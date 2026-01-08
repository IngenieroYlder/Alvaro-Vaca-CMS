import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { NegocioModule } from '../negocio/negocio.module';
import { ThemeModule } from '../theme/theme.module';
import { MenusModule } from '../menus/menus.module';
import { PaginasModule } from '../paginas/paginas.module';

import { NoticiasModule } from '../noticias/noticias.module';
import { CatalogoModule } from '../catalogo/catalogo.module';
import { VacantesModule } from '../vacantes/vacantes.module';
import { AutenticacionModule } from '../autenticacion/autenticacion.module';
import { PostulacionesModule } from '../postulaciones/postulaciones.module';

@Module({
  imports: [
    NegocioModule,
    ThemeModule,
    PaginasModule,
    MenusModule,
    NoticiasModule,
    NoticiasModule,
    CatalogoModule,
    VacantesModule,
    AutenticacionModule,
    PostulacionesModule
  ],
  controllers: [PublicController],
})
export class PublicModule { }
