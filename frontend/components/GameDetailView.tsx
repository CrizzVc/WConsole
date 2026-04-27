import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, Platform, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ConsoleItem } from '../app/(tabs)/index';

interface GameDetailViewProps {
  isVisible: boolean;
  item: ConsoleItem | null;
  onClose: () => void;
  onLaunch?: (path: string) => void;
  onRefresh?: () => void;
}

const GameDetailView: React.FC<GameDetailViewProps> = ({ isVisible, item, onClose, onLaunch, onRefresh }) => {
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editData, setEditData] = useState<Partial<ConsoleItem>>({});

  useEffect(() => {
    if (item) {
      const initialData: any = {
        id: item.id,
        title: item.title,
        description: item.description,
        rating: item.rating,
        image: item.image?.uri?.startsWith('local-file://') ? item.image.uri.replace('local-file://', '') : undefined,
        logo: item.logo?.uri?.startsWith('local-file://') ? item.logo.uri.replace('local-file://', '') : undefined,
        backgroundImage: item.backgroundImage?.uri?.startsWith('local-file://') ? item.backgroundImage.uri.replace('local-file://', '') : undefined,
        video: item.video?.uri?.startsWith('local-file://') ? item.video.uri.replace('local-file://', '') : undefined,
      };

      setEditData(initialData);
    }
  }, [item, isVisible]);

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

  return (
    <Modal visible={isVisible} transparent={false} animationType="fade" onRequestClose={onClose}>
      <View style={styles.detailContainer}>
        {/* BACKGROUND: Prefer custom backgroundImage, then fallback to image, then black */}
        {item.backgroundImage ? (
          <Image source={item.backgroundImage} style={styles.detailBg} />
        ) : (
          item.image && <Image source={item.image} style={styles.detailBg} />
        )}

        <View style={styles.detailOverlay}>
          <TouchableOpacity style={styles.detailBack} onPress={onClose}>
            <Ionicons name="arrow-back-outline" size={28} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.detailContent}>
            <View style={styles.detailLeft}>
              {item.logo ? (
                <Image source={item.logo} style={styles.detailLogo} />
              ) : (
                item.image && (
                  <Image source={item.image} style={styles.detailCover} />
                )
              )}
            </View>

            <View style={styles.detailRight}>
              <Text style={styles.detailTitle}>{item.title}</Text>

              <View style={styles.detailActions}>
                <TouchableOpacity
                  style={[styles.playButton, , { backgroundColor: 'rgba(0, 189, 16, 0.62)' }]}
                  onPress={() => {
                    if (item.path) {
                      if (onLaunch) {
                        onLaunch(item.path);
                      } else if (Platform.OS === 'web' && (window as any).electronAPI) {
                        (window as any).electronAPI.launchApp(item.path);
                      }
                    }
                  }}
                >
                  <Ionicons name="play" size={18} color="#FFF" />
                  <Text style={styles.playButtonText}>inicio</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.playButton, { backgroundColor: 'rgba(255,255,255,0.05)', marginLeft: 10 }]}
                  onPress={() => setEditModalVisible(true)}
                >
                  <Ionicons name="settings-outline" size={18} color="#FFF" />
                  <Text style={styles.playButtonText}>Editar</Text>
                </TouchableOpacity>

                <View style={styles.ratingContainer}>
                  <Ionicons name="star-outline" size={22} color="#FFD700" />
                  <Text style={styles.ratingText}>{item.rating?.toFixed(1) ?? '5.0'}</Text>
                </View>
              </View>

              <Text style={styles.detailDescription}>
                {item.description ?? 'Disfruta de esta increíble experiencia de juego.'}
              </Text>

              <View style={styles.mediaContainer}>
                {item.video ? (
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
            </View>
          </View>
        </View>
      </View>

      {/* EDIT MODAL */}
      <Modal visible={isEditModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Aplicación</Text>

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
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit}>
                <Text style={styles.saveBtnText}>Guardar Cambios</Text>
              </TouchableOpacity>
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
  detailRight: { width: 340, justifyContent: 'flex-end' },
  detailTitle: { color: '#FFF', fontSize: 26, fontWeight: 'bold', marginBottom: 18, letterSpacing: 0.4 },
  detailActions: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  playButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 8, marginRight: 22 },
  playButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600', marginLeft: 10 },
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
});

export default GameDetailView;
