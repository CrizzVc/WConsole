import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Dimensions, useWindowDimensions, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ConsoleItem } from '../app/(tabs)/index';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolate } from 'react-native-reanimated';

interface FavoritesViewProps {
  isVisible: boolean;
  favorites: ConsoleItem[];
  onClose: () => void;
  onLaunch: (item: ConsoleItem) => void;
}

const FavoriteItem: React.FC<{
    item: ConsoleItem;
    isActive: boolean;
    onPress: () => void;
    HERO_WIDTH: number;
    HERO_HEIGHT: number;
}> = ({ item, isActive, onPress, HERO_WIDTH, HERO_HEIGHT }) => {
    // Animated scale for the active item
    const scale = useSharedValue(1);
    
    useEffect(() => {
        scale.value = withTiming(isActive ? 1.08 : 1, { duration: 300 });
    }, [isActive]);

    const animatedCardStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        borderColor: isActive ? '#FF2D55' : 'rgba(255,255,255,0.1)',
        borderWidth: isActive ? 4 : 2,
        shadowOpacity: isActive ? 0.8 : 0.4,
        shadowRadius: isActive ? 25 : 10,
        shadowColor: isActive ? '#FF2D55' : '#000',
    }));

    return (
        <View style={[styles.heroWrapper, { width: HERO_WIDTH, height: HERO_HEIGHT, marginHorizontal: 20 }]}>
            <Animated.View style={[styles.heroCard, animatedCardStyle]}>
                <TouchableOpacity 
                    activeOpacity={0.9} 
                    onPress={onPress}
                    style={{ width: '100%', height: '100%' }}
                >
                    <Image 
                        source={item.backgroundImage || item.image} 
                        style={styles.heroImage}
                        contentFit="cover"
                    />
                    <View style={styles.heroOverlay}>
                        {item.logo ? (
                            <Image source={item.logo} style={styles.heroLogo} contentFit="contain" />
                        ) : (
                            <Text style={styles.heroTitle}>{item.title}</Text>
                        )}
                    </View>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};

