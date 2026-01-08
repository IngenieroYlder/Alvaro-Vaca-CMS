import { Controller, Get, Render, Param, Query, Post, Body, Res, Req } from '@nestjs/common';
import type { Response, Request } from 'express';
import { NoticiasService } from '../noticias/noticias.service';
import { CatalogoService } from '../catalogo/catalogo.service';
import { MenusService } from '../menus/menus.service';
import { NegocioService } from '../negocio/negocio.service';
import { ThemeService } from '../theme/theme.service';
import { PaginasService } from '../paginas/paginas.service';
import { VacantesService } from '../vacantes/vacantes.service';
import { AutenticacionService } from '../autenticacion/autenticacion.service';
import { PostulacionesService } from '../postulaciones/postulaciones.service';

@Controller()
export class PublicController {
  constructor(
    private readonly negocioService: NegocioService,
    private readonly themeService: ThemeService,
    private readonly paginasService: PaginasService,
    private readonly menusService: MenusService,
    private readonly noticiasService: NoticiasService,
    private readonly catalogoService: CatalogoService,
    private readonly vacantesService: VacantesService,
    private readonly autenticacionService: AutenticacionService,
    private readonly postulacionesService: PostulacionesService,
  ) { }

  // --- LEGAL PAGES START ---
  @Get('terminos-y-condiciones')
  @Render('legal')
  async getTerminos() {
    const common = await this.getCommonData();
    try {
      const pagina = await this.paginasService.findBySlug('terminos-y-condiciones');
      return { ...common, pagina, title: pagina?.titulo || 'Términos y Condiciones' };
    } catch (e) {
      return { ...common, pagina: { titulo: 'Términos y Condiciones', contenido: '<p>Página no encontrada o no publicada.</p>' } };
    }
  }

  @Get('politica-de-privacidad')
  @Render('legal')
  async getPrivacidad() {
    const common = await this.getCommonData();
    try {
      const pagina = await this.paginasService.findBySlug('politica-de-privacidad');
      return { ...common, pagina, title: pagina?.titulo || 'Política de Privacidad' };
    } catch (e) {
      return { ...common, pagina: { titulo: 'Política de Privacidad', contenido: '<p>Página no encontrada o no publicada.</p>' } };
    }
  }


  // --- LEGAL PAGES END ---

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
      empresaNombre: business?.nombre || 'Alvaro Vaca',
      empresaSlogan: business?.slogan || 'Senador de la República #75',
      telefono: business?.telefono,
      email: business?.email,
      direccion: business?.direccion,
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
  @Render('inicio')
  async getHome() {
    const common = await this.getCommonData();
    let pageData = {};
    try {
      const page = await this.paginasService.findBySlug('inicio');
      if (page) pageData = page.meta || {};
    } catch (e) { }
    return { ...common, meta: pageData };
  }

  @Get('inicio-v2')
  async getHomeV2() { return this.getHome(); }

  @Get('inicio')
  async getHomeslug() { return this.getHome(); }

  @Get('nosotros')
  @Render('nosotros')
  async getNosotros() {
    const common = await this.getCommonData();
    let pageData = {};
    try {
      const page = await this.paginasService.findBySlug('nosotros');
      if (page) pageData = page.meta || {};
    } catch (e) { }
    return { ...common, meta: pageData };
  }

  @Get('sst')
  @Render('sst')
  async getSst() {
    const common = await this.getCommonData();
    let pageData = {};
    try {
      const page = await this.paginasService.findBySlug('sst');
      if (page) pageData = page.meta || {};
    } catch (e) { }
    return { ...common, meta: pageData };
  }

  @Get('contacto')
  @Render('contacto')
  async getContacto() {
    const common = await this.getCommonData();
    let pageData = {};
    try {
      const page = await this.paginasService.findBySlug('contacto');
      if (page) pageData = page.meta || {};
    } catch (e) { }
    return { ...common, meta: pageData, activePage: 'contacto' };
  }

