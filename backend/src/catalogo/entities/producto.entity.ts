import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { CategoriaProducto } from './categoria-producto.entity';
import { ItemKit } from './item-kit.entity';

export enum TipoProducto {
  SIMPLE = 'simple',
  VARIABLE = 'variable',
  KIT = 'kit',
  VIRTUAL = 'virtual',
}

@Entity('productos')
export class Producto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column({ unique: true, nullable: true })
  sku: string;

  @Column('text', { nullable: true })
  descripcionCorta: string;

  @Column('text', { nullable: true })
  descripcionLarga: string; // Reemplaza a 'descripcion' antigua

  @Column('decimal', { precision: 10, scale: 2 })
  precio: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  precioRebajado: number;

  @Column({ nullable: true })
  imagenPrincipal: string;

  @Column('simple-array', { nullable: true })
  galeria: string[];

  // --- Inventario y Tipo ---
  @Column({ type: 'enum', enum: TipoProducto, default: TipoProducto.SIMPLE })
  tipo: TipoProducto;

  @Column({ default: true })
  manejaInventario: boolean;

  @Column('int', { default: 0 })
  stock: number; // Cantidad de inventario

  @Column({ default: false })
  esDescargable: boolean;

  @Column({ nullable: true })
  archivoDescargable: string; // URL del PDF o archivo

  // --- Atributos y Extras ---
  @Column('jsonb', { nullable: true })
  atributos: any[]; // Ej: [{ nombre: "Color", valores: ["Rojo", "Azul"] }]

  @Column('jsonb', { nullable: true })
  badges: any[]; // Ej: [{ texto: "Oferta", color: "#ff0000", fondo: "#ffffff" }]

  // --- Relaciones ---
  @ManyToOne(() => CategoriaProducto, (categoria) => categoria.productos, {
    nullable: true,
  })
  categoria: CategoriaProducto;

  @OneToMany(() => ItemKit, (item) => item.padre, { cascade: true })
  componentesKit: ItemKit[];

  @ManyToMany(() => Producto)
  @JoinTable({ name: 'productos_relacionados' })
  relacionados: Producto[];

  @ManyToMany(() => Producto)
  @JoinTable({ name: 'productos_ventas_cruzadas' })
  ventasCruzadas: Producto[];

  @CreateDateColumn()
  creadoEn: Date;

  @UpdateDateColumn()
  actualizadoEn: Date;
}
