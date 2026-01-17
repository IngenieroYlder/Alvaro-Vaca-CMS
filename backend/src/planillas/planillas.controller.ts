import { Controller, Get, Post, Patch, Body, Param, Delete, UseGuards, Query, UseInterceptors, UploadedFile, BadRequestException, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PlanillasService } from './planillas.service';
import { JwtAuthGuard } from '../autenticacion/guards/jwt-auth.guard';
import { RolesGuard } from '../autenticacion/guards/roles.guard';
import { Roles } from '../autenticacion/decorators/roles.decorator';
import { UpdatePlanillaDto } from './dto/update-planilla.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

import { UsuariosService } from '../usuarios/usuarios.service';

@Controller('planillas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlanillasController {
  constructor(
      private readonly planillasService: PlanillasService,
      private readonly usuariosService: UsuariosService // Injected
  ) {}

  // ... (uploadPlanilla method skipped)

  @Get()
  @Roles('coordinador', 'admin', 'god')
  async findAll(@Query('leaderId') leaderId?: string, @Req() req?: any) {
    const user = req.user;
    const canViewAll = user.roles.includes('admin') || user.roles.includes('god');
    const isCoordinador = user.roles.includes('coordinador') && !canViewAll;

    let leaderIdsFilter: string[] | undefined = undefined;

    if (isCoordinador) {
        // Fetch leaders managed by this coordinator
        const myLeaders = await this.usuariosService.listarTodos(undefined, user.id);
        leaderIdsFilter = myLeaders.map(u => u.id);
    }

    return this.planillasService.findAll(leaderId, leaderIdsFilter);
  }

  @Roles('coordinador', 'admin', 'god')
  async remove(@Param('id') id: string) {
    return this.planillasService.remove(id);
  }

  @Patch(':id')
  @Roles('coordinador', 'admin', 'god')
  async update(@Param('id') id: string, @Body() updatePlanillaDto: UpdatePlanillaDto) {
    return this.planillasService.update(id, updatePlanillaDto);
  }
}
