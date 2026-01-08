import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Medio } from './medio.entity';

@Entity('carpetas')
export class Carpeta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @ManyToOne(() => Carpeta, (carpeta) => carpeta.subcarpetas, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parentId' })
  parent?: Carpeta;

  @Column({ nullable: true })
  parentId?: string;

  @OneToMany(() => Carpeta, (carpeta) => carpeta.parent)
  subcarpetas: Carpeta[];

  @OneToMany(() => Medio, (medio) => medio.carpeta)
  medios: Medio[];

  @CreateDateColumn()
  createdAt: Date;
}
