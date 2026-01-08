import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vacante } from './entities/vacante.entity';
import { CategoriaVacante } from '../catalogo/entities/categoria-vacante.entity';

@Injectable()
export class VacantesService {
  constructor(
    @InjectRepository(Vacante)
    private vacanteRepository: Repository<Vacante>,
    @InjectRepository(CategoriaVacante)
    private categoryRepository: Repository<CategoriaVacante>,
  ) { }

  async create(createVacanteDto: any) {
    if (createVacanteDto.categoria && typeof createVacanteDto.categoria === 'string') {
      createVacanteDto.categoria = await this.categoryRepository.findOneBy({
        id: createVacanteDto.categoria,
      });
    } else {
      createVacanteDto.categoria = null;
    }

    // Handle empty date string
    if (createVacanteDto.fechaCierre === '') {
      createVacanteDto.fechaCierre = null;
    }

    const vacante = this.vacanteRepository.create(createVacanteDto);
    return await this.vacanteRepository.save(vacante);
  }

  async findAll() {
    return await this.vacanteRepository.find({
      relations: ['categoria'],
      order: { fechaCreacion: 'DESC' },
    } as any);
  }

  async findOne(id: string) {
    const vacante = await this.vacanteRepository.findOne({
      where: { id },
      relations: ['categoria'],
    });
    if (!vacante) throw new NotFoundException('Vacante no encontrada');
    return vacante;
  }

  async findBySlug(slug: string) {
    const vacante = await this.vacanteRepository.findOne({
      where: { slug },
      relations: ['categoria'],
    });
    if (!vacante) throw new NotFoundException('Vacante no encontrada');
    return vacante;
  }

  async update(id: string, updateVacanteDto: any) {
    if (
      updateVacanteDto.categoria &&
      typeof updateVacanteDto.categoria === 'string'
    ) {
      updateVacanteDto.categoria = await this.categoryRepository.findOneBy({
        id: updateVacanteDto.categoria,
      });
    } else if (updateVacanteDto.categoria === '') {
      updateVacanteDto.categoria = null;
    }

    // Handle empty date string
    if (updateVacanteDto.fechaCierre === '') {
      updateVacanteDto.fechaCierre = null;
    }

    await this.vacanteRepository.update(id, updateVacanteDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const vacante = await this.findOne(id);
    return await this.vacanteRepository.remove(vacante);
  }
}
