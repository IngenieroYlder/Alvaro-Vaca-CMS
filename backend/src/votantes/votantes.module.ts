import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VotantesService } from './votantes.service';
import { VotantesController } from './votantes.controller';
import { Votante } from './entities/votante.entity';
import { Asistente } from '../reuniones/entities/asistente.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Votante, Asistente])],
  controllers: [VotantesController],
  providers: [VotantesService],
})
export class VotantesModule {}
