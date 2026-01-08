import { Controller, Post, Get, Param, Body, UseGuards, Request, Patch, UseInterceptors, UploadedFile, Res, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, Header, StreamableFile, NotFoundException } from '@nestjs/common';
import { PostulacionesService } from './postulaciones.service';
import { JwtAuthGuard } from '../autenticacion/guards/jwt-auth.guard';
import { RolesGuard } from '../autenticacion/guards/roles.guard';
import { Roles } from '../autenticacion/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import type { Response } from 'express';
import { createReadStream, existsSync } from 'fs';

@Controller('postulaciones')
export class PostulacionesController {
    constructor(private readonly postulacionesService: PostulacionesService) { }

    @Post('aplicar/:vacanteId')
    @UseGuards(JwtAuthGuard)
    async aplicar(@Request() req: any, @Param('vacanteId') vacanteId: string) {
        return this.postulacionesService.aplicar(req.user.userId, vacanteId);
    }

    @Get('mis-postulaciones')
    @UseGuards(JwtAuthGuard)
    async misPostulaciones(@Request() req: any) {
        return this.postulacionesService.misPostulaciones(req.user.userId);
    }

    @Get('novedades')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'editor')
    async novedades() {
        const count = await this.postulacionesService.contarNovedades();
        return { novedades: count };
    }

    @Get('vacante/:vacanteId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'editor')
    async porVacante(@Param('vacanteId') vacanteId: string) {
        return this.postulacionesService.porVacante(vacanteId);
    }

    @Patch(':id/estado')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'editor')
    async actualizarEstado(@Param('id') id: string, @Body() body: { estado: any, notas?: string, motivoRechazo?: string }) {
        return this.postulacionesService.actualizarEstado(id, body.estado, body.notas, body.motivoRechazo);
    }

    @Patch(':id/visto')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'editor')
    async marcarVisto(@Param('id') id: string) {
        return this.postulacionesService.marcarVisto(id);
    }

    @Post(':id/hoja-de-vida')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads/cvs',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                return cb(null, `${randomName}${extname(file.originalname)}`);
            }
        })
    }))
    async subirHojaDeVida(
        @Param('id') id: string,
        @UploadedFile() file: any,
        @Res() res: Response
    ) {
        if (!file) {
            return res.redirect('/candidato?error=archivo_requerido');
        }

        // Validación manual para evitar JSON Error
        const isZip = file.mimetype === 'application/zip' ||
            file.mimetype === 'application/x-zip-compressed' ||
            extname(file.originalname).toLowerCase() === '.zip';

        if (!isZip) {
            return res.redirect('/candidato?error=formato_invalido_solo_zip');
        }

        if (file.size > 10 * 1024 * 1024) {
            return res.redirect('/candidato?error=archivo_muy_grande');
        }

        await this.postulacionesService.registrarHojaDeVida(id, file.filename);
        return res.redirect('/candidato?status=cv_subido');
    }

    @Get(':id/descargar-cv')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'editor')
    async descargarHojaDeVida(@Param('id') id: string, @Res() res: Response) {
        const { filePath, downloadName } = await this.postulacionesService.obtenerParaDescarga(id);
        res.download(filePath, downloadName);
    }
}
