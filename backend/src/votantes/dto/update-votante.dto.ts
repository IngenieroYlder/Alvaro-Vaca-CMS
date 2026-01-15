import { PartialType } from '@nestjs/mapped-types';
import { CreateVotanteDto } from './create-votante.dto';

export class UpdateVotanteDto extends PartialType(CreateVotanteDto) {}
