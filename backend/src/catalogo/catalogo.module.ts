import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogoService } from './catalogo.service';
import { CatalogoController } from './catalogo.controller';
import { Producto } from './entities/producto.entity';
import { Servicio } from './entities/servicio.entity';
import { CategoriaProducto } from './entities/categoria-producto.entity';
import { CategoriaServicio } from './entities/categoria-servicio.entity';
import { ItemKit } from './entities/item-kit.entity';
import { AtributoGlobal } from './entities/atributo-global.entity';
import { BadgeGlobal } from './entities/badge-global.entity';
import { ValorAtributo } from './entities/valor-atributo.entity';
import { CategoriaNoticia } from './entities/categoria-noticia.entity';
import { CategoriaVacante } from './entities/categoria-vacante.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CategoriaProducto,
      CategoriaServicio,
      AtributoGlobal,
      BadgeGlobal,
      CategoriaNoticia,
      CategoriaVacante,
      Producto,
      Servicio,
      ValorAtributo,
      ItemKit,
    ]),
  ],
  controllers: [CatalogoController],
  providers: [CatalogoService],
  exports: [CatalogoService],
})
export class CatalogoModule { }
