import { create } from "zustand";

interface UserState {
  userId: string | null;
  setUserId: (id: string) => void;
  clearUserId: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  userId: null,
  setUserId: (id) => set({ userId: id }),
  clearUserId: () => set({ userId: null }),
}));
