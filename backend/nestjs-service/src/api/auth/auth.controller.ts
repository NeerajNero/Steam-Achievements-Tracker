import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterAndLoginDto } from './dto/auth.dto';
import { COOKIE } from './constants/auth.constants';

function cookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: COOKIE.SAME_SITE,
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterAndLoginDto, @Res({ passthrough: false }) res: Response) {
    const result = await this.authService.register(dto);
    const secure = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', result.tokens.refreshToken, {
      ...cookieOptions(secure),
      maxAge: COOKIE.REFRESH_MAX_AGE_MS,
    });
    res.cookie('accessToken', result.tokens.accessToken, {
      ...cookieOptions(secure),
      maxAge: COOKIE.ACCESS_MAX_AGE_MS,
    });
    res.status(201).json({ user: result.user, status: result.status });
  }

  @Post('login')
  async login(@Body() dto: RegisterAndLoginDto, @Res({ passthrough: false }) res: Response) {
    const result = await this.authService.login(dto);
    const secure = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', result.tokens.refreshToken, {
      ...cookieOptions(secure),
      maxAge: COOKIE.REFRESH_MAX_AGE_MS,
    });
    res.cookie('accessToken', result.tokens.accessToken, {
      ...cookieOptions(secure),
      maxAge: COOKIE.ACCESS_MAX_AGE_MS,
    });
    res.json({ user: result.user, status: result.status });
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: false }) res: Response) {
    // TODO: get userId from JWT in cookie or auth guard
    const userId = (req as Request & { userId?: string }).userId;
    if (userId) {
      await this.authService.logout(userId);
    }
    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');
    res.json({ message: 'Logged out successfully' });
  }
}
