import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { JwtAuthGuard } from '../autenticacion/guards/jwt-auth.guard';
import { RolesGuard } from '../autenticacion/guards/roles.guard';
import { Roles } from '../autenticacion/decorators/roles.decorator';

@Controller('webhooks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Roles('admin', 'god')
  @Post('configurar')
  crearConfig(@Body() body: any) {
    return this.webhooksService.crear(body);
  }

  @Roles('admin', 'god')
  @Get('configuraciones')
  listarConfig() {
    return this.webhooksService.listar();
  }

  @Roles('admin', 'god')
  @Post('test/:evento')
  testWebhook(@Param('evento') evento: string, @Body() datos: any) {
    return this.webhooksService.dispararWebhook(evento, datos);
  }
}
