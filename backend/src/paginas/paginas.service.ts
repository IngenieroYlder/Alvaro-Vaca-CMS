import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePaginaDto } from './dto/create-pagina.dto';
import { UpdatePaginaDto } from './dto/update-pagina.dto';
import { Pagina } from './entities/pagina.entity';
import { PaginaMeta } from './interfaces/pagina-meta.interface';

@Injectable()
export class PaginasService implements OnModuleInit {
  constructor(
    @InjectRepository(Pagina)
    private paginaRepository: Repository<Pagina>,
  ) { }

  create(createPaginaDto: CreatePaginaDto) {
    const pagina = this.paginaRepository.create(createPaginaDto);
    return this.paginaRepository.save(pagina);
  }

  findAll() {
    return this.paginaRepository.find({ order: { fechaCreacion: 'DESC' } });
  }

  async findOne(id: string) {
    const pagina = await this.paginaRepository.findOneBy({ id });
    if (!pagina) throw new NotFoundException('Página no encontrada');
    return pagina;
  }

  async findBySlug(slug: string) {
    return this.paginaRepository.findOneBy({ slug, esPublica: true });
  }

  async update(id: string, updatePaginaDto: UpdatePaginaDto) {
    const pagina = await this.findOne(id);
    this.paginaRepository.merge(pagina, updatePaginaDto);
    return this.paginaRepository.save(pagina);
  }

  async remove(id: string) {
    const result = await this.paginaRepository.delete(id);
    if (result.affected === 0)
      throw new NotFoundException('Página no encontrada');
    return { message: 'Página eliminada' };
  }
  async onModuleInit() {
    await this.seedPaginas();
    await this.fixHeroImage();
    await this.fixBioSection();
    await this.fixPropuestas();
    await this.fixHomeDescription();
  }

  private async fixPropuestas() {
    try {
      const inicio = await this.paginaRepository.findOneBy({ slug: 'inicio' });
      if (inicio && inicio.meta) {
        const meta = inicio.meta as PaginaMeta;
        if (!meta.propuestas) {
          meta.propuestas = [];
        }

        const internetProposalExists = meta.propuestas.some(p => p.title.includes('Subsidio de Conectividad'));

        if (!internetProposalExists) {
          const newProposal = {
            title: 'Subsidio de Conectividad',
            description: 'Impulsaremos un subsidio vital para garantizar internet, iniciando con estratos 1, 2 y 3. Conectividad es igualdad de oportunidades.',
            icon: 'wifi',
            color: 'secondary'
          };
          
          // Add to the end initially, then sort
          meta.propuestas.push(newProposal);
          console.log('--- MIGRATION: ADDING INTERNET PROPOSAL ---');
        }

        // Reorder Logic
        const desiredOrder = [
          'Educación para emprender',
          'Subsidio de Conectividad',
          'Cero impunidad',
          'Ley de Seguridad Digital e IA'
        ];

        let orderChanged = false;
        const currentTitles = meta.propuestas.map(p => p.title);
        
        // Check if current order matches desired order (filtering out any unknown proposals just in case, or strict match)
        // Simple check: are the first 4 titles in the correct order?
        const reorderedProposals = [];
        
        for (const title of desiredOrder) {
          const proposal = meta.propuestas.find(p => p.title === title || p.title.includes(title));
          if (proposal) {
            reorderedProposals.push(proposal);
          }
        }
        
        // Add any remaining proposals that weren't in the desired list
        const remaining = meta.propuestas.filter(p => !desiredOrder.some(t => p.title === t || p.title.includes(t)));
        reorderedProposals.push(...remaining);

        // Compare reordered with current
        if (JSON.stringify(meta.propuestas) !== JSON.stringify(reorderedProposals)) {
          meta.propuestas = reorderedProposals;
          console.log('--- MIGRATION: REORDERING PROPOSALS ---');
          await this.paginaRepository.save(inicio);
        } else if (!internetProposalExists) {
           // Case where we added but order happened to be fine or just need to save the addition
           await this.paginaRepository.save(inicio);
        }

      }
    } catch (error) {
      console.error('Error migrating proposals:', error);
    }
  }

  private async fixHomeDescription() {
    try {
      const inicio = await this.paginaRepository.findOneBy({ slug: 'inicio' });
      if (inicio && inicio.meta) {
        const meta = inicio.meta as PaginaMeta;
        
        const oldDescriptionStart = "Soy Álvaro Vaca, un candidato nuevo";
        const newDescription = "SOY EMPRESARIO DEL SECTOR DE TELECOMUNICACIONES EMPRESA PRIVADA Y ENTENDIENDO LAS NECESIDADES DE LOS COLOMBIANOS.";
        
        if (meta.hero && meta.hero.description && (meta.hero.description.startsWith(oldDescriptionStart) || meta.hero.description.includes('Vengo del sector transporte'))) {
           if (meta.hero.description !== newDescription) {
             meta.hero.description = newDescription;
             console.log('--- MIGRATION: UPDATING HERO DESCRIPTION ---');
             await this.paginaRepository.save(inicio);
           }
        }
      }
    } catch (error) {
      console.error('Error migrating home description:', error);
    }
  }

