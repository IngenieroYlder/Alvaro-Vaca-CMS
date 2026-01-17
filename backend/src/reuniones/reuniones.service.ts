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
import * as path from 'path';
import * as fs from 'fs';

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

  async findOneById(id: string) {
    const reunion = await this.reunionRepository.findOne({ where: { id } });
    if (!reunion) throw new NotFoundException('Reunión no encontrada');
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

  async findAll(filters: { leader?: string; dateStart?: string; dateEnd?: string; location?: string; leaderId?: string; leaderIds?: string[]; municipio?: string; departamento?: string; reunionId?: string }) {
    const query = this.reunionRepository.createQueryBuilder('reunion')
        .leftJoinAndSelect('reunion.asistentes', 'asistente');

    if (filters.leaderId) {
        query.andWhere('reunion.liderId = :leaderId', { leaderId: filters.leaderId });
    }

    if (filters.leaderIds && filters.leaderIds.length > 0) {
        query.andWhere('reunion.liderId IN (:...leaderIds)', { leaderIds: filters.leaderIds });
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

    async findAllUnique(filters: { dateStart?: string; dateEnd?: string; municipio?: string; departamento?: string; reunionId?: string; leaderId?: string; leaderIds?: string[] }) {
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

        if (filters.leaderIds && filters.leaderIds.length > 0) {
            query.andWhere('reunion.liderId IN (:...leaderIdsUnique)', { leaderIdsUnique: filters.leaderIds });
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

    const prodUrl = 'https://alvarovaca.com.co';
    const codeUrl = `${prodUrl}/reuniones/formulario/${reunion.codigo}`;

    const qrBuffer = await QRCode.toBuffer(codeUrl);
    
    return new Promise((resolve) => {
        const doc = new PDFDocument({ size: 'A5', margin: 30 });
        const buffers: any[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Header Background (Green)
        doc.rect(0, 0, doc.page.width, 160).fill('#059669'); // Increased height to 160 to fit title

        // Logos
        const logoPath = path.join(process.cwd(), 'public', 'assets', 'logo.png');
        const secondaryLogoPath = path.join(process.cwd(), 'public', 'assets', '4_LOGO.png');
        
        let headerY = 20; 
        const leftLogoHeight = 85; 
        const rightLogoHeight = 60;
        
        // 1. Primary Logo (Alvaro Vaca) 
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 90, headerY, { height: leftLogoHeight });
        }
        
        // 2. Secondary Logo (Party)
        if (fs.existsSync(secondaryLogoPath)) {
             const yOffset = (leftLogoHeight - rightLogoHeight) / 2;
             doc.image(secondaryLogoPath, 240, headerY + yOffset, { height: rightLogoHeight });
        }

        // Title 
        doc.fillColor('white') 
           .fontSize(18)
           .font('Helvetica-Bold')
           .text('REGISTRO DE ASISTENCIA', 0, headerY + leftLogoHeight + 15, { align: 'center' }); 

        // Reduce spacing to fit everything on A5
        doc.moveDown(2); // Reduced from 4
        
        // Info (Centered)
        doc.fill('black');
        doc.fontSize(12);
        
        const liderText = `Líder: ${reunion.liderNombre || 'N/A'}`;
        const fechaText = `Fecha: ${reunion.fecha ? new Date(reunion.fecha).toLocaleString() : ''}`;
        const lugarText = `Lugar: ${reunion.barrio || ''}, ${reunion.comuna || reunion.municipio || ''}`;

        doc.font('Helvetica-Bold').text(liderText, { align: 'center' });
        doc.font('Helvetica').text(fechaText, { align: 'center' });
        doc.text(lugarText, { align: 'center' });
        
        doc.moveDown(1);
        
        // QR (Calculated Center)
        const qrSize = 150; // Reduced from 180 to prevent footer overlap
        const qrX = (doc.page.width - qrSize) / 2;
        doc.image(qrBuffer, qrX, doc.y, { fit: [qrSize, qrSize] }); 
        
        // Move cursor down AFTER image
        doc.y += qrSize + 15;
        
        // Code
        doc.fontSize(28).font('Helvetica-Bold').text(`${reunion.codigo}`, { align: 'center' });
        doc.moveDown(0.2);
        
        doc.fontSize(10).font('Helvetica').text('Escanea este código o ingresa el número para registrarte', { align: 'center' });
        
        doc.moveDown(0.5);
        
        // Link (Production URL)
        doc.fontSize(9).fill('#059669').text(codeUrl, { align: 'center', link: codeUrl, underline: true });

        // Footer
        const footerY = doc.page.height - 30; // Closer to bottom
        const footerText = `${prodUrl} - Alvaro Vaca - Desarrollado por Ingeniero Ylder Gonzalez`;
        doc.fontSize(8).fill('gray').text(footerText, 0, footerY, { align: 'center' });

        doc.end();
    });
  }
}
