export type {
  HealthDependencies,
  HealthResponseDto,
  SportType,
  SkillLevel,
  SportCategory,
  Venue,
  Game,
} from '@courtly/shared';

export type ApiConnectionStatus = 'checking' | 'connected' | 'unavailable';

export interface FilterState {
  sport: string | null;
  skillLevel: string | null;
  searchQuery: string;
}
