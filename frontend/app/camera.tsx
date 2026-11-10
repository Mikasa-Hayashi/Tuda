import { LoadingOverlay } from '@/src/components/LoadingOverlay';
import { ScannerFrame } from '@/src/components/ScannerFrame';
import { recognizeImage, type RecognitionCandidate } from '@/src/services/recognitionApi';
import {
  Button,
  ContentUnavailableView,
  Host,
  HStack,
  Image as SymbolImage,
  Spacer,
} from '@expo/ui/swift-ui';
import {
  buttonBorderShape,
  buttonStyle,
  controlSize,
  frame,
  labelStyle,
  preferredColorScheme,
} from '@expo/ui/swift-ui/modifiers';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StatusBar, StyleSheet, View } from 'react-native';
import { initialWindowMetrics } from 'react-native-safe-area-context';

const SIDE_BUTTON = 56;
const SHUTTER_SIZE = 78;

export default function CameraScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const cameraRef = useRef<CameraView>(null);
  const dark = preferredColorScheme('dark');

  useEffect(() => {
    if (!permission?.granted && permission?.canAskAgain !== false) requestPermission();
  }, [permission, requestPermission]);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Host style={styles.container} modifiers={[dark]}>
          <ContentUnavailableView
            title={t('camera.permission')}
            systemImage="camera.fill"
            actions={
              <Button
                label={t('camera.grant')}
                onPress={requestPermission}
                modifiers={[buttonStyle('glassProminent'), controlSize('large')]}
              />
            }
          />
        </Host>
      </View>
    );
  }

  /** Native alert: recognition failed, optionally with up to two "maybe it's…" candidates. */
  const showFailure = (kind: 'error' | 'notFound', options: RecognitionCandidate[] = []) => {
    Alert.alert(
      kind === 'error' ? t('camera.error') : t('camera.notFound'),
      kind === 'error' ? t('camera.errorHint') : t('camera.notFoundHint'),
      [
        ...options.map((o) => ({
          text: t('camera.maybe', { name: o.name }),
          onPress: () => router.push(`/info?id=${o.id}`),
        })),
        { text: t('camera.retry'), style: 'cancel' as const },
      ],
    );
  };

  const processUri = async (uri: string) => {
    setLoading(true);
    try {
      const result = await recognizeImage(uri, i18n.language);
      if (result.recognized && result.id) {
        router.push(`/info?id=${result.id}`);
      } else {
        const options = result.top.filter((c) => !c.neg && c.id && c.p >= 0.1).slice(0, 2);
        showFailure('notFound', options);
      }
    } catch {
      showFailure('error');
    } finally {
      setLoading(false);
    }
  };

  const handleTakePicture = async () => {
    if (!cameraRef.current || isProcessing) return;
    setIsProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.6 });
      if (photo?.uri) await processUri(photo.uri);
    } catch {
      showFailure('error');
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
    <>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button
          icon="xmark"
          accessibilityLabel={t('camera.close')}
          onPress={() => router.back()}
        />
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon={isTorchOn ? 'bolt.fill' : 'bolt.slash'}
          accessibilityLabel={t('camera.torch')}
          onPress={() => setIsTorchOn((v) => !v)}
        />
      </Stack.Toolbar>

      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          enableTorch={isTorchOn && facing === 'back'}
        />
        <View style={styles.frameWrap} pointerEvents="none">
          <ScannerFrame />
        </View>

        {/* Native glass controls: gallery, shutter, and a balancing spacer. */}
        <View
          pointerEvents="box-none"
          style={[styles.controls, { bottom: (initialWindowMetrics?.insets.bottom ?? 0) + 24 }]}
        >
          <Host style={styles.controlsHost} modifiers={[dark]}>
            <HStack>
              <Button
                label={t('camera.gallery')}
                systemImage="photo.on.rectangle"
                onPress={handlePickFromGallery}
                modifiers={[
                  buttonStyle('glass'),
                  controlSize('large'),
                  labelStyle('iconOnly'),
                  frame({ width: SIDE_BUTTON, height: SIDE_BUTTON }),
                ]}
              />
              <Spacer />
              {/* Shutter: white disc inside a glass ring, like the system Camera. */}
              <Button
                onPress={handleTakePicture}
                modifiers={[
                  buttonStyle('glass'),
                  buttonBorderShape('circle'),
                  frame({ width: SHUTTER_SIZE, height: SHUTTER_SIZE }),
                ]}
              >
                <SymbolImage
                  systemName="circle.fill"
                  size={SHUTTER_SIZE - 20}
                  color={isProcessing ? '#8E8E93' : '#FFFFFF'}
                />
              </Button>
              <Spacer />
              <Button
                label={t('camera.flip')}
                systemImage="arrow.triangle.2.circlepath.camera"
                onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
                modifiers={[
                  buttonStyle('glass'),
                  controlSize('large'),
                  labelStyle('iconOnly'),
                  frame({ width: SIDE_BUTTON, height: SIDE_BUTTON }),
                ]}
              />
            </HStack>
          </Host>
        </View>

        <LoadingOverlay visible={loading} text={t('camera.processing')} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  frameWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: { position: 'absolute', left: 28, right: 28 },
  controlsHost: { height: 84 },
});
