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

  @Column()
  liderId: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'liderId' })
  lider: Usuario;
}
