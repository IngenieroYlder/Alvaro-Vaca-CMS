import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfiguracionWebhook } from './entities/webhook-config.entity';
import * as crypto from 'crypto';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectRepository(ConfiguracionWebhook)
    private webhooksRepo: Repository<ConfiguracionWebhook>,
    // HttpService requires HttpModule from @nestjs/axios
    private readonly httpService: HttpService,
  ) {}

  async crear(datos: any) {
    const config = this.webhooksRepo.create(datos);
    return this.webhooksRepo.save(config);
  }

  async listar() {
    return this.webhooksRepo.find();
  }

  // Lógica principal: Encriptar y enviar
  async dispararWebhook(evento: string, datos: any) {
    const config = await this.webhooksRepo.findOne({
      where: { evento, activo: true },
    });
    if (!config) {
      this.logger.warn(
        `No se encontró configuración activa para el evento: ${evento}`,
      );
      return { status: 'skipped', reason: 'No config found' };
    }

    const payload = this.encriptarDatos(datos, config.clave_secreta);

    try {
      // Enviar POST a n8n
      const response = await lastValueFrom(
        this.httpService.post(config.url_destino, {
          evento,
          payload_encriptado: payload,
          timestamp: new Date().toISOString(),
        }),
      );
      return { status: 'success', n8n_response: response.data };
    } catch (error) {
      this.logger.error(`Error enviando webhook ${evento}`, error);
      return { status: 'error', error: error.message };
    }
  }

  private encriptarDatos(datos: any, clave: string): string {
    if (!clave) return JSON.stringify(datos); // Si no hay clave, enviar plano (o lanzar error)

    // Clave debe ser 32 bytes para AES-256. Si es menor, hash it.
    const key = crypto.createHash('sha256').update(String(clave)).digest();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    let encrypted = cipher.update(JSON.stringify(datos), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Retornamos IV + Encrypted para poder desencriptar
    return iv.toString('hex') + ':' + encrypted;
  }
}
