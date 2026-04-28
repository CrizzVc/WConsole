import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useState } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import UserSelectScreen, { UserProfile } from '@/components/UserSelectScreen';
import { UserContext } from '@/contexts/UserContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [activeUser, setActiveUser] = useState<UserProfile | null>(null);

  if (!activeUser) {
    return (
      <>
        <UserSelectScreen onUserSelected={(user) => setActiveUser(user)} />
        <StatusBar style="light" />
      </>
    );
  }

  const updateUser = (updates: Partial<UserProfile>) => {
    if (activeUser) {
      const newUser = { ...activeUser, ...updates };
      setActiveUser(newUser);

      // Persistir en el listado global de usuarios
      const savedUsers = localStorage.getItem('console_users');
      if (savedUsers) {
        const usersList: UserProfile[] = JSON.parse(savedUsers);
        const updatedList = usersList.map(u => u.id === newUser.id ? newUser : u);
        localStorage.setItem('console_users', JSON.stringify(updatedList));
      }
    }
  };

  return (
    <UserContext.Provider value={{ activeUser, changeUser: () => setActiveUser(null), updateUser }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </UserContext.Provider>
  );
}
