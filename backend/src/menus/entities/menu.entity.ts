import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ElementoMenu } from './elemento-menu.entity';

@Entity('menus')
export class Menu {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column({ unique: true })
  slug: string; // ej: 'header-visitante', 'header-usuario', 'footer'

  @OneToMany(() => ElementoMenu, (elemento) => elemento.menu, { cascade: true })
  elementos: ElementoMenu[];
}
