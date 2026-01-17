import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('votantes')
export class Votante {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 100 })
  apellido: string;

  @Column({ length: 20 })
  documento: string;

  @Column({ length: 20, nullable: true })
  telefono: string;

  @Column({ length: 150, nullable: true })
  email: string;

  @Column({ nullable: true })
  direccion: string;

  @Column({ length: 100 })
  departamento: string;

  @Column({ length: 100 })
  municipio: string;

  @Column({ nullable: true })
  comuna: string;

  @Column({ nullable: true })
  puestoVotacion: string;

  @Column({ nullable: true })
  mesa: string;

  @ManyToOne(() => Usuario, { eager: false })
  lider: Usuario;

  @Column()
  liderId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
