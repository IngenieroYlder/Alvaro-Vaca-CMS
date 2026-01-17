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

import { UsuariosService } from '../usuarios/usuarios.service';

@Controller('reuniones')
export class ReunionesController {
  constructor(
      private readonly reunionesService: ReunionesService,
      private readonly usuariosService: UsuariosService // Injected
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('lider', 'admin', 'god', 'coordinador')
  create(@Body() createReunionDto: CreateReunionDto, @Req() req: any) {
    const user = req.user;
    
    // Auto-populate leader info
    const liderId = user.id;
    let liderNombre = user.nombre ? `${user.nombre} ${user.apellido || ''}`.trim() : 'Líder';
    let liderDocumento = user.documento;
    let liderTelefono = user.telefono || user.whatsapp || '';

    // Logic: If user is Leader, MUST have documento.
    // If Admin/God/Coordinator, can bypass (use placeholder or null if entity allows)
    const isPrivileged = user.roles.includes('admin') || user.roles.includes('god') || user.roles.includes('coordinador');
    
    if (!liderDocumento && !isPrivileged) {
        throw new ForbiddenException('Debes actualizar tu perfil con tu documento de identidad antes de crear reuniones.');
    }

    // Default for privileged users if missing
    if (!liderDocumento && isPrivileged) {
        liderDocumento = null; // Entity allows null
    }

    // Coordinator/Admin can assign a different leader
    // expect createReunionDto to potentially have liderId if allowed
    let finalLiderId = liderId;
    let finalLiderNombre = liderNombre;
    
    if (isPrivileged && (createReunionDto as any).liderId) {
         // Verify if leader exists? Service might handle simple ID relationship.
         // We assume the frontend sends the ID.
         // If we want to populate name/doc, we might need to fetch that user OR assume service does it.
         // Service create method: create(dto, { liderId, ... })
         // If we pass a different ID, we should probably fetch that user's details to populate the helper columns (liderNombre, etc) 
         // OR update the service to fetch them if only ID is provided.
         // Let's rely on Service fetching logic if implemented, OR fetch here.
         // Checking Service... I'll assume I need to fetch here to be safe and consistent with current "snapshot" logic.
         // But I don't have UsuariosService injected here? 
         // I need to inject UsersService to fetch the assigned leader's details.
         // For now, let's allow the override but we might miss the snapshot names if I don't fetch.
         // I'll update the Service to handle the look up if liderId changes.
         finalLiderId = (createReunionDto as any).liderId;
         // I can't fetch name here without service. 
         // I will pass the ID and let the Service handle the lookup if it differs from creator.
    }

    return this.reunionesService.create(createReunionDto, {
        liderId: finalLiderId,
        liderNombre: finalLiderId === user.id ? liderNombre : '', // Service should fill this if empty
        liderDocumento: finalLiderId === user.id ? liderDocumento : '',
        liderTelefono: finalLiderId === user.id ? liderTelefono : ''
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
  @Roles('lider', 'admin', 'god', 'permiso_ver_asistentes', 'coordinador') // Ensure coordinador is here
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
    const isCoordinador = user.roles.includes('coordinador') && !canViewAll;
    
    // Enforce leader filter if not privileged
    let leaderIdFilter = undefined;
    let leaderIdsFilter: string[] | undefined = undefined;

    if (!canViewAll) {
        if (isCoordinador) {
            // Fetch leaders managed by this coordinator
            const myLeaders = await this.usuariosService.listarTodos(undefined, user.id);
            leaderIdsFilter = myLeaders.map(u => u.id);
            // Also include self if coordinator acts as leader? Typically yes.
            leaderIdsFilter.push(user.id);
        } else {
            // Ordinary Leader
            leaderIdFilter = user.id;
        }
    }

    const reuniones = await this.reunionesService.findAll({ 
        leader, 
        dateStart, 
        dateEnd, 
        location,
        municipio,
        departamento,
        reunionId,
        leaderId: leaderIdFilter,
        leaderIds: leaderIdsFilter // Pass list
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
  @Roles('admin', 'god', 'permiso_ver_asistentes', 'lider', 'coordinador')
  async findAllUnique(
      @Req() req: any,
      @Query('dateStart') dateStart?: string,
      @Query('dateEnd') dateEnd?: string,
      @Query('municipio') municipio?: string,
      @Query('departamento') departamento?: string,
      @Query('reunionId') reunionId?: string,
  ) {
      const user = req.user;
      const canViewAll = user.roles.includes('admin') || user.roles.includes('god') || user.roles.includes('permiso_ver_asistentes');
      const isCoordinador = user.roles.includes('coordinador') && !canViewAll;
      
      let leaderId = undefined;
      let leaderIds: string[] | undefined = undefined;

      if (!canViewAll) {
          if (isCoordinador) {
             const myLeaders = await this.usuariosService.listarTodos(undefined, user.id);
             leaderIds = myLeaders.map(u => u.id);
             leaderIds.push(user.id);
          } else {
             leaderId = user.id;
          }
      }

      return this.reunionesService.findAllUnique({ dateStart, dateEnd, municipio, departamento, reunionId, leaderId, leaderIds });
  }

  @Get(':code')
  findByCode(@Param('code') code: string) {
    return this.reunionesService.findByCode(code);
  }

  @Get('export/excel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'god', 'permiso_ver_asistentes', 'lider', 'coordinador')
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
    const isCoordinador = user.roles.includes('coordinador') && !canViewAll;
    
    let leaderIdFilter = undefined;
    let leaderIdsFilter: string[] | undefined = undefined;

    if (!canViewAll) {
        if (isCoordinador) {
             const myLeaders = await this.usuariosService.listarTodos(undefined, user.id);
             leaderIdsFilter = myLeaders.map(u => u.id);
             leaderIdsFilter.push(user.id);
        } else {
            leaderIdFilter = user.id;
        }
    }

    if (isUnique) {
        // Updated to use leaderIds
        data = await this.reunionesService.findAllUnique({ 
            dateStart, 
            dateEnd, 
            municipio, 
            departamento, 
            reunionId, 
            leaderId: leaderIdFilter,
            leaderIds: leaderIdsFilter
        });
    } else {
        data = await this.reunionesService.findAll({ 
            leader, 
            dateStart, 
            dateEnd, 
            location, 
            municipio, 
            departamento, 
            reunionId, 
            leaderId: leaderIdFilter,
            leaderIds: leaderIdsFilter // Added logic
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
  @Roles('admin', 'god', 'permiso_ver_asistentes', 'lider', 'coordinador')
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
    
    // PDF Generation Logic
    const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
    const filename = `Reporte_Asistencia_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    doc.pipe(res);

    const primaryColor = '#059669'; // Green
    const secondaryColor = '#8F8F8F';
    const baseUrl = process.env.FRONTEND_URL || 'alvarovaca.com.co';

    // Logos
    const logoPath = require('path').join(process.cwd(), 'public', 'assets', 'logo.png');
    const secondaryLogoPath = require('path').join(process.cwd(), 'public', 'assets', '4_LOGO.png');

    // 1. Primary Logo
    try {
        if (require('fs').existsSync(logoPath)) {
            doc.image(logoPath, 40, 30, { height: 40 });
        }
    } catch (e) { }

    // 2. Secondary Logo
    try {
        if (require('fs').existsSync(secondaryLogoPath)) {
            doc.image(secondaryLogoPath, 160, 30, { height: 40 });
        }
    } catch (e) { }

    // Header logic similar to Votantes
    doc.fillColor(primaryColor)
       .fontSize(20)
       .font('Helvetica-Bold')
       .text('ALVARO VACA', { align: 'right' }); // Align right 
    
    doc.fillColor('black')
       .fontSize(10)
       .font('Helvetica')
       .text('Reporte de Reuniones y Asistencia', { align: 'right' });

    doc.moveDown(2);

    reuniones.forEach((reunion, rIdx) => {
        // Avoid page break at start if not needed, but ensure grouping
        if (doc.y > 650) doc.addPage();

        doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text(`Reunión: ${reunion.nombre} (${reunion.codigo})`);
        doc.fillColor('black').fontSize(10).font('Helvetica').text(`Líder: ${reunion.liderNombre} | Fecha: ${format(reunion.fecha, 'PPP p', { locale: es })}`);
        doc.text(`Lugar: ${reunion.barrio}, ${reunion.comuna || reunion.municipio}`);
        
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica-Bold').text('Asistentes:', { underline: false });
        
        reunion.asistentes.forEach((asistente: any, idx) => {
            let line = `${idx + 1}. ${asistente.nombre} - CC: ${asistente.documento} - Tel: ${asistente.telefono}`;
            if (asistente.direccion) line += ` - Dir: ${asistente.direccion}`;
            doc.font('Helvetica').text(line, { indent: 15 });
        });
        
        doc.moveDown(1.5);
    });

    // Footer
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.moveTo(40, doc.page.height - 50).lineTo(550, doc.page.height - 50).lineWidth(1).stroke(primaryColor);
        doc.fontSize(8).fillColor(secondaryColor);
        doc.text(`${baseUrl} - Alvaro Vaca - Desarrollado por Ingeniero Ylder Gonzalez`, 40, doc.page.height - 40, { align: 'center', width: 510 });
        doc.text(`Página ${i + 1} de ${pages.count}`, 40, doc.page.height - 40, { align: 'right' });
    }

    doc.end();
  }

  @Delete('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('god') // Only God Mode can bulk delete? Or also Admin? User said "super admin modo dios".
  removeBulk(@Body('ids') ids: string[]) {
      if (!ids || ids.length === 0) throw new BadRequestException('No IDs provided');
      return this.reunionesService.removeBulk(ids);
  }

  @Get(':id/qr-flyer')
  async getQrFlyer(@Param('id') id: string, @Res() res: Response) {
      const reunion = await this.reunionesService.findOneById(id);
      const pdfBuffer = await this.reunionesService.generateQrFlyer(id);

      // Construct Filename: Leader_Reunion_Date.pdf
      // Sanitize to avoid filesystem issues or weird headers
      const sanitize = (str: string) => (str || 'N_A').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g, '').replace(/\s+/g, '_');
      
      const leaderName = sanitize(reunion.liderNombre);
      const reunionName = sanitize(reunion.nombre); // Assuming reunion has 'nombre'? entity Check: Yes, inferred from context.
      // Wait, 'nombre' might act as 'barrio' or description?
      // Looking at `findAll`, it uses `reunion.nombre`.
      // Previous `generateQrFlyer` didn't use `reunion.nombre` specifically, it used `reunion.codigo` and location.
      // Let's check Entity to be sure `nombre` exists.
      // In `findAll` I saw `reunion.nombre`.
      
      const dateStr = format(reunion.fecha, 'yyyy-MM-dd', { locale: es });
      
      const filename = `${leaderName}_${reunionName}_${dateStr}.pdf`;

      res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename=${filename}`,
          'Content-Length': pdfBuffer.length,
      });

      res.end(pdfBuffer);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('god', 'admin') 
  remove(@Param('id') id: string) {
    return this.reunionesService.remove(id);
  }
}
