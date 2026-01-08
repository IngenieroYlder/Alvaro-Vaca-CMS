import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Servicio } from './servicio.entity';

@Entity('categorias_servicios')
export class CategoriaServicio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  nombre: string;

  @Column({ nullable: true })
  descripcion: string;

  @OneToMany(() => Servicio, (servicio) => servicio.categoria)
  servicios: Servicio[];
}
