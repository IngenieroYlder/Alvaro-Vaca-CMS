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

  async create(data: { url: string; nombreOriginal: string; liderId: string; descripcion?: string }) {
    const planilla = this.planillaRepository.create(data);
    return await this.planillaRepository.save(planilla);
  }

  async findAll(leaderId?: string) {
    const query = this.planillaRepository.createQueryBuilder('planilla')
        .leftJoinAndSelect('planilla.lider', 'lider')
        .orderBy('planilla.fechaCarga', 'DESC');

    if (leaderId) {
        query.andWhere('planilla.liderId = :leaderId', { leaderId });
    }

    return await query.getMany();
  }

  async remove(id: string) {
    const result = await this.planillaRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Planilla no encontrada');
    return { deleted: true };
  }
}
