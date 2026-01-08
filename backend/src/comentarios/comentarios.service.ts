import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comentario } from './entities/comentario.entity';
import { Noticia } from '../noticias/entities/noticia.entity';

@Injectable()
export class ComentariosService {
  constructor(
    @InjectRepository(Comentario)
    private comentarioRepository: Repository<Comentario>,
    @InjectRepository(Noticia)
    private noticiaRepository: Repository<Noticia>,
  ) {}

  async create(noticiaId: string, data: any, ip: string) {
    // 1. SPAM CHECK: Honeypot
    if (data.fullname_field_gotcha && data.fullname_field_gotcha.length > 0) {
      console.log(`Spam detected (Honeypot) from IP: ${ip}`);
      // Silent fail or throw. Silent is better to fool bots.
      return null;
    }

    // 2. Validate Noticia
    const noticia = await this.noticiaRepository.findOneBy({ id: noticiaId });
    if (!noticia) throw new BadRequestException('Noticia no encontrada');

    // 3. Create
    const comentario = this.comentarioRepository.create({
      nombre: data.nombre,
      email: data.email,
      sitioWeb: data.website,
      contenido: data.comentario.substring(0, 1000), // Limit length
      ip,
      noticia,
      aprobado: true, // Auto-approve for MVP, later moderated
    });

    return await this.comentarioRepository.save(comentario);
  }

  async findByNoticia(noticiaId: string) {
    return this.comentarioRepository.find({
      where: { noticia: { id: noticiaId }, aprobado: true },
      order: { fecha: 'DESC' },
    });
  }
}
