import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePaginaDto } from './dto/create-pagina.dto';
import { UpdatePaginaDto } from './dto/update-pagina.dto';
import { Pagina } from './entities/pagina.entity';

@Injectable()
export class PaginasService {
  constructor(
    @InjectRepository(Pagina)
    private paginaRepository: Repository<Pagina>,
  ) {}

  create(createPaginaDto: CreatePaginaDto) {
    const pagina = this.paginaRepository.create(createPaginaDto);
    return this.paginaRepository.save(pagina);
  }

  findAll() {
    return this.paginaRepository.find({ order: { fechaCreacion: 'DESC' } });
  }

  async findOne(id: string) {
    const pagina = await this.paginaRepository.findOneBy({ id });
    if (!pagina) throw new NotFoundException('Página no encontrada');
    return pagina;
  }

  async findBySlug(slug: string) {
    return this.paginaRepository.findOneBy({ slug, esPublica: true });
  }

  async update(id: string, updatePaginaDto: UpdatePaginaDto) {
    const pagina = await this.findOne(id);
    this.paginaRepository.merge(pagina, updatePaginaDto);
    return this.paginaRepository.save(pagina);
  }

  async remove(id: string) {
    const result = await this.paginaRepository.delete(id);
    if (result.affected === 0)
      throw new NotFoundException('Página no encontrada');
    return { message: 'Página eliminada' };
  }
}
