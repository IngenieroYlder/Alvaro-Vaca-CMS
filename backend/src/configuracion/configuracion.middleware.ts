import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfiguracionService } from './configuracion.service';

@Injectable()
export class ConfiguracionMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfiguracionService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    if (req.method === 'GET') {
      try {
        const v = await this.configService.getCacheVersion();
        res.locals.appVersion = v;
      } catch (e) {
        console.error('Error fetching cache version', e);
        res.locals.appVersion = Date.now().toString();
      }
    }
    next();
  }
}
