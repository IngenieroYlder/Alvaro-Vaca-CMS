import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NoticiasService } from './noticias.service';
// import { AuthGuard } from '../autenticacion/guards/auth.guard'; // Uncomment when auth is ready or use standard
// Using mock auth for now or standard if available

@Controller('api/noticias')
export class NoticiasController {
  constructor(private readonly noticiasService: NoticiasService) { }

  @Get()
  findAll() {
    return this.noticiasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.noticiasService.findOne(id);
  }

  @Post()
  create(@Body() createNoticiaDto: any, @Req() req: any) {
    // Assuming user is attached to req via Guard
    return this.noticiasService.create(createNoticiaDto, req.user);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateNoticiaDto: any) {
    return this.noticiasService.update(id, updateNoticiaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.noticiasService.remove(id);
  }
}
