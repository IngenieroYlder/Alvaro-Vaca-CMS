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
      const doc = new PDFDocument({ margin: 30 });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=mis_votantes.pdf');
      doc.pipe(res);

      doc.fontSize(18).text('Mis Votantes - Proyección', { align: 'center' });
      doc.moveDown();

      let i = 1;
      doc.fontSize(10);
      votantes.forEach(v => {
          doc.text(`${i}. ${v.nombre} ${v.apellido} - CC: ${v.documento} - Tel: ${v.telefono}`);
          doc.text(`   Dir: ${v.direccion} - ${v.municipio}, ${v.departamento}`);
          if (v.puestoVotacion) doc.text(`   Puesto: ${v.puestoVotacion} - Mesa: ${v.mesa}`);
          doc.moveDown(0.5);
          i++;
      });

      doc.end();
  }
}
