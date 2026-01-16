import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString({ message: 'Debe ingresar un correo o documento' })
  email: string;

  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  contrasena: string;
}
