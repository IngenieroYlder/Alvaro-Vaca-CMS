import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Medio } from './entities/medio.entity';
import { Carpeta } from './entities/carpeta.entity';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MediosService {
  constructor(
    @InjectRepository(Medio)
    private mediosRepository: Repository<Medio>,
    @InjectRepository(Carpeta)
    private carpetasRepository: Repository<Carpeta>,
  ) {}

  async crear(file: Express.Multer.File, carpetaId?: string): Promise<Medio> {
    if (!file) {
      throw new BadRequestException('No se ha subido ningún archivo');
    }

    let carpeta;
    if (carpetaId) {
      carpeta = await this.carpetasRepository.findOne({
        where: { id: carpetaId },
      });
      if (!carpeta) throw new NotFoundException('Carpeta no encontrada');
    }

    // Optimization Logic
    const filename = file.filename;
    let size = file.size;
    const mimetype = file.mimetype;
    const finalPath = file.path;

    // Only optimize images
    if (file.mimetype.match(/^image\/(jpeg|png|webp|tiff|gif)$/)) {
      try {
        const image = sharp(file.path);
        const metadata = await image.metadata();

        // Resize if too big (e.g. > 1920px width)
        if (metadata.width && metadata.width > 1920) {
          image.resize({ width: 1920 });
        }

        // Compress (jpeg 80%, webp 80%, png etc)
        // We'll normalize everything to WebP for web performance if desired,
        // OR keep format but compressed. Let's keep format to avoid confusion but compress.
        // Actually, converting to WebP is best for web. Let's do that for non-transparent or standard images.
        // For simplicity and compatibility, let's keep original format but compress.

        if (mimetype === 'image/jpeg' || mimetype === 'image/jpg') {
          image.jpeg({ quality: 80 });
        } else if (mimetype === 'image/png') {
          image.png({ quality: 80 });
        } else if (mimetype === 'image/webp') {
          image.webp({ quality: 80 });
        }

        // Save to buffer
        const buffer = await image.toBuffer();

        // Overwrite original file or create new?
        // Multer already saved it. Let's overwrite it to save space.
        fs.writeFileSync(file.path, buffer);

        // Update size info
        const stats = fs.statSync(file.path);
        size = stats.size;
      } catch (error) {
        console.error('Image optimization failed', error);
        // Continue with original file if optimization fails
      }
    }

    const medio = this.mediosRepository.create({
      filename: filename,
      originalName: file.originalname,
      mimetype: mimetype,
      size: size,
      path: finalPath,
      url: `/uploads/${filename}`,
      carpeta: carpeta || undefined,
      carpetaId: carpeta ? carpeta.id : undefined,
      titulo: file.originalname, // Default title
    });

    return await this.mediosRepository.save(medio);
  }

  async crearCarpeta(nombre: string, parentId?: string): Promise<Carpeta> {
    let parent;
    if (parentId) {
      parent = await this.carpetasRepository.findOne({
        where: { id: parentId },
      });
      if (!parent) throw new NotFoundException('Carpeta padre no encontrada');
    }

    const carpeta = this.carpetasRepository.create({
      nombre,
      parent: parent || undefined,
      parentId: parent ? parent.id : undefined,
    });

    return await this.carpetasRepository.save(carpeta);
  }

  async obtenerContenido(
    carpetaId: string | null,
  ): Promise<{ carpetas: Carpeta[]; medios: Medio[] }> {
    const whereCondition = carpetaId ? { id: carpetaId } : { id: IsNull() };

    // Si carpetaId es 'root' o null, buscamos donde parentId es null
    const parentIdQuery =
      carpetaId && carpetaId !== 'root' ? carpetaId : IsNull();

    const carpetas = await this.carpetasRepository.find({
      where: { parentId: parentIdQuery },
      order: { nombre: 'ASC' },
    });

    const medios = await this.mediosRepository.find({
      where: { carpetaId: parentIdQuery },
      order: { createdAt: 'DESC' },
    });

    return { carpetas, medios };
  }

  async actualizarMedio(
    id: string,
    updateData: Partial<Medio>,
  ): Promise<Medio> {
    const medio = await this.mediosRepository.findOne({ where: { id } });
    if (!medio) throw new NotFoundException('Medio no encontrado');

    Object.assign(medio, updateData);
    return await this.mediosRepository.save(medio);
  }

  async obtenerTodos(): Promise<Medio[]> {
    return await this.mediosRepository.find({ order: { createdAt: 'DESC' } });
  }

  async eliminar(id: string): Promise<void> {
    const medio = await this.mediosRepository.findOne({ where: { id } });
    if (medio) {
      try {
        if (fs.existsSync(medio.path)) {
          fs.unlinkSync(medio.path);
        }
      } catch (error) {
        console.error('Error eliminando archivo físico:', error);
      }
      await this.mediosRepository.remove(medio);
    }
  }

  async eliminarCarpeta(id: string): Promise<void> {
    // Al eliminar carpeta, TypeORM con CASCADE debería manejar los hijos,
    // pero idealmente deberíamos borrar los archivos físicos de los medios hijos primero.
    // Por simplicidad ahora, solo borramos la entidad.
    // TODO: Implementar borrado recursivo de archivos físicos.
    const carpeta = await this.carpetasRepository.findOne({
      where: { id },
      relations: ['medios'],
    });
    if (!carpeta) throw new NotFoundException('Carpeta no encontrada');

    // Borrar archivos físicos de esta carpeta
    for (const medio of carpeta.medios) {
      try {
        if (fs.existsSync(medio.path)) fs.unlinkSync(medio.path);
      } catch (e) {
        console.error('Error borrando archivo fisico', e);
      }
    }

    await this.carpetasRepository.remove(carpeta);
  }
}
