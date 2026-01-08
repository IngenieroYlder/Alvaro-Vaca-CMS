import { Controller, Get, Post, Body, Res, Render, UseGuards, Request } from '@nestjs/common';
import { LoginCandidatoGuard } from '../autenticacion/guards/login-candidato.guard';
import { PostulacionesService } from '../postulaciones/postulaciones.service';
import { NegocioService } from '../negocio/negocio.service';
import { ThemeService } from '../theme/theme.service';
import { MenusService } from '../menus/menus.service';
import { UsuariosService } from '../usuarios/usuarios.service';

@Controller('candidato')
@UseGuards(LoginCandidatoGuard)
export class CandidatoController {
    constructor(
        private readonly postulacionesService: PostulacionesService,
        private readonly negocioService: NegocioService,
        private readonly themeService: ThemeService,
        private readonly menusService: MenusService,
        private readonly usuariosService: UsuariosService,
    ) { }

    private async getCommonData() {
        const business = await this.negocioService.getInfo();
        const theme = await this.themeService.getConfig();
        let menu = null;

        try {
            menu = await this.menusService.findBySlug('menu-principal');
        } catch (e) { }

        const logoUrl = theme.logoHorizontal || theme.logoVertical;
        const logoBlancoUrl = theme.logoBlanco || logoUrl;
        const faviconUrl = theme.favicon || theme.logoVertical || theme.logoHorizontal;

        const headingFont = theme.headingFont || 'Outfit';
        const bodyFont = theme.bodyFont || 'Inter';
        const uniqueFonts = [...new Set([headingFont, bodyFont])];
        const fontQuery = uniqueFonts
            .map((font) => `family=${font.replace(/ /g, '+')}:wght@300;400;500;600;700`)
            .join('&');
        const googleFontsUrl = `https://fonts.googleapis.com/css2?${fontQuery}&display=swap`;

        const safeTheme = {
            primaryColor: theme.primaryColor || '#00274D',
            secondaryColor: theme.secondaryColor || '#4CAF50',
            tertiaryColor: theme.tertiaryColor || '#FF6F00',
            logoFooterSecondary: theme.logoFooterSecondary,
            headingFont,
            bodyFont,
        };

        return {
            title: theme.tituloPagina || 'Consorcio Movitrans',
            faviconUrl,
            googleFontsUrl,
            logoUrl,
            logoBlancoUrl,
            theme: safeTheme,
            empresaNombre: business?.nombre || 'Consorcio Movitrans',
            empresaSlogan: business?.slogan || 'Líderes en gestión integral de movilidad',
            telefono: business?.telefono || '+57 300 000 0000',
            email: business?.email || 'contacto@ejemplo.com',
            direccion: business?.direccion || 'Colombia',
            horarioAtencion: business?.horarioAtencion,
            numeroContrato: business?.numeroContrato,
            tarifasImage: business?.tarifasImage,
            social: {
                facebook: business?.facebook,
                instagram: business?.instagram,
                twitter: business?.x,
                tiktok: business?.tiktok,
                linkedin: business?.linkedin,
                youtube: business?.youtube,
            },
            menu: menu?.arbol || [],
            anio: new Date().getFullYear(),
        };
    }

    @Get()
    @Render('dashboard-candidato')
    async dashboard(@Request() req: any) {
        const common = await this.getCommonData();
        const postulacionesRaw = await this.postulacionesService.misPostulaciones(req.user.id);

        const postulaciones = postulacionesRaw.map((p) => {
            // 1. Define Fixed Steps (Standard Process)
            const fixedSteps = [
                { titulo: 'Registro', descripcion: 'Registro inicial en la plataforma.' },
                { titulo: 'Enviar Hoja de Vida', descripcion: 'Carga de HV en formato PDF o ZIP.' }
            ];
            let steps = [...fixedSteps];

            // 2. Append Custom Steps from Vacancy if Any
            if (p.vacante && p.vacante.pasos && p.vacante.pasos.length > 0) {
                // Keep the full object {titulo, descripcion}
                const customSteps = p.vacante.pasos.map((paso: any) => ({
                    titulo: paso.titulo || paso.label || 'Paso Personalizado',
                    descripcion: paso.descripcion || ''
                }));
                steps = [...steps, ...customSteps];
            } else {
                // Default flow if no custom steps defined
                const defaultSteps = [
                    { titulo: 'Evaluación', descripcion: 'Revisión de perfil y competencias.' },
                    { titulo: 'Entrevista', descripcion: 'Entrevista con el equipo de selección.' },
                    { titulo: 'Selección', descripcion: 'Proceso de selección final.' },
                    { titulo: 'Final', descripcion: 'Decisión tomada.' }
                ];
                steps = [...steps, ...defaultSteps];
            }

            // 3. Determine Current Step Index based on State
            let currentStepIndex = 0;

            if (p.pasoActual && p.pasoActual > 0) {
                currentStepIndex = p.pasoActual - 1;
            } else {
                switch (p.estado) {
                    case 'registrado': currentStepIndex = 0; break;
                    case 'hoja_vida_enviada': currentStepIndex = 1; break;
                    case 'en_revision': currentStepIndex = 2; break;
                    case 'sera_contactado': currentStepIndex = 3; break;
                    case 'seleccionado': currentStepIndex = steps.length - 1; break;
                    case 'rechazado': currentStepIndex = 0; break;
                    default: currentStepIndex = 0;
                }
            }

            // Bounds check
            if (currentStepIndex < 0) currentStepIndex = 0;
            if (currentStepIndex >= steps.length) currentStepIndex = steps.length - 1;

            // 4. Calculate Percentage
            const pasoPorcentaje = Math.round(((currentStepIndex + 1) / steps.length) * 100);

            // Get Current Step Details for easy access in view
            const currentStepDetails = steps[currentStepIndex];

            return {
                ...p,
                steps,
                currentStepIndex,
                pasoPorcentaje,
                currentStepDetails
            };
        });

        return {
            ...common,
            usuario: req.user,
            postulaciones,
        };
    }

    @Post('perfil')
    async actualizarPerfil(@Request() req: any, @Body() body: any, @Res() res: any) {
        try {
            await this.usuariosService.actualizar(req.user.id, {
                nombre: body.nombre,
                apellido: body.apellido,
                telefono: body.telefono,
                whatsapp: body.whatsapp, // Added
            });
            return res.redirect('/candidato?status=perfil_actualizado');
        } catch (error) {
            return res.redirect('/candidato?error=error_actualizando_perfil');
        }
    }

    @Post('eliminar-cuenta')
    async eliminarCuenta(@Request() req: any, @Res() res: any) {
        try {
            await this.usuariosService.eliminar(req.user.id);
            // Clear cookie
            res.clearCookie('Authentication');
            return res.redirect('/login-candidato?status=cuenta_eliminada');
        } catch (error) {
            return res.redirect('/candidato?error=error_eliminando_cuenta');
        }
    }
}
