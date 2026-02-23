import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './api/db/prisma/prisma.module';
import { AuthModule } from './api/auth/auth.module';
import { AuthController } from './api/auth/auth.controller';
import { AuthService } from './api/auth/auth.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AppModule {}
