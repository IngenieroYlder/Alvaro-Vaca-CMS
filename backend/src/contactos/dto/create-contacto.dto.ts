import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateContactoDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  telefono: string;

  @IsBoolean()
  @IsOptional()
  tieneWhatsapp: boolean;

  @IsString()
  @IsOptional()
  otroWhatsapp?: string;

  @IsString()
  @IsNotEmpty()
  ciudad: string;

  @IsString()
  @IsOptional()
  tipo?: string;

  @IsString()
  @IsOptional()
  rol_sumate?: string;

  @IsString()
  @IsNotEmpty()
  mensaje: string;

  // Honeypot field: If this has a value, it's a bot.
  @IsString()
  @IsOptional()
  _gotcha?: string;

  @IsString()
  @IsOptional()
  formId?: string;
}
