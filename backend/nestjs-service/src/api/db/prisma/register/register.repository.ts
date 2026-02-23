import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateUserDto } from '../../../auth/dto/auth.dto';
import { AUTH } from '../../../auth/constants/auth.constants';

@Injectable()
export class RegisterRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(dto: CreateUserDto) {
    const user = await this.prisma.users.create({
      data: {
        email: dto.email,
        password_hash: dto.password_hash,
        provider: dto.provider,
        provider_id: dto.provider_id,
      },
    });
    return user;
  }

  async findUserByEmail(email: string) {
    const user = await this.prisma.users.findUnique({
      where: { email },
    });
    return user;
  }

  async createUserSession(userId: string, refreshTokenHash: string, deviceId: string = AUTH.DEFAULT_DEVICE_ID) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + AUTH.REFRESH_TOKEN_DAYS);

    const session = await this.prisma.user_sessions.create({
      data: {
        user_id: userId,
        refresh_token_hash: refreshTokenHash,
        device_id: deviceId,
        expires_at: expiresAt,
      },
    });
    return session;
  }

  async revokeUserSession(userId: string) {
    const result = await this.prisma.user_sessions.updateMany({
      where: { user_id: userId },
      data: { revoked_at: new Date() },
    });
    return result;
  }

  async revokeAllUserSessions(userId: string) {
    const result = await this.prisma.user_sessions.updateMany({
      where: { user_id: userId },
      data: { revoked_at: new Date() },
    });
    return result;
  }
}
