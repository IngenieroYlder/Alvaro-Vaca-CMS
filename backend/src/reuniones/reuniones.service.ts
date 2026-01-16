import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { Reunion } from './entities/reunion.entity';
import { Asistente } from './entities/asistente.entity';
import { CreateReunionDto } from './dto/create-reunion.dto';
import { RegisterAttendeeDto } from './dto/register-attendee.dto';
import { Response } from 'express';
import * as QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import { UsuariosService } from '../usuarios/usuarios.service';

@Injectable()
export class ReunionesService {
  constructor(
    @InjectRepository(Reunion)
    private readonly reunionRepository: Repository<Reunion>,
    @InjectRepository(Asistente)
    private readonly asistenteRepository: Repository<Asistente>,
    private readonly usuariosService: UsuariosService,
  ) {}

  async create(createReunionDto: CreateReunionDto, leaderInfo: { liderId: string, liderNombre: string, liderDocumento: string | null, liderTelefono: string }) {
    // Generate Unique Code
    let codigo = this.generateCode();
    let unique = false; 

    while (!unique) {
      const existing = await this.reunionRepository.findOne({ where: { codigo } });
      if (!existing) unique = true;
      else codigo = this.generateCode();
    }

    // Logic to enrich leader info if missing (assigned by Coordinator)
    let finalLiderNombre = leaderInfo.liderNombre;
    let finalLiderDocumento = leaderInfo.liderDocumento;
    let finalLiderTelefono = leaderInfo.liderTelefono;

    if (!finalLiderNombre || finalLiderNombre.trim() === '') {
        const usuario = await this.usuariosService.buscarPorId(leaderInfo.liderId);
        if (usuario) {
            finalLiderNombre = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim();
            finalLiderDocumento = usuario.documento || '';
            finalLiderTelefono = usuario.telefono || usuario.whatsapp || '';
        }
    }

    const reunion = this.reunionRepository.create({
      ...createReunionDto,
      codigo,
      liderId: leaderInfo.liderId,
      liderNombre: finalLiderNombre || 'Sin Nombre',
      liderDocumento: finalLiderDocumento || '', 
      liderTelefono: finalLiderTelefono || '',
      lider: { id: leaderInfo.liderId } as any // Relationship
    });

    return await this.reunionRepository.save(reunion);
  }

  async findByCode(codigo: string) {
    const reunion = await this.reunionRepository.findOne({ where: { codigo } });
    if (!reunion) throw new NotFoundException('Reunión no encontrada con ese código');
    return reunion;
  }

  async registerAttendee(registerDto: RegisterAttendeeDto) {
    const reunion = await this.findByCode(registerDto.codigoReunion);
    
    // Check duplication? Optionally check if doc already exists in this meeting
    const existing = await this.asistenteRepository.findOne({
      where: { documento: registerDto.documento, reunion: { id: reunion.id } }
    });
    
    if (existing) {
      throw new BadRequestException('Este documento ya está registrado en esta reunión.');
    }

    const asistente = this.asistenteRepository.create({
      ...registerDto,
      reunion,
      // name split is handled by DTO having both fields now
    });

    return await this.asistenteRepository.save(asistente);
  }

  async findAll(filters: { leader?: string; dateStart?: string; dateEnd?: string; location?: string; leaderId?: string; municipio?: string; departamento?: string; reunionId?: string }) {
    const query = this.reunionRepository.createQueryBuilder('reunion')
        .leftJoinAndSelect('reunion.asistentes', 'asistente');

    if (filters.leaderId) {
        query.andWhere('reunion.liderId = :leaderId', { leaderId: filters.leaderId });
    }

    if (filters.leader) {
        query.andWhere('reunion.liderNombre ILIKE :leader', { leader: `%${filters.leader}%` });
    }
    
    if (filters.dateStart && filters.dateEnd) {
        query.andWhere('reunion.fecha BETWEEN :start AND :end', { 
            start: filters.dateStart, 
            end: filters.dateEnd 
        });
    }

    if (filters.location) {
        query.andWhere(
            '(reunion.municipio ILIKE :loc OR reunion.comuna ILIKE :loc OR reunion.corregimiento ILIKE :loc OR reunion.barrio ILIKE :loc)',
            { loc: `%${filters.location}%` }
        );
    }

    if (filters.municipio) {
        query.andWhere('reunion.municipio = :municipio', { municipio: filters.municipio });
    }

    if (filters.departamento) {
        query.andWhere('reunion.departamento = :departamento', { departamento: filters.departamento });
    }

    if (filters.reunionId) {
        query.andWhere('reunion.id = :reunionId', { reunionId: filters.reunionId });
    }
    
    query.orderBy('reunion.fecha', 'DESC');

    return await query.getMany();
  }

