import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Platform, Modal, TextInput, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolate } from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import YoutubePlayer from '@/components/YoutubePlayer';
import GameDetailView from '@/components/GameDetailView';
import FavoritesView from '@/components/FavoritesView';
import { useUser } from '@/contexts/UserContext';
import { Linking } from 'react-native';
import { fetchGamingNews, NewsArticle } from '@/services/newsService';

const TABS = ['Games', 'Media', 'eShop'];

export interface ConsoleItem {
  id: string;
  title: string;
  time: string;
  image?: any;
  logo?: any;
  backgroundImage?: any;
  video?: any;
  isFolder?: boolean;
  isGrid?: boolean;
  path?: string;
  description?: string;
  rating?: number;
  isFavorite?: boolean;
  isLastPlayed?: boolean;
  lastPlayed?: number;
  youtubeId?: string;
}

const DATA_GAMES: ConsoleItem[] = [
  { id: '1', title: 'Home', time: 'WConsole - Home', image: require('@/assets/images/Home.gif'), description: 'Bienvenido a tu consola personal. Accede a tus juegos y aplicaciones favoritas con una experiencia premium.', rating: 5.0, backgroundImage: require('@/assets/images/FondoDefault.png') },
  { id: 'last_played', title: 'Último Jugado', time: 'No ejecutado aún', image: require('@/assets/images/Home.gif'), isLastPlayed: true },
  { id: '3', title: 'Favorite Games', time: 'Folder - 2 Items', isFolder: true },
  { id: '4', title: 'Media Apps', time: '', isGrid: true },
];

const DATA_MEDIA: ConsoleItem[] = [
  { id: 'm1', title: 'Twitch', time: 'App - Ver directos', image: require('@/assets/images/game_dark.png'), description: 'La plataforma líder de streaming en vivo. Sigue a tus streamers favoritos y disfruta de gaming, música y mucho más en tiempo real.', rating: 4.7 },
  { id: 'm2', title: 'Netflix', time: 'App - Películas y Series', image: require('@/assets/images/game_adventure.png'), description: 'Miles de películas, series y documentales. Disfruta del mejor entretenimiento cuando y donde quieras, con calidad 4K y sonido espacial.', rating: 4.8 },
  { id: 'm3', title: 'Spotify', time: 'App - Música', image: require('@/assets/images/game_cyberpunk.png'), description: 'Millones de canciones y podcasts. Descubre nueva música, crea listas de reproducción y disfruta del audio de alta calidad sin interrupciones.', rating: 4.6 },
  { id: 'm4', title: 'Disney+', time: 'App - Entretenimiento', image: require('@/assets/images/game_dark.png'), description: 'El hogar de Disney, Pixar, Marvel, Star Wars y National Geographic. Magia sin límites para toda la familia en una sola plataforma.', rating: 4.7 },
];

