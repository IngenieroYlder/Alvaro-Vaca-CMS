import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Reunion } from './reunion.entity';

@Entity('asistentes')
export class Asistente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column()
  documento: string;

  @Column()
  telefono: string;

  @Column({ nullable: true })
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
