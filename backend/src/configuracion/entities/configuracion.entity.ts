import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('configuracion')
export class Configuracion {
  @PrimaryColumn()
  clave: string;

  @Column()
  valor: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
