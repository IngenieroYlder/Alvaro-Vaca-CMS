import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenusService } from './menus.service';
import { MenusController } from './menus.controller';
import { Menu } from './entities/menu.entity';
import { ElementoMenu } from './entities/elemento-menu.entity';
import { Pagina } from '../paginas/entities/pagina.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Menu, ElementoMenu, Pagina])],
  controllers: [MenusController],
  providers: [MenusService],
  exports: [MenusService],
})
export class MenusModule {}
