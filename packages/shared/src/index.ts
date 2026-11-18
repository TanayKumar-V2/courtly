/**
 * @courtly/shared
 * Shared domain models, DTOs, and sample datasets for Courtly.
 */

export interface HealthDependencies {
  redis: 'connected' | 'disconnected';
}

export interface HealthResponseDto {
  status: 'ok' | 'degraded';
  service: string;
  dependencies: HealthDependencies;
  timestamp: string;
}

export type SportType =
  | 'football'
  | 'cricket'
  | 'badminton'
  | 'tennis'
  | 'basketball'
  | 'padel';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'all';

export interface SportCategory {
  id: SportType;
  name: string;
  tagline: string;
  iconName: string;
  badge: string;
  accentColor: string;
}

export interface Venue {
  id: string;
  name: string;
  sports: SportType[];
  rating: number;
  reviewCount: number;
  startingPrice: number;
  address: string;
  city: string;
  image: string;
  amenities: string[];
  openHours: string;
  isDemo: true;
}

export interface Game {
  id: string;
  sport: SportType;
  title: string;
  venueName: string;
  location: string;
  date: string;
  time: string;
  playersNeeded: number;
  totalPlayers: number;
  skillLevel: SkillLevel;
  pricePerPerson: number;
  hostName: string;
  description: string;
  isDemo: true;
}

export const DEMO_SPORTS: SportCategory[] = [
  {
    id: 'football',
    name: 'Football',
    tagline: '5v5 & 7v7 Turf Arenas',
    iconName: 'trophy',
    badge: 'Popular',
    accentColor: '#C6F36B',
  },
  {
    id: 'cricket',
    name: 'Cricket',
    tagline: 'Box Cricket & Practice Nets',
    iconName: 'target',
    badge: 'High Demand',
    accentColor: '#38BDF8',
  },
  {
    id: 'badminton',
    name: 'Badminton',
    tagline: 'Indoor Wooden & Synthetic',
    iconName: 'zap',
    badge: 'Trending',
    accentColor: '#F472B6',
  },
  {
    id: 'tennis',
    name: 'Tennis',
    tagline: 'Clay & Hard Courts',
    iconName: 'activity',
    badge: 'Premium',
    accentColor: '#FACC15',
  },
  {
    id: 'basketball',
    name: 'Basketball',
    tagline: 'Full & Half Courts',
    iconName: 'circle',
    badge: 'Fast Pace',
    accentColor: '#FB923C',
  },
  {
    id: 'padel',
    name: 'Padel',
    tagline: 'Glass Enclosed Courts',
    iconName: 'shield',
    badge: 'New',
    accentColor: '#A78BFA',
  },
];

export const DEMO_VENUES: Venue[] = [
  {
    id: 'demo-venue-1',
    name: 'Apex Arena & Turf [Sample Data]',
    sports: ['football', 'cricket'],
    rating: 4.8,
    reviewCount: 142,
    startingPrice: 1200,
    address: 'Indiranagar 100ft Road',
    city: 'Bengaluru',
    image:
      'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=1000&q=80',
    amenities: ['Floodlights', 'Locker Room', 'Parking', 'Mineral Water'],
    openHours: '06:00 AM - 12:00 AM',
    isDemo: true,
  },
  {
    id: 'demo-venue-2',
    name: 'SmashZone Badminton Hub [Sample Data]',
    sports: ['badminton'],
    rating: 4.9,
    reviewCount: 98,
    startingPrice: 500,
    address: 'Koramangala 4th Block',
    city: 'Bengaluru',
    image:
      'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1000&q=80',
    amenities: ['BWF Synthetic Mats', 'Pro Shop', 'Air Conditioned', 'Cafeteria'],
    openHours: '05:00 AM - 11:00 PM',
    isDemo: true,
  },
  {
    id: 'demo-venue-3',
    name: 'CourtCraft Tennis & Padel [Sample Data]',
    sports: ['tennis', 'padel'],
    rating: 4.7,
    reviewCount: 76,
    startingPrice: 900,
    address: 'HSR Layout Sector 2',
    city: 'Bengaluru',
    image:
      'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1000&q=80',
    amenities: ['LED Lights', 'Equipment Rental', 'Shower', 'Coaching'],
    openHours: '06:00 AM - 10:00 PM',
    isDemo: true,
  },
  {
    id: 'demo-venue-4',
    name: 'HoopNation Basketball Club [Sample Data]',
    sports: ['basketball'],
    rating: 4.6,
    reviewCount: 64,
    startingPrice: 800,
    address: 'Whitefield Main Road',
    city: 'Bengaluru',
    image:
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1000&q=80',
    amenities: ['Hardwood Floor', 'Scoreboard', 'Seating Stands', 'Filtered Water'],
    openHours: '06:00 AM - 11:00 PM',
    isDemo: true,
  },
];

export const DEMO_GAMES: Game[] = [
  {
    id: 'demo-game-1',
    sport: 'football',
    title: 'Friday Night 7v7 Fast Pace [Demo Game]',
    venueName: 'Apex Arena & Turf [Sample Data]',
    location: 'Indiranagar, Bengaluru',
    date: 'Today',
    time: '08:30 PM - 09:30 PM',
    playersNeeded: 3,
    totalPlayers: 14,
    skillLevel: 'intermediate',
    pricePerPerson: 180,
    hostName: 'Arjun K.',
    description:
      'Friendly competitive 7v7 turf football. Bibs and match ball provided. Need 3 more outfield players.',
    isDemo: true,
  },
  {
    id: 'demo-game-2',
    sport: 'badminton',
    title: 'Weekend Doubles Sparring [Demo Game]',
    venueName: 'SmashZone Badminton Hub [Sample Data]',
    location: 'Koramangala, Bengaluru',
    date: 'Tomorrow',
    time: '07:00 AM - 08:30 AM',
    playersNeeded: 1,
    totalPlayers: 4,
    skillLevel: 'advanced',
    pricePerPerson: 220,
    hostName: 'Neha R.',
    description:
      'Advanced intermediate/advanced doubles. Feather shuttles provided. Looking for 1 experienced player.',
    isDemo: true,
  },
  {
    id: 'demo-game-3',
    sport: 'cricket',
    title: 'Box Cricket Turbo League [Demo Game]',
    venueName: 'Turf Kings Cricket Nets [Sample Data]',
    location: 'HSR Layout, Bengaluru',
    date: 'Saturday',
    time: '06:00 PM - 08:00 PM',
    playersNeeded: 4,
    totalPlayers: 12,
    skillLevel: 'all',
    pricePerPerson: 150,
    hostName: 'Rohan M.',
    description:
      'Fun box cricket match with tennis ball. All skill levels welcome. Refreshments included.',
    isDemo: true,
  },
  {
    id: 'demo-game-4',
    sport: 'padel',
    title: 'Intro Padel 2v2 Social [Demo Game]',
    venueName: 'CourtCraft Tennis & Padel [Sample Data]',
    location: 'HSR Layout, Bengaluru',
    date: 'Sunday',
    time: '05:00 PM - 06:00 PM',
    playersNeeded: 2,
    totalPlayers: 4,
    skillLevel: 'beginner',
    pricePerPerson: 300,
    hostName: 'Vikram S.',
    description:
      'New to padel? Join us for an easygoing match and learn the basics on glass court.',
    isDemo: true,
  },
];