  private async fixBioSection() {
    try {
      const inicio = await this.paginaRepository.findOneBy({ slug: 'inicio' });
      if (inicio && inicio.meta) {
        const meta = inicio.meta as PaginaMeta;

        if (meta.bio) {
          let changed = false;

          const newDescription = "De Paratebueno para Colombia: nacido en este municipio, hoy vive en Restrepo y trabaja en Villavicencio, donde lidera la oficina principal de HOLA INTERNET; una historia de superación, servicio y emprendimiento.";

          if (meta.bio.description !== newDescription) {
            meta.bio.description = newDescription;
            changed = true;
          }

          if (meta.bio.linkUrl !== '/biografia') {
            meta.bio.linkUrl = '/biografia';
            changed = true;
          }

          if (changed) {
            console.log('--- MIGRATION: UPDATING BIO SECTION ---');
            await this.paginaRepository.save(inicio);
          }
        }
      }
    } catch (error) {
      console.error('Error migrating bio section:', error);
    }
  }

  private async fixHeroImage() {
    try {
      const inicio = await this.paginaRepository.findOneBy({ slug: 'inicio' });
      if (inicio && inicio.meta) {
        const meta = inicio.meta as PaginaMeta;
        if (meta.hero) {
          let changed = false;
          // Fix Desktop Image
          if (meta.hero.image === '/assets/FOTO CAMPAÑA.png') {
            meta.hero.image = '/assets/FOTO_CAMPANA_V2.png';
            changed = true;
          }
          // Fix Mobile Image
          if (meta.hero.mobileImage === '/assets/FOTO CAMPAÑA.png') {
            meta.hero.mobileImage = '/assets/FOTO_CAMPANA_V2.png';
            changed = true;
          }

          if (changed) {
            console.log('--- MIGRATION: UPDATING HERO IMAGE TO V2 ---');
            await this.paginaRepository.save(inicio);
          }
        }
      }
    } catch (error) {
      console.error('Error migrating hero image:', error);
    }
  }

  private async seedPaginas() {
    const paginas = [
      {
        slug: 'inicio',
        titulo: 'Inicio',
        meta: {
          browserTitle: 'Alvaro Vaca - Candidato al Senado 2026',
          browserDescription: 'Elecciones Congreso, Marzo 8. Sitio oficial de Alvaro Vaca, candidato al Senado 2026.',
          hero: {
            badge: 'Elecciones Congreso 2026, Marzo 8',
            title: 'Un Senador que <br><span class="text-gradient">Conecte con la Gente</span>',
            description: 'SOY EMPRESARIO DEL SECTOR DE TELECOMUNICACIONES EMPRESA PRIVADA Y ENTENDIENDO LAS NECESIDADES DE LOS COLOMBIANOS.',
            ctaPrimary: { text: 'Conoce mis Propuestas', url: '#propuestas' },
            ctaSecondary: { text: 'Ver Historia', url: '#biografia' },
            image: '/assets/FOTO_CAMPANA_V2.png',
            mobileImage: '/assets/FOTO_CAMPANA_V2.png'
          },
          bio: {
            title: 'Una Vida de Servicio',
            description: 'De Paratebueno para Colombia: nacido en este municipio, hoy vive en Restrepo y trabaja en Villavicencio, donde lidera la oficina principal de HOLA INTERNET; una historia de superación, servicio y emprendimiento.',
            image: '/assets/alvaro.png',
            linkText: 'Leer Biografía Completa',
            linkUrl: '/biografia'
          },
          propuestas: [
            {
              title: 'Educación para emprender',
              description: 'Desde la primaria enseñamos a los nuevos emprendedores. Fomentar la mentalidad empresarial desde niños.',
              icon: 'lightbulb',
              color: 'primary'
            },
            {
              title: 'Cero impunidad',
              description: 'El hacinamiento en las cárceles es la principal causa de la impunidad en Colombia. Proponemos reforma carcelaria efectiva.',
              icon: 'balance',
              color: 'sunflower'
            },
            {
              title: 'Ley de Seguridad Digital e IA',
              description: 'Las redes sociales y la IA requieren una regulación estricta para proteger a los ciudadanos y empresas.',
              icon: 'security',
              color: 'accent'
            }
          ]
        }
      },
      {
        slug: 'biografia',
        titulo: 'Biografía',
        meta: {
          browserTitle: 'Biografía - Alvaro Vaca Senado 2026',
          browserDescription: 'De Paratebueno para Colombia: nacido en este municipio, hoy vive en Restrepo y trabaja en Villavicencio, donde lidera la oficina principal de HOLA INTERNET; una historia de superación, servicio y emprendimiento.',
          title: 'Una Vida de Servicio',
          description: 'De Paratebueno para Colombia: nacido en este municipio, hoy vive en Restrepo y trabaja en Villavicencio, donde lidera la oficina principal de HOLA INTERNET; una historia de superación, servicio y emprendimiento.',
          image: '/assets/alvaro.png'
        }
      },
      {
        slug: 'propuestas',
        titulo: 'Propuestas',
        meta: {
          browserTitle: 'Propuestas - Alvaro Vaca Senado 2026',
          browserDescription: 'Conoce las propuestas de Alvaro Vaca: Educación para emprender, Cero impunidad y Seguridad Digital.',
          title: 'Propuestas para Transformar Colombia',
          description: 'Ideas claras y ejecutables nacidas de la experiencia.',
          image: '/assets/FOTO CAMPAÑA.png'
        }
      }
    ];

    for (const p of paginas) {
      const existing = await this.paginaRepository.findOneBy({ slug: p.slug });
      if (!existing) {
        console.log(`--- SEEDING PAGE: ${p.slug} ---`);
        await this.paginaRepository.save(this.paginaRepository.create({
          slug: p.slug,
          titulo: p.titulo,
          esPublica: true,
          contenido: `Contenido por defecto para ${p.titulo}`,
          meta: p.meta
        }));
      }
    }
  }
}
