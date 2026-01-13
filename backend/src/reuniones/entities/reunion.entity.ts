import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Asistente } from './asistente.entity';

@Entity('reuniones')
export class Reunion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column({ type: 'timestamp' })
  fecha: Date;

  @Column()
  liderNombre: string;

  @Column()
  liderDocumento: string;

  @Column()
  liderTelefono: string;

  @Column({ default: 'Villavicencio' })
  municipio: string;

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
