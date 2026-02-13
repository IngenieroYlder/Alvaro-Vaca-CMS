import { Controller, Post, UseGuards, Get } from '@nestjs/common';
import { ConfiguracionService } from './configuracion.service';
import { JwtAuthGuard } from '../autenticacion/guards/jwt-auth.guard';
import { RolesGuard } from '../autenticacion/guards/roles.guard';
import { Roles } from '../autenticacion/decorators/roles.decorator';
import { Rol } from '../roles/entities/rol.entity';

@Controller('configuracion')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConfiguracionController {
  constructor(private readonly configService: ConfiguracionService) {}

  @Post('limpiar-cache')
  @Roles('admin', 'superadmin')
  async limpiarCache() {
    const version = await this.configService.updateCacheVersion();
    return { ok: true, version, message: 'Caché limpiado correctamente' };
  }

  @Get('version')
  async getVersion() {
     const version = await this.configService.getCacheVersion();
     return { version };
  }
}
