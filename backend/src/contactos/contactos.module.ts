import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactosService } from './contactos.service';
import { ContactosController } from './contactos.controller';
import { Contacto } from './entities/contacto.entity';
import { Webhook } from './entities/webhook.entity';
import { NegocioModule } from '../negocio/negocio.module';
import { ThemeModule } from '../theme/theme.module';

@Module({
  imports: [TypeOrmModule.forFeature([Contacto, Webhook]), NegocioModule, ThemeModule],
  controllers: [ContactosController],
  providers: [ContactosService],
  exports: [ContactosService],
})
export class ContactosModule { }
