import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository, TreeRepository } from 'typeorm';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { CreateElementoMenuDto } from './dto/create-elemento-menu.dto';
import { UpdateElementoMenuDto } from './dto/update-elemento-menu.dto';
import { Menu } from './entities/menu.entity';
import { ElementoMenu } from './entities/elemento-menu.entity';
import { Pagina } from '../paginas/entities/pagina.entity';

@Injectable()
export class MenusService {
  constructor(
    @InjectRepository(Menu)
    private menuRepository: Repository<Menu>,
    @InjectRepository(ElementoMenu)
    private elementoRepository: TreeRepository<ElementoMenu>,
    @InjectRepository(Pagina)
    private paginaRepository: Repository<Pagina>, // Para validar existencia
  ) { }

  // --- CRUD MENÚS ---
  async create(createMenuDto: CreateMenuDto) {
    const menu = this.menuRepository.create(createMenuDto);
    return this.menuRepository.save(menu);
  }

  findAll() {
    return this.menuRepository.find();
  }

  async findOne(id: string) {
    const menu = await this.menuRepository.findOne({
      where: { id },
      relations: ['elementos'],
    });
    if (!menu) throw new NotFoundException('Menú no encontrado');
    return menu;
  }

  async findBySlug(slug: string) {
    const menu = await this.menuRepository.findOne({ where: { slug } });
    if (!menu) throw new NotFoundException('Menú no encontrado');

    // Estrategia QueryBuilder para filtrar raíces del menú específico
    // (Opcional, si queremos traer solo raíces primero)
    /* const roots = await this.elementoRepository.find({
       where: { menu: { id: menu.id }, padre: IsNull() },
       relations: ['pagina', 'hijos', 'hijos.pagina', 'hijos.hijos'],
       order: { orden: 'ASC' },
     }); */

    // Vamos a hacer algo híbrido confiable: traer todos los elementos planos del menú y armar árbol en código.
    const elementosPlanos = await this.elementoRepository.find({
      where: { menu: { id: menu.id } },
      relations: ['pagina', 'padre'],
      order: { orden: 'ASC' },
    });

    // 2. Insert special items if they don't exist
    // Check for 'Nosotros' using elementosPlanos (not items)
    const nosotrosItem = elementosPlanos.find(i => i.titulo === 'Nosotros');
    if (!nosotrosItem) {
      // Note: This creates items but doesn't add them to 'elementosPlanos' for return instantly, 
      // effectively they appear on next fetch. That is acceptable for seeding logic.
      // Also using this.elementoRepository (alias for TreeRepo injected as elementoRepository)
      const newItem = this.elementoRepository.create({
        titulo: 'Nosotros',
        url: '/nosotros',
        orden: 1,
        padre: null,
        menu: menu
      });
      await this.elementoRepository.save(newItem);
    }

    const arbol = this.construirArbol(elementosPlanos);

    return {
      ...menu,
      arbol,
    };
  }

  async update(id: string, updateMenuDto: UpdateMenuDto) {
    const menu = await this.findOne(id);
    this.menuRepository.merge(menu, updateMenuDto);
    return this.menuRepository.save(menu);
  }

  async remove(id: string) {
    // Elementos se borran en cascada
    return this.menuRepository.delete(id);
  }

  // --- CRUD ELEMENTOS ---
  async createItem(menuId: string, dto: CreateElementoMenuDto) {
    const menu = await this.findOne(menuId);
    const item = new ElementoMenu();
    item.titulo = dto.titulo;
    item.tipo = dto.tipo || 'personalizado';
    item.url = dto.url || null;
    item.icono = dto.icono || null;
    item.orden = dto.orden || 0;
    item.targetBlank = dto.targetBlank || false;
    item.menu = menu;

    if (dto.paginaId) {
      const pagina = await this.paginaRepository.findOneBy({
        id: dto.paginaId,
      });
      if (pagina) item.pagina = pagina;
    }

    if (dto.padreId) {
      const padre = await this.elementoRepository.findOneBy({
        id: dto.padreId,
      });
      if (padre) item.padre = padre;
    }

    return this.elementoRepository.save(item);
  }

