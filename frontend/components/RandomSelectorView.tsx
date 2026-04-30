import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ConsoleItem } from '@/app/(tabs)/index';
import { soundService } from '@/services/soundService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
  isVisible: boolean;
  games: ConsoleItem[];
  onClose: () => void;
  onLaunch: (item: ConsoleItem) => void;
  inputMode?: 'keyboard' | 'gamepad';
}

export default function RandomSelectorView({ isVisible, games, onClose, onLaunch, inputMode }: Props) {
  const [isRolling, setIsRolling] = useState(false);
  const [displayGames, setDisplayGames] = useState<ConsoleItem[]>([]);
  const [rollCount, setRollCount] = useState(0);
  
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    if (isVisible) {
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1);
      startRoll();
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0.9, { duration: 200 });
    }
  }, [isVisible]);

  const startRoll = useCallback(() => {
    if (games.length === 0) return;
    setIsRolling(true);
    setRollCount(prev => prev + 1);
    
    // Pick 3 random games for display
    // We want unique games if possible
    const available = games.filter(g => !g.isFolder && !g.isGrid && g.id !== '1' && g.id !== 'last_played');
    if (available.length === 0) {
      setIsRolling(false);
      return;
    }

    const shuffled = [...available].sort(() => 0.5 - Math.random());
    setDisplayGames(shuffled.slice(0, 3));
    
    // Simulate "rolling" effect with a timeout
    const rollEffect = setTimeout(() => {
      setIsRolling(false);
      soundService.playActivation();
    }, 1200);
    
    soundService.playNavigation();
    return () => clearTimeout(rollEffect);
  }, [games]);

  useEffect(() => {
    const handleKeyDown = (e: any) => {
      if (!isVisible) return;
      
      if (e.key === 'Escape' || e.key === 'b' || e.key === 'B') {
        onClose();
      } else if (e.key === 'Enter' || e.key === 'a' || e.key === 'A') {
        if (!isRolling && displayGames[1]) {
          onLaunch(displayGames[1]);
        }
      } else if (e.key === 'x' || e.key === 'X' || e.key === 'r' || e.key === 'R') {
        if (!isRolling) startRoll();
      }
    };

    if (Platform.OS === 'web') {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isVisible, isRolling, displayGames, startRoll, onClose, onLaunch]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }]
  }));

  if (!isVisible) return null;

  return (
    <Modal visible={isVisible} transparent animationType="none">
      <View style={styles.container}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        
        <Animated.View style={[styles.content, animatedStyle]}>
          {/* AMBIENTACIÓN TAG (TOP LEFT) */}
          <View style={styles.topHeader}>
            <View style={styles.slantedTag}>
              <Text style={styles.tagLabel}>AMBIENTACIÓN</Text>
              <Text style={styles.tagSubLabel}>BACKGROUND</Text>
              <Text style={styles.tagNumber}>{rollCount.toString().padStart(2, '0')}</Text>
            </View>
          </View>

          {/* CARDS AREA */}
          <View style={styles.cardsContainer}>
            {displayGames.map((game, index) => {
              const isMiddle = index === 1;
              return (
                <View 
                  key={game.id + index} 
                  style={[
                    styles.cardWrapper, 
                    isMiddle ? styles.cardMiddle : styles.cardSide,
                    !isMiddle && { opacity: 0.4 }
                  ]}
                >
                  <View style={styles.cardSlant}>
                    <Image source={game.image} style={styles.cardImage} contentFit="cover" />
                    <View style={styles.cardOverlay}>
                       <View style={styles.gameLogoBox}>
                          <MaterialCommunityIcons name="zeta" size={24} color="#FFF" />
                       </View>
                       
                       <View style={styles.cardInfo}>
                          <Text style={styles.cardTitle}>{game.title?.toUpperCase() || 'JUEGO'}</Text>
                          {isMiddle && (
                            <>
                              <Text style={styles.cardSubtitle}>Seleccionado</Text>
                              <Text style={styles.cardDesc} numberOfLines={2}>
                                {game.description || "Un desafío aleatorio te espera. ¿Estás listo para jugar?"}
                              </Text>
                            </>
                          )}
                       </View>
                    </View>
                    
                    <View style={styles.slantLines}>
                      <View style={styles.slantLine} />
                      <View style={styles.slantLine} />
                      <View style={styles.slantLine} />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* BOTTOM CONTROLS */}
          <View style={styles.bottomLeftControls}>
             <TouchableOpacity style={styles.controlBtn} onPress={onClose}>
                <View style={styles.btnIconCircle}><Text style={styles.btnIconText}>B</Text></View>
                <Text style={styles.controlBtnLabel}>VOLVER</Text>
             </TouchableOpacity>
          </View>

          <View style={styles.bottomRightControls}>
             <TouchableOpacity style={[styles.controlBtn, styles.primaryBtn]} onPress={startRoll} disabled={isRolling}>
                <View style={styles.btnIconCircle}><Text style={styles.btnIconText}>X</Text></View>
                <Text style={styles.controlBtnLabel}>REINTENTAR</Text>
             </TouchableOpacity>

             <TouchableOpacity 
               style={[styles.controlBtn, styles.confirmBtn]} 
               onPress={() => displayGames[1] && onLaunch(displayGames[1])}
               disabled={isRolling}
             >
                <View style={[styles.btnIconCircle, { backgroundColor: '#00FFFF' }]}><Text style={[styles.btnIconText, { color: '#000' }]}>A</Text></View>
                <Text style={styles.controlBtnLabel}>INICIAR</Text>
             </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  topHeader: {
    position: 'absolute',
    top: 40,
    left: 40,
    zIndex: 100,
  },
  slantedTag: {
    backgroundColor: '#CCFF00', 
    padding: 12,
    transform: [{ skewX: '-15deg' }],
    width: 120,
  },
  tagLabel: {
    color: '#000',
    fontSize: 16,
    fontWeight: '900',
  },
  tagSubLabel: {
    color: '#000',
    fontSize: 8,
    fontWeight: 'bold',
    marginTop: -3,
  },
  tagNumber: {
    color: '#000',
    fontSize: 40,
    fontWeight: '900',
    marginTop: 2,
  },
  navArrowContainer: {
    marginTop: 20,
  },
  arrowBox: {
    width: 60,
    height: 40,
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: '#FFF',
    borderRadius: 15,
    transform: [{ skewX: '-15deg' }],
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowBoxRight: {
    backgroundColor: '#FFF',
    borderColor: '#000',
  },
  cardsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
    marginTop: 20,
  },
  cardWrapper: {
    width: 220,
    height: 500,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  cardMiddle: {
    width: 280,
    height: 600,
    zIndex: 10,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  cardSide: {
    transform: [{ scale: 0.85 }],
  },
  cardSlant: {
    flex: 1,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    opacity: 0.7,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  gameLogoBox: {
    width: 40,
    height: 40,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  cardInfo: {
    marginTop: 40,
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 32,
    marginBottom: 5,
  },
  cardSubtitle: {
    color: '#CCFF00',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  cardDesc: {
    color: '#AAA',
    fontSize: 12,
    lineHeight: 18,
  },
  slantLines: {
    position: 'absolute',
    bottom: 20,
    right: -20,
    transform: [{ rotate: '-45deg' }],
  },
  slantLine: {
    width: 300,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 10,
  },
  bottomLeftControls: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    flexDirection: 'row',
    gap: 20,
  },
  bottomRightControls: {
    position: 'absolute',
    bottom: 40,
    right: 40,
    flexDirection: 'row',
    gap: 20,
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  primaryBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  confirmBtn: {
    backgroundColor: 'rgba(0,255,255,0.15)',
  },
  btnIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  btnIconText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  controlBtnLabel: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  }
});
