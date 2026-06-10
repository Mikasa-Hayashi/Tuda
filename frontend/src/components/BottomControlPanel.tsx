import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

type BottomControlProps = {
  onTakePicture: () => void;
  onOpenGallery: () => void;
  isProcessing: boolean;
};

export const BottomControlPanel: React.FC<BottomControlProps> = ({
  onTakePicture,
  onOpenGallery,
  isProcessing,
}) => (
  <View style={styles.container}>
    <View style={styles.row}>
      <TouchableOpacity onPress={onOpenGallery} style={styles.galleryButton}>
        <Ionicons name="images" size={28} color="white" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onTakePicture}
        disabled={isProcessing}
        style={styles.shutterOuter}
      >
        <View style={[styles.shutterInner, isProcessing && styles.shutterDisabled]} />
      </TouchableOpacity>
      <View style={styles.spacer} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: 'black',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 30,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  shutterDisabled: { backgroundColor: '#ccc' },
  spacer: { width: 50 },
});