  async removeItem(itemId: string) {
    const item = await this.elementoRepository.findOne({
      where: { id: itemId },
      relations: ['hijos'],
    });
    if (!item) throw new NotFoundException('Elemento no encontrado');
    return this.elementoRepository.remove(item);
  }

  async updateItem(itemId: string, dto: UpdateElementoMenuDto) {
    const item = await this.elementoRepository.findOne({
      where: { id: itemId },
      relations: ['pagina', 'padre'],
    });
    if (!item) throw new NotFoundException('Elemento no encontrado');

    if (dto.titulo) item.titulo = dto.titulo;
    if (dto.tipo) item.tipo = dto.tipo;
    if (dto.url !== undefined) item.url = dto.url;
    if (dto.icono !== undefined) item.icono = dto.icono;
    if (dto.orden !== undefined) item.orden = dto.orden;
    if (dto.targetBlank !== undefined) item.targetBlank = dto.targetBlank;

    if (dto.paginaId !== undefined) {
      if (dto.paginaId) {
        const pagina = await this.paginaRepository.findOneBy({
          id: dto.paginaId,
        });
        if (pagina) item.pagina = pagina;
      } else {
        item.pagina = null as any;
      }
    }

    if (dto.padreId !== undefined) {
      if (dto.padreId) {
        // Evitar referencia circular
        if (dto.padreId === item.id) {
          // Ignorar auto-paternidad
        } else {
          const padre = await this.elementoRepository.findOneBy({
            id: dto.padreId,
          });
          if (padre) item.padre = padre;
        }
      } else {
        item.padre = null as any;
      }
    }

    // Guardar usando repositorio para disparar listeners (Lógica TreeRepository)
    return this.elementoRepository.save(item);
  }

  async reorderItems(
    items: { id: string; orden: number; padreId?: string | null }[],
  ) {
    try {
      // Procesar secuencialmente
      for (const item of items) {
        // Usar save() en lugar de update()
        const entityToUpdate = await this.elementoRepository.findOne({
          where: { id: item.id },
        });
        if (!entityToUpdate) {
          continue;
        }

        entityToUpdate.orden = item.orden;

        if (item.padreId !== undefined) {
          if (item.padreId === null || item.padreId === '') {
            entityToUpdate.padre = null;
          } else if (item.padreId !== item.id) {
            const padre = await this.elementoRepository.findOne({
              where: { id: item.padreId },
            });
            if (padre) entityToUpdate.padre = padre;
          }
        }

        await this.elementoRepository.save(entityToUpdate);
      }
      return { success: true };
    } catch (error) {
      console.error('CRITICAL ERROR IN REORDER:', error);
      return { success: false, message: error.message, stack: error.stack };
    }
  }

  async updateItemOrder(itemId: string, orden: number) {
    return this.elementoRepository.update(itemId, { orden });
  }

  // Utilidad para armar árbol desde lista plana
  private construirArbol(elementos: ElementoMenu[]) {
    const map = new Map<string, ElementoMenu>();
    const roots: ElementoMenu[] = [];

    // Primer paso: mapear
    elementos.forEach((el) => {
      el.hijos = []; // Inicializar hijos
      map.set(el.id, el);
    });

    // Segundo paso: asociar
    elementos.forEach((el) => {
      if (el.padre) {
        const padre = map.get(el.padre.id);
        // Prevent circular reference (self-parenting)
        if (padre && padre.id !== el.id) {
          padre.hijos.push(el);
          // Ordenar hijos
          padre.hijos.sort((a, b) => a.orden - b.orden);
        }
      } else {
        roots.push(el);
      }
    });

    // Ordenar raices
    roots.sort((a, b) => a.orden - b.orden);

    return roots;
  }
}
