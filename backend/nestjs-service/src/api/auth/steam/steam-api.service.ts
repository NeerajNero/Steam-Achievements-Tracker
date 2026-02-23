import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const STEAM_API_BASE = 'https://api.steampowered.com';

export interface SteamOwnedGame {
  appid: number;
  name?: string;
  playtime_2weeks?: number;
  playtime_forever: number;
  img_icon_url?: string;
  img_logo_url?: string;
  has_community_visible_stats?: boolean;
}

export interface SteamPlayerSummary {
  steamid: string;
  communityvisibilitystate?: number;
  profilestate?: number;
  personaname?: string;
  profileurl?: string;
  avatar?: string;
  avatarmedium?: string;
  avatarfull?: string;
  personastate?: number;
  lastlogoff?: number;
}

export interface SteamStatsDto {
  profile: SteamPlayerSummary | null;
  ownedGames: SteamOwnedGame[];
  gameCount: number;
}

interface GetOwnedGamesResponse {
  response?: {
    game_count?: number;
    games?: SteamOwnedGame[];
  };
}

interface GetPlayerSummariesResponse {
  response?: {
    players?: SteamPlayerSummary[];
  };
}

@Injectable()
export class SteamApiService {
  constructor(private readonly configService: ConfigService) {}

  private getApiKey(): string | null {
    return this.configService.get<string>('STEAM_API_KEY') ?? null;
  }

  async getStats(steamId: string): Promise<SteamStatsDto> {
    const key = this.getApiKey();
    if (!key) {
      throw new Error('STEAM_API_KEY is not configured');
    }

    const [profile, ownedGames] = await Promise.all([
      this.getPlayerSummaries(key, steamId),
      this.getOwnedGames(key, steamId),
    ]);

    return {
      profile: profile ?? null,
      ownedGames: ownedGames ?? [],
      gameCount: ownedGames?.length ?? 0,
    };
  }

  private async getPlayerSummaries(
    key: string,
    steamId: string,
  ): Promise<SteamPlayerSummary | null> {
    const url = new URL(`${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/`);
    url.searchParams.set('key', key);
    url.searchParams.set('steamids', steamId);

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`Steam API error: ${res.status} ${res.statusText}`);
    }
    const data = (await res.json()) as GetPlayerSummariesResponse;
    const players = data.response?.players;
    return players?.[0] ?? null;
  }

  private async getOwnedGames(
    key: string,
    steamId: string,
  ): Promise<SteamOwnedGame[]> {
    const url = new URL(`${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/`);
    url.searchParams.set('key', key);
    url.searchParams.set('steamid', steamId);
    url.searchParams.set('include_appinfo', '1');
    url.searchParams.set('include_played_free_games', '1');

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`Steam API error: ${res.status} ${res.statusText}`);
    }
    const data = (await res.json()) as GetOwnedGamesResponse;
    return data.response?.games ?? [];
  }
}
