import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, Platform, TextInput, ScrollView, useWindowDimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { ConsoleItem } from '../app/(tabs)/index';
import YoutubePlayer from './YoutubePlayer';
import ControlPrompt from './ControlPrompt';

interface GameDetailViewProps {
  isVisible: boolean;
  item: ConsoleItem | null;
  onClose: () => void;
  onLaunch?: (id: string, path: string) => void;
  onRefresh?: () => void;
  isLaunching?: boolean;
  inputMode: 'keyboard' | 'gamepad';
}

const GameDetailView: React.FC<GameDetailViewProps> = ({ isVisible, item, onClose, onLaunch, onRefresh, isLaunching, inputMode }) => {
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editData, setEditData] = useState<Partial<ConsoleItem>>({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [focusIndex, setFocusIndex] = useState(0); // 0: Inicio, 1: Editar, 2: Favorito
  const [editModalFocusIndex, setEditModalFocusIndex] = useState(0);

  const { width } = useWindowDimensions();
  const isSmallScreen = width < 1100; // Handheld PC threshold

  const editTitleRef = React.useRef<TextInput>(null);
  const editDescRef = React.useRef<TextInput>(null);


  useEffect(() => {
    if (item) {
      setFocusIndex(0); // Reset focus when opening
      const initialData: any = {
        id: item.id,
        title: item.title,
        description: item.description,
        rating: item.rating,
        image: item.image?.uri?.startsWith('local-file://') ? item.image.uri.replace('local-file://', '') : (item.image?.uri?.startsWith('http') ? item.image.uri : undefined),
        logo: item.logo?.uri?.startsWith('local-file://') ? item.logo.uri.replace('local-file://', '') : (item.logo?.uri?.startsWith('http') ? item.logo.uri : undefined),
        backgroundImage: item.backgroundImage?.uri?.startsWith('local-file://') ? item.backgroundImage.uri.replace('local-file://', '') : (item.backgroundImage?.uri?.startsWith('http') ? item.backgroundImage.uri : undefined),
        video: item.video?.uri?.startsWith('local-file://') ? item.video.uri.replace('local-file://', '') : (item.video?.uri?.startsWith('http') ? item.video.uri : undefined),
        youtubeId: item.youtubeId,
      };

      setEditData(initialData);
    }
  }, [item, isVisible]);

  useEffect(() => {
    if (isEditModalVisible) {
      setEditModalFocusIndex(0);
    }
  }, [isEditModalVisible]);

  // Keyboard navigation within Detail View
  useEffect(() => {
    if (isVisible && !isLaunching) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Enter', ' '].includes(e.key)) {
          e.preventDefault();
        }

        if (isEditModalVisible) {
          if (e.key === 'ArrowDown') {
            setEditModalFocusIndex(prev => Math.min(prev + 1, 10));
          } else if (e.key === 'ArrowUp') {
            setEditModalFocusIndex(prev => Math.max(prev - 1, 0));
          } else if (e.key === 'ArrowRight' && editModalFocusIndex >= 8) {
            setEditModalFocusIndex(prev => Math.min(prev + 1, 10));
          } else if (e.key === 'ArrowLeft' && editModalFocusIndex >= 9) {
            setEditModalFocusIndex(prev => Math.max(prev - 1, 8));
          } else if (e.key === 'Enter') {
            if (editModalFocusIndex === 0) handleSyncIGDB();
            else if (editModalFocusIndex === 1) handleSyncSteamGrid();
            else if (editModalFocusIndex === 2) editTitleRef.current?.focus();
            else if (editModalFocusIndex === 3) editDescRef.current?.focus();
            else if (editModalFocusIndex === 4) handleSelectImage('image');
            else if (editModalFocusIndex === 5) handleSelectImage('logo');
            else if (editModalFocusIndex === 6) handleSelectImage('backgroundImage');
            else if (editModalFocusIndex === 7) handleSelectVideo();
            else if (editModalFocusIndex === 8) handleDeleteApp();
            else if (editModalFocusIndex === 9) setEditModalVisible(false);
            else if (editModalFocusIndex === 10) handleSaveEdit();
          } else if (e.key === 'Escape' || e.key === 'b' || e.key === 'B') {
            setEditModalVisible(false);
          }
          return;
        }

        if (e.key === 'ArrowRight') {
          setFocusIndex((prev) => Math.min(prev + 1, 2));
        } else if (e.key === 'ArrowLeft') {
          setFocusIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
          if (focusIndex === 0) {
            // Launch app
            if (item?.path) {
              if (onLaunch) onLaunch(item.id, item.path);
              else if ((window as any).electronAPI) (window as any).electronAPI.launchApp(item.id, item.path);
            }
          } else if (focusIndex === 1) {
            setEditModalVisible(true);
          } else if (focusIndex === 2) {
            handleToggleFavorite();
          }
        } else if (e.key === 'Escape' || e.key === 'b' || e.key === 'B') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isVisible, isEditModalVisible, focusIndex, editModalFocusIndex, item, onLaunch, onClose]);

  if (!item) return null;

  const handleSelectImage = async (field: 'image' | 'backgroundImage' | 'logo') => {
    if ((window as any).electronAPI) {
      const img = await (window as any).electronAPI.selectImage();
      if (img) setEditData({ ...editData, [field]: img });
    }
  };

  const handleSelectVideo = async () => {
    if ((window as any).electronAPI) {
      const vid = await (window as any).electronAPI.selectVideo();
      if (vid) setEditData({ ...editData, video: vid });
    }
  };

  const handleSaveEdit = async () => {
    if ((window as any).electronAPI && editData.id) {
      // Limpiamos los campos vacíos o undefined para no sobrescribir con valores nulos en la DB
      const cleanData = Object.fromEntries(
        Object.entries(editData).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
      );

      const result = await (window as any).electronAPI.updateApp(cleanData);
      if (result.success) {
        setEditModalVisible(false);
        if (onRefresh) onRefresh();
      } else {
        alert('Error al actualizar: ' + result.error);
      }
    }
  };

  const handleSyncIGDB = async () => {
    if ((window as any).electronAPI && editData.title) {
      setIsSyncing(true);
      const result = await (window as any).electronAPI.fetchGameData(editData.title);
      setIsSyncing(false);
      
      if (result.success) {
        const game = result.data;
        const newEditData: any = {
          ...editData,
          rating: game.rating ? game.rating / 20 : (game.aggregated_rating ? game.aggregated_rating / 20 : 5.0),
          description: game.summary || editData.description,
          youtubeId: game.videos && game.videos.length > 0 ? game.videos[0].video_id : editData.youtubeId
        };

        // Si IGDB devuelve una carátula, la usamos (convertimos a alta resolución)
        if (game.cover && game.cover.url) {
          const coverUrl = 'https:' + game.cover.url.replace('t_thumb', 't_cover_big');
          newEditData.image = coverUrl;
        }

        // Si IGDB devuelve capturas o arte, usamos la primera como fondo (1080p)
        if (game.screenshots && game.screenshots.length > 0) {
          newEditData.backgroundImage = 'https:' + game.screenshots[0].url.replace('t_thumb', 't_1080p');
        } else if (game.artworks && game.artworks.length > 0) {
          newEditData.backgroundImage = 'https:' + game.artworks[0].url.replace('t_thumb', 't_1080p');
        }

        setEditData(newEditData);

      } else {

        alert('No se encontró información en IGDB. Revisa el nombre del juego.');
      }
    }
  };


  const handleToggleFavorite = async () => {
    console.log('Toggling favorite for:', item.id);
    if ((window as any).electronAPI && item.id) {
      const newStatus = !item.isFavorite;
      const result = await (window as any).electronAPI.updateApp({ id: item.id, isFavorite: newStatus });
      console.log('Update result:', result);
      if (result.success) {
        if (onRefresh) onRefresh();
      } else {
        alert('No se pudo marcar como favorito: ' + result.error);
      }
    } else {
      console.log('Missing electronAPI or item.id');
    }
  };

  const handleDeleteApp = async () => {
    if ((window as any).electronAPI && item.id) {
      const confirmed = window.confirm(`¿Estás seguro de que quieres eliminar "${item.title}"? Esta acción no se puede deshacer.`);
      if (confirmed) {
        const result = await (window as any).electronAPI.deleteApp(item.id);
        if (result.success) {
          onClose();
          if (onRefresh) onRefresh();
        } else {
          alert('Error al eliminar: ' + result.error);
        }
      }
    }
  };


  const handleSyncSteamGrid = async () => {
    if ((window as any).electronAPI && editData.title) {
      setIsSyncing(true);
      const result = await (window as any).electronAPI.fetchSteamGridData(editData.title);
      setIsSyncing(false);
      
      if (result.success) {
        const assets = result.data;
        setEditData({
          ...editData,
          image: assets.grid || editData.image,
          backgroundImage: assets.hero || editData.backgroundImage,
          logo: assets.logo || editData.logo
        });
      } else {
        alert('SteamGridDB: ' + result.error);
      }
    }
  };


  return (
    <Modal visible={isVisible} transparent={false} animationType="fade" onRequestClose={onClose}>
      <View style={styles.detailContainer}>
        {/* FULLSCREEN BACKGROUND */}
        {(editData.backgroundImage || item.backgroundImage) ? (
          <Image 
            source={editData.backgroundImage ? (editData.backgroundImage.startsWith('http') ? { uri: editData.backgroundImage } : { uri: `local-file:///${editData.backgroundImage}` }) : item.backgroundImage} 
            style={styles.detailBg} 
          />
        ) : (
          (editData.image || item.image) && (
            <Image 
              source={editData.image ? (editData.image.startsWith('http') ? { uri: editData.image } : { uri: `local-file:///${editData.image}` }) : item.image} 
              style={styles.detailBg} 
            />
          )
        )}

        <View style={styles.detailOverlay}>
          {/* NAVIGATION BUTTONS */}
          <TouchableOpacity 
            style={styles.detailBack} 
            onPress={onClose}
            accessible={false}
          >
            <ControlPrompt btn="Back" label="" inputMode={inputMode} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.favoriteButton, 
              item.isFavorite && styles.favoriteButtonActive,
              focusIndex === 2 && styles.buttonFocused,
              isSmallScreen && { right: '43%' }
            ]}
            onPress={() => {
              setFocusIndex(2);
              handleToggleFavorite();
            }}
          >
            <Ionicons name={item.isFavorite ? "heart" : "heart-outline"} size={26} color={item.isFavorite ? "#FF2D55" : "#FFF"} />
          </TouchableOpacity>

          <View style={styles.detailContent}>
            {!isSmallScreen && (
              <View style={styles.detailLeft}>
                {(editData.logo || item.logo) ? (
                  <Image 
                    source={editData.logo ? (editData.logo.startsWith('http') ? { uri: editData.logo } : { uri: `local-file:///${editData.logo}` }) : item.logo} 
                    style={styles.detailLogo} 
                  />
                ) : (
                  (editData.image || item.image) && (
                    <Image 
                      source={editData.image ? (editData.image.startsWith('http') ? { uri: editData.image } : { uri: `local-file:///${editData.image}` }) : item.image} 
                      style={styles.detailCover} 
                    />
                  )
                )}
              </View>
            )}

            {/* RIGHT: BLURRED INFO PANEL */}
            <View style={styles.detailRight}>
              <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
              
              <View style={styles.infoPanel}>
                {isSmallScreen ? (
                   (editData.logo || item.logo) ? (
                    <Image 
                      source={editData.logo ? (editData.logo.startsWith('http') ? { uri: editData.logo } : { uri: `local-file:///${editData.logo}` }) : item.logo} 
                      style={[styles.detailLogo, { width: '100%', height: 120, marginBottom: 20 }]} 
                    />
                  ) : (
                    <Text style={styles.detailTitle} numberOfLines={2}>{item.title}</Text>
                  )
                ) : (
                  <Text style={styles.detailTitle} numberOfLines={2}>{item.title}</Text>
                )}
                
                <View style={styles.ratingContainer}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Ionicons 
                      key={s} 
                      name={s <= (item.rating ?? 5) ? "star" : "star-outline"} 
                      size={18} 
                      color="#FFD700" 
                      style={{ marginRight: 4 }}
                    />
                  ))}
                  <Text style={styles.ratingText}>{item.rating?.toFixed(1) ?? '5.0'}</Text>
                </View>

                <View style={styles.detailActions}>
                  <TouchableOpacity
                    style={[
                      styles.playButton, 
                      focusIndex === 0 && styles.buttonFocused
                    ]}
                    onPress={() => {
                      setFocusIndex(0);
                      if (item.path) {
                        if (onLaunch) {
                          onLaunch(item.id, item.path);
                        } else if (Platform.OS === 'web' && (window as any).electronAPI) {
                          (window as any).electronAPI.launchApp(item.id, item.path);
                        }
                      }
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="play" size={24} color="#FFF" />
                      <Text style={[styles.playButtonText, { marginLeft: 10 }]}>JUGAR</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.optionsButton, 
                      focusIndex === 1 && styles.buttonFocused
                    ]}
                    onPress={() => {
                      setFocusIndex(1);
                      setEditModalVisible(true);
                    }}
                  >
                    <Ionicons name="ellipsis-vertical" size={24} color="#FFF" />
                  </TouchableOpacity>
                </View>

                <ScrollView 
                  style={styles.detailScrollView} 
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 40 }}
                >
                  <Text style={styles.detailDescription}>
                    {item.description ?? 'Disfruta de esta increíble experiencia de juego en tu WConsole.'}
                  </Text>

                  <View style={styles.mediaContainer}>
                    {item.youtubeId ? (
                      <YoutubePlayer
                        height={200}
                        play={isVisible}
                        videoId={item.youtubeId}
                      />
                    ) : item.video ? (
                      <View style={styles.videoWrapper}>
                        <video
                          key={item.video.uri}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          autoPlay
                          muted
                          loop
                          playsInline
                          preload="auto"
                        >
                          <source src={item.video.uri} />
                        </video>
                      </View>
                    ) : (
                      item.image && <Image source={item.image} style={styles.detailScreenshot} />
                    )}
                  </View>
                </ScrollView>
              </View>
            </View>
          </View>
        </View>


        {isLaunching && (
          <BlurView intensity={90} tint="dark" style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}>
            <View style={styles.launchingOverlay}>
              <MaterialCommunityIcons name="controller-classic" size={100} color="#00FFFF" />
              <Text style={styles.launchingText}>Ejecutándose...</Text>
            </View>
          </BlurView>
        )}
      </View>

      {/* EDIT MODAL */}
      <Modal visible={isEditModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Aplicación</Text>

            <TouchableOpacity 
              style={[styles.syncBtn, isSyncing && { opacity: 0.7 }, editModalFocusIndex === 0 && styles.buttonFocused]} 
              onPress={handleSyncIGDB}
              disabled={isSyncing}
            >
              <Ionicons name="sync" size={18} color="#000" />
              <Text style={styles.syncBtnText}>{isSyncing ? 'Sincronizando...' : 'Sincronizar con IGDB (Rating/Resumen)'}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.syncBtn, { backgroundColor: '#171a21' }, isSyncing && { opacity: 0.7 }, editModalFocusIndex === 1 && styles.buttonFocused]} 
              onPress={handleSyncSteamGrid}
              disabled={isSyncing}
            >
              <Ionicons name="images" size={18} color="#FFF" />
              <Text style={[styles.syncBtnText, { color: '#FFF' }]}>{isSyncing ? 'Sincronizando...' : 'Sincronizar con SteamGridDB (Arte)'}</Text>
            </TouchableOpacity>

            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.label}>Título</Text>
              <TextInput
                ref={editTitleRef}
                style={[styles.input, editModalFocusIndex === 2 && styles.inputFocused]}
                value={editData.title}
                onChangeText={(text) => setEditData({ ...editData, title: text })}
              />

              <Text style={styles.label}>Descripción</Text>
              <TextInput
                ref={editDescRef}
                style={[styles.input, { height: 80 }, editModalFocusIndex === 3 && styles.inputFocused]}
                multiline
                value={editData.description}
                onChangeText={(text) => setEditData({ ...editData, description: text })}
              />

              <TouchableOpacity 
                style={[styles.fileBtn, editModalFocusIndex === 4 && styles.buttonFocused]} 
                onPress={() => handleSelectImage('image')}
              >
                <Ionicons name="image" size={20} color="#FFF" />
                <Text style={styles.fileBtnText}>Cambiar Portada</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.fileBtn, editModalFocusIndex === 5 && styles.buttonFocused]} 
                onPress={() => handleSelectImage('logo')}
              >
                <Ionicons name="color-palette" size={20} color="#FFF" />
                <Text style={styles.fileBtnText}>Cambiar Logo (PNG)</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.fileBtn, editModalFocusIndex === 6 && styles.buttonFocused]} 
                onPress={() => handleSelectImage('backgroundImage')}
              >
                <Ionicons name="images" size={20} color="#FFF" />
                <Text style={styles.fileBtnText}>Cambiar Fondo</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.fileBtn, editModalFocusIndex === 7 && styles.buttonFocused]} 
                onPress={handleSelectVideo}
              >
                <Ionicons name="videocam" size={20} color="#FFF" />
                <Text style={styles.fileBtnText}>Cambiar Video</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.deleteBtn, editModalFocusIndex === 8 && styles.buttonFocused]} 
                onPress={handleDeleteApp}
              >
                <Ionicons name="trash-outline" size={20} color="#FF2D55" />
              </TouchableOpacity>
              
              <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end' }}>
                <TouchableOpacity 
                  style={[styles.cancelBtn, editModalFocusIndex === 9 && styles.buttonFocused]} 
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.saveBtn, editModalFocusIndex === 10 && styles.buttonFocused]} 
                  onPress={handleSaveEdit}
                >
                  <Text style={styles.saveBtnText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  detailContainer: { 
    flex: 1, 
    backgroundColor: '#000' 
  },
  detailBg: { 
    position: 'absolute', 
    width: '100%', 
    height: '100%', 
    resizeMode: 'cover',
    opacity: 0.6 
  },
  detailOverlay: { 
    flex: 1, 
    flexDirection: 'row' 
  },
  detailBack: { 
    position: 'absolute', 
    top: 40, 
    left: 40, 
    zIndex: 30, 
    width: 50, 
    height: 50, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  favoriteButton: { 
    position: 'absolute', 
    top: 40, 
    right: 520, // Adjusted to be outside the info panel or inside it? Let's put it inside info panel or top right of the whole screen.
    zIndex: 30, 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  favoriteButtonActive: { 
    backgroundColor: 'rgba(255, 45, 85, 0.2)', 
    borderColor: 'rgba(255, 45, 85, 0.5)' 
  },
  detailContent: { 
    flex: 1, 
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  detailLeft: { 
    flex: 1, 
    justifyContent: 'flex-end', 
    paddingLeft: 80, 
    paddingBottom: 100 
  },
  detailLogo: { 
    width: 450, 
    height: 220, 
    resizeMode: 'contain' 
  },
  detailCover: { 
    width: 320, 
    height: 190, 
    borderRadius: 18, 
    resizeMode: 'cover', 
    borderWidth: 3, 
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  detailRight: { 
    width: '40%', // Fixed width usually better, but let's make it responsive
    maxWidth: 480,
    minWidth: 380,
    height: '100%',
    overflow: 'hidden',
  },
  infoPanel: {
    flex: 1,
    padding: 50,
    paddingTop: 120,
  },
  detailTitle: { 
    color: '#FFF', 
    fontSize: 34, 
    fontWeight: '800', 
    marginBottom: 8, 
    letterSpacing: 0.5 
  },
  ratingContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 30 
  },
  ratingText: { 
    color: '#FFD700', 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginLeft: 8 
  },
  detailActions: { 
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40 
  },
  playButton: { 
    flex: 1,
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#00BD10', 
    paddingHorizontal: 30, 
    paddingVertical: 15, 
    borderRadius: 14, 
    marginRight: 12,
    shadowColor: '#00BD10',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  playButtonText: { 
    color: '#FFF', 
    fontSize: 16, 
    fontWeight: '800', 
    letterSpacing: 1 
  },
  optionsButton: { 
    width: 54,
    height: 54,
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)', 
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)'
  },
  detailScrollView: { 
    flex: 1 
  },
  detailDescription: { 
    color: 'rgba(255,255,255,0.75)', 
    fontSize: 15, 
    lineHeight: 24, 
    marginBottom: 30,
    fontWeight: '400'
  },
  mediaContainer: { 
    width: '100%', 
    height: 200, 
    borderRadius: 16, 
    overflow: 'hidden', 
    backgroundColor: '#000', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.1)',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  videoWrapper: { width: '100%', height: '100%' },
  detailScreenshot: { width: '100%', height: '100%', resizeMode: 'cover' },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: 480, backgroundColor: '#1C1C1E', borderRadius: 24, padding: 35, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginBottom: 25, textAlign: 'center' },
  label: { color: '#8E8E93', fontSize: 13, marginBottom: 8, marginLeft: 5, textTransform: 'uppercase', letterSpacing: 1 },
  input: { backgroundColor: '#000', color: '#FFF', padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#333', fontSize: 16 },
  inputFocused: {
    borderColor: '#00FFFF',
    backgroundColor: '#0A0A0A',
  },
  fileBtn: { backgroundColor: '#2C2C2E', padding: 18, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  fileBtnText: { color: '#FFF', marginLeft: 12, fontSize: 15, fontWeight: '500' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 },
  cancelBtn: { flex: 1, padding: 16, backgroundColor: '#3A3A3C', borderRadius: 12, marginRight: 10, alignItems: 'center' },
  cancelBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  saveBtn: { flex: 1, padding: 16, backgroundColor: '#00FFFF', borderRadius: 12, marginLeft: 10, alignItems: 'center' },
  saveBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  deleteBtn: {
    width: 54,
    height: 54,
    backgroundColor: 'rgba(255, 45, 85, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 45, 85, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  syncBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFD700', padding: 16, borderRadius: 12, marginBottom: 20 },
  syncBtnText: { color: '#000', fontWeight: '800', marginLeft: 10, fontSize: 15 },
  buttonFocused: {
    borderColor: '#FFF',
    borderWidth: 3,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    transform: [{ scale: 1.04 }],
    zIndex: 10,
  },
  launchingOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  launchingText: {
    color: '#00FFFF',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 25,
    letterSpacing: 6,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 255, 255, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },

});


export default GameDetailView;
