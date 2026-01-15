import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateVotanteDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  apellido: string;

  @IsString()
  @IsNotEmpty()
  documento: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsString()
  @IsNotEmpty()
  departamento: string;

  @IsString()
  @IsNotEmpty()
  municipio: string;

  @IsString()
  @IsOptional()
  puestoVotacion?: string;

  @IsString()
  @IsOptional()
  mesa?: string;

  @IsUUID()
  @IsOptional() // In case we infer it from the logged in user
  liderId?: string;
}
