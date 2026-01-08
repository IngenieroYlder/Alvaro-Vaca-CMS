import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComentariosService } from './comentarios.service';
import { ComentariosController } from './comentarios.controller';
import { Comentario } from './entities/comentario.entity';
import { Noticia } from '../noticias/entities/noticia.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Comentario, Noticia])],
  controllers: [ComentariosController],
  providers: [ComentariosService],
  exports: [ComentariosService],
})
export class ComentariosModule {}
