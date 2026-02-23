import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import {
  AuthResponseDto,
  AuthSuccessResponseDto,
  LogoutResponseDto,
  RegisterAndLoginDto,
} from './dto/auth.dto';
import { COOKIE, FRONTEND } from './constants/auth.constants';
import { Public } from './decorators/public.decorator';
import type { SteamValidateResult } from './strategies/steam.strategy';
import type { SteamLinkValidateResult } from './strategies/steam-link.strategy';
import { SteamStatsResponseDto } from './steam/steam-stats.dto';

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
  @ApiOperation({ summary: 'Steam login', description: 'Redirects to Steam OpenID 2.0 for login (no account linking). Open in browser.' })
  async steamAuth() {
    // Passport redirects to Steam; no body
  }

  @Get('steam/link')
  @UseGuards(AuthGuard('steam-link'))
  @ApiOperation({ summary: 'Link Steam (requires auth)', description: 'Redirects to Steam to link Steam account to the current user. Requires valid access token. Open in browser.' })
  async steamLink() {
    // Passport redirects to Steam; no body
  }

  @Get('steam/stats')
  @ApiOperation({ summary: 'Steam stats', description: 'Returns Steam profile and owned games with playtime for the linked Steam account. Requires auth and STEAM_API_KEY.' })
  @ApiResponse({ status: 200, description: 'Steam stats', type: SteamStatsResponseDto })
  @ApiResponse({ status: 400, description: 'Steam account not linked' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSteamStats(@Req() req: Request) {
    const user = (req as Request & { user?: { userId: string } }).user;
    return this.authService.getSteamStats(user!.userId);
  }

  @Public()
  @Get('steam/callback')
  @UseGuards(AuthGuard('steam'))
  @ApiOperation({ summary: 'Steam callback', description: 'Steam redirects here after login. Creates session, sets cookies, redirects to dashboard.' })
  async steamCallback(@Req() req: Request, @Res({ passthrough: false }) res: Response) {
    const steamUser = (req as Request & { user?: SteamValidateResult }).user;
    if (!steamUser) {
      const base = process.env.FRONTEND_URL ?? 'http://localhost:3000';
      res.redirect(`${base}/?steam=error`);
      return;
    }
    const result = await this.authService.handleSteamCallback(
      steamUser.steamId,
      steamUser.linkedUserId,
    );
    this.setSteamResultCookiesAndRedirect(res, result, false);
  }

  @Get('steam/link/callback')
  @UseGuards(AuthGuard('steam-link'))
  @ApiOperation({ summary: 'Steam link callback', description: 'Steam redirects here after linking. Requires auth; links Steam to current user, sets cookies, redirects to dashboard.' })
  async steamLinkCallback(@Req() req: Request, @Res({ passthrough: false }) res: Response) {
    const steamLinkUser = (req as Request & { user?: SteamLinkValidateResult }).user;
    if (!steamLinkUser?.linkedUserId) {
      const base = process.env.FRONTEND_URL ?? 'http://localhost:3000';
      res.redirect(`${base}/?steam=error`);
      return;
    }
    const result = await this.authService.handleSteamCallback(
      steamLinkUser.steamId,
      steamLinkUser.linkedUserId,
    );
    this.setSteamResultCookiesAndRedirect(res, result, true);
  }

  private setSteamResultCookiesAndRedirect(
    res: Response,
    result: AuthResponseDto | null,
    _isLink: boolean,
  ) {
    const base = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const dashboardPath = process.env.DASHBOARD_PATH ?? FRONTEND.DEFAULT_DASHBOARD_PATH;
    const dashboardUrl = `${base.replace(/\/$/, '')}${dashboardPath.startsWith('/') ? dashboardPath : `/${dashboardPath}`}`;
    if (!result) {
      res.redirect(`${base}/?steam=no_account`);
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