export default function ConsoleHome() {
  const { activeUser, changeUser, updateUser } = useUser();
  const [activeTab, setActiveTab] = useState('Games');
  const [activeIndex, setActiveIndex] = useState(0);

  // Focus management
  type FocusArea = 'header_user' | 'header_tabs' | 'main_carousel' | 'bottom_news' | 'footer';
  const [focusArea, setFocusArea] = useState<FocusArea>('main_carousel');
  const [focusIndex, setFocusIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const mainVerticalScrollRef = useRef<ScrollView>(null);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  // Dynamic sizing based on window width
  const baseCardSize = 220;
  // Simple scaling logic: base on 1000px width, but clamped
  const scale = Math.min(Math.max(windowWidth / 1100, 0.85), 1.4);
  const CARD_SIZE = Math.round(baseCardSize * scale);
  const ITEM_WIDTH = CARD_SIZE + (8 * 2); // card width + horizontal margins
  const LEFT_PADDING = 50; // fixed left anchor position
  const RIGHT_PADDING = windowWidth - ITEM_WIDTH - LEFT_PADDING; // allows last item to reach left anchor

  // States for dynamic data and clock
  const [games, setGames] = useState<ConsoleItem[]>(DATA_GAMES);
  const [media, setMedia] = useState<ConsoleItem[]>(DATA_MEDIA);
  const [lastPlayedGame, setLastPlayedGame] = useState<ConsoleItem | null>(null);
  const [currentTime, setCurrentTime] = useState('');
  const [news, setNews] = useState<NewsArticle[]>([]);

  // States for Add App Modal
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [newApp, setNewApp] = useState({ title: '', path: '', image: '', type: 'game' });
  const [isSaving, setIsSaving] = useState(false);

  // States for Game Detail View
  const [isDetailVisible, setDetailVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ConsoleItem | null>(null);
  const [isUserModalVisible, setUserModalVisible] = useState(false);
  const [modalSelectedIndex, setModalSelectedIndex] = useState(0);
  const [isHomeBgModalVisible, setHomeBgModalVisible] = useState(false);
  const [isFavoritesVisible, setFavoritesVisible] = useState(false);
  const [homeBackground, setHomeBackground] = useState<any>(null);

  // Background transition states
  const [bgA, setBgA] = useState<any>(null);
  const [bgB, setBgB] = useState<any>(null);
  const [activeLayer, setActiveLayer] = useState<'A' | 'B'>('A');
  const [showTrailer, setShowTrailer] = useState(false);
  const fade = useSharedValue(0);
  const tabFade = useSharedValue(1);

  useEffect(() => {
    setShowTrailer(false);
    const item = currentData[activeIndex];
    if (item?.youtubeId) {
      const timer = setTimeout(() => {
        setShowTrailer(true);
      }, 3000); // 3 segundos de espera
      return () => clearTimeout(timer);
    }
  }, [activeIndex, activeTab]);

  useEffect(() => {
    tabFade.value = 0;
    tabFade.value = withTiming(1, { duration: 400 });
  }, [activeTab]);

  const animatedTabContentStyle = useAnimatedStyle(() => ({
    opacity: tabFade.value,
    transform: [{ translateY: interpolate(tabFade.value, [0, 1], [15, 0]) }]
  }));

  useEffect(() => {
    if (Platform.OS === 'web') {
      const savedBg = localStorage.getItem('home_background');
      if (savedBg) setHomeBackground({ uri: savedBg });
    }
  }, []);



  const currentData = activeTab === 'Games' ? games : (activeTab === 'Media' ? media : []);

  // Reloj en tiempo real
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      setCurrentTime(`${hours}:${minutes} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Cargar apps desde la DB local
  const loadApps = () => {
    if (Platform.OS === 'web' && (window as any).electronAPI) {
      (window as any).electronAPI.getApps().then((data: any) => {
        let allFormatted: ConsoleItem[] = [];

        if (data.games) {
          const formattedGames = data.games.map((g: any) => ({
            id: g.id,
            title: g.title,
            time: 'Custom App',
            image: g.imageBase64 ? { uri: g.imageBase64 } : (g.image ? (g.image.startsWith('http') ? { uri: g.image } : { uri: `local-file:///${g.image.replace(/\\/g, '/')}` }) : null),
            logo: g.logoBase64 ? { uri: g.logoBase64 } : (g.logo ? (g.logo.startsWith('http') ? { uri: g.logo } : { uri: `local-file:///${g.logo.replace(/\\/g, '/')}` }) : null),
            backgroundImage: g.backgroundImageBase64 ? { uri: g.backgroundImageBase64 } : (g.backgroundImage ? (g.backgroundImage.startsWith('http') ? { uri: g.backgroundImage } : { uri: `local-file:///${g.backgroundImage.replace(/\\/g, '/')}` }) : null),
            video: g.video ? (g.video.startsWith('http') ? { uri: g.video } : { uri: `local-file:///${g.video.replace(/\\/g, '/')}` }) : null,
            path: g.path,
            description: g.description,
            rating: g.rating,
            isFavorite: g.isFavorite,
            lastPlayed: g.lastPlayed,
            youtubeId: g.youtubeId
          }));
          setGames([...DATA_GAMES, ...formattedGames]);
          allFormatted = [...allFormatted, ...formattedGames];
        }
        if (data.media) {
          const formattedMedia = data.media.map((m: any) => ({
            id: m.id,
            title: m.title,
            time: 'Custom Media',
            image: m.imageBase64 ? { uri: m.imageBase64 } : (m.image ? (m.image.startsWith('http') ? { uri: m.image } : { uri: `local-file://${m.image}` }) : null),
            backgroundImage: m.backgroundImageBase64 ? { uri: m.backgroundImageBase64 } : (m.backgroundImage ? (m.backgroundImage.startsWith('http') ? { uri: m.backgroundImage } : { uri: `local-file://${m.backgroundImage}` }) : null),
            video: m.video ? (m.video.startsWith('http') ? { uri: m.video } : { uri: `local-file://${m.video}` }) : null,
            path: m.path,
            description: m.description,
            rating: m.rating,
            isFavorite: m.isFavorite,
            lastPlayed: m.lastPlayed,
            youtubeId: m.youtubeId
          }));
          setMedia([...DATA_MEDIA, ...formattedMedia]);
          allFormatted = [...allFormatted, ...formattedMedia];
        }

        // Identificar el último juego jugado
        const latest = allFormatted.filter(i => i.lastPlayed).sort((a: any, b: any) => b.lastPlayed - a.lastPlayed)[0];
        if (latest) {
          setLastPlayedGame(latest);
        }
      }).catch(console.error);
    }
  };

  useEffect(() => {
    loadApps();
    fetchGamingNews().then(setNews);
  }, []);

  // Gamepad Support
  useEffect(() => {
    let rafId: number;
    const prevButtons = new Array(16).fill(false);
    let lastMoveTime = 0;
    const THROTTLE = 200;

    const poll = () => {
      const gamepads = navigator.getGamepads();
      const gp = gamepads[0];
      if (gp) {
        const now = Date.now();
        const buttons = gp.buttons;

        const dispatch = (key: string) => {
          window.dispatchEvent(new KeyboardEvent('keydown', { key }));
          lastMoveTime = now;
        };

        // D-Pad and Sticks (Throttled)
        if (now - lastMoveTime > THROTTLE) {
          if (buttons[12]?.pressed || gp.axes[1] < -0.5) dispatch('ArrowUp');
          else if (buttons[13]?.pressed || gp.axes[1] > 0.5) dispatch('ArrowDown');
          else if (buttons[14]?.pressed || gp.axes[0] < -0.5) dispatch('ArrowLeft');
          else if (buttons[15]?.pressed || gp.axes[0] > 0.5) dispatch('ArrowRight');
        }

        // Buttons (One-shot)
        const checkButton = (idx: number, key: string) => {
          if (buttons[idx]?.pressed && !prevButtons[idx]) dispatch(key);
          prevButtons[idx] = buttons[idx]?.pressed;
        };

        checkButton(0, 'Enter');      // A / Cross
        checkButton(1, 'Escape');     // B / Circle
        checkButton(4, 'q');         // L1
        checkButton(5, 'e');         // R1
        checkButton(9, 'Enter');      // Options/Start
      }
      rafId = requestAnimationFrame(poll);
    };

    if (Platform.OS === 'web') {
      rafId = requestAnimationFrame(poll);
    }
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Sincronizar selectedItem cuando cambian las listas
  useEffect(() => {
    if (selectedItem) {
      const updated = currentData.find(i => i.id === selectedItem.id);
      if (updated) setSelectedItem(updated);
    }
  }, [games, media, activeTab]);

  // Keyboard Navigation Listener
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleKeyDown = (e: any) => {
        // Si el usuario está escribiendo en un input o textarea, no interferimos con la navegación del sistema
        if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Enter', ' '].includes(e.key)) {
          e.preventDefault();
        }

        if (e.target && (
          e.target.tagName === 'INPUT' ||
          e.target.tagName === 'TEXTAREA' ||
          e.target.isContentEditable ||
          (e.target.getAttribute && e.target.getAttribute('type') === 'text')
        )) {
          return;
        }

        // Detail view controls
        if (isDetailVisible) {
          if (e.key === 'Escape' || e.key === 'b' || e.key === 'B') {
            setDetailVisible(false);
          }
          return;
        }
        // User/Power modal controls
        if (isUserModalVisible) {
          if (e.key === 'Escape' || e.key === 'b' || e.key === 'B') {
            setUserModalVisible(false);
          } else if (e.key === 'ArrowRight') {
            setModalSelectedIndex((prev) => Math.min(prev + 1, 3));
          } else if (e.key === 'ArrowLeft') {
            setModalSelectedIndex((prev) => Math.max(prev - 1, 0));
          } else if (e.key === 'Enter') {
            if (modalSelectedIndex === 2) { // Cambiar de usuario
              setUserModalVisible(false);
              changeUser();
            } else if (modalSelectedIndex === 3) { // Apagar
              if ((window as any).electronAPI) (window as any).electronAPI.closeApp();
            }
          }
          return;
        }

        if (isAddModalVisible || isHomeBgModalVisible || isFavoritesVisible) return;

        // --- SPATIAL NAVIGATION ---

        if (e.key === 'ArrowDown') {
          if (focusArea === 'header_user' || focusArea === 'header_tabs') {
            setFocusArea('main_carousel');
            setFocusIndex(activeIndex);
          } else if (focusArea === 'main_carousel') {
            setFocusArea('bottom_news');
            setFocusIndex(0);
            mainVerticalScrollRef.current?.scrollTo({ y: 350, animated: true });
          } else if (focusArea === 'bottom_news') {
            const nextIdx = focusIndex + 1;
            const maxIdx = news.length; // news items + back to top
            if (nextIdx <= maxIdx) {
              setFocusIndex(nextIdx);
              mainVerticalScrollRef.current?.scrollTo({ y: 350 + nextIdx * 140, animated: true });
            } else {
              setFocusArea('footer');
              setFocusIndex(0);
              mainVerticalScrollRef.current?.scrollToEnd({ animated: true });
            }
          }
          return;
        }

        if (e.key === 'ArrowUp') {
          if (focusArea === 'footer') {
            setFocusArea('bottom_news');
            setFocusIndex(news.length);
            mainVerticalScrollRef.current?.scrollToEnd({ animated: true });
          } else if (focusArea === 'bottom_news') {
            const nextIdx = focusIndex - 1;
            if (nextIdx >= 0) {
              setFocusIndex(nextIdx);
              mainVerticalScrollRef.current?.scrollTo({ y: 350 + nextIdx * 140, animated: true });
            } else {
              setFocusArea('main_carousel');
              setFocusIndex(activeIndex);
              mainVerticalScrollRef.current?.scrollTo({ y: 0, animated: true });
            }
          } else if (focusArea === 'main_carousel') {
            setFocusArea('header_tabs');
            setFocusIndex(TABS.indexOf(activeTab));
          } else if (focusArea === 'header_tabs') {
            setFocusArea('header_user');
            setFocusIndex(0);
          }
          return;
        }

        if (e.key === 'ArrowRight') {
          if (focusArea === 'main_carousel') {
            const nextIdx = Math.min(activeIndex + 1, currentData.length - 1);
            setActiveIndex(nextIdx);
            setFocusIndex(nextIdx);
          } else if (focusArea === 'header_tabs') {
            const nextIdx = Math.min(focusIndex + 1, TABS.length - 1);
            setFocusIndex(nextIdx);
            setActiveTab(TABS[nextIdx]);
            setActiveIndex(0);
          } else if (focusArea === 'bottom_news') {
            // No horizontal move in vertical news list
          }
          return;
        }

        if (e.key === 'ArrowLeft') {
          if (focusArea === 'main_carousel') {
            const nextIdx = Math.max(activeIndex - 1, 0);
            setActiveIndex(nextIdx);
            setFocusIndex(nextIdx);
          } else if (focusArea === 'header_tabs') {
            const nextIdx = Math.max(focusIndex - 1, 0);
            setFocusIndex(nextIdx);
            setActiveTab(TABS[nextIdx]);
            setActiveIndex(0);
          } else if (focusArea === 'bottom_news') {
            // No horizontal move in vertical news list
          }
          return;
        }

        if (e.key === 'Enter') {
          if (focusArea === 'main_carousel') {
            const item = currentData[activeIndex];
            if (item) {
              if (item.isFolder || item.isGrid) {
                setFavoritesVisible(true);
                return;
              }
              if (activeTab === 'Games' && activeIndex === 0) {
                setHomeBgModalVisible(true);
                return;
              }
              setSelectedItem(item);
              setDetailVisible(true);
            }
          } else if (focusArea === 'header_user') {
            setUserModalVisible(true);
          } else if (focusArea === 'footer') {
            setAddModalVisible(true);
          } else if (focusArea === 'bottom_news') {
            if (focusIndex === news.length) { // Back to top button
              setFocusArea('main_carousel');
              setFocusIndex(activeIndex);
              mainVerticalScrollRef.current?.scrollTo({ y: 0, animated: true });
              return;
            }
            const article = news[focusIndex];
            if (article) Linking.openURL(article.url);
          }
          return;
        }

        if (e.key === 'q' || e.key === 'Q' || e.key === 'e' || e.key === 'E') {
          const direction = (e.key === 'q' || e.key === 'Q') ? -1 : 1;
          setActiveTab((prev) => {
            const idx = TABS.indexOf(prev);
            const nextIdx = idx + direction;
            if (nextIdx >= 0 && nextIdx < TABS.length) {
              setActiveIndex(0);
              if (focusArea === 'header_tabs') setFocusIndex(nextIdx);
              return TABS[nextIdx];
            }
            return prev;
          });
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [activeTab, currentData, activeIndex, focusArea, focusIndex, isAddModalVisible, isDetailVisible, isUserModalVisible, isFavoritesVisible, selectedItem, modalSelectedIndex]);

  // Auto-scroll: with dynamic padding the active item always lands at the screen center
  useEffect(() => {
    // Usamos un pequeño delay o requestAnimationFrame para asegurar que el layout se haya actualizado
    const timer = setTimeout(() => {
      if (scrollRef.current) {
        const scrollX = activeIndex * ITEM_WIDTH;
        scrollRef.current.scrollTo({ x: scrollX, animated: true });
      }
    }, 10);
    return () => clearTimeout(timer);
  }, [activeIndex, activeTab, ITEM_WIDTH, windowWidth]);

  const handleAppPress = (index: number, item: ConsoleItem) => {
    // Sincronizar foco con el clic
    setFocusArea('main_carousel');
    setActiveIndex(index);
    setFocusIndex(index);

    if (activeIndex === index) {
      if (activeTab === 'Games' && index === 0) {
        setHomeBgModalVisible(true);
        return;
      }
      if (item.isFolder || item.isGrid) {
        setFavoritesVisible(true);
        return;
      }
      if (item.isLastPlayed) {
        if (lastPlayedGame) {
          setSelectedItem(lastPlayedGame);
          setDetailVisible(true);
        } else {
          alert('Aún no has jugado a ningún juego.');
        }
        return;
      }
      if (!item.isGrid) {
        setSelectedItem(item);
        setDetailVisible(true);
      }
    }
  };

  const handleSelectExecutable = async () => {
    if ((window as any).electronAPI) {
      const path = await (window as any).electronAPI.selectFile();
      if (path) setNewApp({ ...newApp, path });
    }
  };

  const handleSelectImage = async () => {
    if ((window as any).electronAPI) {
      const img = await (window as any).electronAPI.selectImage();
      if (img) setNewApp({ ...newApp, image: img });
    }
  };

  const handleSaveApp = async () => {
    if ((window as any).electronAPI && newApp.title && newApp.path) {
      setIsSaving(true);
      let appToSave = { ...newApp };

      // Si no hay imagen y es un juego, intentar buscar en SteamGridDB
      if (!appToSave.image && appToSave.type === 'game') {
        try {
          const res = await (window as any).electronAPI.fetchSteamGridData(appToSave.title);
          if (res.success && res.data) {
            if (res.data.grid) appToSave.image = res.data.grid;
            if (res.data.hero) (appToSave as any).backgroundImage = res.data.hero;
            if (res.data.logo) (appToSave as any).logo = res.data.logo;
          }
        } catch (error) {
          console.error('Error fetching SteamGrid data:', error);
        }
      }

      await (window as any).electronAPI.saveApp(appToSave);
      setIsSaving(false);
      setAddModalVisible(false);
      setNewApp({ title: '', path: '', image: '', type: 'game' });
      loadApps(); // Reload DB to update list
    } else {
      alert('Por favor completa el título y la ruta del ejecutable.');
    }
  };

  const handleSelectHomeBg = async () => {
    if ((window as any).electronAPI) {
      const img = await (window as any).electronAPI.selectImage();
      if (img) {
        const bgUri = `local-file:///${img.replace(/\\/g, '/')}`;
        setHomeBackground({ uri: bgUri });
        localStorage.setItem('home_background', bgUri);
        setHomeBgModalVisible(false);
      }
    }
  };

  const handleSelectAvatar = async () => {
    if ((window as any).electronAPI) {
      const img = await (window as any).electronAPI.selectImage();
      if (img) {
        const avatarUri = `local-file:///${img.replace(/\\/g, '/')}`;
        updateUser({ avatar: avatarUri });
      }
    }
  };

  const currentBg = (activeTab === 'Games' && activeIndex === 0)
    ? (homeBackground || require('@/assets/images/FondoDefault.png'))
    : (currentData[activeIndex]?.isLastPlayed ? lastPlayedGame?.backgroundImage : currentData[activeIndex]?.backgroundImage);

  // Trigger crossfade when currentBg changes
  useEffect(() => {
    if (activeLayer === 'A') {
      if (currentBg !== bgA) {
        setBgB(currentBg);
        setActiveLayer('B');
        fade.value = withTiming(1, { duration: 800 });
      }
    } else {
      if (currentBg !== bgB) {
        setBgA(currentBg);
        setActiveLayer('A');
        fade.value = withTiming(0, { duration: 800 });
      }
    }
  }, [currentBg]);

  // Initial load
  useEffect(() => {
    if (currentBg && !bgA && !bgB) setBgA(currentBg);
  }, []);

  const animatedStyleB = useAnimatedStyle(() => ({
    opacity: fade.value,
  }));
  return (
    <SafeAreaView style={styles.container}>
      {/* BACKGROUND DINÁMICO (Dual Layer Crossfade) */}
      <View style={StyleSheet.absoluteFill}>
        {showTrailer && currentData[activeIndex]?.youtubeId ? (
          <View style={{ width: windowWidth, height: windowHeight, overflow: 'hidden' }}>
            <YoutubePlayer
              height={windowHeight}
              width={windowWidth}
              play={true}
              videoId={currentData[activeIndex].youtubeId}
              mute={true}
            />
          </View>
        ) : (
          <>
            {bgA && (
              <Image
                source={bgA}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
              />
            )}
            <Animated.View style={[StyleSheet.absoluteFill, animatedStyleB]}>
              {bgB && (
                <Image
                  source={bgB}
                  style={StyleSheet.absoluteFillObject}
                  contentFit="cover"
                />
              )}
            </Animated.View>
          </>
        )}
      </View>
      {/* OVERLAY PARA LEGIBILIDAD (Solo si hay fondo) */}
      {currentBg && (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
      )}
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => {
              setFocusArea('header_user');
              setUserModalVisible(true);
            }}
            accessible={false}
            style={[
              styles.avatarContainer,
              styles.avatarActive,
              activeUser ? { borderColor: activeUser.color } : {},
              focusArea === 'header_user' && styles.itemFocused
            ]}
            activeOpacity={0.75}
          >
            {activeUser ? (
              <Image source={{ uri: (activeUser as any).avatarBase64 || activeUser.avatar }} style={styles.avatar} />
            ) : (
              <Ionicons name="person" size={22} color="#CCC" />
            )}
          </TouchableOpacity>
          {activeUser && (
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>Bienvenido,</Text>
              <Text style={styles.welcomeName}>{activeUser.name}</Text>
            </View>
          )}
        </View>

        <View style={styles.headerCenter}>
          <View style={styles.lrButton}><Text style={styles.lrText}>L</Text></View>
          {TABS.map((tab, idx) => (
            <TouchableOpacity
              key={tab}
              onPress={() => {
                setActiveTab(tab);
                setActiveIndex(0);
                setFocusArea('main_carousel');
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.navItem,
                  activeTab === tab && styles.navItemActive,
                  (focusArea === 'header_tabs' && focusIndex === idx) && styles.tabFocused
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={styles.lrButton}><Text style={styles.lrText}>R</Text></View>
        </View>

        <View style={styles.headerRight}>
          <Text style={styles.timeText}>{currentTime}</Text>
          <Ionicons name="wifi" size={20} color="#CCC" style={{ marginHorizontal: 8 }} />
          <Text style={styles.batteryText}>75%</Text>
          <Ionicons name="battery-full" size={24} color="#CCC" />
        </View>
      </View>

      {/* SCROLLABLE CONTENT */}
      <ScrollView
        ref={mainVerticalScrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false} // Only scroll via navigation/code for console feel
      >
        {/* MAIN CONTENT */}
        <Animated.View style={[styles.mainContent, animatedTabContentStyle]}>
          <View style={styles.activeTitleContainer}>
            <View style={styles.cartridgeIcon} />
            <Text style={[styles.activeTitle, { fontSize: Math.round(22 * scale) }]}>
              {currentData[activeIndex]?.isLastPlayed ? (lastPlayedGame ? `Último: ${lastPlayedGame.title}` : 'Último Jugado') : currentData[activeIndex]?.title}
            </Text>
          </View>

          <View style={[styles.carouselWrapper, { height: CARD_SIZE * 1.2 }]}>
            <ScrollView
              ref={scrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: LEFT_PADDING, paddingRight: RIGHT_PADDING, alignItems: 'center' }}
              snapToInterval={ITEM_WIDTH}
              snapToAlignment="start"
              decelerationRate="fast"
              scrollEventThrottle={16}
              onLayout={() => {
                if (scrollRef.current) {
                  const scrollX = activeIndex * ITEM_WIDTH;
                  scrollRef.current.scrollTo({ x: scrollX, animated: false });
                }
              }}
            >
              {currentData.map((item, index) => {
                const isActive = index === activeIndex;
                const cardContainerStyle = [
                  styles.cardBase,
                  { width: CARD_SIZE, height: CARD_SIZE },
                  isActive && styles.cardActive
                ];

                if (item.isGrid) {
                  return (
                    <TouchableOpacity key={item.id} onPress={() => handleAppPress(index, item)} activeOpacity={0.9}>
                      <View style={[styles.folderContainer, cardContainerStyle]}>
                        <View style={styles.folderHeader}>
                          <MaterialCommunityIcons name="view-grid" size={16} color="#00FFFF" />
                          <Text style={styles.folderTitle}> Favorite Media</Text>
                        </View>
                        <View style={styles.folderContent}>
                          {(() => {
                            const favs = media.filter(m => m.isFavorite);
                            if (favs.length === 0) {
                              return (
                                <View style={styles.folderEmpty}>
                                  <Ionicons name="apps-outline" size={30} color="rgba(0,255,255,0.2)" />
                                </View>
                              );
                            }
                            if (favs.length === 1) {
                              return <Image source={favs[0].image} style={styles.folderImgFull} />;
                            }
                            if (favs.length === 2) {
                              return (
                                <View style={styles.folderCol}>
                                  <Image source={favs[0].image} style={styles.folderImgWide} />
                                  <Image source={favs[1].image} style={styles.folderImgWide} />
                                </View>
                              );
                            }
                            if (favs.length === 3) {
                              return (
                                <View style={styles.folderCol}>
                                  <View style={styles.folderRow}>
                                    <Image source={favs[0].image} style={styles.folderImgSmall} />
                                    <Image source={favs[1].image} style={styles.folderImgSmall} />
                                  </View>
                                  <Image source={favs[2].image} style={styles.folderImgWide} />
                                </View>
                              );
                            }
                            // 4 or more
                            return (
                              <View style={styles.folderCol}>
                                <View style={styles.folderRow}>
                                  <Image source={favs[0].image} style={styles.folderImgSmall} />
                                  <Image source={favs[1].image} style={styles.folderImgSmall} />
                                </View>
                                <View style={styles.folderRow}>
                                  <Image source={favs[2].image} style={styles.folderImgSmall} />
                                  <Image source={favs[3].image} style={styles.folderImgSmall} />
                                </View>
                              </View>
                            );
                          })()}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                }

                if (item.isFolder) {
                  return (
                    <TouchableOpacity key={item.id} onPress={() => handleAppPress(index, item)} activeOpacity={0.9}>
                      <View style={[styles.folderContainer, cardContainerStyle]}>
                        <View style={styles.folderHeader}>
                          <Ionicons name="heart" size={16} color="#FF2D55" />
                          <Text style={styles.folderTitle}> Favorite Games</Text>
                        </View>
                        <View style={styles.folderContent}>
                          {(() => {
                            const favs = games.filter(g => g.isFavorite);
                            if (favs.length === 0) {
                              return (
                                <View style={styles.folderEmpty}>
                                  <Ionicons name="star-outline" size={30} color="rgba(255,255,255,0.2)" />
                                </View>
                              );
                            }
                            if (favs.length === 1) {
                              return <Image source={favs[0].image} style={styles.folderImgFull} />;
                            }
                            if (favs.length === 2) {
                              return (
                                <View style={styles.folderCol}>
                                  <Image source={favs[0].image} style={styles.folderImgWide} />
                                  <Image source={favs[1].image} style={styles.folderImgWide} />
                                </View>
                              );
                            }
                            if (favs.length === 3) {
                              return (
                                <View style={styles.folderCol}>
                                  <View style={styles.folderRow}>
                                    <Image source={favs[0].image} style={styles.folderImgSmall} />
                                    <Image source={favs[1].image} style={styles.folderImgSmall} />
                                  </View>
                                  <Image source={favs[2].image} style={styles.folderImgWide} />
                                </View>
                              );
                            }
                            // 4 or more
                            return (
                              <View style={styles.folderCol}>
                                <View style={styles.folderRow}>
                                  <Image source={favs[0].image} style={styles.folderImgSmall} />
                                  <Image source={favs[1].image} style={styles.folderImgSmall} />
                                </View>
                                <View style={styles.folderRow}>
                                  <Image source={favs[2].image} style={styles.folderImgSmall} />
                                  <Image source={favs[3].image} style={styles.folderImgSmall} />
                                </View>
                              </View>
                            );
                          })()}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                }

                return (
                  <TouchableOpacity key={item.id} onPress={() => handleAppPress(index, item)} activeOpacity={0.9}>
                    <Image
                      source={item.isLastPlayed ? (lastPlayedGame?.image ?? item.image) : item.image}
                      style={[styles.cardImage, cardContainerStyle]}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.activeSubtitleContainer}>
            <Text style={styles.activeSubtitle}>
              {currentData[activeIndex]?.isLastPlayed ? (lastPlayedGame ? `Jugado recientemente` : 'Ningún juego ejecutado') : currentData[activeIndex]?.time}
            </Text>
          </View>
        </Animated.View>

        {/* BOTTOM NEWS SECTION (VERTICAL) */}
        <View style={styles.newsContainerVertical}>
          <View style={styles.newsHeaderContainer}>
            <Ionicons name="newspaper-outline" size={14} color="#00FFFF" />
            <Text style={styles.newsSectionTitle}>ÚLTIMAS NOTICIAS</Text>
          </View>
          <View style={styles.newsListVertical}>
            {news.length > 0 ? (
              news.map((article, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.newsCardVertical,
                    (focusArea === 'bottom_news' && focusIndex === index) && styles.itemFocused
                  ]}
                  onPress={() => {
                    setFocusArea('bottom_news');
                    setFocusIndex(index);
                    Linking.openURL(article.url);
                  }}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: article.urlToImage }} style={styles.newsImageVertical} contentFit="cover" />
                  <View style={styles.newsOverlayVertical}>
                    <Text style={styles.newsSourcePremium}>{article.source.name.toUpperCase()}</Text>
                    <Text numberOfLines={2} style={styles.newsTitleVertical}>{article.title}</Text>
                    <Text numberOfLines={2} style={styles.newsDescVertical}>{article.description}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.newsLoadingContainer}>
                <Text style={styles.newsLoadingText}>Cargando novedades del mundo gaming...</Text>
              </View>
            )}

            {/* BACK TO TOP BUTTON at the end of the vertical list */}
            {news.length > 0 && (
              <TouchableOpacity
                style={[
                  styles.backToTopCardVertical,
                  (focusArea === 'bottom_news' && focusIndex === news.length) && styles.itemFocused
                ]}
                onPress={() => {
                  setFocusArea('main_carousel');
                  setFocusIndex(activeIndex);
                  mainVerticalScrollRef.current?.scrollTo({ y: 0, animated: true });
                }}
              >
                <Ionicons name="arrow-up" size={24} color="#00FFFF" />
                <Text style={styles.backToTopText}>VOLVER AL PRINCIPIO</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* FOOTER CONTROLS */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <MaterialCommunityIcons name="nintendo-switch" size={24} color="#FFF" />
          <Text style={styles.footerHint}><Ionicons name="apps" size={14} /> Explore</Text>
        </View>
        <View style={styles.footerRight}>
          <TouchableOpacity
            onPress={() => {
              setFocusArea('footer');
              setFocusIndex(0);
              setAddModalVisible(true);
            }}
            accessible={false}
            style={[styles.footerBtn, (focusArea === 'footer' && focusIndex === 0) && styles.footerBtnFocused]}
          >
            <Text style={styles.footerHint}><Text style={styles.btnIcon}> + </Text> Añadir App</Text>
          </TouchableOpacity>
          <Text style={styles.footerHint}><Text style={styles.btnIcon}> X </Text> Close Software</Text>
          <Text style={styles.footerHint}><Text style={styles.btnIcon}> A </Text> Start/Select</Text>
        </View>
      </View>

      <GameDetailView
        isVisible={isDetailVisible}
        item={selectedItem}
        onClose={() => setDetailVisible(false)}
        onRefresh={loadApps}
        onLaunch={(id, path) => {
          if (Platform.OS === 'web' && (window as any).electronAPI) {
            (window as any).electronAPI.launchApp(id, path).then(loadApps);
          }
        }}
      />

      <FavoritesView
        isVisible={isFavoritesVisible}
        favorites={currentData[activeIndex]?.isGrid ? media.filter(m => m.isFavorite) : games.filter(g => g.isFavorite)}
        onClose={() => setFavoritesVisible(false)}
        onLaunch={(item) => {
          if (item.path && Platform.OS === 'web' && (window as any).electronAPI) {
            (window as any).electronAPI.launchApp(item.id, item.path).then(loadApps);
          }
        }}
      />

      {/* MODAL TO ADD APP */}

      <Modal visible={isAddModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Añadir Nueva Aplicación</Text>

            <TextInput
              style={styles.input}
              placeholder="Nombre de la Aplicación"
              placeholderTextColor="#888"
              value={newApp.title}
              onChangeText={(text) => setNewApp({ ...newApp, title: text })}
            />

            <View style={styles.pickerRow}>
              <TouchableOpacity
                style={[styles.typeBtn, newApp.type === 'game' && styles.typeBtnActive]}
                onPress={() => setNewApp({ ...newApp, type: 'game' })}
              >
                <Text style={styles.typeBtnText}>Games</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, newApp.type === 'media' && styles.typeBtnActive]}
                onPress={() => setNewApp({ ...newApp, type: 'media' })}
              >
                <Text style={styles.typeBtnText}>Media</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.fileBtn} onPress={handleSelectExecutable}>
              <Ionicons name="folder-open" size={20} color="#FFF" />
              <Text style={styles.fileBtnText}>
                {newApp.path ? 'Ruta: ...' + newApp.path.slice(-20) : 'Seleccionar Ejecutable (.exe)'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.fileBtn} onPress={handleSelectImage}>
              <Ionicons name="image" size={20} color="#FFF" />
              <Text style={styles.fileBtnText}>
                {newApp.image ? 'Portada: ...' + newApp.image.slice(-20) : 'Portada (Opcional - Auto-fetch)'}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelBtn, isSaving && { opacity: 0.5 }]}
                onPress={() => !isSaving && setAddModalVisible(false)}
                disabled={isSaving}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, isSaving && { backgroundColor: '#444' }]}
                onPress={handleSaveApp}
                disabled={isSaving}
              >
                <Text style={styles.saveBtnText}>{isSaving ? 'Buscando assets...' : 'Guardar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL TO CHANGE HOME BACKGROUND */}
      <Modal visible={isHomeBgModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Configurar Fondo de Inicio</Text>
            <Text style={{ color: '#AAA', textAlign: 'center', marginBottom: 20 }}>
              Selecciona una imagen personalizada para el fondo de tu pantalla principal.
            </Text>

            <TouchableOpacity style={styles.fileBtn} onPress={handleSelectHomeBg}>
              <Ionicons name="image" size={24} color="#FFF" />
              <Text style={styles.fileBtnText}>Seleccionar Imagen de Fondo</Text>
            </TouchableOpacity>

            {homeBackground && (
              <TouchableOpacity
                style={[styles.fileBtn, { backgroundColor: '#442222' }]}
                onPress={() => {
                  setHomeBackground(null);
                  localStorage.removeItem('home_background');
                  setHomeBgModalVisible(false);
                }}
              >
                <Ionicons name="trash" size={24} color="#FF5555" />
                <Text style={[styles.fileBtnText, { color: '#FF5555' }]}>Eliminar Fondo Personalizado</Text>
              </TouchableOpacity>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setHomeBgModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={isUserModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.userModalOverlay}
          activeOpacity={1}
          onPress={() => setUserModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} style={{ width: '100%', alignItems: 'center' }}>
            <View style={styles.userModalContent}>
              {/* Header User Profile */}
              <View style={styles.userModalHeader}>
                <TouchableOpacity onPress={handleSelectAvatar} style={styles.modalAvatarContainer}>
                  {activeUser?.avatar ? (
                    <Image source={{ uri: (activeUser as any).avatarBase64 || activeUser.avatar }} style={styles.modalAvatar} />
                  ) : (
                    <Ionicons name="person" size={24} color="#FFF" />
                  )}
                  <View style={styles.avatarEditBadge}>
                    <Ionicons name="camera" size={12} color="#FFF" />
                  </View>
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={styles.modalUserNameInput}
                    value={activeUser?.name || ''}
                    onChangeText={(text) => updateUser({ name: text })}
                    placeholder="Nombre de usuario"
                    placeholderTextColor="#A0A0C0"
                  />
                  <Text style={styles.userModalHeaderStatus}>Online</Text>
                </View>
              </View>

              {/* Power Buttons */}
              <View style={styles.powerButtonsContainer}>
                <TouchableOpacity
                  style={[styles.powerButton, modalSelectedIndex === 0 && styles.powerButtonActive]}
                  activeOpacity={0.8}
                  onPress={() => setModalSelectedIndex(0)}
                >
                  <Ionicons name="lock-closed-outline" size={48} color={modalSelectedIndex === 0 ? styles.powerIconActive.color : styles.powerIcon.color} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.powerButton, modalSelectedIndex === 1 && styles.powerButtonActive]}
                  activeOpacity={0.8}
                  onPress={() => setModalSelectedIndex(1)}
                >
                  <Ionicons name="log-out-outline" size={48} color={modalSelectedIndex === 1 ? styles.powerIconActive.color : styles.powerIcon.color} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.powerButton, modalSelectedIndex === 2 && styles.powerButtonActive]}
                  activeOpacity={0.8}
                  onPress={() => {
                    setModalSelectedIndex(2);
                    setUserModalVisible(false);
                    changeUser();
                  }}
                >
                  <Ionicons name="sync-outline" size={48} color={modalSelectedIndex === 2 ? styles.powerIconActive.color : styles.powerIcon.color} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.powerButton, modalSelectedIndex === 3 && styles.powerButtonActive]}
                  activeOpacity={0.8}
                  onPress={() => {
                    setModalSelectedIndex(3);
                    if (Platform.OS === 'web' && (window as any).electronAPI) {
                      (window as any).electronAPI.closeApp();
                    }
                  }}
                >
                  <Ionicons name="power-outline" size={48} color={modalSelectedIndex === 3 ? styles.powerIconActive.color : styles.powerIcon.color} />
                </TouchableOpacity>
              </View>


              {/* Footer Info */}
              <View style={styles.userModalFooter}>
                <View style={styles.statusInfo}>
                  <Ionicons name="desktop-outline" size={16} color="#A0A0C0" />
                  <Text style={styles.statusText}>Last Login: Sep 18 20:05</Text>
                </View>
                <Text style={styles.statusSeparator}>|</Text>
                <View style={styles.statusInfo}>
                  <Ionicons name="time-outline" size={16} color="#A0A0C0" />
                  <Text style={styles.statusText}>Uptime: 6 hours, 5 minutes</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E1E' },
  header: { flexDirection: 'row', paddingHorizontal: 30, paddingTop: 20, paddingBottom: 10, alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', width: '30%' },
  avatarContainer: { width: 44, height: 44, borderRadius: 22, marginRight: 10, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  avatarActive: { borderColor: '#FF3B30' },
  avatar: { width: '100%', height: '100%' },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#333', alignItems: 'center', justifyContent: 'center', marginLeft: 5 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '40%' },
  lrButton: { borderWidth: 1, borderColor: '#666', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, marginHorizontal: 15 },
  lrText: { color: '#CCC', fontSize: 12, fontWeight: 'bold' },
  navItem: { color: '#888', fontSize: 16, marginHorizontal: 12, fontWeight: '600' },
  navItemActive: { color: '#FFF' },
  headerRight: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', width: '30%' },
  timeText: { color: '#CCC', fontSize: 14, fontWeight: 'bold', marginRight: 10 },
  batteryText: { color: '#CCC', fontSize: 14, fontWeight: 'bold', marginRight: 5 },
  mainContent: { flex: 1, justifyContent: 'center', marginTop: 20 },
  activeTitleContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 50, marginBottom: 15, height: 30 },
  cartridgeIcon: { width: 12, height: 16, backgroundColor: '#00FFFF', marginRight: 10, borderRadius: 2 },
  activeTitle: { color: '#00FFFF', fontSize: 22, fontWeight: '300', letterSpacing: 0.5 },
  carouselWrapper: {},
  // scrollContent padding is applied inline via HORIZONTAL_PADDING (dynamic, not in StyleSheet)
  cardBase: { borderRadius: 12, marginHorizontal: 8, borderWidth: 4, borderColor: 'transparent' },
  cardActive: { borderColor: '#00FFFF', transform: [{ scale: 1.08 }], zIndex: 10 },
  cardImage: { resizeMode: 'cover' },
  gridContainer: { backgroundColor: '#111', padding: 6, justifyContent: 'space-between' },
  gridRow: { flexDirection: 'row', justifyContent: 'space-between', flex: 1, marginBottom: 6 },
  gridItem: { flex: 1, borderRadius: 8, marginHorizontal: 3, alignItems: 'center', justifyContent: 'center' },
  folderContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15,
    backdropFilter: 'blur(15px)', // Standard CSS for Electron/Web
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  } as any,
  folderHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  folderTitle: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  folderContent: { flex: 1, marginTop: 5 },
  folderCol: { flex: 1, justifyContent: 'space-between' },
  folderRow: { flexDirection: 'row', justifyContent: 'space-between', height: '48%' },
  folderImgFull: { width: '100%', height: '100%', borderRadius: 6 },
  folderImgWide: { width: '100%', height: '48%', borderRadius: 4 },
  folderImgSmall: { width: '48%', height: '100%', borderRadius: 4 },
  folderEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  activeSubtitleContainer: { paddingHorizontal: 50, marginTop: 15, height: 20 },
  activeSubtitle: { color: '#888', fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  newsContainer: { height: 160, justifyContent: 'center', marginTop: 10 },
  newsHeaderContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 50, marginBottom: 10 },
  newsSectionTitle: { color: '#00FFFF', fontSize: 10, fontWeight: 'bold', marginLeft: 6, letterSpacing: 1.5 },
  newsScroll: { paddingHorizontal: 50, alignItems: 'center' },
  newsCardPremium: {
    width: 240,
    height: 120,
    borderRadius: 12,
    marginRight: 15,
    overflow: 'hidden',
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  newsImagePremium: { width: '100%', height: '100%', opacity: 0.6 },
  newsOverlayPremium: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    height: '65%',
    justifyContent: 'flex-end'
  },
  newsSourcePremium: { color: '#00FFFF', fontSize: 9, fontWeight: '900', marginBottom: 4 },
  newsTitlePremium: { color: '#FFF', fontSize: 13, fontWeight: '600', lineHeight: 18 },
  newsLoadingContainer: { height: 120, justifyContent: 'center', alignItems: 'center', width: 240 },
  newsLoadingText: { color: '#666', fontSize: 12, fontStyle: 'italic' },
  newsContainerVertical: { marginTop: 40, width: '40%', paddingBottom: 20 },
  newsListVertical: { paddingHorizontal: 50, gap: 15 },
  newsCardVertical: {
    width: '100%',
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)',
  } as any,
  newsImageVertical: {
    width: 180,
    height: '100%',
  },
  newsOverlayVertical: {
    flex: 1,
    padding: 15,
    justifyContent: 'center',
  },
  newsTitleVertical: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  newsDescVertical: {
    color: '#AAA',
    fontSize: 12,
    lineHeight: 16,
  },
  backToTopCardVertical: {
    width: '100%',
    height: 80,
    backgroundColor: 'rgba(0,255,255,0.05)',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,255,255,0.2)',
    marginTop: 10,
  },
  backToTopText: {
    color: '#00FFFF',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 5,
    letterSpacing: 2
  },
  footer: { height: 60, borderTopWidth: 1, borderTopColor: '#333', backgroundColor: '#1E1E1E', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 30 },
  footerLeft: { flexDirection: 'row', alignItems: 'center' },
  footerRight: { flexDirection: 'row', alignItems: 'center' },
  footerHint: { color: '#CCC', fontSize: 14, marginLeft: 20, alignItems: 'center' },
  footerBtn: { flexDirection: 'row', alignItems: 'center' },
  btnIcon: { color: '#FFF', fontWeight: 'bold', backgroundColor: '#333', borderRadius: 10, overflow: 'hidden', paddingHorizontal: 6, paddingVertical: 2, fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: 400, backgroundColor: '#2A2A2A', borderRadius: 12, padding: 25, borderWidth: 1, borderColor: '#444' },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: '#111', color: '#FFF', padding: 12, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#444' },
  pickerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  typeBtn: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#111', borderRadius: 8, marginHorizontal: 5, borderWidth: 1, borderColor: '#444' },
  typeBtnActive: { borderColor: '#00FFFF', backgroundColor: '#333' },
  typeBtnText: { color: '#FFF', fontWeight: 'bold' },
  fileBtn: { backgroundColor: '#333', padding: 15, borderRadius: 8, flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  fileBtnText: { color: '#FFF', marginLeft: 10, flex: 1 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  cancelBtn: { flex: 1, padding: 12, backgroundColor: '#555', borderRadius: 8, marginRight: 5, alignItems: 'center' },
  cancelBtnText: { color: '#FFF', fontWeight: 'bold' },
  saveBtn: { flex: 1, padding: 12, backgroundColor: '#00FFFF', borderRadius: 8, marginLeft: 5, alignItems: 'center' },
  saveBtnText: { color: '#000', fontWeight: 'bold' },
  // USER/POWER MODAL STYLES
  userModalOverlay: { flex: 1, backgroundColor: 'rgba(10, 10, 15, 0.95)', justifyContent: 'center', alignItems: 'center' },
  userModalContent: { width: '90%', maxWidth: 800, alignItems: 'center' },
  userModalHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(30, 30, 45, 0.8)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 15, marginBottom: 40, alignSelf: 'flex-end', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  userModalHeaderAvatar: { width: 30, height: 30, borderRadius: 15, marginRight: 10 },
  userModalHeaderName: { color: '#E0E0FF', fontSize: 16, fontWeight: '500', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  powerButtonsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 50 },
  powerButton: { width: 160, height: 160, backgroundColor: 'rgba(40, 40, 60, 0.5)', borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  powerButtonActive: { backgroundColor: '#C4B5FD', borderColor: '#A78BFA' }, // Light purple/lavender
  powerIcon: { color: '#E0E0FF' },
  powerIconActive: { color: '#1E1E2E' },
  userModalFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 15 },
  statusInfo: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusText: { color: '#A0A0C0', fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  statusSeparator: { color: '#404060', fontSize: 18 },
  modalAvatarContainer: { position: 'relative', marginRight: 15 },
  modalAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#FFF' },
  avatarEditBadge: { position: 'absolute', bottom: -2, right: -2, backgroundColor: '#00FFFF', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#1E1E2E' },
  userModalHeaderStatus: { color: '#00FF00', fontSize: 10, fontWeight: 'bold' },
  modalUserNameInput: {
    color: '#E0E0FF',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    width: 200,
  },
  welcomeContainer: {
    marginLeft: 5,
    justifyContent: 'center',
  },
  welcomeText: {
    color: '#888',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  welcomeName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // New Focus Styles
  itemFocused: {
    borderWidth: 3,
    borderColor: '#00FFFF',
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    transform: [{ scale: 1.05 }],
  },
  tabFocused: {
    color: '#00FFFF',
    borderBottomWidth: 2,
    borderBottomColor: '#00FFFF',
    paddingBottom: 2,
  },
  footerBtnFocused: {
    backgroundColor: 'rgba(0, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
});

