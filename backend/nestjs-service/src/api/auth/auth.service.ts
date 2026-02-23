import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { RegisterAndLoginDto, AuthResponseDto, CreateUserDto } from './dto/auth.dto';
import { RegisterRepository } from '../db/prisma/register/register.repository';
import { AUTH, JWT } from './constants/auth.constants';

@Injectable()
export class AuthService {
  constructor(
    private readonly registerRepository: RegisterRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterAndLoginDto): Promise<AuthResponseDto> {
    const { email, password } = dto;

    const existingUser = await this.registerRepository.findUserByEmail(email);

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const password_hash = await this.hashPassword(password);
    const provider_id = `${email}-${randomBytes(10).toString('hex')}`;

    const createUserDto: CreateUserDto = {
      email,
      password_hash,
      provider: 'email',
      provider_id,
    };
    const user = await this.registerRepository.createUser(createUserDto);

    const accessToken = await this.generateAccessToken(user.id);
    const refreshToken = this.generateRefreshToken();
    const refreshTokenHash = await bcrypt.hash(refreshToken, AUTH.BCRYPT_ROUNDS);

    await this.registerRepository.createUserSession(user.id, refreshTokenHash);

    return {
      user: { id: user.id, email: user.email },
      status: 'success',
      tokens: { accessToken, refreshToken, refreshTokenHash },
    };
  }

  async login(dto: RegisterAndLoginDto): Promise<AuthResponseDto> {
    const { email, password } = dto;

    const existingUser = await this.registerRepository.findUserByEmail(email);

    if (!existingUser) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const password_hash = existingUser.password_hash;
    if (!password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await this.compareToken(password, password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.generateAccessToken(existingUser.id);
    const refreshToken = this.generateRefreshToken();
    const refreshTokenHash = await bcrypt.hash(refreshToken, AUTH.BCRYPT_ROUNDS);

    await this.registerRepository.createUserSession(existingUser.id, refreshTokenHash);

    return {
      user: { id: existingUser.id, email: existingUser.email },
      status: 'success',
      tokens: { accessToken, refreshToken, refreshTokenHash },
    };
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.registerRepository.revokeUserSession(userId);
    return { message: 'Logged out successfully' };
  }

  async logoutAll(userId: string): Promise<{ message: string }> {
    await this.registerRepository.revokeAllUserSessions(userId);
    return { message: 'Logged out successfully' };
  }

  private async generateAccessToken(userId: string) {
    const secret = process.env.JWT_ACCESS_SECRET;
    const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN ?? JWT.DEFAULT_ACCESS_EXPIRES_IN;
    if (!secret) throw new Error('JWT_ACCESS_SECRET is not set');
    return this.jwtService.signAsync(
      { sub: userId },
      { secret, expiresIn },
    );
  }

  private generateRefreshToken(): string {
    return randomBytes(AUTH.REFRESH_TOKEN_BYTES).toString('hex');
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, AUTH.BCRYPT_ROUNDS);
  }

  private async compareToken(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}