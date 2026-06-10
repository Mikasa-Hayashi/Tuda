import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type TopControlProps = {
  isTorchOn: boolean;
  onToggleTorch: () => void;
  onToggleMap: () => void;
};

export const TopControlPanel: React.FC<TopControlProps> = ({ isTorchOn, onToggleTorch, onToggleMap }) => (
  <SafeAreaView style={styles.container}>
    <View style={styles.row}>
      <TouchableOpacity onPress={onToggleTorch} style={styles.iconButton}>
        <Ionicons
          name={isTorchOn ? 'flash' : 'flash-off'}
          size={28}
          color={isTorchOn ? '#FFD700' : 'white'}
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={onToggleMap} style={styles.iconButton}>
        <Ionicons name="location-sharp" size={28} color="#FFD700" />
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: { backgroundColor: 'black' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  iconButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
});
