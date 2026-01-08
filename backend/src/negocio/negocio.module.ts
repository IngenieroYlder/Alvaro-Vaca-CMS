import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NegocioService } from './negocio.service';
import { NegocioController } from './negocio.controller';
import { Negocio } from './entities/negocio.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Negocio])],
  controllers: [NegocioController],
  providers: [NegocioService],
  exports: [NegocioService],
})
export class NegocioModule {}
