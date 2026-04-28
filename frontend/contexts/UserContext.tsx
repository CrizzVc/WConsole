import React, { createContext, useContext } from 'react';
import { UserProfile } from '@/components/UserSelectScreen';

interface UserContextValue {
  activeUser: UserProfile | null;
  changeUser: () => void;
}

export const UserContext = createContext<UserContextValue>({
  activeUser: null,
  changeUser: () => {},
});

export function useUser() {
  return useContext(UserContext);
}
