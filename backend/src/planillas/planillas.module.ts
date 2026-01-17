import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanillasService } from './planillas.service';
import { PlanillasController } from './planillas.controller';
import { Planilla } from './entities/planilla.entity';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [
      TypeOrmModule.forFeature([Planilla]),
      UsuariosModule // Import this
  ],
  controllers: [PlanillasController],
  providers: [PlanillasService],
})
export class PlanillasModule {}
