import { useMemo } from 'react';
import { DEMO_VENUES } from '../constants';
import { SportType, Venue } from '../types';

export function useVenues(selectedSport?: SportType | null, searchQuery?: string) {
  const venues = useMemo(() => {
    let result: Venue[] = DEMO_VENUES;

    if (selectedSport) {
      result = result.filter((v) => v.sports.includes(selectedSport));
    }

    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.city.toLowerCase().includes(q) ||
          v.address.toLowerCase().includes(q) ||
          v.sports.some((s) => s.toLowerCase().includes(q)),
      );
    }

    return result;
  }, [selectedSport, searchQuery]);

  const getVenueById = (id: string): Venue | undefined => {
    return DEMO_VENUES.find((v) => v.id === id);
  };

  return {
    venues,
    getVenueById,
    totalCount: venues.length,
  };
}
