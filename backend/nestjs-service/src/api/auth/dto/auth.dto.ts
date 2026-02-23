import { IsEmail, IsString, MinLength } from 'class-validator';
import type { auth_provider } from '@prisma/client';

export class RegisterAndLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class AuthTokensDto {
  accessToken: string;
  refreshToken: string;
  refreshTokenHash: string;
}

export class AuthResponseDto {
  user: { id: string; email: string | null };
  status: string;
  tokens: AuthTokensDto;
}

export class CreateUserDto {
  email: string;
  password_hash: string;
  provider: auth_provider;
  provider_id: string;
}

export class CreateUserSessionDto {
  userId: string;
  refreshTokenHash: string;
  deviceId?: string;
}
