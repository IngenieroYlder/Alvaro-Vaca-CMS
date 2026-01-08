import {
  Controller,
  Post,
  Body,
  Param,
  Req,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { ComentariosService } from './comentarios.service';
import type { Request, Response } from 'express';

@Controller('noticias/comentar')
export class ComentariosController {
  constructor(private readonly comentariosService: ComentariosService) { }

  @Post(':id')
  async create(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const ip = req.ip || req.socket.remoteAddress || '';

    try {
      await this.comentariosService.create(id, body, ip);
      // Redirect back to the page
      const referer = req.headers.referer || `/noticias`;
      return res.redirect(referer);
    } catch (error) {
      // In case of error (validations), maybe redirect with error query param?
      // For now, implicit fail-safe
      console.error('Comment Error:', error);
      return res.redirect(req.headers.referer || `/noticias`);
    }
  }
}
