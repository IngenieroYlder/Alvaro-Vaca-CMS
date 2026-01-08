import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('roles')
export class Rol {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  nombre: string; // 'admin', 'usuario'

  @Column('simple-array')
  permisos: string[]; // ['dashboard', 'catalogo', 'usuarios', 'temas']

  @Column({ default: 'Shield' })
  icono: string;
}
