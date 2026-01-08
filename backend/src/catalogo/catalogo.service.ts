import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Producto } from './entities/producto.entity';
import { Servicio } from './entities/servicio.entity';
import { CategoriaProducto } from './entities/categoria-producto.entity';
import { CategoriaServicio } from './entities/categoria-servicio.entity';
import { AtributoGlobal } from './entities/atributo-global.entity';
import { BadgeGlobal } from './entities/badge-global.entity';
import { ValorAtributo } from './entities/valor-atributo.entity';
import { CategoriaNoticia } from './entities/categoria-noticia.entity';
import { CategoriaVacante } from './entities/categoria-vacante.entity';

@Injectable()
export class CatalogoService implements OnModuleInit {
  constructor(
    @InjectRepository(Producto) private productosRepo: Repository<Producto>,
    @InjectRepository(Servicio) private serviciosRepo: Repository<Servicio>,
    @InjectRepository(CategoriaProducto)
    private catProductoRepo: Repository<CategoriaProducto>,
    @InjectRepository(CategoriaServicio)
    private catServicioRepo: Repository<CategoriaServicio>,
    @InjectRepository(AtributoGlobal)
    private atributosRepo: Repository<AtributoGlobal>,
    @InjectRepository(BadgeGlobal) private badgesRepo: Repository<BadgeGlobal>,
    @InjectRepository(ValorAtributo)
    private valoresRepo: Repository<ValorAtributo>,
    @InjectRepository(CategoriaNoticia)
    private catNoticiaRepo: Repository<CategoriaNoticia>,
    @InjectRepository(CategoriaVacante)
    private catVacanteRepo: Repository<CategoriaVacante>,
  ) { }

  async onModuleInit() {
    const count = await this.badgesRepo.count();
    if (count === 0) {
      await this.badgesRepo.save([
        { texto: 'Descuento', colorFondo: '#ef4444', colorTexto: '#ffffff' },
        { texto: 'Agotado', colorFondo: '#6b7280', colorTexto: '#ffffff' },
        { texto: 'Pro', colorFondo: '#3b82f6', colorTexto: '#ffffff' },
      ]);
    }
  }

  // --- Productos ---
  async crearProducto(datos: any) {
    // Transformar datos del Kit para que TypeORM entienda las relaciones
    if (datos.componentesKit && Array.isArray(datos.componentesKit)) {
      datos.componentesKit = datos.componentesKit.map((item: any) => ({
        ...item,
        hijo: { id: item.hijoId }, // Map ID to relation object
      }));
    }

    const producto = this.productosRepo.create(datos);
    return this.productosRepo.save(producto);
  }

  async listarProductos() {
    return this.productosRepo.find({
      relations: ['categoria', 'componentesKit', 'componentesKit.hijo'],
    });
  }

  // --- Globales ---
  async listarAtributos() {
    return this.atributosRepo.find({ relations: ['valores'] });
  }
  async crearAtributo(nombre: string) {
    const ext = await this.atributosRepo.findOneBy({ nombre });
    if (ext) return ext;
    return this.atributosRepo.save(this.atributosRepo.create({ nombre }));
  }
  async actualizarAtributo(id: string, nombre: string) {
    await this.atributosRepo.update(id, { nombre });
    return this.atributosRepo.findOne({
      where: { id },
      relations: ['valores'],
    });
  }
  async eliminarAtributo(id: string) {
    return this.atributosRepo.delete(id);
  }

  // --- Valores Atributos ---
  async crearValorAtributo(atributoId: string, valor: string) {
    const atributo = await this.atributosRepo.findOneBy({ id: atributoId });
    if (!atributo) throw new Error('Atributo no encontrado');
    const nuevoValor = this.valoresRepo.create({ valor, atributo });
    return this.valoresRepo.save(nuevoValor);
  }
  async eliminarValorAtributo(id: string) {
    return this.valoresRepo.delete(id);
  }

  async listarBadges() {
    return this.badgesRepo.find();
  }
  async crearBadge(datos: any) {
    return this.badgesRepo.save(this.badgesRepo.create(datos));
  }
  async actualizarBadge(id: string, datos: any) {
    await this.badgesRepo.update(id, datos);
    return this.badgesRepo.findOneBy({ id });
  }
  async eliminarBadge(id: string) {
    return this.badgesRepo.delete(id);
  }

  // --- Servicios ---
  async crearServicio(datos: any) {
    const servicio = this.serviciosRepo.create(datos);
    return this.serviciosRepo.save(servicio);
  }

  async listarServicios() {
    return this.serviciosRepo.find({ relations: ['categoria'] });
  }

  // --- Categorias Productos ---
  async crearCategoriaProducto(datos: any) {
    const categoria = this.catProductoRepo.create(datos);
    return this.catProductoRepo.save(categoria);
  }

  async listarCategoriasProductos() {
    return this.catProductoRepo.find();
  }

  // --- Categorias Servicios ---
  async crearCategoriaServicio(datos: any) {
    const categoria = this.catServicioRepo.create(datos);
    return this.catServicioRepo.save(categoria);
  }

  async listarCategoriasServicios() {
    return this.catServicioRepo.find();
  }

  // --- Categorias Noticias ---
  async crearCategoriaNoticia(datos: any) {
    const categoria = this.catNoticiaRepo.create(datos);
    return this.catNoticiaRepo.save(categoria);
  }

  async listarCategoriasNoticias() {
    return this.catNoticiaRepo.find();
  }

  // --- Categorias Vacantes ---
  async listarCategoriasVacantes() {
    return this.catVacanteRepo.find({ where: { activo: true } });
  }

  async crearCategoriaVacante(datos: any) {
    if (!datos.nombre || !datos.slug)
      throw new Error('Nombre y Slug requeridos');
    const categoria = this.catVacanteRepo.create(datos);
    return this.catVacanteRepo.save(categoria);
  }

  async actualizarCategoriaVacante(id: string, datos: any) {
    await this.catVacanteRepo.update(id, datos);
    return this.catVacanteRepo.findOneBy({ id });
  }

  async eliminarCategoriaVacante(id: string) {
    return this.catVacanteRepo.delete(id);
  }
}
