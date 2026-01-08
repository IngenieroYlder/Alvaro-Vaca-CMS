import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Noticia } from './entities/noticia.entity';
import { NoticiasService } from './noticias.service';
import { NoticiasController } from './noticias.controller';
import { CategoriaNoticia } from '../catalogo/entities/categoria-noticia.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Noticia, CategoriaNoticia])],
  controllers: [NoticiasController],
  providers: [NoticiasService],
  exports: [NoticiasService],
})
export class NoticiasModule {}
