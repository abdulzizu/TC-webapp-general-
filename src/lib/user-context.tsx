"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type SizeProfile = {
  tshirtSize: string;
  chestInches: string;
  sleeveInches: string;
  pantsWaist: string;
  pantsLength: string;
  hipInches: string;
  capInches: string;
};

export type UserProfile = {
  name: string;
  phone: string;
  deliveryAddress: string;
  sizes: SizeProfile;
};

type UserContextType = {
  user: UserProfile | null;
  saveUser: (profile: UserProfile) => void;
  signOut: () => void;
  isSignedIn: boolean;
};

const UserContext = createContext<UserContextType | null>(null);
const STORAGE_KEY = "tc_user";

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch {}
  }, []);

  function saveUser(profile: UserProfile) {
    setUser(profile);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {}
  }

  function signOut() {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }

  return (
    <UserContext.Provider value={{ user, saveUser, signOut, isSignedIn: !!user }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside UserProvider");
  return ctx;
}
