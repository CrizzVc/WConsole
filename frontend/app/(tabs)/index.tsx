import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView, Dimensions, Platform, Modal, TextInput, Button } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const TABS = ['Games', 'Media', 'eShop'];

interface ConsoleItem {
  id: string;
  title: string;
  time: string;
  image?: any;
  isFolder?: boolean;
  isGrid?: boolean;
  path?: string;
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
  const { width: windowWidth } = Dimensions.get('window');
  const ITEM_WIDTH = 220 + (8 * 2); // card width + horizontal margins
  const LEFT_PADDING = 50; // fixed left anchor position
  const RIGHT_PADDING = windowWidth - ITEM_WIDTH - LEFT_PADDING; // allows last item to reach left anchor

  // States for dynamic data and clock
  const [games, setGames] = useState<ConsoleItem[]>(DATA_GAMES);
  const [media, setMedia] = useState<ConsoleItem[]>(DATA_MEDIA);
  const [currentTime, setCurrentTime] = useState('');

  // States for Add App Modal
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [newApp, setNewApp] = useState({ title: '', path: '', image: '', type: 'game' });

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
        if (data.games) {
          const formattedGames = data.games.map((g: any) => ({
            id: g.id,
            title: g.title,
            time: 'Custom App',
            image: g.imageBase64 ? { uri: g.imageBase64 } : { uri: `local-file://${g.image}` },
            path: g.path
          }));
          setGames([...DATA_GAMES, ...formattedGames]);
        }
        if (data.media) {
          const formattedMedia = data.media.map((m: any) => ({
            id: m.id,
            title: m.title,
            time: 'Custom Media',
            image: m.imageBase64 ? { uri: m.imageBase64 } : { uri: `local-file://${m.image}` },
            path: m.path
          }));
          setMedia([...DATA_MEDIA, ...formattedMedia]);
        }
      }).catch(console.error);
    }
  };

  useEffect(() => {
    loadApps();
  }, []);

  // Keyboard Navigation Listener
  useEffect(() => {
    if (Platform.OS === 'web' && !isAddModalVisible) {
      const handleKeyDown = (e: any) => {
        const dataLength = currentData.length;

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
        } else if (e.key === 'Enter') {
          const item = currentData[activeIndex];
          if (item && item.path && Platform.OS === 'web' && (window as any).electronAPI) {
            (window as any).electronAPI.launchApp(item.path);
          }
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [activeTab, currentData, activeIndex, isAddModalVisible]);

  // Auto-scroll: with dynamic padding the active item always lands at the screen center
  useEffect(() => {
    if (scrollRef.current) {
      const scrollX = activeIndex * ITEM_WIDTH;
      scrollRef.current.scrollTo({ x: scrollX, animated: true });
    }
  }, [activeIndex, activeTab, ITEM_WIDTH]);

  const handleAppPress = (index: number, item: ConsoleItem) => {
    if (activeIndex === index) {
      if (item.path && Platform.OS === 'web' && (window as any).electronAPI) {
        (window as any).electronAPI.launchApp(item.path);
      }
    } else {
      setActiveIndex(index);
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
    if ((window as any).electronAPI && newApp.title && newApp.path && newApp.image) {
      await (window as any).electronAPI.saveApp(newApp);
      setAddModalVisible(false);
      setNewApp({ title: '', path: '', image: '', type: 'game' });
      loadApps(); // Reload DB to update list
    } else {
      alert('Por favor completa todos los campos.');
    }
  };

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
          <Text style={styles.timeText}>{currentTime}</Text>
          <Ionicons name="wifi" size={20} color="#CCC" style={{ marginHorizontal: 8 }} />
          <Text style={styles.batteryText}>75%</Text>
          <Ionicons name="battery-full" size={24} color="#CCC" />
        </View>
      </View>

      {/* MAIN CONTENT */}
      <View style={styles.mainContent}>
        <View style={styles.activeTitleContainer}>
          <View style={styles.cartridgeIcon} />
          <Text style={styles.activeTitle}>{currentData[activeIndex]?.title}</Text>
        </View>

        <View style={styles.carouselWrapper}>
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: LEFT_PADDING, paddingRight: RIGHT_PADDING, alignItems: 'center' }}
          >
            {currentData.map((item, index) => {
              const isActive = index === activeIndex;
              const cardContainerStyle = [
                styles.cardBase,
                isActive && styles.cardActive
              ];

              if (item.isGrid) {
                return (
                  <TouchableOpacity key={item.id} onPress={() => handleAppPress(index, item)} activeOpacity={0.9}>
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

              if (item.isFolder) {
                return (
                  <TouchableOpacity key={item.id} onPress={() => handleAppPress(index, item)} activeOpacity={0.9}>
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
                <TouchableOpacity key={item.id} onPress={() => handleAppPress(index, item)} activeOpacity={0.9}>
                  <Image
                    source={item.image}
                    style={[styles.cardImage, cardContainerStyle]}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

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
          <TouchableOpacity onPress={() => setAddModalVisible(true)} style={styles.footerBtn}>
            <Text style={styles.footerHint}><Text style={styles.btnIcon}> + </Text> Añadir App</Text>
          </TouchableOpacity>
          <Text style={styles.footerHint}><Text style={styles.btnIcon}> Y </Text> Change User</Text>
          <Text style={styles.footerHint}><Text style={styles.btnIcon}> X </Text> Close Software</Text>
          <Text style={styles.footerHint}><Text style={styles.btnIcon}> A </Text> Start/Select</Text>
        </View>
      </View>

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
                {newApp.image ? 'Portada: ...' + newApp.image.slice(-20) : 'Seleccionar Portada (Imagen)'}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveApp}>
                <Text style={styles.saveBtnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  carouselWrapper: { height: 250 },
  // scrollContent padding is applied inline via HORIZONTAL_PADDING (dynamic, not in StyleSheet)
  cardBase: { width: 220, height: 220, borderRadius: 12, marginHorizontal: 8, borderWidth: 4, borderColor: 'transparent' },
  cardActive: { borderColor: '#00FFFF', transform: [{ scale: 1.08 }], zIndex: 10 },
  cardImage: { resizeMode: 'cover' },
  gridContainer: { backgroundColor: '#111', padding: 6, justifyContent: 'space-between' },
  gridRow: { flexDirection: 'row', justifyContent: 'space-between', flex: 1, marginBottom: 6 },
  gridItem: { flex: 1, borderRadius: 8, marginHorizontal: 3, alignItems: 'center', justifyContent: 'center' },
  folderContainer: { backgroundColor: '#2A2A2A', padding: 15 },
  folderTitle: { color: '#FFF', fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  folderContent: { flexDirection: 'row', justifyContent: 'space-between', flex: 1 },
  folderImg: { width: '48%', height: '100%', borderRadius: 8 },
  activeSubtitleContainer: { paddingHorizontal: 50, marginTop: 15, height: 20 },
  activeSubtitle: { color: '#888', fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  newsContainer: { height: 120, justifyContent: 'center' },
  newsScroll: { paddingHorizontal: 50, alignItems: 'center' },
  newsCard: { width: 200, height: 80, backgroundColor: '#2A2A2A', borderRadius: 10, marginRight: 15, padding: 15, justifyContent: 'space-between', flexDirection: 'row' },
  newsText: { color: '#FFF', fontSize: 16, fontWeight: '500' },
  newsDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00FFFF', marginTop: 5 },
  newsVideoCard: { width: 140, height: 80, borderRadius: 10, marginRight: 15, overflow: 'hidden', backgroundColor: '#111' },
  newsVideoImg: { width: '100%', height: '100%', opacity: 0.7 },
  playIconContainer: { position: 'absolute', top: 5, left: 5, backgroundColor: 'rgba(0,0,0,0.6)', padding: 4, borderRadius: 4 },
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
  saveBtnText: { color: '#000', fontWeight: 'bold' }
});
