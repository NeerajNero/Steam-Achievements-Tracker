import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import {
  AuthSuccessResponseDto,
  LogoutResponseDto,
  RegisterAndLoginDto,
} from './dto/auth.dto';
import { COOKIE, FRONTEND } from './constants/auth.constants';
import { Public } from './decorators/public.decorator';
import type { SteamValidateResult } from './strategies/steam.strategy';

function cookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: COOKIE.SAME_SITE,
  };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register', description: 'Register a new user with email and password. Sets HTTP-only cookies for access and refresh tokens.' })
  @ApiBody({ type: RegisterAndLoginDto })
  @ApiResponse({ status: 201, description: 'User created', type: AuthSuccessResponseDto })
  @ApiResponse({ status: 409, description: 'User with this email already exists' })
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

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login', description: 'Log in with email and password. Sets HTTP-only cookies for access and refresh tokens.' })
  @ApiBody({ type: RegisterAndLoginDto })
  @ApiResponse({ status: 200, description: 'Login successful', type: AuthSuccessResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
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
  @ApiOperation({ summary: 'Logout', description: 'Log out (requires valid access token in cookie). Clears auth cookies and revokes session.' })
  @ApiResponse({ status: 200, description: 'Logged out', type: LogoutResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@Req() req: Request, @Res({ passthrough: false }) res: Response) {
    const user = (req as Request & { user?: { userId: string } }).user;
    if (user?.userId) {
      await this.authService.logout(user.userId);
    }
    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');
    res.json({ message: 'Logged out successfully' });
  }

  @Public()
  @Get('steam')
  @UseGuards(AuthGuard('steam'))
  @ApiOperation({ summary: 'Steam login/link', description: 'Redirects to Steam OpenID 2.0. If logged in, used for linking; otherwise for login.' })
  async steamAuth() {
    // Passport redirects to Steam; no body
  }

  @Public()
  @Get('steam/callback')
  @UseGuards(AuthGuard('steam'))
  @ApiOperation({ summary: 'Steam callback', description: 'Steam redirects here after auth. Creates session, sets cookies, redirects to dashboard.' })
  async steamCallback(@Req() req: Request, @Res({ passthrough: false }) res: Response) {
    const steamUser = (req as Request & { user?: SteamValidateResult }).user;
    if (!steamUser) {
      const base = process.env.FRONTEND_URL ?? 'http://localhost:3000';
      res.redirect(`${base}/login?steam=error`);
      return;
    }
    const result = await this.authService.handleSteamCallback(
      steamUser.steamId,
      steamUser.linkedUserId,
    );
    const base = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const dashboardPath = process.env.DASHBOARD_PATH ?? FRONTEND.DEFAULT_DASHBOARD_PATH;
    const dashboardUrl = `${base.replace(/\/$/, '')}${dashboardPath.startsWith('/') ? dashboardPath : `/${dashboardPath}`}`;

    if (!result) {
      res.redirect(`${base}/login?steam=no_account`);
      return;
    }

    const secure = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', result.tokens.refreshToken, {
      ...cookieOptions(secure),
      maxAge: COOKIE.REFRESH_MAX_AGE_MS,
    });
    res.cookie('accessToken', result.tokens.accessToken, {
      ...cookieOptions(secure),
      maxAge: COOKIE.ACCESS_MAX_AGE_MS,
    });
    res.redirect(dashboardUrl);
  }
}
