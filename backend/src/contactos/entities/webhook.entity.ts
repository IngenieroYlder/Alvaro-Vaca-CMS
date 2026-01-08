import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('webhooks')
export class Webhook {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    formId: string; // 'contact-form', 'sumate-form'

    @Column({ nullable: true })
    url: string;

    @Column({ default: true })
    isActive: boolean;
}
