import { PartialType } from '@nestjs/mapped-types';
import { CreateReunioneDto } from './create-reunione.dto';

export class UpdateReunioneDto extends PartialType(CreateReunioneDto) {}
