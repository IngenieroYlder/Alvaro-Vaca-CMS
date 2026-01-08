import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { MenusService } from './menus.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { CreateElementoMenuDto } from './dto/create-elemento-menu.dto';
import { UpdateElementoMenuDto } from './dto/update-elemento-menu.dto';

@Controller('menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Post()
  create(@Body() createMenuDto: CreateMenuDto) {
    return this.menusService.create(createMenuDto);
  }

  @Patch('reorder')
  reorderItems(
    @Body() items: { id: string; orden: number; padreId?: string | null }[],
  ) {
    return this.menusService.reorderItems(items);
  }

  @Get()
  findAll() {
    return this.menusService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.menusService.findOne(id);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.menusService.findBySlug(slug);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMenuDto: UpdateMenuDto) {
    return this.menusService.update(id, updateMenuDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.menusService.remove(id);
  }

  // --- ITEMS ---
  @Post(':id/items')
  createItem(@Param('id') id: string, @Body() dto: CreateElementoMenuDto) {
    return this.menusService.createItem(id, dto);
  }

  @Delete('items/:itemId')
  removeItem(@Param('itemId') itemId: string) {
    return this.menusService.removeItem(itemId);
  }

  @Patch('items/:itemId')
  updateItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateElementoMenuDto,
  ) {
    return this.menusService.updateItem(itemId, dto);
  }
}
