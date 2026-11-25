import type { QueryClient } from "@tanstack/react-query";

/** Reloads every ride and booking list or detail currently on screen. */
export function refreshRideLists(queryClient: QueryClient): void {
  for (const key of ["ride", "booking", "driver-rides"]) {
    queryClient.invalidateQueries({ queryKey: [key] });
  }
}
