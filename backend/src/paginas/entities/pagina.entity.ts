import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('paginas')
export class Pagina {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  titulo: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  contenido: string;

  @Column({ type: 'json', nullable: true })
  meta: any;

  @Column({ default: false })
  esPublica: boolean;

  @CreateDateColumn()
  fechaCreacion: Date;

  @UpdateDateColumn()
  fechaActualizacion: Date;
}
