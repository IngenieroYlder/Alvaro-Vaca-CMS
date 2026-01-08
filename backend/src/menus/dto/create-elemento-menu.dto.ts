import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateElementoMenuDto {
  @IsString()
  titulo: string;

  @IsString()
  @IsOptional()
  tipo?: 'personalizado' | 'pagina';

  @IsString()
  @IsOptional()
  url?: string;

  @IsUUID()
  @IsOptional()
  paginaId?: string;

  @IsUUID()
  @IsOptional()
  padreId?: string;

  @IsString()
  @IsOptional()
  icono?: string;

  @IsInt()
  @IsOptional()
  orden?: number;

  @IsBoolean()
  @IsOptional()
  targetBlank?: boolean;
}
