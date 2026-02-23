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

  async findUserById(id: string) {
    return this.prisma.users.findUnique({
      where: { id },
    });
  }

  async createUserSession(userId: string, refreshTokenHash: string, deviceId: string = AUTH.DEFAULT_DEVICE_ID) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + AUTH.REFRESH_TOKEN_DAYS);

    // Upsert: one session per (user_id, device_id); replace existing session on re-login
    const session = await this.prisma.user_sessions.upsert({
      where: {
        user_id_device_id: {
          user_id: userId,
          device_id: deviceId,
        },
      },
      create: {
        user_id: userId,
        refresh_token_hash: refreshTokenHash,
        device_id: deviceId,
        expires_at: expiresAt,
      },
      update: {
        refresh_token_hash: refreshTokenHash,
        expires_at: expiresAt,
        revoked_at: null,
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

  async linkSteamToUser(userId: string, steamId: string) {
    return this.prisma.user_providers.upsert({
      where: {
        user_id_provider: { user_id: userId, provider: 'steam' },
      },
      create: {
        user_id: userId,
        provider: 'steam',
        provider_id: steamId,
      },
      update: { provider_id: steamId },
    });
  }

  async findUserBySteamId(steamId: string) {
    const link = await this.prisma.user_providers.findUnique({
      where: {
        provider_provider_id: { provider: 'steam', provider_id: steamId },
      },
      include: { users: true },
    });
    return link?.users ?? null;
  }
}