const FavoritesView: React.FC<FavoritesViewProps> = ({ isVisible, favorites, onClose, onLaunch }) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const isKeyboardScroll = useRef(false);
  
  // Carousel sizing
  const HERO_WIDTH = Math.min(windowWidth * 0.75, 800);
  const HERO_HEIGHT = HERO_WIDTH * 0.45;
  const ITEM_WIDTH = HERO_WIDTH + 40;
  const SIDE_SPACING = (windowWidth - HERO_WIDTH) / 2;

  // Background transition
  const fade = useSharedValue(0);
  const [bgImage, setBgImage] = useState<any>(null);
  const [prevBgImage, setPrevBgImage] = useState<any>(null);

  useEffect(() => {
    if (favorites.length > 0) {
      const currentHero = favorites[activeIndex]?.backgroundImage || favorites[activeIndex]?.image;
      if (currentHero !== bgImage) {
        setPrevBgImage(bgImage);
        setBgImage(currentHero);
        fade.value = 0;
        fade.value = withTiming(1, { duration: 500 });
      }
    }
  }, [activeIndex, favorites]);

  const animatedBgStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
  }));

  // Keyboard Navigation
  useEffect(() => {
    if (isVisible && Platform.OS === 'web') {
      const handleKeyDown = (e: any) => {
        if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Enter', ' '].includes(e.key)) {
          e.preventDefault();
        }

        if (e.key === 'ArrowRight') {
          if (activeIndex < favorites.length - 1) {
            isKeyboardScroll.current = true;
            setActiveIndex(activeIndex + 1);
          }
        } else if (e.key === 'ArrowLeft') {
          if (activeIndex > 0) {
            isKeyboardScroll.current = true;
            setActiveIndex(activeIndex - 1);
          }
        } else if (e.key === 'Enter') {
          if (favorites[activeIndex]) {
            onLaunch(favorites[activeIndex]);
          }
        } else if (e.key === 'Escape' || e.key === 'b' || e.key === 'B') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isVisible, favorites, activeIndex]);

  // Auto-scroll when activeIndex changes via keyboard
  useEffect(() => {
    if (scrollRef.current && isKeyboardScroll.current) {
        scrollRef.current.scrollTo({ x: activeIndex * ITEM_WIDTH, animated: true });
        // Reset the flag after a short delay to allow onScroll to settle
        setTimeout(() => { isKeyboardScroll.current = false; }, 500);
    }
  }, [activeIndex]);

  if (favorites.length === 0) {
    return (
      <Modal visible={isVisible} transparent animationType="fade">
        <View style={styles.container}>
          <TouchableOpacity style={styles.backButton} onPress={onClose} accessible={false}>
            <Ionicons name="arrow-back" size={28} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-dislike-outline" size={80} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyText}>No tienes juegos favoritos aún</Text>
            <Text style={styles.emptySubtext}>Marca tus juegos con el corazón para verlos aquí.</Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <View style={styles.container}>
        {/* DYNAMIC BLURRED BACKGROUND */}
        <View style={StyleSheet.absoluteFill}>
          {prevBgImage && (
            <Image source={prevBgImage} style={styles.absoluteBg} contentFit="cover" />
          )}
          <Animated.View style={[StyleSheet.absoluteFill, animatedBgStyle]}>
            {bgImage && (
              <Image source={bgImage} style={styles.absoluteBg} contentFit="cover" />
            )}
          </Animated.View>
          <View style={styles.blurOverlay} />
        </View>

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose} accessible={false}>
            <Ionicons name="arrow-back" size={28} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
             <Ionicons name="heart" size={24} color="#FF2D55" />
             <Text style={styles.title}> FAVORITE GAMES</Text>
          </View>
          <View style={{ width: 60 }} />
        </View>

        {/* HERO CAROUSEL */}
        <View style={styles.carouselContainer}>
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ 
                paddingHorizontal: SIDE_SPACING,
                alignItems: 'center', // Vertical centering for horizontal scroll
                justifyContent: 'center',
                flexGrow: 1
            }}
            snapToInterval={ITEM_WIDTH}
            decelerationRate="fast"
            onScroll={(e) => {
              if (isKeyboardScroll.current) return;
              const x = e.nativeEvent.contentOffset.x;
              const index = Math.round(x / ITEM_WIDTH);
              if (index !== activeIndex && index >= 0 && index < favorites.length) {
                setActiveIndex(index);
              }
            }}
            scrollEventThrottle={16}
          >
            {favorites.map((item, index) => (
                <FavoriteItem 
                    key={item.id}
                    item={item}
                    isActive={index === activeIndex}
                    onPress={() => (index === activeIndex) ? onLaunch(item) : setActiveIndex(index)}
                    HERO_WIDTH={HERO_WIDTH}
                    HERO_HEIGHT={HERO_HEIGHT}
                />
            ))}
          </ScrollView>
        </View>

        {/* GAME INFO */}
        <View style={styles.infoContainer}>
           <Text style={styles.activeGameTitle}>{favorites[activeIndex]?.title}</Text>
           <View style={styles.launchHint}>
              <View style={styles.btnIcon}><Text style={styles.btnText}>A</Text></View>
              <Text style={styles.hintText}> Iniciar Juego</Text>
           </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
            <Text style={styles.footerText}>{activeIndex + 1} / {favorites.length} Juegos</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  absoluteBg: { ...StyleSheet.absoluteFillObject, opacity: 0.5 },
  blurOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.4)',
    backdropFilter: 'blur(40px)', // High blur for background
  } as any,
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingTop: 40, 
    paddingHorizontal: 30,
    zIndex: 10
  },
  backButton: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  titleContainer: { flexDirection: 'row', alignItems: 'center' },
  title: { color: '#FFF', fontSize: 20, fontWeight: 'bold', letterSpacing: 2 },
  carouselContainer: { 
    flex: 2, // Give it more weight than header/footer
    justifyContent: 'center',
    width: '100%'
  },
  heroWrapper: { 
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  heroCard: { 
    width: '100%', 
    height: '100%', 
    borderRadius: 20, 
    overflow: 'hidden',
    backgroundColor: '#111',
    // Elevation for Android glow
    elevation: 10,
  },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-end',
    padding: 25
  },
  heroLogo: { width: '50%', height: 60, alignSelf: 'flex-start' },
  heroTitle: { color: '#FFF', fontSize: 28, fontWeight: 'bold' },
  infoContainer: { alignItems: 'center', marginBottom: 60 },
  activeGameTitle: { color: '#FFF', fontSize: 24, fontWeight: '300', marginBottom: 15 },
  launchHint: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 30 },
  btnIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  hintText: { color: '#FFF', fontSize: 16, fontWeight: '500' },
  footer: { paddingBottom: 40, alignItems: 'center' },
  footerText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 'bold' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#FFF', fontSize: 22, fontWeight: 'bold', marginTop: 20 },
  emptySubtext: { color: '#888', fontSize: 16, marginTop: 10 },
});

export default FavoritesView;
