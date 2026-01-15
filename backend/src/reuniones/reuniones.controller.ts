import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Res, BadRequestException, UseGuards, Req, ForbiddenException, Render } from '@nestjs/common';
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
  create(@Body() createReunionDto: CreateReunionDto, @Req() req: any) {
    const user = req.user;
    
    // Auto-populate leader info
    const liderId = user.id;
    let liderNombre = user.nombre ? `${user.nombre} ${user.apellido || ''}`.trim() : 'Líder';
    let liderDocumento = user.documento;
    let liderTelefono = user.telefono || user.whatsapp || '';

    // Logic: If user is Leader, MUST have documento.
    // If Admin/God, can bypass (use placeholder or null if entity allows)
    const isPrivileged = user.roles.includes('admin') || user.roles.includes('god');
    
    if (!liderDocumento && !isPrivileged) {
        throw new ForbiddenException('Debes actualizar tu perfil con tu documento de identidad antes de crear reuniones.');
    }

    // Default for privileged users if missing
    if (!liderDocumento && isPrivileged) {
        liderDocumento = null; // Entity allows null
    }

    // Pass enriched DTO to service
    // We need to cast or extend the DTO to include these fields if they aren't there, 
    // or change service to accept them separately.
    // Ideally, the service should handle the entity creation. 
    // Let's pass the DTO and the user-derived values manually to the service.
    
    return this.reunionesService.create(createReunionDto, {
        liderId,
        liderNombre,
        liderDocumento,
        liderTelefono
    });
  }

  @Post('register')
  registerAttendee(@Body() registerDto: RegisterAttendeeDto) {
    return this.reunionesService.registerAttendee(registerDto);
  }

  // Vistas Públicas (HTML)
  
  @Get('registro')
  @Render('reunion-buscar') // Requiere 'reunion-buscar.hbs'
  renderBuscar() {
    return {};
  }

  @Get('formulario/:code')
  @Render('reunion-registro') // Requiere 'reunion-registro.hbs'
  async renderFormulario(@Param('code') code: string) {
    try {
        const reunion = await this.reunionesService.findByCode(code);
        if(!reunion) {
            // Si no existe, podría renderizar error o redirigir
            return { error: 'Reunión no encontrada' };
        }
        return {
            reunion: {
                ...reunion,
                fechaFormatted: format(reunion.fecha, 'PPP p', { locale: es }),
                lugar: `${reunion.barrio}, ${reunion.comuna || reunion.municipio}`
            }
        };
    } catch (e) {
        return { error: 'Reunión no válida' };
    }
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
    @Query('municipio') municipio?: string,
    @Query('departamento') departamento?: string,
    @Query('reunionId') reunionId?: string,
  ) {
    const user = req.user;
    const canViewAll = user.roles.includes('admin') || user.roles.includes('god') || user.roles.includes('permiso_ver_asistentes');
    
    // Enforce leader filter if not privileged
    let leaderIdFilter = undefined;
    if (!canViewAll) {
        leaderIdFilter = user.id;
    }

    const reuniones = await this.reunionesService.findAll({ 
        leader, 
        dateStart, 
        dateEnd, 
        location,
        municipio,
        departamento,
        reunionId,
        leaderId: leaderIdFilter // Pass restricted leader ID
    });
    
    // Even if they get the meetings, if they are restricted, they should only see their own.
    // The service filter handles the "which meetings to return".
    // But what about "attendees"? 
    // If I am a leader viewing MY meeting, I should see attendees.
    // If I am an admin viewing ANY meeting, I should see attendees.
    // So if the meeting is returned by the service (which applied the filter), 
    // the user HAS permission to see it (it's theirs or they are admin).
    
    return reuniones;
  }
  
  @Get('unique')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'god', 'permiso_ver_asistentes', 'lider') // Added 'lider'
  findAllUnique(
      @Req() req: any,
      @Query('dateStart') dateStart?: string,
      @Query('dateEnd') dateEnd?: string,
      @Query('municipio') municipio?: string,
      @Query('departamento') departamento?: string,
      @Query('reunionId') reunionId?: string,
  ) {
      const user = req.user;
      const canViewAll = user.roles.includes('admin') || user.roles.includes('god') || user.roles.includes('permiso_ver_asistentes');
      
      let leaderId = undefined;
      if (!canViewAll) {
          leaderId = user.id;
      }

      return this.reunionesService.findAllUnique({ dateStart, dateEnd, municipio, departamento, reunionId, leaderId });
  }

  @Get(':code')
  findByCode(@Param('code') code: string) {
    return this.reunionesService.findByCode(code);
  }

  @Get('export/excel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'god', 'permiso_ver_asistentes', 'lider') // Added 'lider'
  async exportExcel(
    @Res() res: Response,
    @Req() req: any, // Need request to check user
    @Query('leader') leader?: string,
    @Query('dateStart') dateStart?: string,
    @Query('dateEnd') dateEnd?: string,
    @Query('location') location?: string,
    @Query('municipio') municipio?: string,
    @Query('departamento') departamento?: string,
    @Query('reunionId') reunionId?: string,
    @Query('unique') unique?: string, // 'true' or 'false'
  ) {
    const user = req.user;
    const isUnique = unique === 'true';
    let data : any[];
    
    // Authorization Check for Data Access
    const canViewAll = user.roles.includes('admin') || user.roles.includes('god') || user.roles.includes('permiso_ver_asistentes');
    let leaderIdFilter = undefined;

    if (!canViewAll) {
        leaderIdFilter = user.id;
        // If they try to filter by another leader, ignore it or maybe throw error? 
        // For simplicity/safety, we just OVERRIDE the filter with their own ID.
        // Also, UNIQUE report might not be relevant for a single leader or maybe it is?
        // Let's allow unique report but filtered by their meetings.
    }

    if (isUnique) {
      // NOTE: findAllUnique currently doesn't support leaderIdFilter in Service. 
      // If we want leaders to draw unique reports, we need to update Service or block it.
      // For now, let's block unique report for non-privileged if service isn't ready, 
      // OR let's update service later. 
      // User requirement was generic "export data". 
      // Implementation Plan didn't specify updating findAllUnique service method.
      // Let's assume Unique Report is Admin feature for now to be safe, OR check if we can easily add it.
      // The Plan said "Enable Leaders to export their own data".
      // Let's update Service findAllUnique to accept leaderID to be consistent. 
      // For this step, I will pass the filter, but I need to update Service too if I do.
      // Let's stick to standard export for Leaders for now, or just block Unique for them if not critical.
      // But wait, the controller logic I am writing here needs to be sound.
      
      if (!canViewAll) {
          // Check for unique perms or similar logic as before
          // If we want to allow leaders to see unique list of THEIR meetings:
          // We must ensure the service filters by their meetings or leaderId.
          // Since unique service now supports reunionId, it helps.
          // But strict row-level security for unique across all their meetings might imply fetching all their meetings first.
          // For now, retaining the restriction or assuming admin only for global unique.
          // If they pass reunionId designated to them, it might be fine.
          // Let's keep the block for now or relax it if needed. 
          throw new ForbiddenException('No tienes permisos para generar reporte de únicos global.');
      }
        data = await this.reunionesService.findAllUnique({ dateStart, dateEnd, municipio, departamento, reunionId });
    } else {
        data = await this.reunionesService.findAll({ 
            leader, 
            dateStart, 
            dateEnd, 
            location, 
            municipio,
            departamento,
            reunionId,
            leaderId: leaderIdFilter 
        });
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
            { header: 'Dirección', key: 'direccion', width: 30 }, // Added
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
                    direccion: asistente.direccion || '', // Added
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
  @Roles('admin', 'god', 'permiso_ver_asistentes', 'lider') // Added 'lider'
  async exportPdf(
    @Res() res: Response,
    @Req() req: any,
    @Query('leader') leader?: string,
    @Query('dateStart') dateStart?: string,
    @Query('dateEnd') dateEnd?: string,
    @Query('location') location?: string,
    @Query('municipio') municipio?: string,
    @Query('departamento') departamento?: string,
    @Query('reunionId') reunionId?: string,
  ) {
    const user = req.user;
    
    // Authorization Check
    const canViewAll = user.roles.includes('admin') || user.roles.includes('god') || user.roles.includes('permiso_ver_asistentes');
    let leaderIdFilter = undefined;

    if (!canViewAll) {
        leaderIdFilter = user.id;
    }

    const reuniones = await this.reunionesService.findAll({ 
        leader, 
        dateStart, 
        dateEnd, 
        location, 
        municipio,
        departamento,
        reunionId,
        leaderId: leaderIdFilter 
    });
    
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
            let line = `${idx + 1}. ${asistente.nombre} - CC: ${asistente.documento} - Tel: ${asistente.telefono}`;
            if (asistente.direccion) line += ` - Dir: ${asistente.direccion}`;
            doc.font('Helvetica').text(line);
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
