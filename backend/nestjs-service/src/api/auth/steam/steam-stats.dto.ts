import { ApiProperty } from '@nestjs/swagger';

export class SteamOwnedGameDto {
  @ApiProperty({ example: 730, description: 'Steam app ID' })
  appid: number;

  @ApiProperty({ example: 'Counter-Strike 2', required: false })
  name?: string;

  @ApiProperty({ example: 120, description: 'Minutes played in last 2 weeks', required: false })
  playtime_2weeks?: number;

  @ApiProperty({ example: 1440, description: 'Total minutes played' })
  playtime_forever: number;

  @ApiProperty({ required: false })
  img_icon_url?: string;

  @ApiProperty({ required: false })
  img_logo_url?: string;

  @ApiProperty({ required: false })
  has_community_visible_stats?: boolean;
}

export class SteamPlayerSummaryDto {
  @ApiProperty()
  steamid: string;

  @ApiProperty({ required: false })
  personaname?: string;

  @ApiProperty({ required: false })
  profileurl?: string;

  @ApiProperty({ required: false })
  avatar?: string;

  @ApiProperty({ required: false })
  avatarmedium?: string;

  @ApiProperty({ required: false })
  avatarfull?: string;
}

export class SteamStatsResponseDto {
  @ApiProperty({ type: SteamPlayerSummaryDto, nullable: true })
  profile: SteamPlayerSummaryDto | null;

  @ApiProperty({ type: [SteamOwnedGameDto] })
  ownedGames: SteamOwnedGameDto[];

  @ApiProperty({ example: 42 })
  gameCount: number;
}
