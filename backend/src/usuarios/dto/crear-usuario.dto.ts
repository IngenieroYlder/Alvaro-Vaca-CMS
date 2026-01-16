import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class CrearUsuarioDto {
  @IsEmail({}, { message: 'El correo debe ser válido' })
  @IsOptional()
  email?: string;

  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @IsOptional()
  contrasena?: string;

  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  // @IsNotEmpty() // Should be required now? Plan said "documento obligatorio".
  documento: string;

  @IsString()
  @IsOptional()
  apellido?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  whatsapp?: string;

  @IsString()
  @IsOptional()
  fotoPerfil?: string;
}
