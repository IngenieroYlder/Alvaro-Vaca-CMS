import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Reunion } from './reunion.entity';

@Entity('asistentes')
export class Asistente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  nombre: string;

  @Column({ length: 50 })
  apellido: string;

  @Column({ length: 20 })
  documento: string;

  @Column({ length: 15 })
  telefono: string;

  @Column({ nullable: true, length: 150 })
  email: string;

  @Column({ type: 'text', nullable: true })
  firma: string; // Base64 signature or path

  @Column({ default: false })
  habeasData: boolean;

  @ManyToOne(() => Reunion, (reunion) => reunion.asistentes, { onDelete: 'CASCADE' })
  reunion: Reunion;

  @CreateDateColumn()
  createdAt: Date;
}
