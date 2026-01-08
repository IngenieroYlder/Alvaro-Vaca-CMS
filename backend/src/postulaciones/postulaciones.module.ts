import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostulacionesService } from './postulaciones.service';
import { PostulacionesController } from './postulaciones.controller';
import { Postulacion } from './entities/postulacion.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Vacante } from '../vacantes/entities/vacante.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Postulacion, Usuario, Vacante])],
    controllers: [PostulacionesController],
    providers: [PostulacionesService],
    exports: [PostulacionesService]
})
export class PostulacionesModule { }
