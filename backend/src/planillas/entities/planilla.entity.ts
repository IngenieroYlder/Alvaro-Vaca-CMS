import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('planillas')
export class Planilla {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  url: string;

  @Column()
  nombreOriginal: string;

  @CreateDateColumn()
  fechaCarga: Date;

  @Column({ nullable: true })
  descripcion: string;

  @Column({ nullable: true })
  fechaInicio: Date;

  @Column({ nullable: true })
  fechaFin: Date;

  @Column()
  liderId: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'liderId' })
  lider: Usuario;

  @Column({ default: 'Pendiente para verificar' })
  estado: string;

  @Column({ type: 'text', nullable: true })
  notas: string;
}
