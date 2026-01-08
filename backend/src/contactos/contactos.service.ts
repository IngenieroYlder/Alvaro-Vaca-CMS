import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository, FindOptionsWhere } from 'typeorm';
import { Contacto } from './entities/contacto.entity';
import { Webhook } from './entities/webhook.entity';
import { CreateContactoDto } from './dto/create-contacto.dto';
import type { Response } from 'express';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { NegocioService } from '../negocio/negocio.service';
import { ThemeService } from '../theme/theme.service';
import axios from 'axios';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ContactosService {
  constructor(
    @InjectRepository(Contacto)
    private contactoRepository: Repository<Contacto>,
    @InjectRepository(Webhook)
    private webhookRepository: Repository<Webhook>,
    private readonly negocioService: NegocioService,
    private readonly themeService: ThemeService,
  ) { }

  async create(createContactoDto: CreateContactoDto): Promise<Contacto> {
    // Remove the honeypot field and formId before saving
    const { _gotcha, formId, ...data } = createContactoDto;
    const nuevoContacto = this.contactoRepository.create(data);
    const saved = await this.contactoRepository.save(nuevoContacto);

    // Webhook trigger
    this.triggerWebhook(saved, formId).catch((err) =>
      console.error('Webhook Error:', err),
    );

    return saved;
  }

  private async triggerWebhook(contacto: Contacto, formId?: string) {
    if (!formId) return;

    const webhookConfig = await this.webhookRepository.findOneBy({ formId, isActive: true });

    if (webhookConfig?.url) {
      try {
        await axios.post(webhookConfig.url, contacto, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        console.log(`Webhook (${formId}) sent successfully to:`, webhookConfig.url);
      } catch (error) {
        console.error(`Failed to trigger webhook (${formId}):`, error.message);
      }
    }
  }

  async getWebhooks(): Promise<Webhook[]> {
    return await this.webhookRepository.find();
  }

  async saveWebhook(formId: string, url: string, isActive: boolean): Promise<Webhook> {
    let webhook = await this.webhookRepository.findOneBy({ formId });
    if (!webhook) {
      webhook = this.webhookRepository.create({ formId });
    }
    webhook.url = url;
    webhook.isActive = isActive;
    return await this.webhookRepository.save(webhook);
  }

  async findAll(
    tipo?: string,
    desde?: string,
    hasta?: string,
    estado?: string,
  ): Promise<Contacto[]> {
    const where: FindOptionsWhere<Contacto> = {};

    if (tipo) {
      where.tipo = tipo;
    }

    if (estado) {
      where.estado = estado;
    }

    if (desde && hasta) {
      // Expecting YYYY-MM-DD
      const start = new Date(desde);
      start.setHours(0, 0, 0, 0);
      const end = new Date(hasta);
      end.setHours(23, 59, 59, 999);
      where.fecha = Between(start, end);
    } else if (desde) {
      const start = new Date(desde);
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      where.fecha = Between(start, end);
    }

    return await this.contactoRepository.find({
      where,
      order: { fecha: 'DESC' },
    });
  }

  async updateStatus(id: string, estado: string): Promise<Contacto> {
    const contacto = await this.contactoRepository.findOneBy({ id });
    if (!contacto) {
      throw new Error('Contacto no encontrado');
    }
    contacto.estado = estado;
    return await this.contactoRepository.save(contacto);
  }

  async exportExcel(
    res: Response,
    tipo?: string,
    desde?: string,
    hasta?: string,
    estado?: string,
  ) {
    const contactos = await this.findAll(tipo, desde, hasta, estado);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Contactos');

    worksheet.columns = [
      { header: 'Fecha', key: 'fecha', width: 20 },
      { header: 'Nombre', key: 'nombre', width: 30 },
      { header: 'Tipo', key: 'tipo', width: 15 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Email', key: 'email', width: 35 },
      { header: 'Teléfono', key: 'telefono', width: 15 },
      { header: 'Ciudad', key: 'ciudad', width: 20 },
      { header: 'Mensaje', key: 'mensaje', width: 50 },
      { header: 'WhatsApp', key: 'whatsapp', width: 10 },
      { header: 'Rol Súmate', key: 'rol_sumate', width: 15 },
    ];

    contactos.forEach((c) => {
      worksheet.addRow({
        fecha: format(c.fecha, 'yyyy-MM-dd HH:mm', { locale: es }),
        nombre: c.nombre,
        tipo: c.tipo || 'consulta',
        estado: c.estado || 'sin_responder',
        email: c.email,
        telefono: c.telefono,
        ciudad: c.ciudad,
        mensaje: c.mensaje,
        whatsapp: c.tieneWhatsapp ? 'Sí' : 'No',
        rol_sumate: c.rol_sumate || '-',
      });
    });

    const filename = `Mensajes_y_Voluntariado_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

    await workbook.xlsx.write(res);
    res.end();
  }

  async exportPdf(
    res: Response,
    tipo?: string,
    desde?: string,
    hasta?: string,
    estado?: string,
  ) {
    const contactos = await this.findAll(tipo, desde, hasta, estado);
    const settings = await this.negocioService.getInfo();
    const theme = await this.themeService.getConfig();

    // Fix: bufferPages: true is required to count pages at the end
    const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });

    const filename = `Mensajes_y_Voluntariado_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

    doc.pipe(res);

    // --- Styles ---
    const primaryColor = theme.primaryColor || '#8338ec';
    const textColor = '#333333';
    const grayColor = '#666666';

    // --- Header Branding ---
    const yHeader = 30;

    // 1. Primary Logo (Dynamic)
    const logoPath = theme.logoHorizontal || theme.logoVertical;
    if (logoPath) {
      try {
        const relativePath = logoPath.replace('/uploads/', '');
        const fullPath = path.join(process.cwd(), 'uploads', relativePath);
        if (fs.existsSync(fullPath)) {
          doc.image(fullPath, 40, yHeader, { height: 50 });
        }
      } catch (e) {
        console.warn('Could not embed primary logo in PDF:', e.message);
      }
    }

    // 2. Secondary Logo (Static - Alianza Verde)
    const secondaryLogoPath = path.join(process.cwd(), 'public', 'assets', '4_LOGO.png');
    if (fs.existsSync(secondaryLogoPath)) {
      try {
        // Place it next to the first one, or with some offset
        // Assuming primary logo is ~120px wide max, let's place this one at x=180 or similar, but dynamic layout is strict.
        // Let's place it to the right of the first logo.
        doc.image(secondaryLogoPath, 160, yHeader, { height: 45 });
      } catch (e) {
        console.warn('Could not embed secondary logo in PDF:', e.message);
      }
    }

    doc
      .fillColor(primaryColor)
      .fontSize(22)
      .font('Helvetica-Bold')
      .text('Listado de Contactos', 0, yHeader + 15, { align: 'right' });

    // Adjusted Separator Line Y-position
    const ySeparator = yHeader + 65;
    doc
      .moveTo(40, ySeparator)
      .lineTo(555, ySeparator)
      .strokeColor(primaryColor)
      .lineWidth(2)
      .stroke();

    doc.moveDown(5); // Increased spacing

    // --- Content List ---
    let currentY = ySeparator + 30;

    contactos.forEach((c, index) => {
      // Check if we need a new page
      if (currentY > 720) {
        doc.addPage();
        currentY = 50;
      }

      // Message Card Background
      doc.rect(40, currentY, 515, 135).fill('#F9F9F9'); // Slightly taller for Rol

      doc
        .fillColor(primaryColor)
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(`${c.nombre}`, 55, currentY + 15);

      // Rol Badge if exists
      if (c.rol_sumate) {
        doc
          .fillColor('#F89621') // Accent color
          .fontSize(10)
          .text(`(${c.rol_sumate.toUpperCase()})`, 55 + (doc.widthOfString(c.nombre) * 1.5) + 10, currentY + 17);
      }

      doc
        .fillColor(grayColor)
        .fontSize(9)
        .font('Helvetica')
        .text(
          `Fecha: ${format(c.fecha, 'PPP p', { locale: es })}`,
          55,
          currentY + 17,
          { align: 'right', width: 480 },
        );

      doc
        .fillColor(textColor)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(`Email:`, 55, currentY + 45);
      doc.font('Helvetica').text(`${c.email}`, 100, currentY + 45);

      doc.font('Helvetica-Bold').text(`Teléfono:`, 55, currentY + 60);
      doc
        .font('Helvetica')
        .text(
          `${c.telefono}${c.tieneWhatsapp ? ' (WhatsApp)' : ''}`,
          110,
          currentY + 60,
        );

      doc.font('Helvetica-Bold').text(`Ciudad:`, 55, currentY + 75);
      doc.font('Helvetica').text(`${c.ciudad}`, 100, currentY + 75);

      doc.font('Helvetica-Bold').text(`Tipo:`, 250, currentY + 75);
      doc.font('Helvetica').text(`${c.tipo || 'consulta'}`, 300, currentY + 75);

      doc.font('Helvetica-Bold').text(`Estado:`, 380, currentY + 75);
      doc
        .font('Helvetica')
        .text(`${c.estado || 'sin_responder'}`, 430, currentY + 75);

      doc.font('Helvetica-Bold').text(`Mensaje:`, 55, currentY + 90);
      doc.font('Helvetica').text(`${c.mensaje}`, 110, currentY + 90, {
        width: 430,
        height: 35, // More height
        ellipsis: true,
      });

      currentY += 150; // Increased card spacing
    });

    // --- Footer ---
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);

      doc
        .moveTo(40, 780)
        .lineTo(555, 780)
        .strokeColor('#EEEEEE')
        .lineWidth(1)
        .stroke();

      const footerText = `${settings?.nombre || 'Alvaro Vaca'} | ${settings?.email || ''}`;
      doc
        .fillColor(grayColor)
        .fontSize(8)
        .text(footerText, 0, 790, { align: 'center' });
      doc.text(`Página ${i + 1} de ${range.count}`, 0, 805, {
        align: 'center',
      });
    }

    doc.end();
  }
}
