export type Role = 'PLAYER' | 'VENUE_OWNER' | 'ADMIN';

export type Sport =
  | 'FOOTBALL'
  | 'CRICKET'
  | 'BADMINTON'
  | 'TENNIS'
  | 'BASKETBALL'
  | 'PADEL'
  | 'OTHER';

export type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface SportSkill {
  sport: Sport;
  skillLevel: SkillLevel;
}

export interface PlayerProfile {
  id?: string;
  bio?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  preferredSports: Sport[];
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  emailVerified: boolean;
  emailVerifiedAt?: string | null;
  status: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  roles: string[];
  profile?: PlayerProfile | null;
  sportSkills: SportSkill[];
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface RegisterResponse {
  message: string;
  user: User;
}
