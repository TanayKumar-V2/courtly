import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { searchVenues } from '../services/discovery-service';
import { DiscoveryFilters, DiscoveryVenueItem } from '../types/discovery.types';

export function useVenueSearch(filters: DiscoveryFilters, pageSize = 20) {
  const query = useInfiniteQuery({
    queryKey: ['discovery', 'venues', filters, pageSize],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      searchVenues({
        ...filters,
        page: pageParam,
        pageSize,
        signal,
      }),
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.page < lastPage.meta.totalPages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    staleTime: 30_000,
  });

  // Deduplicate venues across pages cleanly by ID
  const venues = useMemo<DiscoveryVenueItem[]>(() => {
    if (!query.data?.pages) return [];
    const seen = new Set<string>();
    const list: DiscoveryVenueItem[] = [];
    for (const page of query.data.pages) {
      for (const item of page.data) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          list.push(item);
        }
      }
    }
    return list;
  }, [query.data]);

  const total = query.data?.pages?.[0]?.meta?.total ?? 0;

  return {
    ...query,
    venues,
    total,
  };
}
