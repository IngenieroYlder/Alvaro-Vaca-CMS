import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('negocio')
export class Negocio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  nombre: string;

  @Column({ nullable: true })
  slogan: string;

  @Column({ nullable: true })
  telefono: string;

  @Column({ nullable: true })
  direccion: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  contactoUrl: string;

  // Redes Sociales
  @Column({ nullable: true })
  instagram: string;

  @Column({ nullable: true })
  facebook: string;

  @Column({ nullable: true })
  x: string; // Twitter

  @Column({ nullable: true })
  tiktok: string;

  @Column({ nullable: true })
  pinterest: string;

  @Column({ nullable: true })
  youtube: string;

  @Column({ nullable: true })
  linkedin: string;

  @Column({ nullable: true })
  webhookUrl: string;

  @Column({ nullable: true })
  webhookToken: string;

  @Column({ nullable: true, type: 'text' })
  horarioAtencion: string;

  @Column({ nullable: true })
  numeroContrato: string;

  @Column({ nullable: true })
  tarifasImage: string;
}
