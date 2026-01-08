import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateNegocioDto } from './dto/create-negocio.dto';
import { UpdateNegocioDto } from './dto/update-negocio.dto';
import { Negocio } from './entities/negocio.entity';

@Injectable()
export class NegocioService {
  constructor(
    @InjectRepository(Negocio)
    private negocioRepository: Repository<Negocio>,
  ) {}

  async createOrUpdate(createNegocioDto: CreateNegocioDto) {
    const existing = await this.negocioRepository.find();
    if (existing.length > 0) {
      // Update first one
      const id = existing[0].id;
      await this.negocioRepository.update(id, createNegocioDto);
      return this.negocioRepository.findOneBy({ id });
    } else {
      // Create new
      const negocio = this.negocioRepository.create(createNegocioDto);
      return this.negocioRepository.save(negocio);
    }
  }

  async getInfo() {
    const existing = await this.negocioRepository.find();
    if (existing.length > 0) {
      return existing[0];
    }
    return null; // O devuelve un objeto vacío
  }
}
