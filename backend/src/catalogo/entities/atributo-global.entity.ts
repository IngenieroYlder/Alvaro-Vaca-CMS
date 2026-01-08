import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { ValorAtributo } from './valor-atributo.entity';

@Entity('atributos_globales')
export class AtributoGlobal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  nombre: string; // ej: "Color", "Talla"

  @OneToMany(() => ValorAtributo, (valor) => valor.atributo)
  valores: ValorAtributo[];
}
