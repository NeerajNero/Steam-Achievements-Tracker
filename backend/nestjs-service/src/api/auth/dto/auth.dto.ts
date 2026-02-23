import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import type { auth_provider } from '@prisma/client';

export class RegisterAndLoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'secret123', minLength: 6, description: 'Password (min 6 characters)' })
  @IsString()
  @MinLength(6)
  password: string;
}

export class AuthUserResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'user@example.com', nullable: true })
  email: string | null;
}

export class AuthSuccessResponseDto {
  @ApiProperty({ type: AuthUserResponseDto })
  user: AuthUserResponseDto;

  @ApiProperty({ example: 'success' })
  status: string;
}

export class LogoutResponseDto {
  @ApiProperty({ example: 'Logged out successfully' })
  message: string;
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
