import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaginasService } from './paginas.service';
import { PaginasController } from './paginas.controller';
import { Pagina } from './entities/pagina.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pagina])],
  controllers: [PaginasController],
  providers: [PaginasService],
  exports: [PaginasService],
})
export class PaginasModule {}
