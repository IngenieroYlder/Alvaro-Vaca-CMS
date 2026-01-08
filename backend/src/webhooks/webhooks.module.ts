import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { ConfiguracionWebhook } from './entities/webhook-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ConfiguracionWebhook]), HttpModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService], // Exportar por si otros módulos quieren disparar hooks
})
export class WebhooksModule {}
