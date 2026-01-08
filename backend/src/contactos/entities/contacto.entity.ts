import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('contactos')
export class Contacto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column()
  email: string;

  @Column()
  telefono: string;

  @Column({ default: false })
  tieneWhatsapp: boolean;

  @Column({ nullable: true })
  otroWhatsapp: string;

  @Column({ nullable: true })
  rol_sumate: string; // 'voluntario' | 'lider'

  @Column()
  ciudad: string;

  @Column({ default: 'consulta' })
  tipo: string; // 'peticion', 'queja', 'reclamo', 'consulta'

  @Column({ default: 'sin_responder' })
  estado: string; // 'sin_responder', 'abierto', 'resuelto', 'no_resuelto'

  @Column('text')
  mensaje: string;

  @CreateDateColumn()
  fecha: Date;
}
