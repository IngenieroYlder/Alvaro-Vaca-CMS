import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Postulacion } from '../../postulaciones/entities/postulacion.entity';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false }) // No devolver contraseña por defecto
  contrasena: string;

  @Column({ nullable: true })
  documento: string;

  @Column({ nullable: true })
  nombre: string;

  @Column({ nullable: true })
  apellido: string;

  @Column({ nullable: true })
  telefono: string;

  @Column({ nullable: true })
  fotoPerfil: string; // URL de la imagen

  @Column({ nullable: true })
  whatsapp: string;

  @Column({ default: true })
  activo: boolean;

  // Roles como array simple por ahora (ej: ['admin', 'usuario'])
  // Más adelante se puede migrar a tabla Roles si se requiere granularidad extrema
  @Column('simple-array', { default: 'usuario' })
  roles: string[];

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn: Date;

  @UpdateDateColumn({ name: 'actualizado_en' })
  actualizadoEn: Date;

  @OneToMany(() => Postulacion, (postulacion) => postulacion.usuario)
  postulaciones: Postulacion[];
}
