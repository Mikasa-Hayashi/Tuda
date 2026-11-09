import { BottomControlPanel } from '@/src/components/BottomControlPanel';
import { LoadingOverlay } from '@/src/components/LoadingOverlay';
import { ScannerFrame } from '@/src/components/ScannerFrame';
import { TopControlPanel } from '@/src/components/TopControlPanel';
import { recognizeImage, type RecognitionCandidate } from '@/src/services/recognitionApi';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Failure = { kind: 'notFound'; options: RecognitionCandidate[] } | { kind: 'error' };

export default function CameraScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [failure, setFailure] = useState<Failure | null>(null);
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
        <Text style={styles.permText}>{t('camera.permission')}</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permButton}>
          <Text style={styles.permButtonText}>{t('camera.grant')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const processUri = async (uri: string) => {
    setLoading(true);
    setFailure(null);
    try {
      const result = await recognizeImage(uri, i18n.language);
      if (result.recognized && result.id) {
        router.push(`/info?id=${result.id}`);
      } else {
        const options = result.top.filter((c) => !c.neg && c.id && c.p >= 0.1).slice(0, 2);
        setFailure({ kind: 'notFound', options });
      }
    } catch {
      setFailure({ kind: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleTakePicture = async () => {
    if (!cameraRef.current) return;
    setIsProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.6 });
      if (photo?.uri) await processUri(photo.uri);
    } catch {
      setFailure({ kind: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePickFromGallery = async () => {
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!picked.canceled && picked.assets[0]?.uri) await processUri(picked.assets[0].uri);
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
          onOpenGallery={handlePickFromGallery}
          isProcessing={isProcessing}
        />
      </View>
      <LoadingOverlay visible={loading} text={t('camera.processing')} />
      {failure && (
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>
            {failure.kind === 'error' ? t('camera.error') : t('camera.notFound')}
          </Text>
          <Text style={styles.sheetHint}>
            {failure.kind === 'error' ? t('camera.errorHint') : t('camera.notFoundHint')}
          </Text>
          {failure.kind === 'notFound' &&
            failure.options.map((o) => (
              <TouchableOpacity
                key={o.id}
                style={styles.sheetOption}
                onPress={() => {
                  setFailure(null);
                  router.push(`/info?id=${o.id}`);
                }}
              >
                <Text style={styles.sheetOptionText}>{t('camera.maybe', { name: o.name })}</Text>
              </TouchableOpacity>
            ))}
          <TouchableOpacity style={styles.permButton} onPress={() => setFailure(null)}>
            <Text style={styles.permButtonText}>{t('camera.retry')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  topBlock: { backgroundColor: 'black', zIndex: 10 },
  cameraContainer: { flex: 1, backgroundColor: 'black' },
  cameraWrapper: { flex: 1, alignItems: 'center' },
  camera: { width: '100%', aspectRatio: 3 / 4, justifyContent: 'center', alignItems: 'center' },
  sheet: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 40,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#1c1c1e',
    zIndex: 20,
  },
  sheetTitle: { color: 'white', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  sheetHint: { color: '#c7c7cc', textAlign: 'center', marginTop: 6, marginBottom: 10 },
  sheetOption: { backgroundColor: '#2c2c2e', padding: 14, borderRadius: 12, marginTop: 8 },
  sheetOptionText: { color: 'white', textAlign: 'center', fontSize: 16 },
  permText: { textAlign: 'center', color: 'white' },
  permButton: { backgroundColor: 'white', padding: 10, marginTop: 20, borderRadius: 5 },
  permButtonText: { color: 'black' },
});
