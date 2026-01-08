import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VacantesService } from './vacantes.service';
import { VacantesController } from './vacantes.controller';
import { Vacante } from './entities/vacante.entity';
import { CategoriaVacante } from '../catalogo/entities/categoria-vacante.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vacante, CategoriaVacante])],
  controllers: [VacantesController],
  providers: [VacantesService],
  exports: [VacantesService],
})
export class VacantesModule {}
