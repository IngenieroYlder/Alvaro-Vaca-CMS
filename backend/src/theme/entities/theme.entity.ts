import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('theme_config')
export class ThemeConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 'My Project' })
  projectName: string;

  // --- Colors ---
  @Column({ default: '#8338ec' })
  primaryColor: string;

  @Column({ default: '#ffbe0b' })
  secondaryColor: string;

  @Column({ default: '#2e62ff' })
  tertiaryColor: string;

  @Column({ default: '#4d4d66' })
  baseColor: string; // Text color

  @Column({ default: '#5ed270' })
  accentColor: string;

  // --- Typography ---
  @Column({ default: 'Inter' })
  headingFont: string;

  @Column({ default: 'Roboto' })
  bodyFont: string;

  @Column({ type: 'float', default: 16 })
  baseFontSizePx: number;

  @Column({ type: 'float', default: 1.25 })
  typeScale: number; // Major Third by default

  // --- Spacing ---
  @Column({ type: 'float', default: 1.5 })
  spacingScale: number;

  @Column({ type: 'float', default: 20 })
  borderRadius: number;

  // --- Viewport Config (for clamps) ---
  @Column({ default: 380 })
  minViewport: number;

  @Column({ default: 1280 })
  maxViewport: number;

  // --- Media / Logos ---
  @Column({ nullable: true })
  logoVertical: string; // URL

  @Column({ nullable: true })
  logoHorizontal: string; // URL

  @Column({ nullable: true })
  logoBlanco: string; // URL

  @Column({ nullable: true })
  logoNegro: string; // URL

  @Column({ nullable: true })
  logoFooterSecondary: string; // URL

  // --- SEO & Metadata ---
  @Column({ nullable: true })
  favicon: string; // URL

  @Column({ default: 'Panel de Control' })
  tituloPagina: string;

  @Column({ default: 'Bienvenido al sistema de gestión de Colombia Pictures' })
  descripcionPagina: string;
}
