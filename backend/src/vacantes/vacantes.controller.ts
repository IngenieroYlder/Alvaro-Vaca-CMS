import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { VacantesService } from './vacantes.service';
import { JwtAuthGuard } from '../autenticacion/guards/jwt-auth.guard';

@Controller('api/vacantes')
export class VacantesController {
  constructor(private readonly vacantesService: VacantesService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createVacanteDto: any) {
    return this.vacantesService.create(createVacanteDto);
  }

  @Get()
  findAll() {
    return this.vacantesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vacantesService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateVacanteDto: any) {
    return this.vacantesService.update(id, updateVacanteDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.vacantesService.remove(id);
  }
}
