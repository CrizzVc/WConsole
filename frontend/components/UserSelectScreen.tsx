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
import { Ionicons } from '@expo/vector-icons';


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
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Animated values for each card
  const scaleAnims = useRef(users.map(() => new Animated.Value(1))).current;
  const glowAnims = useRef(users.map(() => new Animated.Value(0))).current;

  // Background pulse animation
  const bgPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgPulse, { toValue: 1, duration: 4000, useNativeDriver: false }),
        Animated.timing(bgPulse, { toValue: 0, duration: 4000, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const handleHoverIn = (index: number) => {
    setHoveredId(users[index].id);
    Animated.parallel([
      Animated.spring(scaleAnims[index], { toValue: 1.08, useNativeDriver: true, speed: 20 }),
      Animated.timing(glowAnims[index], { toValue: 1, duration: 200, useNativeDriver: false }),
    ]).start();
  };

  const handleHoverOut = (index: number) => {
    setHoveredId(null);
    Animated.parallel([
      Animated.spring(scaleAnims[index], { toValue: 1, useNativeDriver: true, speed: 20 }),
      Animated.timing(glowAnims[index], { toValue: 0, duration: 200, useNativeDriver: false }),
    ]).start();
  };

  const handleSelect = (user: UserProfile) => {
    onUserSelected(user);
  };

  const bgInterpolate = bgPulse.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,212,255,0.03)', 'rgba(0,212,255,0.08)'],
  });

  return (
    <View style={styles.container}>
      {/* Animated background gradient layer */}
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: bgInterpolate }]} />

      {/* Background decorative circles */}
      <View style={[styles.bgCircle, styles.bgCircle1]} />
      <View style={[styles.bgCircle, styles.bgCircle2]} />
      <View style={[styles.bgCircle, styles.bgCircle3]} />

      {/* Top logo area */}
      <View style={styles.logoArea}>
        <Ionicons name="game-controller" size={32} color="#00D4FF" />
        <Text style={styles.logoText}>W<Text style={styles.logoBold}>Console</Text></Text>
      </View>

      {/* Title */}
      <View style={styles.titleArea}>
        <Text style={styles.title}>¿Quién está jugando?</Text>
        <Text style={styles.subtitle}>Selecciona tu perfil para continuar</Text>
      </View>

      {/* User Cards Row */}
      <View style={styles.cardsRow}>
        {users.map((user, index) => {
          const glowColor = glowAnims[index].interpolate({
            inputRange: [0, 1],
            outputRange: ['rgba(0,0,0,0)', user.color + '66'],
          });
          const borderColor = glowAnims[index].interpolate({
            inputRange: [0, 1],
            outputRange: ['rgba(255,255,255,0.1)', user.color],
          });

          return (
            <Animated.View
              key={user.id}
              style={[
                styles.cardWrapper,
                { transform: [{ scale: scaleAnims[index] }] },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleSelect(user)}
                onPressIn={() => handleHoverIn(index)}
                onPressOut={() => handleHoverOut(index)}
                // Web hover support
                {...(Platform.OS === 'web'
                  ? {
                      onMouseEnter: () => handleHoverIn(index),
                      onMouseLeave: () => handleHoverOut(index),
                    }
                  : {})}
              >
                {/* Glow shadow layer */}
                <Animated.View
                  style={[styles.cardGlow, { backgroundColor: glowColor, shadowColor: user.color }]}
                />

                {/* Card glass panel */}
                <Animated.View style={[styles.card, { borderColor }]}>
                  {/* Avatar */}
                  <View style={[styles.avatarRing, { borderColor: user.color }]}>
                    <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
                  </View>

                  {/* Name */}
                  <Text style={styles.userName}>{user.name}</Text>

                  {/* Color accent dot */}
                  <View style={[styles.colorDot, { backgroundColor: user.color }]} />
                </Animated.View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        {/* Add User Card */}
        <Animated.View style={styles.cardWrapper}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.addCard}
            {...(Platform.OS === 'web'
              ? {
                  onMouseEnter: () => {},
                  onMouseLeave: () => {},
                }
              : {})}
          >
            <View style={styles.addIconCircle}>
              <Ionicons name="add" size={36} color="#00D4FF" />
            </View>
            <Text style={styles.addUserText}>Añadir Usuario</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Bottom hint */}
      <View style={styles.hintRow}>
        <View style={styles.hintKey}><Text style={styles.hintKeyText}>A</Text></View>
        <Text style={styles.hintText}>Seleccionar</Text>
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E14',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  // Background decorative circles
  bgCircle: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.06,
  },
  bgCircle1: {
    width: 600,
    height: 600,
    backgroundColor: '#00D4FF',
    top: -200,
    left: -150,
  },
  bgCircle2: {
    width: 400,
    height: 400,
    backgroundColor: '#FF3B30',
    bottom: -100,
    right: -80,
  },
  bgCircle3: {
    width: 250,
    height: 250,
    backgroundColor: '#00D4FF',
    bottom: 50,
    left: '30%',
  },

  // Logo
  logoArea: {
    position: 'absolute',
    top: 40,
    left: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoText: {
    color: '#CCC',
    fontSize: 22,
    fontWeight: '300',
    letterSpacing: 2,
    marginLeft: 8,
  },
  logoBold: {
    color: '#00D4FF',
    fontWeight: '700',
  },

  // Title
  titleArea: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: 0.3,
  },

  // Cards layout
  cardsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 28,
  },
  cardWrapper: {
    alignItems: 'center',
  },

  // Glow behind card
  cardGlow: {
    position: 'absolute',
    width: 155,
    height: 210,
    borderRadius: 24,
    top: 8,
    left: 8,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 30,
    shadowOpacity: 1,
    elevation: 20,
  },

  // Main user card
  card: {
    width: 155,
    height: 210,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    overflow: 'hidden',
    // Subtle inner shimmer
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },

  // Avatar ring
  avatarRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 99,
  },

  userName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Add user card
  addCard: {
    width: 155,
    height: 210,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  addIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: 'rgba(0,212,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,212,255,0.07)',
  },
  addUserText: {
    color: '#00D4FF',
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.8,
  },

  // Bottom hint
  hintRow: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hintKey: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    backgroundColor: '#1E1E2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintKeyText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  hintText: {
    color: '#555',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
