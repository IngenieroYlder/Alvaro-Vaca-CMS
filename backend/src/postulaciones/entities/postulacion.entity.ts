import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Vacante } from '../../vacantes/entities/vacante.entity';

export enum EstadoPostulacion {
    REGISTRADO = 'registrado', // Postulado inicialmente
    HOJA_VIDA_ENVIADA = 'hoja_vida_enviada', // CV subido o enviado
    EN_REVISION = 'en_revision', // Revisión por empresa
    SERA_CONTACTADO = 'sera_contactado', // Pasó fltros, espera contacto
    SELECCIONADO = 'seleccionado', // Contratado
    RECHAZADO = 'rechazado', // No continua

    // DEPRECATED (Legacy states for migration)
    PENDIENTE = 'pendiente',
    REVISION = 'revision',
    ENTREVISTA = 'entrevista',
    PRUEBAS = 'pruebas',
    DESCARTADO = 'descartado'
}

@Entity('postulaciones')
export class Postulacion {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Usuario, (usuario) => usuario.postulaciones, { onDelete: 'CASCADE' })
    usuario: Usuario;

    @ManyToOne(() => Vacante, (vacante) => vacante.postulaciones)
    vacante: Vacante;

    @Column({
        type: 'enum',
        enum: EstadoPostulacion,
        default: EstadoPostulacion.REGISTRADO
    })
    estado: EstadoPostulacion;

    // To track which step of the custom "pasos" workflow the candidate is on
    @Column({ default: 0 })
    pasoActual: number;

    @Column({ type: 'text', nullable: true })
    notas: string; // Internal notes by HR

    @Column({ type: 'varchar', nullable: true })
    hojaDeVida: string; // Filename of the uploaded CV (ZIP)

    @Column({ type: 'text', nullable: true })
    motivoRechazo: string; // Required if state is RECHAZADO

    @Column({ default: false })
    vistoPorReclutador: boolean; // To simulate badge/notification

    @CreateDateColumn()
    fechaPostulacion: Date;

    @UpdateDateColumn()
    fechaActualizacion: Date;
}
