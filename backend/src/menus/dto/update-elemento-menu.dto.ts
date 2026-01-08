import { PartialType } from '@nestjs/mapped-types';
import { CreateElementoMenuDto } from './create-elemento-menu.dto';

export class UpdateElementoMenuDto extends PartialType(CreateElementoMenuDto) {}
