import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseInterceptors,
  UploadedFile,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediosService } from './medios.service';

@Controller('medios')
export class MediosController {
  constructor(private readonly mediosService: MediosService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file')) // 'file' name
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('carpetaId') carpetaId?: string,
  ) {
    if (carpetaId === 'null' || carpetaId === 'undefined')
      carpetaId = undefined;
    return this.mediosService.crear(file, carpetaId);
  }

  @Post('folder')
  async createFolder(@Body() body: { nombre: string; parentId?: string }) {
    return this.mediosService.crearCarpeta(body.nombre, body.parentId);
  }

  @Get('content')
  async getFolderContent(@Query('folderId') folderId?: string) {
    // folderId can be 'root' or undefined for root.
    return this.mediosService.obtenerContenido(
      folderId === 'root' ? null : folderId || null,
    );
  }

  @Patch(':id')
  async updateMedia(@Param('id') id: string, @Body() body: any) {
    return this.mediosService.actualizarMedio(id, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.mediosService.eliminar(id);
  }

  @Delete('folder/:id')
  async deleteFolder(@Param('id') id: string) {
    return this.mediosService.eliminarCarpeta(id);
  }

  // Deprecated/Legacy
  @Get()
  async findAll() {
    return this.mediosService.obtenerTodos();
  }
}
