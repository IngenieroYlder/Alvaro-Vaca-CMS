import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsuariosModule } from './usuarios/usuarios.module';
import { AutenticacionModule } from './autenticacion/autenticacion.module';
import { CatalogoModule } from './catalogo/catalogo.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ThemeModule } from './theme/theme.module';
import { MediosModule } from './medios/medios.module';
import { RolesModule } from './roles/roles.module';
import { NegocioModule } from './negocio/negocio.module';
import { PaginasModule } from './paginas/paginas.module';
import { MenusModule } from './menus/menus.module';
import { PublicModule } from './public/public.module';
import { ContactosModule } from './contactos/contactos.module';
import { NoticiasModule } from './noticias/noticias.module';
import { ComentariosModule } from './comentarios/comentarios.module';
import { VacantesModule } from './vacantes/vacantes.module';
import { PostulacionesModule } from './postulaciones/postulaciones.module';
import { CandidatoModule } from './candidato/candidato.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true,
        ssl: false,
      }),
      inject: [ConfigService],
    }),
    UsuariosModule,
    AutenticacionModule,
    CatalogoModule,
    WebhooksModule,
    ThemeModule,
    MediosModule,
    ContactosModule,
    RolesModule,
    NegocioModule,
    PaginasModule,
    MenusModule,
    PublicModule,
    NoticiasModule,
    ComentariosModule,
    VacantesModule,
    PostulacionesModule,
    CandidatoModule,
  ],
  controllers: [],
  providers: [AppService],
})
export class AppModule { }
