import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne } from 'typeorm';
import { Asistente } from './asistente.entity';

import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('reuniones')
export class Reunion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column({ type: 'timestamp' })
  fecha: Date;

  @ManyToOne(() => Usuario, { nullable: true })
  lider: Usuario;

  @Column({ nullable: true })
  liderId: string;

  @Column()
  liderNombre: string;

  @Column({ nullable: true })
  liderDocumento: string;

  @Column()
  liderTelefono: string;

  @Column({ default: 'Villavicencio' })
  municipio: string;

  @Column({ default: 'Meta' })
  departamento: string;

  @Column({ nullable: true })
  comuna: string;

  @Column({ nullable: true })
  corregimiento: string;

  @Column()
  barrio: string;

  @Column({ unique: true })
  codigo: string;

  @OneToMany(() => Asistente, (asistente) => asistente.reunion)
  asistentes: Asistente[];

  @CreateDateColumn()
  createdAt: Date;
}
