import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReunionesService } from './reuniones.service';
import { ReunionesController } from './reuniones.controller';
import { Reunion } from './entities/reunion.entity';
import { Asistente } from './entities/asistente.entity';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [TypeOrmModule.forFeature([Reunion, Asistente]), UsuariosModule],
  controllers: [ReunionesController],
  providers: [ReunionesService],
  exports: [ReunionesService, TypeOrmModule],
})
export class ReunionesModule {}
