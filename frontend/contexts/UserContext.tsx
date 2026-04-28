import React, { createContext, useContext } from 'react';
import { UserProfile } from '@/components/UserSelectScreen';

interface UserContextValue {
  activeUser: UserProfile | null;
  changeUser: () => void;
  updateUser: (updates: Partial<UserProfile>) => void;
}

export const UserContext = createContext<UserContextValue>({
  activeUser: null,
  changeUser: () => {},
  updateUser: () => {},
});

export function useUser() {
  return useContext(UserContext);
}
