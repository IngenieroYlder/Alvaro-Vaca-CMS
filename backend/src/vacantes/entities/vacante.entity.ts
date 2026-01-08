import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { CategoriaVacante } from '../../catalogo/entities/categoria-vacante.entity';
import { Postulacion } from '../../postulaciones/entities/postulacion.entity';

export enum EstadoVacante {
  ABIERTA = 'abierta',
  CERRADA = 'cerrada',
  FINALIZA_PRONTO = 'finaliza_pronto',
}

@Entity('vacantes')
export class Vacante {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  titulo: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  imagen: string; // URL of the banner/card image

  @Column({ type: 'text' })
  descripcion: string; // Rich text

  @Column({ type: 'json', nullable: true })
  requisitos: string[]; // Array of strings

  @Column({ type: 'text', nullable: true })
  ubicacion: string;

  @Column()
  tipoContrato: string; // Indefinido, Prestacion, etc.

  @Column({ nullable: true })
  salario: string;

  @ManyToOne(() => CategoriaVacante, (cat) => cat.vacantes, { nullable: true })
  categoria: CategoriaVacante;

  @Column({ type: 'enum', enum: EstadoVacante, default: EstadoVacante.ABIERTA })
  estado: EstadoVacante;

  @Column({ type: 'timestamp', nullable: true })
  fechaCierre: Date;

  // JSON Field to define custom steps for this job application
  // Example: [{ "id": 1, "label": "Registro", "type": "form" }, { "id": 2, "label": "Prueba Técnica", "type": "external_link" }]
  @Column({ type: 'json', default: [] })
  pasos: any[];

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn()
  fechaCreacion: Date;

  @UpdateDateColumn()
  fechaActualizacion: Date;

  @OneToMany(() => Postulacion, (postulacion) => postulacion.vacante)
  postulaciones: Postulacion[];
}
