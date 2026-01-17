import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Planilla } from './entities/planilla.entity';

@Injectable()
export class PlanillasService {
  constructor(
    @InjectRepository(Planilla)
    private readonly planillaRepository: Repository<Planilla>,
  ) {}

  async create(data: { url: string; nombreOriginal: string; liderId: string; descripcion?: string; fechaInicio?: Date; fechaFin?: Date }) {
    const planilla = this.planillaRepository.create(data);
    return await this.planillaRepository.save(planilla);
  }

  async findAll(leaderId?: string, leaderIds?: string[]) {
    const query = this.planillaRepository.createQueryBuilder('planilla')
        .leftJoinAndSelect('planilla.lider', 'lider')
        .orderBy('planilla.fechaCarga', 'DESC');

    if (leaderId) {
        query.andWhere('planilla.liderId = :leaderId', { leaderId });
    }

    if (leaderIds && leaderIds.length > 0) {
        query.andWhere('planilla.liderId IN (:...leaderIds)', { leaderIds });
    }

    return await query.getMany();
  }

  async update(id: string, data: { estado?: string; notas?: string }) {
    const planilla = await this.planillaRepository.findOne({ where: { id } });
    if (!planilla) throw new NotFoundException('Planilla no encontrada');
    
    // Only update allowed fields
    if (data.estado !== undefined) planilla.estado = data.estado;
    if (data.notas !== undefined) planilla.notas = data.notas;
    
    return await this.planillaRepository.save(planilla);
  }

  async remove(id: string) {
    const result = await this.planillaRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Planilla no encontrada');
    return { deleted: true };
  }
}
