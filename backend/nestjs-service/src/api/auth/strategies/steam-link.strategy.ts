import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';

// passport-steam is CommonJS and uses OpenID 2.0
// eslint-disable-next-line @typescript-eslint/no-require-imports
const SteamStrategyBase = require('passport-steam');

const STEAM_ID_REGEX = /^https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/;

export type SteamLinkValidateResult = {
  steamId: string;
  identifier: string;
  /** Set from JWT when user hit /auth/steam/link while logged in. */
  linkedUserId?: string;
};

@Injectable()
export class SteamLinkStrategy extends PassportStrategy(SteamStrategyBase, 'steam-link') {
  constructor(configService: ConfigService) {
    const appUrl = configService.get<string>('APP_URL') ?? 'http://localhost:3000';
    const apiKey = configService.get<string>('STEAM_API_KEY');

    super({
      returnURL: `${appUrl.replace(/\/$/, '')}/auth/steam/link/callback`,
      realm: appUrl.endsWith('/') ? appUrl : `${appUrl}/`,
      apiKey: apiKey ?? undefined,
      profile: !!apiKey,
      passReqToCallback: true,
    });
  }

  validate(req: Request, identifier: string, _profile?: unknown): SteamLinkValidateResult {
    const match = STEAM_ID_REGEX.exec(identifier);
    const steamId = match?.[1] ?? identifier;
    const linkedUserId = (req as Request & { user?: { userId: string } }).user?.userId;
    return { steamId, identifier, linkedUserId };
  }
}
