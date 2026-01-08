import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Carpeta } from './carpeta.entity';

@Entity('medios')
export class Medio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  filename: string; // Nombre guardado en disco (uuid.ext)

  @Column()
  originalName: string; // Nombre original subido por el usuario

  @Column()
  mimetype: string; // image/png, etc.

  @Column({ type: 'int' })
  size: number;

  @Column()
  path: string; // Ruta relativa local

  @Column()
  url: string; // URL pública para acceder

  // --- Metadatos nuevos ---
  @Column({ nullable: true })
  titulo?: string;

  @Column({ nullable: true })
  alt?: string;

  @Column({ nullable: true })
  leyenda?: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @ManyToOne(() => Carpeta, (carpeta) => carpeta.medios, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  carpeta?: Carpeta;

  @Column({ nullable: true })
  carpetaId?: string;

  @CreateDateColumn()
  createdAt: Date;
}
