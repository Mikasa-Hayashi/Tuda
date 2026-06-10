import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';

type LoadingOverlayProps = {
  visible: boolean;
  text?: string;
};

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible, text = 'Загрузка...' }) => (
  <Modal transparent visible={visible} animationType="fade">
    <View style={styles.overlay}>
      <View style={styles.box}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.text}>{text}</Text>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  box: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
  },
  text: { marginTop: 12, color: '#fff', fontSize: 16 },
});
