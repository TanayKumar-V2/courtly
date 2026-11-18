import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ownerApplicationService,
  SubmitOwnerApplicationPayload,
} from '../services/owner-application-service';

export const OWNER_APPLICATION_QUERY_KEY = ['owner-application', 'me'];

export function useMyOwnerApplication(enabled = true) {
  return useQuery({
    queryKey: OWNER_APPLICATION_QUERY_KEY,
    queryFn: () => ownerApplicationService.getMyStatus(),
    enabled,
    staleTime: 30_000,
  });
}

export function useSubmitOwnerApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitOwnerApplicationPayload) =>
      ownerApplicationService.submit(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OWNER_APPLICATION_QUERY_KEY });
    },
  });
}
