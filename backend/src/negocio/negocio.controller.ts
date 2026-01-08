import { Controller, Get, Post, Body } from '@nestjs/common';
import { NegocioService } from './negocio.service';
import { CreateNegocioDto } from './dto/create-negocio.dto';

@Controller('negocio')
export class NegocioController {
  constructor(private readonly negocioService: NegocioService) {}

  @Post()
  createOrUpdate(@Body() createNegocioDto: CreateNegocioDto) {
    return this.negocioService.createOrUpdate(createNegocioDto);
  }

  @Get()
  getInfo() {
    return this.negocioService.getInfo();
  }
}
