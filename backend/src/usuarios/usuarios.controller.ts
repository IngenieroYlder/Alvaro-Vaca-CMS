import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  UseGuards,
  Res,
  Query,
  Request,
} from '@nestjs/common';
import type { Response } from 'express';
import { Roles } from '../autenticacion/decorators/roles.decorator';
import { JwtAuthGuard } from '../autenticacion/guards/jwt-auth.guard';
import { RolesGuard } from '../autenticacion/guards/roles.guard';
import { UsuariosService } from './usuarios.service';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { RolesService } from '../roles/roles.service';

@Controller('usuarios')
export class UsuariosController {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly rolesService: RolesService
  ) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'god', 'coordinador')
  crear(@Body() crearUsuarioDto: CrearUsuarioDto, @Request() req: any) {
    const userRole = req.user?.roles || [];
    const isCoordinador = userRole.includes('coordinador') && !userRole.includes('admin') && !userRole.includes('god');

    if (isCoordinador) {
        // Force role to 'lider' if created by a coordinator
        crearUsuarioDto.roles = ['lider'];
    }
    
    return this.usuariosService.crear(crearUsuarioDto);
  }

  // TODO: Proteger esta ruta con Guards más adelantes
  @Get(':id')
  async buscarUno(@Param('id') id: string) {
    const usuario = await this.usuariosService.buscarPorId(id);
    if (!usuario) return null;

    // Calcular permisos dinámicamente
    let permisos: string[] = [];
    if (usuario.roles && usuario.roles.length > 0) {
      const normalizedRoles = usuario.roles.map((r: string) => String(r).toLowerCase().trim());

      const rolesEntities = await Promise.all(
        normalizedRoles.map((roleName: string) => this.rolesService.findByName(roleName))
      );

      const allPermisos = rolesEntities
        .filter(r => !!r)
        .flatMap(r => r!.permisos || [])
        .concat(normalizedRoles.includes('god') ? ['god'] : []);

      permisos = [...new Set(allPermisos)];
    }

    return {
      ...usuario,
      permisos
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'god', 'coordinador')
  listarTodos(@Query('role') role: string, @Request() req: any) {
    const userRole = req.user?.roles || [];
    const isCoordinadorOnly = userRole.includes('coordinador') && !userRole.includes('admin') && !userRole.includes('god');

    if (isCoordinadorOnly) {
        // Coordinators can ONLY see 'lider' users
        return this.usuariosService.listarTodos('lider');
    }

    return this.usuariosService.listarTodos(role);
  }

  @Patch(':id')
  actualizar(
    @Param('id') id: string,
    @Body() actualizarUsuarioDto: ActualizarUsuarioDto,
  ) {
    return this.usuariosService.actualizar(id, actualizarUsuarioDto);
  }

  @Get('exportar/excel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async exportarExcel(@Res() res: Response) {
    const buffer = await this.usuariosService.exportarExcel();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=usuarios.xlsx',
      'Content-Length': String(buffer.length),
    });
    res.end(buffer);
  }

  @Get('exportar/pdf')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async exportarPdf(@Res() res: Response) {
    const buffer = await this.usuariosService.exportarPdf();
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=usuarios.pdf',
      'Content-Length': String(buffer.length),
    });
    res.end(buffer);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  eliminar(@Param('id') id: string) {
    return this.usuariosService.eliminar(id);
  }
}
