import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';

export class CreatePaginaDto {
  @IsString()
  titulo: string;

  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'El slug solo puede contener letras minúsculas, números y guiones',
  })
  slug: string;

  @IsString()
  @IsOptional()
  contenido?: string;

  @IsBoolean()
  @IsOptional()
  esPublica?: boolean;

  @IsOptional()
  meta?: any;
}
