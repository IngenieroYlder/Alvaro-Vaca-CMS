import { IsString, Matches } from 'class-validator';

export class CreateMenuDto {
  @IsString()
  nombre: string;

  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'El slug solo puede contener letras minúsculas, números y guiones',
  })
  slug: string;
}
