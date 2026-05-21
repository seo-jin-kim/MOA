import { create } from "zustand";
import "../types/auth.tsx";
import type {User} from "../types/auth.tsx";

// zustand 스토어 안에 뭐가 들어있는지 미리 정의해두는 것
export interface AuthState {
    user: User | null;
    activeMenu: number;
    setActiveMenu: (menu: number) => void;
    login: (userData: User) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    activeMenu: 1,
    setActiveMenu: (menu) => set({ activeMenu: menu }),
    login: (userData) => set({ user: userData }),
    logout: () => set({ user: null })
}));
