import { useMemo } from 'react';
import { DEMO_GAMES } from '../constants';
import { Game, SkillLevel, SportType } from '../types';

export function useGames(
  selectedSport?: SportType | null,
  selectedSkill?: SkillLevel | null,
  searchQuery?: string,
) {
  const games = useMemo(() => {
    let result: Game[] = DEMO_GAMES;

    if (selectedSport) {
      result = result.filter((g) => g.sport === selectedSport);
    }

    if (selectedSkill && selectedSkill !== 'all') {
      result = result.filter((g) => g.skillLevel === selectedSkill || g.skillLevel === 'all');
    }

    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.location.toLowerCase().includes(q) ||
          g.venueName.toLowerCase().includes(q) ||
          g.sport.toLowerCase().includes(q),
      );
    }

    return result;
  }, [selectedSport, selectedSkill, searchQuery]);

  const getGameById = (id: string): Game | undefined => {
    return DEMO_GAMES.find((g) => g.id === id);
  };

  return {
    games,
    getGameById,
    totalCount: games.length,
  };
}
