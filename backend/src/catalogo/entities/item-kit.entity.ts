import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Producto } from './producto.entity';

@Entity('items_kit')
export class ItemKit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Producto, (producto) => producto.componentesKit, {
    onDelete: 'CASCADE',
  })
  padre: Producto; // El producto principal (Kit)

  @ManyToOne(() => Producto, { onDelete: 'CASCADE' })
  hijo: Producto; // El producto componente (ej: una unidad de 'Jabón')

  @Column('int', { default: 1 })
  cantidad: number;
}
