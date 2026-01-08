import { Module } from '@nestjs/common';
import { CandidatoController } from './candidato.controller';
import { PostulacionesModule } from '../postulaciones/postulaciones.module';
import { VacantesModule } from '../vacantes/vacantes.module';
import { NegocioModule } from '../negocio/negocio.module';
import { ThemeModule } from '../theme/theme.module';
import { MenusModule } from '../menus/menus.module';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
    imports: [
        PostulacionesModule,
        VacantesModule,
        NegocioModule,
        ThemeModule,
        MenusModule,
        UsuariosModule
    ],
    controllers: [CandidatoController],
})
export class CandidatoModule { }
