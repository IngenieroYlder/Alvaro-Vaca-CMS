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

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ select: false, nullable: true }) // Password can be null temporarily or generated
  contrasena: string;

  @Column({ unique: true, nullable: true }) // Documento required for Login (but nullable for legacy data)
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
