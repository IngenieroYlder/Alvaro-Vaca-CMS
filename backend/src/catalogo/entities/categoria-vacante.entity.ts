import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Vacante } from '../../vacantes/entities/vacante.entity';

@Entity('categorias_vacantes')
export class CategoriaVacante {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  descripcion: string;

  @OneToMany(() => Vacante, (vacante) => vacante.categoria)
  vacantes: Vacante[];

  @Column({ default: true })
  activo: boolean;
}
