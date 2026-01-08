import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('badges_globales')
export class BadgeGlobal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  texto: string; // ej: "Nuevo", "Oferta"

  @Column({ default: '#000000' })
  colorFondo: string;

  @Column({ default: '#ffffff' })
  colorTexto: string;
}
