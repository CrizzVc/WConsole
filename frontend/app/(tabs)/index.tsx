import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView, Dimensions, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const TABS = ['Games', 'Media', 'eShop'];

interface ConsoleItem {
  id: string;
  title: string;
  time: string;
  image?: any;
  isFolder?: boolean;
  isGrid?: boolean;
}

const DATA_GAMES: ConsoleItem[] = [
  { id: '1', title: 'STARS', time: 'TODAY 1.2 H - TOTAL 5.4 H', image: require('@/assets/images/game_dark.png') },
  { id: '2', title: 'Pokémon Legends: Arceus', time: 'TODAY 2.3 H - TOTAL 17.9 H', image: require('@/assets/images/game_adventure.png') },
  { id: '3', title: 'Favorite Games', time: 'Folder - 2 Items', isFolder: true },
  { id: '4', title: 'Media Apps', time: '', isGrid: true },
  { id: '5', title: 'ENCODYA', time: 'TODAY 0.5 H - TOTAL 2.1 H', image: require('@/assets/images/game_cyberpunk.png') },
];

const DATA_MEDIA: ConsoleItem[] = [
  { id: 'm1', title: 'Twitch', time: 'App - Ver directos', image: require('@/assets/images/game_dark.png') },
  { id: 'm2', title: 'Netflix', time: 'App - Películas y Series', image: require('@/assets/images/game_adventure.png') },
  { id: 'm3', title: 'Spotify', time: 'App - Música', image: require('@/assets/images/game_cyberpunk.png') },
  { id: 'm4', title: 'Disney+', time: 'App - Entretenimiento', image: require('@/assets/images/game_dark.png') },
];