    async findAllUnique(filters: { dateStart?: string; dateEnd?: string; municipio?: string; departamento?: string; reunionId?: string; leaderId?: string }) {
        const query = this.asistenteRepository.createQueryBuilder('asistente')
            .leftJoinAndSelect('asistente.reunion', 'reunion')
            .distinctOn(['asistente.documento']);

         if (filters.dateStart && filters.dateEnd) {
            query.andWhere('reunion.fecha BETWEEN :start AND :end', { 
                start: filters.dateStart, 
                end: filters.dateEnd 
            });
        }

        if (filters.leaderId) {
            query.andWhere('reunion.liderId = :leaderIdUnique', { leaderIdUnique: filters.leaderId });
        }

        if (filters.municipio) {
            query.andWhere('reunion.municipio = :municipioUnique', { municipioUnique: filters.municipio });
        }

        if (filters.departamento) {
            query.andWhere('reunion.departamento = :departamentoUnique', { departamentoUnique: filters.departamento });
        }

        if (filters.reunionId) {
            query.andWhere('reunion.id = :reunionIdUnique', { reunionIdUnique: filters.reunionId });
        }
        
        return await query.getMany();
    }


  async remove(id: string) {
    const result = await this.reunionRepository.delete(id);
    if (result.affected === 0) {
        throw new NotFoundException(`Reunión con id ${id} no encontrada`);
    }
    return { deleted: true };
  }
  
  async removeBulk(ids: string[]) {
    const result = await this.reunionRepository.delete(ids);
    return { deleted: true, count: result.affected };
  }

  private generateCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString(); // 4 digit code
  }

  async generateQrFlyer(id: string): Promise<Buffer> {
    const reunion = await this.reunionRepository.findOne({ where: { id } });
    if (!reunion) throw new NotFoundException('Reunión no encontrada');

    const baseUrl = process.env.FRONTEND_URL || 'https://patios.colombiapictures.co';
    const codeUrl = `${baseUrl}/reuniones/formulario/${reunion.codigo}`;

    const qrBuffer = await QRCode.toBuffer(codeUrl);
    
    return new Promise((resolve) => {
        const doc = new PDFDocument({ size: 'A5', margin: 30 });
        const buffers: any[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Header Background
        doc.rect(0, 0, doc.page.width, 80).fill('#5D40E8'); // Primary Color
        
        doc.fontSize(16).fill('white').text('REGISTRO DE ASISTENCIA', { align: 'center' });
        doc.moveDown(4);
        
        // Info
        doc.fill('black');
        doc.fontSize(10).font('Helvetica-Bold').text('Líder:', { continued: true }).font('Helvetica').text(` ${reunion.liderNombre || 'N/A'}`);
        doc.font('Helvetica-Bold').text('Fecha:', { continued: true }).font('Helvetica').text(` ${reunion.fecha ? new Date(reunion.fecha).toLocaleString() : ''}`);
        doc.font('Helvetica-Bold').text('Lugar:', { continued: true }).font('Helvetica').text(` ${reunion.barrio || ''}, ${reunion.comuna || reunion.municipio || ''}`);
        
        doc.moveDown(2);
        
        // QR
        doc.image(qrBuffer, { fit: [200, 200], align: 'center' });
        doc.moveDown();
        
        doc.fontSize(24).font('Helvetica-Bold').text(`${reunion.codigo}`, { align: 'center' });
        doc.fontSize(10).font('Helvetica').text('Escanea este código o ingresa el número para registrarte', { align: 'center' });
        
        doc.end();
    });
  }
}
