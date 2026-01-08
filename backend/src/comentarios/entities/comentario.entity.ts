import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Noticia } from '../../noticias/entities/noticia.entity';

@Entity('comentarios')
export class Comentario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  sitioWeb: string;

  @Column({ type: 'text' })
  contenido: string;

  @Column({ default: false })
  aprobado: boolean;

  @Column({ nullable: true })
  ip: string; // For simple spam blocking

  @ManyToOne(() => Noticia, (noticia) => noticia.comentarios, {
    onDelete: 'CASCADE',
  })
  noticia: Noticia;

  @CreateDateColumn()
  fecha: Date;
}
