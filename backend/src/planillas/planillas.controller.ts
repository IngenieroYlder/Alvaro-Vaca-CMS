import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PlanillasService } from './planillas.service';
import { JwtAuthGuard } from '../autenticacion/guards/jwt-auth.guard';
import { RolesGuard } from '../autenticacion/guards/roles.guard';
import { Roles } from '../autenticacion/decorators/roles.decorator';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Controller('planillas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlanillasController {
  constructor(private readonly planillasService: PlanillasService) {}

  @Post('upload')
  @Roles('coordinador', 'admin', 'god')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/planillas',
      filename: (req, file, cb) => {
        const uniqueSuffix = uuidv4();
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|pdf)$/)) {
            return cb(new BadRequestException('Solo se permiten archivos de imagen (jpg, png) o PDF'), false);
        }
        cb(null, true);
    }
  }))
  async uploadPlanilla(
    @UploadedFile() file: Express.Multer.File,
    @Body('liderId') liderId: string,
    @Body('descripcion') descripcion?: string
  ) {
    if (!file) throw new BadRequestException('Archivo no proporcionado');
    if (!liderId) throw new BadRequestException('ID de Líder es requerido');

    // Generate Public URL (Assuming Static Serve is configured for /uploads)
    // If static files are served from root 'uploads', then:
    const url = `/uploads/planillas/${file.filename}`;
    
    return this.planillasService.create({
        url,
        nombreOriginal: file.originalname,
        liderId,
        descripcion
    });
  }

  @Get()
  @Roles('coordinador', 'admin', 'god') // Leaders don't see this? "Leaders will not have access to Afiliados module"
  async findAll(@Query('leaderId') leaderId?: string) {
    return this.planillasService.findAll(leaderId);
  }

  @Delete(':id')
  @Roles('coordinador', 'admin', 'god')
  async remove(@Param('id') id: string) {
    return this.planillasService.remove(id);
  }
}
