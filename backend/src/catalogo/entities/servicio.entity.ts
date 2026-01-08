import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CategoriaServicio } from './categoria-servicio.entity';

@Entity('servicios')
export class Servicio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column('decimal', { precision: 10, scale: 2 })
  precio: number;

  @Column({ nullable: true })
  imagenPrincipal: string;

  @Column('simple-array', { nullable: true })
  galeria: string[];

  @ManyToOne(() => CategoriaServicio, (categoria) => categoria.servicios, {
    nullable: true,
  })
  categoria: CategoriaServicio;

  @CreateDateColumn()
  creadoEn: Date;

  @UpdateDateColumn()
  actualizadoEn: Date;
}
