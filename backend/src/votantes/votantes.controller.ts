import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query, Res } from '@nestjs/common';
import { VotantesService } from './votantes.service';
import { CreateVotanteDto } from './dto/create-votante.dto';
import { UpdateVotanteDto } from './dto/update-votante.dto';
import { JwtAuthGuard } from '../autenticacion/guards/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Asistente } from '../reuniones/entities/asistente.entity';
import { Repository } from 'typeorm';
import type { Response } from 'express';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

@Controller('votantes')
@UseGuards(JwtAuthGuard)
export class VotantesController {
  constructor(
    private readonly votantesService: VotantesService,
    @InjectRepository(Asistente)
    private readonly asistentesRepository: Repository<Asistente>
  ) {}

  @Post()
  create(@Body() createVotanteDto: CreateVotanteDto, @Req() req: any) {
    return this.votantesService.create(createVotanteDto, req.user.id);
  }

  @Post('importar')
  async import(@Body() body: { attendeeIds: string[] }, @Req() req: any) {
    // Need to load relations to get dept/muni from Reunion
    const asistentes = await this.asistentesRepository.find({
        where: body.attendeeIds.map(id => ({ id })),
        relations: ['reunion']
    });
    
    // We pass the LOADED assistants to service
    // Or we update service to accept a list of asistentes
    // Let's call a modified method in service that takes the entity list or handle logic here?
    // Better to move logic to service. I'll pass the repository to service or update service signature.
    // Let's just pass the repository or find them in service. The service draft I wrote used repository inject.
    // I'll update Module to inject Asistente repo in Service? 
    // Actually, I can just find them here and map to CreateDTOs, or fix Service to use the repo if injected.
    
    // Let's stick to Service having the logic. I will fix Service to inject Asistente repository properly.
    return this.votantesService.importFromAttendees(body.attendeeIds, req.user.id, this.asistentesRepository);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.votantesService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.votantesService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVotanteDto: UpdateVotanteDto, @Req() req: any) {
    return this.votantesService.update(id, updateVotanteDto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.votantesService.remove(id, req.user.id);
  }

  @Get('export/excel')
  async exportExcel(@Res() res: Response, @Req() req: any) {
      const votantes = await this.votantesService.findAll(req.user.id);
      
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Mis Votantes');
      
      worksheet.columns = [
          { header: 'Nombre', key: 'nombre', width: 20 },
          { header: 'Apellido', key: 'apellido', width: 20 },
          { header: 'Cédula', key: 'documento', width: 15 },
          { header: 'Teléfono', key: 'telefono', width: 15 },
          { header: 'Dirección', key: 'direccion', width: 25 },
          { header: 'Departamento', key: 'departamento', width: 15 },
          { header: 'Municipio', key: 'municipio', width: 15 },
          { header: 'Comuna', key: 'comuna', width: 10 }, 
          { header: 'Puesto Votación', key: 'puesto', width: 20 },
          { header: 'Mesa', key: 'mesa', width: 10 },
      ];
      
      votantes.forEach(v => {
          worksheet.addRow({
              nombre: v.nombre,
              apellido: v.apellido,
              documento: v.documento,
              telefono: v.telefono,
              direccion: v.direccion,
              departamento: v.departamento,
              municipio: v.municipio,
              comuna: v.comuna || '',
              puesto: v.puestoVotacion,
              mesa: v.mesa
          });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=mis_votantes.xlsx');
      
      await workbook.xlsx.write(res);
      res.end();
  }

  @Get('export/pdf')
  async exportPdf(@Res() res: Response, @Req() req: any) {
      const votantes = await this.votantesService.findAll(req.user.id);
      const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=mis_votantes.pdf');
      doc.pipe(res);

      // --- STYLES & ASSETS ---
      const primaryColor = '#059669'; // Green Web Color
      const secondaryColor = '#8F8F8F';
      // Resolve logo path - assumption: running from dist so back out to project root or use absolute
      // Trying absolute path based on file structure exploration
      const logoPath = 'd:/Colombia Picture/Alvaro Vaca CMS/backend/public/assets/logo.png';
      
      // --- HEADER ---
      // Logo
      try {
        if (require('fs').existsSync(logoPath)) {
            doc.image(logoPath, 40, 30, { width: 100 });
        }
      } catch(e) { /* Ignore if logo missing */ }

      // Title
      doc.fillColor(primaryColor)
         .fontSize(20)
         .font('Helvetica-Bold')
         .text('ALVARO VACA', 160, 45, { align: 'right' }); // Align right or adjust
      
      doc.fillColor('black')
         .fontSize(10)
         .font('Helvetica')
         .text('Reporte de Afiliados (Proyección)', 160, 70, { align: 'right' });

      doc.moveDown(3);

      // --- CONTENT ---
      // Table Header like look
      let y = doc.y;
      
      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold');
      doc.text('#', 40, y);
      doc.text('Afiliado', 70, y);
      doc.text('Ubicación', 300, y);
      doc.text('Votación', 450, y);
      
      doc.moveTo(40, y + 15).lineTo(550, y + 15).stroke(primaryColor);
      
      doc.moveDown(1.5);
      
      let i = 1;
      doc.font('Helvetica').fontSize(9).fillColor('black');
      
      votantes.forEach(v => {
          y = doc.y;
          if (y > 720) {
              doc.addPage();
              y = 40;
              // Re-draw simple header if needed or just continue
          }

          doc.font('Helvetica-Bold').text(`${i}.`, 40, y);
          
          doc.font('Helvetica-Bold').text(`${v.nombre} ${v.apellido}`, 70, y);
          doc.font('Helvetica').text(`CC: ${v.documento} - Tel: ${v.telefono || 'N/A'}`, 70, y + 12);
          
          // Location
          doc.text(`${v.municipio}, ${v.departamento}`, 300, y);
          let loc2 = v.direccion || '';
          if (v.comuna) loc2 += ` - Comuna: ${v.comuna}`;
          doc.text(loc2, 300, y + 12);
          
          // Voting Place
          doc.text(`Puesto: ${v.puestoVotacion || 'N/A'}`, 450, y);
          doc.text(`Mesa: ${v.mesa || 'N/A'}`, 450, y + 12);
          
          doc.moveDown(2.5); // Space between rows
          i++;
      });

      // --- FOOTER ---
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        
        // Footer Line
        doc.moveTo(40, 780).lineTo(550, 780).lineWidth(1).stroke(primaryColor);
        
        // Footer Text
        doc.fontSize(8).fillColor(secondaryColor);
        const baseUrl = process.env.FRONTEND_URL || 'alvarovaca.com.co';
        doc.text(`${baseUrl} - Alvaro Vaca - Desarrollado por Ingeniero Ylder Gonzalez`, 40, 790, { align: 'center', width: 510 });
        doc.text(`Página ${i + 1} de ${pages.count}`, 40, 790, { align: 'right' });
      }

      doc.end();
  }
}
