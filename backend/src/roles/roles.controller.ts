import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CrearRolDto, ActualizarRolDto } from './dto/rol.dto';

@Controller('api/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) { }

  @Post()
  create(@Body() crearRolDto: CrearRolDto) {
    return this.rolesService.create(crearRolDto);
  }

  @Get()
  findAll() {
    console.log('[ROLES CONTROLLER] Fetching all roles...');
    return this.rolesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() actualizarRolDto: ActualizarRolDto) {
    return this.rolesService.update(id, actualizarRolDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}
