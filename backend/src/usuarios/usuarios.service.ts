import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import * as bcrypt from 'bcryptjs';
import { Reunion } from '../reuniones/entities/reunion.entity';
import { Postulacion } from '../postulaciones/entities/postulacion.entity';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
  ) { }

  async crear(crearUsuarioDto: CrearUsuarioDto): Promise<Usuario> {
    let { contrasena, ...datosUsuario } = crearUsuarioDto;

    // Si no hay contraseña pero hay documento, usar documento como contraseña
    if (!contrasena && datosUsuario.documento) {
        contrasena = datosUsuario.documento;
    }

    if (!contrasena) {
        throw new ConflictException('La contraseña es obligatoria si no se proporciona documento');
    }

    // Hash de la contraseña
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(contrasena, salt);

    try {
      const nuevoUsuario = this.usuariosRepository.create({
        ...datosUsuario,
        contrasena: hash,
        // Asegurar valores por defecto si no vienen
        activo: true,
        roles: (datosUsuario as any).roles || ['usuario'],
      });
      return await this.usuariosRepository.save(nuevoUsuario);
    } catch (error: any) { // Type 'any' to access 'code'
      if (error.code === '23505') {
        const detail = error.detail || '';
        if (detail.includes('email')) {
             throw new ConflictException('El correo electrónico ya está registrado');
        }
        if (detail.includes('documento')) {
             throw new ConflictException('El documento ya está registrado');
        }
        throw new ConflictException('El usuario ya existe (correo o documento duplicado)');
      }
      throw new InternalServerErrorException('Error al crear el usuario');
    }
  }

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    return await this.usuariosRepository.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'contrasena',
        'roles',
        'documento',
        'activo',
        'nombre',
        'apellido',
      ],
    });
  }

  // Método específico para Auth que necesita la contraseña
  async buscarParaAuth(identificador: string): Promise<Usuario | null> {
    return this.usuariosRepository.findOne({
      where: [
          { email: identificador },
          { documento: identificador }
      ],
      select: [
        'id',
        'email',
        'contrasena',
        'roles',
        'documento',
        'activo',
        'nombre',
        'apellido',
      ],
    });
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    return await this.usuariosRepository.findOne({ where: { id } });
  }

  async listarTodos(role?: string, coordinatorId?: string): Promise<Usuario[]> {
    const query = this.usuariosRepository.createQueryBuilder('usuario')
      .orderBy('usuario.creadoEn', 'DESC');

    if (role) {
      query.andWhere('usuario.roles LIKE :role', { role: `%${role}%` });
    }

    if (coordinatorId) {
        query.andWhere('usuario.coordinatorId = :coordId', { coordId: coordinatorId });
    }

    return await query.getMany();
  }

  async actualizar(
    id: string,
    actualizarUsuarioDto: ActualizarUsuarioDto,
  ): Promise<Usuario> {
    const usuario = await this.buscarPorId(id);
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // Si viene contraseña, hashear
    if (actualizarUsuarioDto.contrasena) {
      actualizarUsuarioDto.contrasena = await bcrypt.hash(
        actualizarUsuarioDto.contrasena,
        10,
      );
    }

    const usuarioActualizado = Object.assign(usuario, actualizarUsuarioDto);
    return await this.usuariosRepository.save(usuarioActualizado);
  }

  async eliminar(id: string): Promise<void> {
    const result = await this.usuariosRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
  }

  async onModuleInit() {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@admin.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    const existingAdmin = await this.usuariosRepository.findOne({
      where: { email: adminEmail },
    });
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(adminPassword, salt);

    if (!existingAdmin) {
      console.log('--- SEEDING DEFAULT ADMIN USER ---');
      const admin = this.usuariosRepository.create({
        email: adminEmail,
        contrasena: hash,
        roles: ['admin', 'god'],
        nombre: 'Admin',
        apellido: 'System',
        activo: true,
      });
      await this.usuariosRepository.save(admin);
      console.log(`--- ADMIN CREATED: ${adminEmail} / [HIDDEN] ---`);
    } else {
      console.log('--- ADMIN EXISTS. SKIPPING UPDATE. ---');
    }

    // --- CLEANUP DUPLICATES LOGIC (Temporary) ---
    // Fix for issue where multiple users have document '123456789'
    const duplicateDoc = '123456789';
    const usersWithDoc = await this.usuariosRepository.find({
        where: { documento: duplicateDoc }
    });

    if (usersWithDoc.length > 1) {
        console.log(`[CLEANUP] Found ${usersWithDoc.length} users with document ${duplicateDoc}`);
        
        // Identify the user to KEEP (Admin or God)
        let mainUser = usersWithDoc.find(u => u.email === adminEmail);
        if (!mainUser) mainUser = usersWithDoc.find(u => u.roles.includes('god'));
        if (!mainUser) {
             // If neither, keep the one created earliest? or just first
             // Sort by createdAt usually better but let's just pick first safe one
             mainUser = usersWithDoc[0];
        }

        console.log(`[CLEANUP] Consolidating data to Main User: ${mainUser.email} (${mainUser.id})`);
        
        for (const user of usersWithDoc) {
            if (user.id === mainUser.id) continue;

            console.log(`[CLEANUP] Moving data from ${user.email} -> ${mainUser.email}`);

            console.log(`[CLEANUP] Moving data from ${user.email} -> ${mainUser.email}`);

            // 1. Reassign Reuniones (Load -> Update -> Save)
            const reuniones = await this.usuariosRepository.manager.find(Reunion, {
                where: { lider: { id: user.id } }
            });
            console.log(`[CLEANUP] Found ${reuniones.length} meetings to move.`);
            for (const reunion of reuniones) {
                reunion.lider = mainUser;
                reunion.liderId = mainUser.id; // Sync explicit column
                await this.usuariosRepository.manager.save(reunion);
            }

            // 2. Reassign Postulaciones (Load -> Update -> Save)
            const postulaciones = await this.usuariosRepository.manager.find(Postulacion, {
                where: { usuario: { id: user.id } }
            });
            console.log(`[CLEANUP] Found ${postulaciones.length} applications to move.`);
            for (const postulacion of postulaciones) {
                postulacion.usuario = mainUser;
                await this.usuariosRepository.manager.save(postulacion);
            }

            // 3. Delete the duplicate user
            console.log(`[CLEANUP] Deleting duplicate user: ${user.email} (${user.id})`);
            await this.usuariosRepository.delete(user.id);
        }
    }
    // --------------------------------------------
  }

  async exportarExcel(): Promise<Buffer> {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Usuarios');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 30 },
      { header: 'Nombre', key: 'nombre', width: 20 },
      { header: 'Apellido', key: 'apellido', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Teléfono', key: 'telefono', width: 15 },
      { header: 'WhatsApp', key: 'whatsapp', width: 15 },
      { header: 'Roles', key: 'roles', width: 20 },
      { header: 'Activo', key: 'activo', width: 10 },
      { header: 'Fecha Registro', key: 'creadoEn', width: 20 },
    ];

    const usuarios = await this.listarTodos();
    const usuariosExportables = usuarios.filter(u => !u.roles.includes('god'));

    usuariosExportables.forEach(u => {
      worksheet.addRow({
        id: u.id,
        nombre: u.nombre,
        apellido: u.apellido,
        email: u.email,
        telefono: u.telefono,
        whatsapp: u.whatsapp,
        roles: u.roles.join(', '),
        activo: u.activo ? 'Si' : 'No',
        creadoEn: u.creadoEn.toISOString().split('T')[0]
      });
    });

    return await workbook.xlsx.writeBuffer();
  }

  async exportarPdf(): Promise<Buffer> {
    const PDFDocument = require('pdfkit');

    return new Promise(async (resolve, reject) => {
      const doc = new PDFDocument({ margin: 30 });
      const buffers: any[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header
      doc.fontSize(20).text('Reporte de Usuarios', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Generado: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(2);

      const usuarios = await this.listarTodos();
      const usuariosExportables = usuarios.filter(u => !u.roles.includes('god'));

      // Simple Table Simulation
      let y = doc.y;
      const x = 30;

      doc.font('Helvetica-Bold').fontSize(9);
      doc.text('Nombre', x, y);
      doc.text('Email', x + 150, y);
      doc.text('Rol', x + 350, y);
      doc.text('Celular', x + 450, y);

      doc.moveTo(x, y + 15).lineTo(580, y + 15).stroke();
      y += 20;
      doc.font('Helvetica').fontSize(9);

      usuariosExportables.forEach(u => {
        if (y > 700) { // New Page
          doc.addPage();
          y = 30;
        }

        const nombreCompleto = `${u.nombre || ''} ${u.apellido || ''}`.trim() || 'Sin Nombre';

        doc.text(nombreCompleto.substring(0, 30), x, y);
        doc.text(u.email.substring(0, 40), x + 150, y);
        doc.text(u.roles.join(', '), x + 350, y);
        doc.text(u.telefono || '-', x + 450, y);

        y += 15;
      });

      doc.end();
    });
  }
}
