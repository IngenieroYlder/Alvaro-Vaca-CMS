import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Noticia } from './entities/noticia.entity';
import { CategoriaNoticia } from '../catalogo/entities/categoria-noticia.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';

@Injectable()
export class NoticiasService {
  constructor(
    @InjectRepository(Noticia)
    private readonly noticiaRepository: Repository<Noticia>,
    @InjectRepository(CategoriaNoticia)
    private readonly categoriaRepository: Repository<CategoriaNoticia>,
  ) {}

  async findAll() {
    return this.noticiaRepository.find({
      relations: ['categoria', 'autor'],
      order: { fechaPublicacion: 'DESC' },
    });
  }

  async findOne(id: string) {
    const noticia = await this.noticiaRepository.findOne({
      where: { id },
      relations: ['categoria', 'autor', 'noticiasRelacionadas'],
    });
    if (!noticia) throw new NotFoundException('Noticia no encontrada');
    return noticia;
  }

  async findBySlug(slug: string) {
    const noticia = await this.noticiaRepository.findOne({
      where: { slug, activo: true },
      relations: ['categoria', 'autor', 'noticiasRelacionadas'],
    });
    if (!noticia) throw new NotFoundException('Noticia no encontrada');
    return noticia;
  }

  async create(createNoticiaDto: any, usuario: Usuario) {
    // Logic to handle slugs and relations would go here
    // For now basic implementation
    const noticia = this.noticiaRepository.create({
      ...createNoticiaDto,
      autor: usuario,
    });
    return this.noticiaRepository.save(noticia);
  }

  async update(id: string, updateNoticiaDto: any) {
    const noticia = await this.findOne(id);
    Object.assign(noticia, updateNoticiaDto);
    return this.noticiaRepository.save(noticia);
  }

  async remove(id: string) {
    const noticia = await this.findOne(id);
    return this.noticiaRepository.remove(noticia);
  }

  // Lógica Híbrida de Noticias Relacionadas
  async findRelated(id: string, limit = 3) {
    const actual = await this.findOne(id);
    let relacionadas = actual.noticiasRelacionadas || [];

    // Si faltan para completar el límite, buscar por categoría
    if (relacionadas.length < limit && actual.categoria) {
      const extra = await this.noticiaRepository.find({
        where: {
          categoria: { id: actual.categoria.id },
          id: Not(id),
          activo: true,
        },
        take: limit - relacionadas.length,
        order: { fechaPublicacion: 'DESC' },
      });
      relacionadas = [...relacionadas, ...extra];
    }

    // Si aún faltan, buscar recientes generales
    if (relacionadas.length < limit) {
      const extra = await this.noticiaRepository.find({
        where: {
          id: Not(id),
          activo: true,
        },
        take: limit - relacionadas.length,
        order: { fechaPublicacion: 'DESC' },
      });
      // Filtrar duplicados por si acaso
      const idsExistentes = new Set(relacionadas.map((n) => n.id));
      const extraFiltrado = extra.filter((n) => !idsExistentes.has(n.id));
      relacionadas = [...relacionadas, ...extraFiltrado];
    }

    return relacionadas;
  }
}
