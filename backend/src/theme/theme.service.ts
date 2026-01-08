import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ThemeConfig } from './entities/theme.entity';
import tinycolor from 'tinycolor2';

@Injectable()
export class ThemeService implements OnModuleInit {
  constructor(
    @InjectRepository(ThemeConfig)
    private themeRepository: Repository<ThemeConfig>,
  ) {}

  async onModuleInit() {
    // Seed default theme if none exists
    const count = await this.themeRepository.count();
    if (count === 0) {
      await this.themeRepository.save(new ThemeConfig());
    }
  }

  async getConfig(): Promise<ThemeConfig> {
    const config = await this.themeRepository.findOne({ where: { id: 1 } });
    return config || new ThemeConfig();
  }

  async updateConfig(newConfig: Partial<ThemeConfig>): Promise<ThemeConfig> {
    const config = await this.getConfig();
    Object.assign(config, newConfig);
    return this.themeRepository.save(config);
  }

  async generateCss(): Promise<string> {
    const config = await this.getConfig();
    const variables = this.generateVariables(config);

    return `:root {
${Object.entries(variables)
  .map(([key, value]) => `  ${key}: ${value};`)
  .join('\n')}
}`;
  }

  private generateVariables(config: ThemeConfig): Record<string, string> {
    const vars: Record<string, string> = {};

    // 1. Colors
    this.generateColorPalette(vars, 'primary', config.primaryColor);
    this.generateColorPalette(vars, 'secondary', config.secondaryColor);
    this.generateColorPalette(vars, 'tertiary', config.tertiaryColor);
    this.generateColorPalette(vars, 'base', config.baseColor);
    this.generateColorPalette(vars, 'accent', config.accentColor);

    // 2. Spacing (Clamps)
    // Scale: xs, s, m, l, xl, xxl, section
    // We base it on a base rem size (usually 1rem = 16px)
    // Using simple scale multipliers for demo: 0.75, 1, 1.5, 2.5, 4, 6, 8
    this.generateClamp(vars, 'space-xs', 0.8, 1.0, config);
    this.generateClamp(vars, 'space-s', 1.2, 1.4, config);
    this.generateClamp(vars, 'space-m', 1.8, 2.4, config); // Base logic matches the JSON
    this.generateClamp(vars, 'space-l', 3.0, 3.6, config);
    this.generateClamp(vars, 'space-xl', 4.5, 5.4, config);
    this.generateClamp(vars, 'space-xxl', 6.8, 8.1, config);
    this.generateClamp(vars, 'space-section', 9.0, 12.0, config);
    this.generateClamp(vars, 'logo-width', 12.0, 20.0, config);

    // 3. Typography
    this.generateClamp(vars, 'h1', 4.4, 5.5, config);
    this.generateClamp(vars, 'h2', 3.5, 4.4, config);
    this.generateClamp(vars, 'h3', 2.8, 3.5, config);
    this.generateClamp(vars, 'h4', 2.2, 2.8, config);
    this.generateClamp(vars, 'text-m', 1.0, 1.125, config); // body

    // Fonts
    vars['--font-heading'] = `"${config.headingFont}", sans-serif`;
    vars['--font-body'] = `"${config.bodyFont}", sans-serif`;

    // Radius
    vars['--radius'] = `${config.borderRadius}px`;
    vars['--radius-m'] = `${config.borderRadius}px`;
    vars['--radius-s'] = `${Math.round(config.borderRadius * 0.7)}px`;
    vars['--radius-l'] = `${Math.round(config.borderRadius * 1.5)}px`;

    return vars;
  }

  private generateColorPalette(
    vars: Record<string, string>,
    name: string,
    hex: string,
  ) {
    const color = tinycolor(hex);

    // Base
    vars[`--${name}`] = hex;

    // Transparencies (10-90)
    for (let i = 10; i <= 90; i += 10) {
      vars[`--${name}-trans-${i}`] = color
        .clone()
        .setAlpha(i / 100)
        .toRgbString();
    }

    // Shades (Light/Dark mechanism)
    // Using hardcoded lighten/darken amounts to mimic the provided JSON vibe,
    // or we can use the library's mix/tint/shade logic.
    vars[`--${name}-light`] = tinycolor.mix(hex, '#ffffff', 85).toHexString(); // Very light
    vars[`--${name}-semi-light`] = tinycolor
      .mix(hex, '#ffffff', 40)
      .toHexString();

    vars[`--${name}-medium`] = tinycolor.mix(hex, '#ffffff', 15).toHexString(); // Slightly lighter than base

    vars[`--${name}-semi-dark`] = tinycolor
      .mix(hex, '#000000', 10)
      .toHexString();
    vars[`--${name}-dark`] = tinycolor.mix(hex, '#000000', 20).toHexString();
    vars[`--${name}-ultra-dark`] = tinycolor
      .mix(hex, '#000000', 40)
      .toHexString();
  }

  private generateClamp(
    vars: Record<string, string>,
    name: string,
    minRem: number,
    maxRem: number,
    config: ThemeConfig,
  ) {
    // Formula: y = mx + b
    // m (slope) = (maxSize - minSize) / (maxWidth - minWidth)
    // 1 rem = 16px (assuming default browser)
    const minWidth = config.minViewport;
    const maxWidth = config.maxViewport;

    const minPx = minRem * 16;
    const maxPx = maxRem * 16;

    const slope = (maxPx - minPx) / (maxWidth - minWidth);
    const yAxisIntersection = -minWidth * slope + minPx;

    // slope to vw units (slope * 100)
    const slopeVw = (slope * 100).toFixed(4);
    const intersectRem = (yAxisIntersection / 16).toFixed(4);

    // clamp(min, val + slope, max)
    vars[`--${name}`] =
      `clamp(${minRem}rem, calc(${intersectRem}rem + ${slopeVw}vw), ${maxRem}rem)`;
  }
}
