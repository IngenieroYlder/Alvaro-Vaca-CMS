import { IsString, IsArray } from 'class-validator';

export class CrearRolDto {
  @IsString()
  nombre: string;

  @IsArray()
  @IsString({ each: true })
  permisos: string[];

  @IsString()
  icono: string;
}

import { PartialType } from '@nestjs/mapped-types';

export class ActualizarRolDto extends PartialType(CrearRolDto) {}
