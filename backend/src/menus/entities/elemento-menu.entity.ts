import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Tree,
  TreeChildren,
  TreeParent,
} from 'typeorm';
import { Menu } from './menu.entity';
import { Pagina } from '../../paginas/entities/pagina.entity';

@Entity('elementos_menu')
@Tree('closure-table')
export class ElementoMenu {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Menu, (menu) => menu.elementos, { onDelete: 'CASCADE' })
  menu: Menu;

  @Column()
  titulo: string;

  @Column({ default: 'personalizado' }) // 'personalizado' | 'pagina'
  tipo: string;

  @Column({ type: 'text', nullable: true })
  url: string | null; // Para enlaces personalizados

  @ManyToOne(() => Pagina, { nullable: true })
  pagina: Pagina; // Enlace a página interna

  @Column({ type: 'text', nullable: true })
  icono: string | null;

  @Column({ default: 0 })
  orden: number;

  @Column({ default: false })
  targetBlank: boolean;

  @TreeChildren()
  hijos: ElementoMenu[];

  @TreeParent()
  padre: ElementoMenu | null;
}