  @Get('servicios')
  @Render('servicios')
  async getServicios() {
    const common = await this.getCommonData();
    let pageData = {};
    try {
      const page = await this.paginasService.findBySlug('servicios');
      if (page) pageData = page.meta || {};
    } catch (e) { }
    return { ...common, meta: pageData };
  }

  @Get('tarifas')
  @Render('tarifas')
  async getTarifas() {
    const common = await this.getCommonData();
    return {
      ...common,
      meta: {
        title: 'Tarifas 2025',
        description: 'Tarifas reglamentarias para derechos de grúas y patios.',
      },
    };
  }

  @Get('noticias')
  @Render('noticias')
  async getNoticias(
    @Query('categoria') categoriaSlug?: string,
    @Query('busqueda') busqueda?: string,
  ) {
    const common = await this.getCommonData();
    let noticias = await this.noticiasService.findAll();
    const categorias = await this.catalogoService.listarCategoriasNoticias();

    if (categoriaSlug) {
      noticias = noticias.filter((n) => n.categoria && n.categoria.slug === categoriaSlug);
    }
    if (busqueda) {
      const term = busqueda.toLowerCase();
      noticias = noticias.filter((n) =>
        n.titulo.toLowerCase().includes(term) || n.resumen?.toLowerCase().includes(term)
      );
    }

    return {
      ...common,
      noticias,
      categorias,
      filtros: { categoria: categoriaSlug, busqueda },
      title: 'Noticias y Actualidad', // Fix: Override default title
    };
  }

  @Get('noticias/:slug')
  @Render('noticia-detalle')
  async getNoticia(@Param('slug') slug: string) {
    const common = await this.getCommonData();
    try {
      const noticia = await this.noticiasService.findBySlug(slug);
      const relacionadas = await this.noticiasService.findRelated(noticia.id);
      return {
        ...common,
        noticia,
        relacionadas,
        meta: {
          title: noticia.titulo,
          description: noticia.resumen,
          image: noticia.imagenPrincipal,
        },
      };
    } catch (e) { throw e; }
  }

  @Get('biografia')
  @Render('biografia')
  async getBiografia() {
    const common = await this.getCommonData();
    let pageData = {};
    try {
      const page = await this.paginasService.findBySlug('biografia');
      if (page) pageData = page.meta || {};
    } catch (e) { }
    return { ...common, meta: pageData, activePage: 'biografia' };
  }

  @Get('propuestas')
  @Render('propuestas')
  async getPropuestas() {
    const common = await this.getCommonData();
    let pageData = {};
    try {
      const page = await this.paginasService.findBySlug('propuestas');
      if (page) pageData = page.meta || {};
    } catch (e) { }
    return { ...common, meta: pageData, activePage: 'propuestas' };
  }

  @Get('vacantes')
  @Render('vacantes')
  async getVacantes(@Query('categoria') categoriaSlug?: string) {
    const common = await this.getCommonData();
    let vacantes = await this.vacantesService.findAll();

    if (categoriaSlug) {
      vacantes = vacantes.filter((v) => v.categoria && v.categoria.slug === categoriaSlug);
    }

    const categoriasMap = new Map();
    vacantes.forEach((v) => {
      if (v.categoria) categoriasMap.set(v.categoria.slug, v.categoria);
    });
    const categorias = Array.from(categoriasMap.values());

    return { ...common, vacantes, categorias };
  }

