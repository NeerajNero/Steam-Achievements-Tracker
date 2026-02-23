import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RegisterRepository } from '../db/prisma/register/register.repository';
import { JwtStrategy } from './strategies/jwt.strategy';
import { SteamStrategy } from './strategies/steam.strategy';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: (configService.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m') as JwtModuleOptions['signOptions'] extends { expiresIn?: infer E } ? E : never,
        },
      }),
    }),
  ],
  providers: [AuthService, RegisterRepository, JwtStrategy, SteamStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}