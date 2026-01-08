import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { AtributoGlobal } from './atributo-global.entity';

@Entity('valores_atributos')
export class ValorAtributo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  valor: string;

  @Column({ nullable: true })
  color: string; // Para representar colores visualmente si aplica

  @ManyToOne(() => AtributoGlobal, (atributo) => atributo.valores, {
    onDelete: 'CASCADE',
  })
  atributo: AtributoGlobal;
}
