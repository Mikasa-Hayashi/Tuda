import { BottomControlPanel } from '@/src/components/BottomControlPanel';
import { LoadingOverlay } from '@/src/components/LoadingOverlay';
import { ScannerFrame } from '@/src/components/ScannerFrame';
import { TopControlPanel } from '@/src/components/TopControlPanel';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CameraScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission, requestPermission]);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permText}>We need your permission to show the camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permButton}>
          <Text style={styles.permButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleTakePicture = async () => {
    if (!cameraRef.current) return;
    setLoading(true);
    try {
      await cameraRef.current.pausePreview();
      setIsProcessing(true);
      const photo = await cameraRef.current.takePictureAsync();
      if (photo) {
        router.push('/info?id=1');
      }
    } catch {
      Alert.alert('Error', 'Failed to take picture.');
    } finally {
      setLoading(false);
      setIsProcessing(false);
      await cameraRef.current?.resumePreview();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBlock}>
        <TopControlPanel
          isTorchOn={isTorchOn}
          onToggleTorch={() => setIsTorchOn((v) => !v)}
          onToggleMap={() => router.replace('/')}
        />
      </View>
      <View style={styles.cameraContainer}>
        <View style={styles.cameraWrapper}>
          <CameraView ref={cameraRef} style={styles.camera} enableTorch={isTorchOn}>
            <ScannerFrame />
          </CameraView>
        </View>
        <BottomControlPanel
          onTakePicture={handleTakePicture}
          onOpenGallery={() => Alert.alert('Gallery', 'Opening Gallery...')}
          isProcessing={isProcessing}
        />
      </View>
      <LoadingOverlay visible={loading} text="Обработка фото..." />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  topBlock: { backgroundColor: 'black', zIndex: 10 },
  cameraContainer: { flex: 1, backgroundColor: 'black' },
  cameraWrapper: { flex: 1, alignItems: 'center' },
  camera: { width: '100%', aspectRatio: 3 / 4, justifyContent: 'center', alignItems: 'center' },
  permText: { textAlign: 'center', color: 'white' },
  permButton: { backgroundColor: 'white', padding: 10, marginTop: 20, borderRadius: 5 },
  permButtonText: { color: 'black' },
});
