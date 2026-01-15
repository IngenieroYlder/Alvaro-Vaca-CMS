import { IsString, IsNotEmpty, IsEmail, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class RegisterAttendeeDto {
  @IsString()
  @IsNotEmpty()
  codigoReunion: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  nombre: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  apellido: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  documento: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10, { message: 'El teléfono no puede tener más de 10 dígitos' })
  telefono: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(150)
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  direccion?: string;

  @IsString()
  @IsOptional()
  firma?: string;

  @IsBoolean()
  @IsNotEmpty()
  habeasData: boolean;
}
