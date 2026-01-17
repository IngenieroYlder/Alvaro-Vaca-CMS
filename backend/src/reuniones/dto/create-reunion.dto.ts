import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateReunionDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsDateString()
  @IsNotEmpty()
  fecha: string;

  @IsString()
  @IsOptional()
  liderNombre?: string;

  @IsString()
  @IsOptional()
  liderDocumento?: string;

  @IsString()
  @IsOptional()
  liderTelefono?: string;

  @IsString()
  @IsOptional()
  municipio?: string;

  @IsString()
  @IsOptional()
  comuna?: string;

  @IsString()
  @IsOptional()
  departamento?: string;

  @IsString()
  @IsOptional()
  corregimiento?: string;

  @IsString()
  @IsNotEmpty()
  barrio: string;
}
