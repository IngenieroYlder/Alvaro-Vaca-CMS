import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateReunionDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsDateString()
  @IsNotEmpty()
  fecha: string;

  @IsString()
  @IsNotEmpty()
  liderNombre: string;

  @IsString()
  @IsNotEmpty()
  liderDocumento: string;

  @IsString()
  @IsNotEmpty()
  liderTelefono: string;

  @IsString()
  @IsOptional()
  municipio?: string;

  @IsString()
  @IsOptional()
  comuna?: string;

  @IsString()
  @IsOptional()
  corregimiento?: string;

  @IsString()
  @IsNotEmpty()
  barrio: string;
}
