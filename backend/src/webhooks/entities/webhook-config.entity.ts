import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('configuracion_webhooks')
export class ConfiguracionWebhook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  evento: string; // ej: 'boton_click', 'nuevo_usuario'

  @Column()
  url_destino: string; // Endpoint de n8n

  @Column({ nullable: true })
  clave_secreta: string; // Para la encriptación

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn()
  creadoEn: Date;
}
