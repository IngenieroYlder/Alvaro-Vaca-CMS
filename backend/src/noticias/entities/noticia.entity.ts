import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { CategoriaNoticia } from '../../catalogo/entities/categoria-noticia.entity';
import { Comentario } from '../../comentarios/entities/comentario.entity';

@Entity('noticias')
export class Noticia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  titulo: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  resumen: string;

  @Column({ type: 'text', nullable: true })
  contenido: string;

  @Column({ nullable: true })
  imagenPrincipal: string;

  @Column({ type: 'json', nullable: true })
  galeria: string[];

  @Column({ default: false })
  destacada: boolean;

  @Column({ default: true })
  activo: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fechaPublicacion: Date;

  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  autor: Usuario;

  @ManyToOne(() => CategoriaNoticia, (categoria) => categoria.noticias, {
    nullable: true,
  })
  categoria: CategoriaNoticia;

  @ManyToMany(() => Noticia)
  @JoinTable({
    name: 'noticias_relacionadas',
    joinColumn: { name: 'noticia_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'relacionada_id', referencedColumnName: 'id' },
  })
  noticiasRelacionadas: Noticia[];

  @CreateDateColumn()
  fechaCreacion: Date;

  @OneToMany(() => Comentario, (comentario) => comentario.noticia)
  comentarios: Comentario[];

  @UpdateDateColumn()
  fechaActualizacion: Date;
}
