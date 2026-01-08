import { Controller, Get, Body, Put, Res } from '@nestjs/common';
import { ThemeService } from './theme.service';
import { ThemeConfig } from './entities/theme.entity';
import type { Response } from 'express';

@Controller('theme')
export class ThemeController {
  constructor(private readonly themeService: ThemeService) {}

  @Get('config')
  getConfig() {
    return this.themeService.getConfig();
  }

  @Put('config')
  updateConfig(@Body() config: Partial<ThemeConfig>) {
    return this.themeService.updateConfig(config);
  }

  @Get('css')
  async getCss(@Res() res: Response) {
    const css = await this.themeService.generateCss();
    res.header('Content-Type', 'text/css');
    res.send(css);
  }
}
