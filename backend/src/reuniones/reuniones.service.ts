import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { Reunion } from './entities/reunion.entity';
import { Asistente } from './entities/asistente.entity';
import { CreateReunionDto } from './dto/create-reunion.dto';
import { RegisterAttendeeDto } from './dto/register-attendee.dto';
import { Response } from 'express';
// import * as PDFDocument from 'pdfkit'; // Will need to install types or handle import
// import * as ExcelJS from 'exceljs'; // Will need to install

@Injectable()
export class ReunionesService {
  constructor(
    @InjectRepository(Reunion)
    private readonly reunionRepository: Repository<Reunion>,
    @InjectRepository(Asistente)
    private readonly asistenteRepository: Repository<Asistente>,
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

    const reunion = this.reunionRepository.create({
      ...createReunionDto,
      codigo,
      liderId: leaderInfo.liderId,
      liderNombre: leaderInfo.liderNombre,
      liderDocumento: leaderInfo.liderDocumento || '', // Fallback empty string if DB requires it, but we set nullable in entity?
      // Wait, entity has liderDocumento as nullable now. But TS might complain if I pass null to a string field?
      // Let's ensure entity definition matches.
      liderTelefono: leaderInfo.liderTelefono,
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
}
