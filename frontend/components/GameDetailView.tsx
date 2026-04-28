import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, Platform, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ConsoleItem } from '../app/(tabs)/index';
import YoutubePlayer from './YoutubePlayer';

interface GameDetailViewProps {
  isVisible: boolean;
  item: ConsoleItem | null;
  onClose: () => void;
  onLaunch?: (id: string, path: string) => void;
  onRefresh?: () => void;
}

const GameDetailView: React.FC<GameDetailViewProps> = ({ isVisible, item, onClose, onLaunch, onRefresh }) => {
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editData, setEditData] = useState<Partial<ConsoleItem>>({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [focusIndex, setFocusIndex] = useState(0); // 0: Inicio, 1: Editar, 2: Favorito


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

  // Keyboard navigation within Detail View
  useEffect(() => {
    if (isVisible && !isEditModalVisible) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Enter', ' '].includes(e.key)) {
          e.preventDefault();
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
  }, [isVisible, isEditModalVisible, focusIndex, item, onLaunch, onClose]);

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
        {/* BACKGROUND: Prefer custom backgroundImage, then fallback to image, then black */}
        {/* BACKGROUND: Prefer editData for live preview, then fallback to item, then image */}
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
          <TouchableOpacity 
            style={styles.detailBack} 
            onPress={onClose}
            accessible={false}
          >
            <Ionicons name="arrow-back-outline" size={28} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.favoriteButton, 
              item.isFavorite && styles.favoriteButtonActive,
              focusIndex === 2 && styles.buttonFocused
            ]}
            onPress={() => {
              setFocusIndex(2);
              handleToggleFavorite();
            }}
          >
            <Ionicons name={item.isFavorite ? "heart" : "heart-outline"} size={22} color={item.isFavorite ? "#FF2D55" : "#FFF"} />
          </TouchableOpacity>

          <View style={styles.detailContent}>
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

            <View style={styles.detailRight}>
              <Text style={styles.detailTitle}>{item.title}</Text>

              <View style={styles.detailActions}>
                <TouchableOpacity
                  style={[
                    styles.playButton, 
                    { backgroundColor: 'rgba(0, 189, 16, 0.62)' },
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
                  <Ionicons name="play" size={18} color="#FFF" />
                  <Text style={styles.playButtonText}>inicio</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.playButton, 
                    { backgroundColor: 'rgba(255,255,255,0.05)', marginLeft: 10 },
                    focusIndex === 1 && styles.buttonFocused
                  ]}
                  onPress={() => {
                    setFocusIndex(1);
                    setEditModalVisible(true);
                  }}
                >
                  <Ionicons name="settings-outline" size={18} color="#FFF" />
                  <Text style={styles.playButtonText}>Editar</Text>
                </TouchableOpacity>


                <View style={styles.ratingContainer}>
                  <Ionicons name="star-outline" size={22} color="#FFD700" />
                  <Text style={styles.ratingText}>{item.rating?.toFixed(1) ?? '5.0'}</Text>
                </View>
              </View>

              <ScrollView 
                style={styles.detailScrollView} 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                <Text style={styles.detailDescription}>
                  {item.description ?? 'Disfruta de esta increíble experiencia de juego.'}
                </Text>

                <View style={styles.mediaContainer}>
                  {item.youtubeId ? (
                    <YoutubePlayer
                      height={185}
                      play={isVisible}
                      videoId={item.youtubeId}
                    />
                  ) : item.video ? (
                    <View style={styles.videoWrapper}>
                      {/* En Electron/Web usamos un tag de video estándar */}
                      <video
                        key={item.video.uri}
                        style={{ width: '100%', height: '100%', borderRadius: 12, objectFit: 'cover' }}
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

      {/* EDIT MODAL */}
      <Modal visible={isEditModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Aplicación</Text>

            <TouchableOpacity 
              style={[styles.syncBtn, isSyncing && { opacity: 0.7 }]} 
              onPress={handleSyncIGDB}
              disabled={isSyncing}
            >
              <Ionicons name="sync" size={18} color="#000" />
              <Text style={styles.syncBtnText}>{isSyncing ? 'Sincronizando...' : 'Sincronizar con IGDB (Rating/Resumen)'}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.syncBtn, { backgroundColor: '#171a21' }, isSyncing && { opacity: 0.7 }]} 
              onPress={handleSyncSteamGrid}
              disabled={isSyncing}
            >
              <Ionicons name="images" size={18} color="#FFF" />
              <Text style={[styles.syncBtnText, { color: '#FFF' }]}>{isSyncing ? 'Sincronizando...' : 'Sincronizar con SteamGridDB (Arte)'}</Text>
            </TouchableOpacity>



            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.label}>Título</Text>
              <TextInput
                style={styles.input}
                value={editData.title}
                onChangeText={(text) => setEditData({ ...editData, title: text })}
              />

              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                multiline
                value={editData.description}
                onChangeText={(text) => setEditData({ ...editData, description: text })}
              />

              <TouchableOpacity style={styles.fileBtn} onPress={() => handleSelectImage('image')}>
                <Ionicons name="image" size={20} color="#FFF" />
                <Text style={styles.fileBtnText}>Cambiar Portada</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.fileBtn} onPress={() => handleSelectImage('logo')}>
                <Ionicons name="color-palette" size={20} color="#FFF" />
                <Text style={styles.fileBtnText}>Cambiar Logo (PNG)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.fileBtn} onPress={() => handleSelectImage('backgroundImage')}>
                <Ionicons name="images" size={20} color="#FFF" />
                <Text style={styles.fileBtnText}>Cambiar Fondo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.fileBtn} onPress={handleSelectVideo}>
                <Ionicons name="videocam" size={20} color="#FFF" />
                <Text style={styles.fileBtnText}>Cambiar Video</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteApp}>
                <Ionicons name="trash-outline" size={20} color="#FF2D55" />
              </TouchableOpacity>
              
              <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end' }}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit}>
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
  detailContainer: { flex: 1, backgroundColor: '#000' },
  detailBg: { position: 'absolute', width: '100%', height: '100%', resizeMode: 'cover', opacity: 0.35 },
  detailOverlay: { flex: 1, backgroundColor: 'rgba(10,10,20,0.72)' },
  detailBack: { position: 'absolute', top: 24, left: 28, zIndex: 20, width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 22 },
  detailContent: { flex: 1, flexDirection: 'row', paddingHorizontal: 55, paddingBottom: 60, alignItems: 'flex-end' },
  detailLeft: { flex: 1, justifyContent: 'flex-end', marginRight: 45 },
  detailCover: { width: 280, height: 170, borderRadius: 14, resizeMode: 'cover', borderWidth: 2, borderColor: 'rgba(0,255,255,0.3)' },
  detailLogo: { width: 320, height: 180, resizeMode: 'contain' },
  detailRight: { width: 440, height: '70%', justifyContent: 'flex-end' },
  detailScrollView: { flex: 1, marginTop: 10 },
  detailTitle: { color: '#FFF', fontSize: 26, fontWeight: 'bold', marginBottom: 18, letterSpacing: 0.4 },
  detailActions: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  playButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 8, marginRight: 22 },
  playButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600', marginLeft: 10 },
  favoriteButton: { position: 'absolute', top: 24, right: 28, zIndex: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  favoriteButtonActive: { backgroundColor: 'rgba(255, 45, 85, 0.2)', borderWidth: 1, borderColor: 'rgba(255, 45, 85, 0.5)' },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' },
  ratingText: { color: '#FFD700', fontSize: 22, fontWeight: 'bold', marginLeft: 7 },
  detailDescription: { color: 'rgba(255,255,255,0.72)', fontSize: 13, lineHeight: 21, marginBottom: 18 },
  mediaContainer: { width: '100%', height: 185, borderRadius: 12, overflow: 'hidden', backgroundColor: '#111', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  videoWrapper: { width: '100%', height: '100%' },
  detailScreenshot: { width: '100%', height: '100%', resizeMode: 'cover' },

  // Modal styles (shared with index.tsx basically)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: 450, backgroundColor: '#1A1A1A', borderRadius: 16, padding: 25, borderWidth: 1, borderColor: '#333' },
  modalTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { color: '#888', fontSize: 12, marginBottom: 5, marginLeft: 5, textTransform: 'uppercase' },
  input: { backgroundColor: '#0D0D0D', color: '#FFF', padding: 12, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  fileBtn: { backgroundColor: '#262626', padding: 15, borderRadius: 8, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  fileBtnText: { color: '#FFF', marginLeft: 10, fontSize: 14 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  cancelBtn: { flex: 1, padding: 14, backgroundColor: '#333', borderRadius: 8, marginRight: 8, alignItems: 'center' },
  cancelBtnText: { color: '#FFF', fontWeight: 'bold' },
  saveBtn: { flex: 1, padding: 14, backgroundColor: '#00FFFF', borderRadius: 8, marginLeft: 8, alignItems: 'center' },
  saveBtnText: { color: '#000', fontWeight: 'bold' },
  deleteBtn: {
    padding: 14,
    backgroundColor: 'rgba(255, 45, 85, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 45, 85, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  syncBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFD700', padding: 12, borderRadius: 8, marginBottom: 20 },
  syncBtnText: { color: '#000', fontWeight: 'bold', marginLeft: 8, fontSize: 14 },
  buttonFocused: {
    borderColor: '#00FFFF',
    borderWidth: 2,
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    transform: [{ scale: 1.05 }],
  },
});


export default GameDetailView;
