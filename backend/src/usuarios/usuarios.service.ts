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

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
  ) { }

  async crear(crearUsuarioDto: CrearUsuarioDto): Promise<Usuario> {
    const { contrasena, ...datosUsuario } = crearUsuarioDto;

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
    } catch (error) {
      if (error.code === '23505') {
        // Código de error de Postgres para Unique Violation
        throw new ConflictException('El correo electrónico ya está registrado');
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
        'activo',
        'nombre',
        'apellido',
      ],
    });
  }

  // Método específico para Auth que necesita la contraseña
  async buscarParaAuth(email: string): Promise<Usuario | null> {
    return this.usuariosRepository.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'contrasena',
        'roles',
        'activo',
        'nombre',
        'apellido',
      ],
    });
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    return await this.usuariosRepository.findOne({ where: { id } });
  }

  async listarTodos(): Promise<Usuario[]> {
    return await this.usuariosRepository.find({
      order: { creadoEn: 'DESC' },
    });
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
