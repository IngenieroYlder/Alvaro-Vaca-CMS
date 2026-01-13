import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Res, BadRequestException, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ReunionesService } from './reuniones.service';
import { CreateReunionDto } from './dto/create-reunion.dto';
import { RegisterAttendeeDto } from './dto/register-attendee.dto';
import type { Response } from 'express'; // Fix lint
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { JwtAuthGuard } from '../autenticacion/guards/jwt-auth.guard';
import { RolesGuard } from '../autenticacion/guards/roles.guard';
import { Roles } from '../autenticacion/decorators/roles.decorator';

@Controller('reuniones')
export class ReunionesController {
  constructor(private readonly reunionesService: ReunionesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('lider', 'admin', 'god')
  create(@Body() createReunionDto: CreateReunionDto) {
    return this.reunionesService.create(createReunionDto);
  }

  @Post('register')
  registerAttendee(@Body() registerDto: RegisterAttendeeDto) {
    // Public endpoint for attendees? Or protected?
    // User said: "el asistente pueda desde el formulario seleccionar dicha reunion ... y registrarse"
    // Usually public with the code.
    return this.reunionesService.registerAttendee(registerDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('lider', 'admin', 'god', 'permiso_ver_asistentes')
  async findAll(
    @Req() req: any,
    @Query('leader') leader?: string,
    @Query('dateStart') dateStart?: string,
    @Query('dateEnd') dateEnd?: string,
    @Query('location') location?: string,
  ) {
    const user = req.user;
    const canViewAttendees = user.roles.includes('admin') || user.roles.includes('god') || user.roles.includes('permiso_ver_asistentes');
    
    // If not admin/god and NO specific permission, restrict what they see?
    // But filters are optional. 
    // If leader, maybe we only show *their* meetings?
    // User said: "podra crear reuniones... no podra acceder a los datos registrados a menos que yo le de el permiso"
    
    // For now, let's allow listing meetings but strip attendees if no permission.
    const reuniones = await this.reunionesService.findAll({ leader, dateStart, dateEnd, location });
    
    if (!canViewAttendees) {
        // Strip attendees data
        return reuniones.map(r => ({
            ...r,
            asistentes: [], // Hide attendees
            asistentesCount: r.asistentes.length // Maybe show count?
        }));
    }
    
    return reuniones;
  }
  
  @Get('unique')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'god', 'permiso_ver_asistentes') // Only privileged users can see unique attendee data
  findAllUnique(
      @Query('dateStart') dateStart?: string,
      @Query('dateEnd') dateEnd?: string,
  ) {
      return this.reunionesService.findAllUnique({ dateStart, dateEnd });
  }

  @Get(':code')
  findByCode(@Param('code') code: string) {
    return this.reunionesService.findByCode(code);
  }

  @Get('export/excel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'god', 'permiso_ver_asistentes') // Export is privileged
  async exportExcel(
    @Res() res: Response,
    @Query('leader') leader?: string,
    @Query('dateStart') dateStart?: string,
    @Query('dateEnd') dateEnd?: string,
    @Query('location') location?: string,
    @Query('unique') unique?: string, // 'true' or 'false'
  ) {
    const isUnique = unique === 'true';
    let data : any[];
    
    if (isUnique) {
        data = await this.reunionesService.findAllUnique({ dateStart, dateEnd });
    } else {
        data = await this.reunionesService.findAll({ leader, dateStart, dateEnd, location });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(isUnique ? 'Asistentes Únicos' : 'Asistencias');

    if (isUnique) {
         worksheet.columns = [
            { header: 'Nombre', key: 'nombre', width: 30 },
            { header: 'Documento', key: 'documento', width: 15 },
            { header: 'Teléfono', key: 'telefono', width: 15 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Última Reunión (Fecha)', key: 'fecha', width: 20 },
            { header: 'Reunión Referencia', key: 'reunion', width: 30 },
            { header: 'Habeas Data', key: 'habeas', width: 10 },
        ];

        (data as any[]).forEach((asistente: any) => {
             worksheet.addRow({
                nombre: asistente.nombre,
                documento: asistente.documento,
                telefono: asistente.telefono,
                email: asistente.email,
                fecha: asistente.reunion ? format(asistente.reunion.fecha, 'yyyy-MM-dd HH:mm', { locale: es }) : '-',
                reunion: asistente.reunion ? asistente.reunion.nombre : '-',
                habeas: asistente.habeasData ? 'Sí' : 'No',
            });
        });

    } else {
        worksheet.columns = [
            { header: 'ID Reunión', key: 'codigo', width: 10 },
            { header: 'Nombre Reunión', key: 'reunionNombre', width: 30 },
            { header: 'Fecha', key: 'reunionFecha', width: 20 },
            { header: 'Líder', key: 'lider', width: 25 },
            { header: 'Lugar (Barrio/Comuna)', key: 'lugar', width: 25 },
            { header: 'Asistente', key: 'nombre', width: 30 },
            { header: 'Documento', key: 'documento', width: 15 },
            { header: 'Teléfono', key: 'telefono', width: 15 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Habeas Data', key: 'habeas', width: 10 },
        ];

        // Ensure data structure matches expectation (Reuniones array)
        // If data is Reuniones[], we flatten it.
        // Wait, findAll returns Reuniones[] with Asistentes[]
        // findAllUnique returns Asistentes[]
        
        data.forEach((reunion) => {
             reunion.asistentes.forEach((asistente: any) => {
                worksheet.addRow({
                    codigo: reunion.codigo,
                    reunionNombre: reunion.nombre,
                    reunionFecha: format(reunion.fecha, 'yyyy-MM-dd HH:mm', { locale: es }),
                    lider: reunion.liderNombre,
                    lugar: `${reunion.barrio} - ${reunion.comuna || reunion.municipio}`,
                    nombre: asistente.nombre,
                    documento: asistente.documento,
                    telefono: asistente.telefono,
                    email: asistente.email,
                    habeas: asistente.habeasData ? 'Sí' : 'No',
                });
             });
        });
    }

    const filename = `Reporte_Asistencia_${isUnique ? 'Unicos_' : ''}${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    await workbook.xlsx.write(res);
    res.end();
  }

  @Get('export/pdf')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'god', 'permiso_ver_asistentes') // Export is privileged
  async exportPdf(
    @Res() res: Response,
    @Query('leader') leader?: string,
    @Query('dateStart') dateStart?: string,
    @Query('dateEnd') dateEnd?: string,
    @Query('location') location?: string,
  ) {
    const reuniones = await this.reunionesService.findAll({ leader, dateStart, dateEnd, location });
    
    // PDF Generation Logic (Simplified for now)
    const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
    const filename = `Reporte_Asistencia_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    doc.pipe(res);

    doc.fontSize(20).text('Reporte de Asistencia', { align: 'center' });
    doc.moveDown();

    reuniones.forEach(reunion => {
        doc.fontSize(14).font('Helvetica-Bold').text(`Reunión: ${reunion.nombre} (${reunion.codigo})`);
        doc.fontSize(10).font('Helvetica').text(`Líder: ${reunion.liderNombre} | Fecha: ${format(reunion.fecha, 'PPP p', { locale: es })}`);
        doc.text(`Lugar: ${reunion.barrio}, ${reunion.comuna || reunion.municipio}`);
        
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica-Bold').text('Asistentes:', { underline: true });
        
        reunion.asistentes.forEach((asistente: any, idx) => {
            doc.font('Helvetica').text(`${idx + 1}. ${asistente.nombre} - CC: ${asistente.documento} - Tel: ${asistente.telefono}`);
        });
        
        doc.moveDown(1.5);
    });


    doc.end();
  }

  @Delete('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('god') // Only God Mode can bulk delete? Or also Admin? User said "super admin modo dios".
  removeBulk(@Body('ids') ids: string[]) {
      if (!ids || ids.length === 0) throw new BadRequestException('No IDs provided');
      return this.reunionesService.removeBulk(ids);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('god', 'admin') 
  remove(@Param('id') id: string) {
    return this.reunionesService.remove(id);
  }
}
