import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';


export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

interface UserSelectScreenProps {
  onUserSelected: (user: UserProfile) => void;
}

const DEFAULT_USERS: UserProfile[] = [
  { id: '1', name: 'Player 1', avatar: 'https://i.pravatar.cc/200?img=11', color: '#FF3B30' },
  { id: '2', name: 'Player 2', avatar: 'https://i.pravatar.cc/200?img=47', color: '#00D4FF' },
];

export default function UserSelectScreen({ onUserSelected }: UserSelectScreenProps) {
  const [users] = useState<UserProfile[]>(DEFAULT_USERS);
  const [hoveredId, setHoveredId] = useState<string | null>(users[0].id);
  const [homeBg, setHomeBg] = useState<string | null>(null);
  const [time, setTime] = useState('');

  // Background pulse animation for fallback
  const bgPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgPulse, { toValue: 1, duration: 4000, useNativeDriver: false }),
        Animated.timing(bgPulse, { toValue: 0, duration: 4000, useNativeDriver: false }),
      ])
    ).start();

    // Fetch background
    if (Platform.OS === 'web') {
      const savedBg = localStorage.getItem('home_background');
      if (savedBg) setHomeBg(savedBg);
    }

    // Clock
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      setTime(`${hours}:${minutes} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    // Keyboard Navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      const totalItems = users.length + 1; // +1 for Add User
      const allIds = ['add', ...users.map(u => u.id)];
      const currentIndex = allIds.indexOf(hoveredId || 'add');

      if (e.key === 'ArrowRight') {
        const nextIndex = (currentIndex + 1) % totalItems;
        setHoveredId(allIds[nextIndex]);
      } else if (e.key === 'ArrowLeft') {
        const nextIndex = (currentIndex - 1 + totalItems) % totalItems;
        setHoveredId(allIds[nextIndex]);
      } else if (e.key === 'Enter') {
        if (hoveredId === 'add') {
          // Add user logic
        } else {
          const user = users.find(u => u.id === hoveredId);
          if (user) handleSelect(user);
        }
      }
    };

    if (Platform.OS === 'web') {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      clearInterval(interval);
      if (Platform.OS === 'web') {
        window.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [hoveredId, users]);

  const handleSelect = (user: UserProfile) => {
    onUserSelected(user);
  };

  const bgInterpolate = bgPulse.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,212,255,0.03)', 'rgba(0,212,255,0.08)'],
  });

  return (
    <View style={styles.container}>
      {/* BACKGROUND LAYER */}
      {homeBg ? (
        <Image 
          source={{ uri: homeBg }} 
          style={styles.blurredBg} 
          blurRadius={40}
        />
      ) : (
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: bgInterpolate }]} />
      )}
      
      {/* DARK OVERLAY */}
      <View style={styles.overlay} />

      {/* TOP RIGHT CLOCK */}
      <View style={styles.topRight}>
        <Text style={styles.timeText}>{time}</Text>
      </View>

      {/* CENTERED TITLES */}
      <View style={styles.titleArea}>
        <Text style={styles.title}>Welcome Back to WConsole</Text>
        <Text style={styles.subtitle}>Who's playing today?</Text>
      </View>

      {/* USER LIST */}
      <View style={styles.cardsRow}>
        {/* ADD USER BUTTON */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.cardWrapper}
          onPress={() => {}}
          {...(Platform.OS === 'web' ? {
            onMouseEnter: () => setHoveredId('add'),
            onMouseLeave: () => setHoveredId(null)
          } : {})}
        >
          <View style={[styles.card, hoveredId === 'add' && styles.cardFocused]}>
            <View style={styles.addIconCircle}>
              <Ionicons name="add" size={40} color="#FFF" />
            </View>
          </View>
          <Text style={styles.userName}>Add User</Text>
        </TouchableOpacity>

        {users.map((user, index) => {
          const isFocused = hoveredId === user.id;
          return (
            <TouchableOpacity
              key={user.id}
              activeOpacity={0.8}
              style={styles.cardWrapper}
              onPress={() => handleSelect(user)}
              {...(Platform.OS === 'web' ? {
                onMouseEnter: () => setHoveredId(user.id),
                onMouseLeave: () => setHoveredId(null)
              } : {})}
            >
              {isFocused && (
                <View style={styles.focusIndicator}>
                  <Ionicons name="game-controller" size={18} color="#FFF" />
                </View>
              )}
              <View style={[
                styles.card, 
                isFocused && styles.cardFocused,
                isFocused && { borderColor: '#FFF', borderWidth: 3 }
              ]}>
                <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
              </View>
              <Text style={[styles.userName, isFocused && styles.userNameFocused]}>{user.name}</Text>
              {isFocused && (
                <View style={styles.optionsHint}>
                  <MaterialCommunityIcons name="menu" size={16} color="#FFF" />
                  <Text style={styles.optionsText}>Options</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* BOTTOM POWER BUTTON */}
      <TouchableOpacity style={styles.powerButton} activeOpacity={0.7}>
        <Ionicons name="power" size={24} color="#FFF" />
      </TouchableOpacity>

      {/* BOTTOM RIGHT HINT */}
      <View style={styles.bottomRightHint}>
        <View style={styles.hintIcon}>
          <Ionicons name="close" size={16} color="#000" />
        </View>
        <Text style={styles.hintText}>Select</Text>
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blurredBg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  topRight: {
    position: 'absolute',
    top: 40,
    right: 60,
  },
  timeText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '300',
    letterSpacing: 1,
  },
  titleArea: {
    alignItems: 'center',
    marginBottom: 80,
    marginTop: -40,
  },
  title: {
    color: '#FFF',
    fontSize: 48,
    fontWeight: '300',
    letterSpacing: 2,
    marginBottom: 10,
  },
  subtitle: {
    color: '#AAA',
    fontSize: 18,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  cardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
  },
  cardWrapper: {
    alignItems: 'center',
    width: 150,
    height: 250, // Fixed height to prevent layout shifts
    justifyContent: 'center',
  },
  card: {
    width: 130,
    height: 130,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardFocused: {
    width: 150,
    height: 150,
    backgroundColor: '#FFF',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  addIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    color: '#AAA',
    fontSize: 18,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 15,
  },
  userNameFocused: {
    color: '#FFF',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  focusIndicator: {
    position: 'absolute',
    top: 15,
  },
  optionsHint: {
    position: 'absolute',
    bottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  optionsText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  powerButton: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomRightHint: {
    position: 'absolute',
    bottom: 40,
    right: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hintIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
});
