import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';

// passport-steam is CommonJS and uses OpenID 2.0
// eslint-disable-next-line @typescript-eslint/no-require-imports
const SteamStrategyBase = require('passport-steam');

const STEAM_ID_REGEX = /^https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/;

export type SteamProfile = {
  id?: string;
  displayName?: string;
  _json?: Record<string, unknown>;
};

export type SteamValidateResult = {
  steamId: string;
  identifier: string;
  profile?: SteamProfile;
  /** Set when user was logged in during the Steam callback (for linking). */
  linkedUserId?: string;
};

@Injectable()
export class SteamStrategy extends PassportStrategy(SteamStrategyBase, 'steam') {
  constructor(configService: ConfigService) {
    const appUrl = configService.get<string>('APP_URL') ?? 'http://localhost:3000';
    const apiKey = configService.get<string>('STEAM_API_KEY');

    super({
      returnURL: `${appUrl.replace(/\/$/, '')}/auth/steam/callback`,
      realm: appUrl.endsWith('/') ? appUrl : `${appUrl}/`,
      apiKey: apiKey ?? undefined,
      profile: !!apiKey,
      passReqToCallback: true,
    });
  }

  /**
   * Called after Steam OpenID 2.0 verification.
   * identifier: OpenID claimed_id URL (e.g. https://steamcommunity.com/openid/id/76561198000000000)
   * profile: Steam profile when STEAM_API_KEY is set, otherwise minimal/openid profile
   */
  validate(
    req: Request,
    identifier: string,
    profile: SteamProfile,
  ): SteamValidateResult {
    const match = STEAM_ID_REGEX.exec(identifier);
    const steamId = match?.[1] ?? identifier;

    const linkedUserId = (req as Request & { user?: { userId: string } }).user?.userId;

    return {
      steamId,
      identifier,
      profile: profile?.id ? profile : undefined,
      linkedUserId,
    };
  }
}