export default function ConsoleHome() {
  const [activeTab, setActiveTab] = useState('Games');
  const [activeIndex, setActiveIndex] = useState(1);
  const scrollRef = useRef<ScrollView>(null);
  const ITEM_WIDTH = 220 + (8 * 2); // width + marginHorizontal * 2

  const currentData = activeTab === 'Games' ? DATA_GAMES : (activeTab === 'Media' ? DATA_MEDIA : []);

  // Keyboard Navigation Listener
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleKeyDown = (e: any) => {
        const dataLength = activeTab === 'Games' ? DATA_GAMES.length : (activeTab === 'Media' ? DATA_MEDIA.length : 0);

        // L and R bumpers (mapped to Q and E)
        if (e.key === 'q' || e.key === 'Q') {
          setActiveTab((prev) => {
            const idx = TABS.indexOf(prev);
            if (idx > 0) { setActiveIndex(0); return TABS[idx - 1]; }
            return prev;
          });
        } else if (e.key === 'e' || e.key === 'E') {
          setActiveTab((prev) => {
            const idx = TABS.indexOf(prev);
            if (idx < TABS.length - 1) { setActiveIndex(0); return TABS[idx + 1]; }
            return prev;
          });
        } else if (e.key === 'ArrowRight') {
          setActiveIndex((prev) => Math.min(prev + 1, dataLength - 1));
        } else if (e.key === 'ArrowLeft') {
          setActiveIndex((prev) => Math.max(prev - 1, 0));
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [activeTab]);

  // Auto-scroll logic when activeIndex changes
  useEffect(() => {
    if (scrollRef.current) {
      const windowWidth = Dimensions.get('window').width;
      const paddingLeft = 40; // Equivalent to scrollContent's paddingHorizontal
      const itemCenter = paddingLeft + (activeIndex * ITEM_WIDTH) + (ITEM_WIDTH / 2);
      const scrollX = itemCenter - (windowWidth / 2);
      scrollRef.current.scrollTo({ x: Math.max(0, scrollX), animated: true });
    }
  }, [activeIndex]);

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.avatarContainer, styles.avatarActive]}>
            <Image source={{ uri: 'https://i.pravatar.cc/100?img=11' }} style={styles.avatar} />
          </View>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: 'https://i.pravatar.cc/100?img=12' }} style={styles.avatar} />
          </View>
          <View style={styles.iconButton}>
            <Ionicons name="game-controller-outline" size={24} color="#CCC" />
          </View>
        </View>

        <View style={styles.headerCenter}>
          <View style={styles.lrButton}><Text style={styles.lrText}>L</Text></View>
          {TABS.map((tab) => (
            <Text key={tab} style={[styles.navItem, activeTab === tab && styles.navItemActive]}>
              {tab}
            </Text>
          ))}
          <View style={styles.lrButton}><Text style={styles.lrText}>R</Text></View>
        </View>

        <View style={styles.headerRight}>
          <Text style={styles.timeText}>22:25 PM</Text>
          <Ionicons name="wifi" size={20} color="#CCC" style={{ marginHorizontal: 8 }} />
          <Text style={styles.batteryText}>75%</Text>
          <Ionicons name="battery-full" size={24} color="#CCC" />
        </View>
      </View>

      {/* MAIN CONTENT */}
      <View style={styles.mainContent}>
        {/* Active Title Bar */}
        <View style={styles.activeTitleContainer}>
          <View style={styles.cartridgeIcon} />
          <Text style={styles.activeTitle}>{currentData[activeIndex]?.title}</Text>
        </View>

        {/* Carousel */}
        <View style={styles.carouselWrapper}>
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {currentData.map((item, index) => {
              const isActive = index === activeIndex;
              const cardContainerStyle = [
                styles.cardBase,
                isActive && styles.cardActive
              ];

              // Render Grid specifically if item.isGrid is true
              if (item.isGrid) {
                return (
                  <TouchableOpacity key={item.id} onPress={() => setActiveIndex(index)} activeOpacity={0.9}>
                    <View style={[styles.gridContainer, cardContainerStyle]}>
                      <View style={styles.gridRow}>
                        <View style={[styles.gridItem, { backgroundColor: '#9146FF' }]}><MaterialCommunityIcons name="twitch" size={40} color="#FFF" /></View>
                        <View style={[styles.gridItem, { backgroundColor: '#E50914' }]}><MaterialCommunityIcons name="netflix" size={40} color="#FFF" /></View>
                      </View>
                      <View style={styles.gridRow}>
                        <View style={[styles.gridItem, { backgroundColor: '#1DB954' }]}><MaterialCommunityIcons name="spotify" size={40} color="#FFF" /></View>
                        <View style={[styles.gridItem, { backgroundColor: '#002E5D', justifyContent: 'center', alignItems: 'center' }]}><Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Disney+</Text></View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }

              // Render Folder specifically if item.isFolder is true
              if (item.isFolder) {
                return (
                  <TouchableOpacity key={item.id} onPress={() => setActiveIndex(index)} activeOpacity={0.9}>
                    <View style={[styles.folderContainer, cardContainerStyle]}>
                      <Text style={styles.folderTitle}>Favorite Games</Text>
                      <View style={styles.folderContent}>
                        <Image source={require('@/assets/images/game_dark.png')} style={styles.folderImg} />
                        <Image source={require('@/assets/images/game_cyberpunk.png')} style={styles.folderImg} />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity key={item.id} onPress={() => setActiveIndex(index)} activeOpacity={0.9}>
                  <Image
                    source={item.image}
                    style={[styles.cardImage, cardContainerStyle]}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Subtitle / Time */}
        <View style={styles.activeSubtitleContainer}>
          <Text style={styles.activeSubtitle}>{currentData[activeIndex]?.time}</Text>
        </View>
      </View>

      {/* BOTTOM NEWS ROW */}
      <View style={styles.newsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.newsScroll}>
          <TouchableOpacity style={styles.newsCard}>
            <Text style={styles.newsText}>Official News</Text>
            <View style={styles.newsDot} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.newsVideoCard}>
            <Image source={require('@/assets/images/game_adventure.png')} style={styles.newsVideoImg} />
            <View style={styles.playIconContainer}>
              <Ionicons name="play" size={16} color="#FFF" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.newsVideoCard}>
            <Image source={require('@/assets/images/game_cyberpunk.png')} style={styles.newsVideoImg} />
            <View style={styles.playIconContainer}>
              <Ionicons name="play" size={16} color="#FFF" />
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* FOOTER CONTROLS */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <MaterialCommunityIcons name="nintendo-switch" size={24} color="#FFF" />
          <Text style={styles.footerHint}><Ionicons name="apps" size={14} /> Explore</Text>
        </View>
        <View style={styles.footerRight}>
          <Text style={styles.footerHint}><Text style={styles.btnIcon}> + </Text> Options</Text>
          <Text style={styles.footerHint}><Text style={styles.btnIcon}> Y </Text> Change User</Text>
          <Text style={styles.footerHint}><Text style={styles.btnIcon}> X </Text> Close Software</Text>
          <Text style={styles.footerHint}><Text style={styles.btnIcon}> A </Text> Continue</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '30%',
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarActive: {
    borderColor: '#FF3B30',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40%',
  },
  lrButton: {
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginHorizontal: 15,
  },
  lrText: {
    color: '#CCC',
    fontSize: 12,
    fontWeight: 'bold',
  },
  navItem: {
    color: '#888',
    fontSize: 16,
    marginHorizontal: 12,
    fontWeight: '600',
  },
  navItemActive: {
    color: '#FFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '30%',
  },
  timeText: {
    color: '#CCC',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 10,
  },
  batteryText: {
    color: '#CCC',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 5,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    marginTop: 20,
  },
  activeTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 50,
    marginBottom: 15,
    height: 30,
  },
  cartridgeIcon: {
    width: 12,
    height: 16,
    backgroundColor: '#00FFFF',
    marginRight: 10,
    borderRadius: 2,
  },
  activeTitle: {
    color: '#00FFFF',
    fontSize: 22,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  carouselWrapper: {
    height: 250,
  },
  scrollContent: {
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  cardBase: {
    width: 220,
    height: 220,
    borderRadius: 12,
    marginHorizontal: 8,
    borderWidth: 4,
    borderColor: 'transparent',
  },
  cardActive: {
    borderColor: '#00FFFF',
    transform: [{ scale: 1.08 }],
    zIndex: 10,
  },
  cardImage: {
    resizeMode: 'cover',
  },
  gridContainer: {
    backgroundColor: '#111',
    padding: 6,
    justifyContent: 'space-between',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
    marginBottom: 6,
  },
  gridItem: {
    flex: 1,
    borderRadius: 8,
    marginHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderContainer: {
    backgroundColor: '#2A2A2A',
    padding: 15,
  },
  folderTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  folderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
  },
  folderImg: {
    width: '48%',
    height: '100%',
    borderRadius: 8,
  },
  activeSubtitleContainer: {
    paddingHorizontal: 50,
    marginTop: 15,
    height: 20,
  },
  activeSubtitle: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  newsContainer: {
    height: 120,
    justifyContent: 'center',
  },
  newsScroll: {
    paddingHorizontal: 50,
    alignItems: 'center',
  },
  newsCard: {
    width: 200,
    height: 80,
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    marginRight: 15,
    padding: 15,
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  newsText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  newsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00FFFF',
    marginTop: 5,
  },
  newsVideoCard: {
    width: 140,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  newsVideoImg: {
    width: '100%',
    height: '100%',
    opacity: 0.7,
  },
  playIconContainer: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 4,
    borderRadius: 4,
  },
  footer: {
    height: 60,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#1E1E1E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerHint: {
    color: '#CCC',
    fontSize: 14,
    marginLeft: 20,
    alignItems: 'center',
  },
  btnIcon: {
    color: '#FFF',
    fontWeight: 'bold',
    backgroundColor: '#333',
    borderRadius: 10,
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 12,
  },
});