  @Get('vacantes/:slug')
  @Render('vacante-detalle')
  async getVacante(@Param('slug') slug: string, @Req() req: Request) {
    const common = await this.getCommonData();
    try {
      const vacante = await this.vacantesService.findBySlug(slug);

      // Inject Fixed Steps for Display
      const fixedStepsDetails = [
        { titulo: 'Registro y Login', descripcion: 'Crea tu cuenta o inicia sesión para postularte.' },
        { titulo: 'Envío de Hoja de Vida', descripcion: 'Sube tu CV actualizado en formato ZIP.' },
      ];
      vacante.pasos = [...fixedStepsDetails, ...(vacante.pasos || [])];

      let yaPostulado = false;

      if (req.cookies && req.cookies['Authentication']) {
        try {
          const token = req.cookies['Authentication'];
          const decoded = this.autenticacionService.decodificarToken(token);
          if (decoded && decoded.sub) {
            yaPostulado = await this.postulacionesService.haPostulado(decoded.sub, vacante.id);
          }
        } catch (e) {
          console.error('Error checking postulation status', e);
        }
      }

      return {
        ...common,
        vacante,
        yaPostulado,
        meta: {
          title: vacante.titulo,
          description: vacante.descripcion,
        },
      };
    } catch (e) { throw e; }
  }

  @Get('candidato/registro')
  @Render('registro-candidato')
  async getRegistroCandidato(@Query('vacante') vacanteId?: string) {
    const common = await this.getCommonData();
    let vacanteTitulo = '';
    if (vacanteId) {
      try {
        const vacante = await this.vacantesService.findOne(vacanteId);
        if (vacante) vacanteTitulo = vacante.titulo;
      } catch (e) { }
    }
    return { ...common, vacanteId, vacanteTitulo };
  }

  @Post('candidato/registro')
  async registrarCandidato(@Body() body: any, @Res() res: Response) {
    try {
      const resultado = await this.autenticacionService.registrarCandidato(body);

      res.cookie('Authentication', resultado.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000,
      });

      let redirectUrl = '/candidato';

      if (body.vacanteId) {
        try {
          // Auto-apply
          await this.postulacionesService.aplicar(resultado.usuario.id, body.vacanteId);
          // Redirect to slug
          const vacante = await this.vacantesService.findOne(body.vacanteId);
          redirectUrl = `/vacantes/${vacante.slug}?status=aplicado`;
        } catch (e) {
          console.error(e);
          try {
            const vacante = await this.vacantesService.findOne(body.vacanteId);
            redirectUrl = `/vacantes/${vacante.slug}?error=error_aplicacion`;
          } catch (err) {
            redirectUrl = '/candidato?error=aplicacion_fallida';
          }
        }
      }
      return res.redirect(redirectUrl);
    } catch (error) {
      console.error('Registration error:', error);
      return res.redirect(`/candidato/registro?error=registro_fallido${body.vacanteId ? '&vacante=' + body.vacanteId : ''}`);
    }
  }

  @Get('login-candidato')
  @Render('login-candidato')
  async getLoginCandidato(
    @Query('vacante') vacanteId?: string,
    @Query('registrado') registrado?: boolean,
    @Query('error') error?: string
  ) {
    const common = await this.getCommonData();
    return { ...common, vacanteId, registrado, error };
  }

  @Post('candidato/login')
  async loginCandidato(@Body() body: any, @Res() res: Response) {
    try {
      const resultado = await this.autenticacionService.login({
        email: body.email,
        contrasena: body.contrasena
      });

      res.cookie('Authentication', resultado.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000,
      });

      let redirectUrl = '/candidato';
      if (body.vacanteId) {
        try {
          // Auto-apply on login
          await this.postulacionesService.aplicar(resultado.usuario.id, body.vacanteId);
          const vacante = await this.vacantesService.findOne(body.vacanteId);
          redirectUrl = `/vacantes/${vacante.slug}?status=aplicado`;
        } catch (e) {
          console.error('Error applying on login:', e);
          // Even if application fails (e.g., already applied), try to redirect to vacante
          try {
            const vacante = await this.vacantesService.findOne(body.vacanteId);
            redirectUrl = `/vacantes/${vacante.slug}?error=error_aplicacion`;
          } catch (err) {
            redirectUrl = '/candidato?error=aplicacion_fallida';
          }
        }
      }

      return res.redirect(redirectUrl);
    } catch (e) {
      return res.redirect(`/login-candidato?error=credenciales_invalidas${body.vacanteId ? '&vacante=' + body.vacanteId : ''}`);
    }
  }

}
