import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Noticia } from '../../noticias/entities/noticia.entity';

@Entity('categorias_noticias')
export class CategoriaNoticia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  nombre: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @OneToMany(() => Noticia, (noticia) => noticia.categoria)
  noticias: Noticia[];

  @Column({ default: true })
  activo: boolean;
}
