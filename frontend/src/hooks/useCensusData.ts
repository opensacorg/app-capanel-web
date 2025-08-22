import { useQuery } from '@tanstack/react-query';
import { CensusService, type CensusDataResponse } from '../services/censusService';

export const CENSUS_QUERY_KEY = ['census', 'data'] as const;

export function useCensusData() {
  return useQuery<CensusDataResponse>({
    queryKey: CENSUS_QUERY_KEY,
    queryFn: () => CensusService.getCensusData(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}

// Hook to get just the total enrollment number with fallback
export function useTotalEnrollment() {
  const { data, isLoading, isError, error } = useCensusData();
  
  return {
    totalEnr: data?.data?.total_enr,
    isLoading,
    isError,
    error,
    hasData: data?.data?.total_enr !== undefined,
  };
}
