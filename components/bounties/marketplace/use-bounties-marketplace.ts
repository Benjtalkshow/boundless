'use client';

import { useInfiniteQuery } from '@tanstack/react-query';

import { listBounties, bountyKeys } from '@/features/bounties';

const PAGE_SIZE = 12;

export interface MarketplaceFilters {
  /** Server-side: bounty lifecycle status (e.g. 'open'). */
  status?: string;
  /** Server-side: free-text title/description search. */
  search?: string;
}

/**
 * Infinite (page-accumulating) public bounty list for the marketplace. Wraps the
 * `listBounties` client; status + search are applied server-side, pagination via
 * `getNextPageParam` off the response total. Mode/category narrowing is done
 * client-side in the page (the public list endpoint doesn't filter on them).
 */
export function useInfiniteBounties(filters: MarketplaceFilters) {
  const query = useInfiniteQuery({
    queryKey: bountyKeys.list({ ...filters, infinite: true }),
    queryFn: ({ pageParam }) =>
      listBounties({ ...filters, page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((n, p) => n + p.bounties.length, 0);
      return loaded < lastPage.total ? allPages.length + 1 : undefined;
    },
  });

  const bounties = query.data?.pages.flatMap(p => p.bounties) ?? [];
  const totalCount = query.data?.pages[0]?.total ?? 0;

  return {
    bounties,
    totalCount,
    loading: query.isLoading,
    loadingMore: query.isFetchingNextPage,
    error: query.error ? (query.error as Error).message : null,
    hasMore: query.hasNextPage,
    loadMore: query.fetchNextPage,
  };
}
