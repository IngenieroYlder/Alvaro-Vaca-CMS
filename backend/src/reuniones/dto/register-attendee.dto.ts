import { IsString, IsNotEmpty, IsEmail, IsOptional, IsBoolean } from 'class-validator';

export class RegisterAttendeeDto {
  @IsString()
  @IsNotEmpty()
  codigoReunion: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  documento: string;

  @IsString()
  @IsNotEmpty()
  telefono: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  firma?: string;

  @IsBoolean()
  @IsNotEmpty()
  habeasData: boolean;
}
