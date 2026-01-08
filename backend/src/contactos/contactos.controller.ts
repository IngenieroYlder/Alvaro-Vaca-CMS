import { Controller, Post, Body, Get, Res, Query, Param } from '@nestjs/common';
import { ContactosService } from './contactos.service';
import { CreateContactoDto } from './dto/create-contacto.dto';
import type { Response } from 'express';

@Controller('contactos')
export class ContactosController {
  constructor(private readonly contactosService: ContactosService) { }

  @Post()
  async create(@Body() createContactoDto: CreateContactoDto) {
    // Anti-Spam: Honeypot check
    if (createContactoDto._gotcha) {
      // Silently fail for bots (return success but don't save)
      // or return error. Silence is better to confuse bots.
      console.warn('Spam attempt blocked: _gotcha field was filled.');
      return { message: 'Mensaje enviado con éxito' };
    }

    return await this.contactosService.create(createContactoDto);
  }

  @Get()
  findAll(
    @Query('tipo') tipo?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('estado') estado?: string,
  ) {
    return this.contactosService.findAll(tipo, desde, hasta, estado);
  }

  @Post(':id/estado')
  async updateStatus(
    @Param('id') id: string,
    @Body('estado') estado: string,
  ) {
    return await this.contactosService.updateStatus(id, estado);
  }

  @Get('export/excel')
  async exportExcel(
    @Res() res: Response,
    @Query('tipo') tipo?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('estado') estado?: string,
  ) {
    return await this.contactosService.exportExcel(res, tipo, desde, hasta, estado);
  }

  @Get('export/pdf')
  async exportPdf(
    @Res() res: Response,
    @Query('tipo') tipo?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('estado') estado?: string,
  ) {
    return await this.contactosService.exportPdf(res, tipo, desde, hasta, estado);
  }

  @Get('webhooks')
  async getWebhooks() {
    return await this.contactosService.getWebhooks();
  }

  @Post('webhooks')
  async saveWebhook(@Body() body: { formId: string; url: string; isActive: boolean }) {
    return await this.contactosService.saveWebhook(body.formId, body.url, body.isActive);
  }
}
