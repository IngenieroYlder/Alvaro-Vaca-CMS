import { Injectable, BadRequestException, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Postulacion, EstadoPostulacion } from './entities/postulacion.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Vacante } from '../vacantes/entities/vacante.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PostulacionesService implements OnModuleInit {
    constructor(
        @InjectRepository(Postulacion)
        private postulacionRepo: Repository<Postulacion>,
        @InjectRepository(Usuario)
        private usuarioRepo: Repository<Usuario>,
        @InjectRepository(Vacante)
        private vacanteRepo: Repository<Vacante>,
    ) { }

    onModuleInit() {
        const uploadDir = path.join(process.cwd(), 'uploads', 'cvs');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
    }

    async aplicar(usuarioId: string, vacanteId: string) {
        // 1. Check if Vacante exists and is open
        const vacante = await this.vacanteRepo.findOneBy({ id: vacanteId });
        if (!vacante) throw new NotFoundException('Vacante no encontrada');
        if (!vacante.activo || vacante.estado === 'cerrada') throw new BadRequestException('La vacante está cerrada');

        // 2. Check if already applied
        const existing = await this.postulacionRepo.findOne({
            where: { usuario: { id: usuarioId }, vacante: { id: vacanteId } }
        });
        if (existing) throw new BadRequestException('Ya te has postulado a esta vacante');

        // 3. Create Postulacion
        const usuario = await this.usuarioRepo.findOneBy({ id: usuarioId });
        if (!usuario) throw new NotFoundException('Usuario no encontrado');

        const postulacion = this.postulacionRepo.create({
            usuario,
            vacante,
            estado: EstadoPostulacion.REGISTRADO,
            pasoActual: 1, // Start at step 1
            vistoPorReclutador: false
        });

        return await this.postulacionRepo.save(postulacion);
    }

    async misPostulaciones(usuarioId: string) {
        return await this.postulacionRepo.find({
            where: { usuario: { id: usuarioId } },
            relations: ['vacante', 'vacante.categoria'], // Fixed: Include category
            order: { fechaPostulacion: 'DESC' }
        });
    }

    async porVacante(vacanteId: string) {
        // Ensure vacanteId is treated safely.
        // Also load 'usuario' to show name, email, phone in the dashboard
        const results = await this.postulacionRepo.find({
            where: { vacante: { id: vacanteId } },
            relations: ['usuario'],
            order: { fechaPostulacion: 'DESC' }
        });
        return results;
    }

    async haPostulado(usuarioId: string, vacanteId: string): Promise<boolean> {
        const count = await this.postulacionRepo.count({
            where: { usuario: { id: usuarioId }, vacante: { id: vacanteId } }
        });
        return count > 0;
    }

    async obtenerParaDescarga(id: string) {
        const postulacion = await this.postulacionRepo.findOne({
            where: { id },
            relations: ['usuario', 'vacante']
        });
        if (!postulacion || !postulacion.hojaDeVida) throw new NotFoundException('Archivo no encontrado');

        const filePath = path.join(process.cwd(), 'uploads', 'cvs', postulacion.hojaDeVida);
        if (!fs.existsSync(filePath)) throw new NotFoundException('El archivo físico no existe');

        // Format: [Candidate Name]-[Vacancy]-[Date].zip
        // Sanitize strings to avoid filesystem issues
        const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9]/g, '_');
        const candidateName = sanitize(`${postulacion.usuario.nombre || 'Candidato'}_${postulacion.usuario.apellido || ''}`);
        const vacancyName = sanitize(postulacion.vacante.titulo);
        const date = new Date().toISOString().split('T')[0];

        const downloadName = `${candidateName}-${vacancyName}-${date}.zip`;

        return { filePath, downloadName };
    }

    async actualizarEstado(id: string, estado: EstadoPostulacion, notas?: string, motivoRechazo?: string) {
        const postulacion = await this.postulacionRepo.findOneBy({ id });
        if (!postulacion) throw new NotFoundException('Postulacion no encontrada');

        postulacion.estado = estado;

        // Logic for step calculation based on state
        switch (estado) {
            case EstadoPostulacion.REGISTRADO: postulacion.pasoActual = 1; break;
            case EstadoPostulacion.HOJA_VIDA_ENVIADA: postulacion.pasoActual = 2; break;
            case EstadoPostulacion.EN_REVISION: postulacion.pasoActual = 3; break;
            case EstadoPostulacion.SERA_CONTACTADO: postulacion.pasoActual = 4; break;
            case EstadoPostulacion.SELECCIONADO: postulacion.pasoActual = 5; break;
            case EstadoPostulacion.RECHAZADO: postulacion.pasoActual = 0; break; // Or keep previous? 0 implies out.
        }

        if (notas) postulacion.notas = notas;

        if (estado === EstadoPostulacion.RECHAZADO) {
            if (!motivoRechazo) throw new BadRequestException('Se requiere motivo para rechazar');
            postulacion.motivoRechazo = motivoRechazo;
        }

        // Updating state implies the recruiter has seen it or is interacting with it, 
        // so we could say seen=true. BUT if the CANDIDATE makes a change (upload CV), 
        // we might want seen=false. This method is primarily for ADMIN/RECRUITER use.
        postulacion.vistoPorReclutador = true;

        return await this.postulacionRepo.save(postulacion);
    }

    async registrarHojaDeVida(id: string, filename: string) {
        const postulacion = await this.postulacionRepo.findOneBy({ id });
        if (!postulacion) throw new NotFoundException('Postulacion no encontrada');

        postulacion.hojaDeVida = filename;
        postulacion.estado = EstadoPostulacion.HOJA_VIDA_ENVIADA;
        postulacion.pasoActual = 2;
        postulacion.vistoPorReclutador = false; // Trigger notification/badge for recruiter

        return await this.postulacionRepo.save(postulacion);
    }

    async contarNovedades(): Promise<number> {
        return await this.postulacionRepo.count({
            where: { vistoPorReclutador: false }
        });
    }

    async marcarVisto(id: string) {
        const postulacion = await this.postulacionRepo.findOneBy({ id });
        if (postulacion) {
            postulacion.vistoPorReclutador = true;
            await this.postulacionRepo.save(postulacion);
        }
    }
}
