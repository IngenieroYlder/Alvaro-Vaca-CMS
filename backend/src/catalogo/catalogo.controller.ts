import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Delete,
  Param,
  Patch,
} from '@nestjs/common';
import { CatalogoService } from './catalogo.service';
import { JwtAuthGuard } from '../autenticacion/guards/jwt-auth.guard'; // Wait, I need to create this alias or use AuthGuard('jwt')
import { RolesGuard } from '../autenticacion/guards/roles.guard';
import { Roles } from '../autenticacion/decorators/roles.decorator';
import { AuthGuard } from '@nestjs/passport';

@Controller('catalogo')
export class CatalogoController {
  constructor(private readonly catalogoService: CatalogoService) { }

  // --- Productos ---
  @Get('productos')
  listarProductos() {
    return this.catalogoService.listarProductos();
  }

  @Post('productos')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'editor')
  crearProducto(@Body() body: any) {
    // Usar DTO luego
    return this.catalogoService.crearProducto(body);
  }

  // --- Servicios ---
  @Get('servicios')
  listarServicios() {
    return this.catalogoService.listarServicios();
  }

  @Post('servicios')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'editor')
  crearServicio(@Body() body: any) {
    return this.catalogoService.crearServicio(body);
  }

  // --- Categorias Productos ---
  @Get('categorias-productos')
  listarCategoriasProductos() {
    return this.catalogoService.listarCategoriasProductos();
  }

  @Post('categorias-productos')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'editor')
  crearCategoriaProducto(@Body() body: any) {
    return this.catalogoService.crearCategoriaProducto(body);
  }

  // --- Globales: Atributos y Badges ---
  @Get('atributos')
  listarAtributos() {
    return this.catalogoService.listarAtributos();
  }

  @Post('atributos')
  crearAtributo(@Body() body: any) {
    return this.catalogoService.crearAtributo(body.nombre);
  }

  @Patch('atributos/:id')
  actualizarAtributo(@Param('id') id: string, @Body() body: any) {
    return this.catalogoService.actualizarAtributo(id, body.nombre);
  }

  @Delete('atributos/:id')
  eliminarAtributo(@Param('id') id: string) {
    return this.catalogoService.eliminarAtributo(id);
  }

  @Post('atributos/:id/valores')
  crearValorAtributo(@Param('id') id: string, @Body() body: any) {
    return this.catalogoService.crearValorAtributo(id, body.valor);
  }

  @Delete('valores-atributos/:id')
  eliminarValorAtributo(@Param('id') id: string) {
    return this.catalogoService.eliminarValorAtributo(id);
  }

  @Get('badges')
  listarBadges() {
    return this.catalogoService.listarBadges();
  }

  @Post('badges')
  crearBadge(@Body() body: any) {
    return this.catalogoService.crearBadge(body);
  }

  @Patch('badges/:id')
  actualizarBadge(@Param('id') id: string, @Body() body: any) {
    return this.catalogoService.actualizarBadge(id, body);
  }

  @Delete('badges/:id')
  eliminarBadge(@Param('id') id: string) {
    return this.catalogoService.eliminarBadge(id);
  }

  // --- Categorias Servicios ---
  @Get('categorias-servicios')
  listarCategoriasServicios() {
    return this.catalogoService.listarCategoriasServicios();
  }

  @Post('categorias-servicios')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'editor')
  crearCategoriaServicio(@Body() body: any) {
    return this.catalogoService.crearCategoriaServicio(body);
  }

  // --- Categorias Noticias ---
  @Get('categorias-noticias')
  listarCategoriasNoticias() {
    return this.catalogoService.listarCategoriasNoticias();
  }

  @Post('categorias-noticias')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'editor')
  crearCategoriaNoticia(@Body() body: any) {
    return this.catalogoService.crearCategoriaNoticia(body);
  }

  // --- Categorias Vacantes ---
  @Get('categorias-vacantes')
  listarCategoriasVacantes() {
    return this.catalogoService.listarCategoriasVacantes();
  }

  @Post('categorias-vacantes')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'editor')
  crearCategoriaVacante(@Body() body: any) {
    return this.catalogoService.crearCategoriaVacante(body);
  }

  @Patch('categorias-vacantes/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'editor')
  actualizarCategoriaVacante(@Param('id') id: string, @Body() body: any) {
    return this.catalogoService.actualizarCategoriaVacante(id, body);
  }

  @Delete('categorias-vacantes/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'editor')
  eliminarCategoriaVacante(@Param('id') id: string) {
    return this.catalogoService.eliminarCategoriaVacante(id);
  }
}
