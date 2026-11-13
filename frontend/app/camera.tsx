import { achievements } from '@/src/storage/achievements';
import { scanHistory } from '@/src/storage/scanHistory';
import { LoadingOverlay } from '@/src/components/LoadingOverlay';
import { useDeviceRotation } from '@/src/hooks/useDeviceRotation';
import { normalizeOrientation } from '@/src/services/imageOrientation';
import { ScannerFrame } from '@/src/components/ScannerFrame';
import { recognizeImage, type RecognitionCandidate } from '@/src/services/recognitionApi';
import {
  Button,
  ContentUnavailableView,
  Host,
  HStack,
  Image as SymbolImage,
  Spacer,
  VStack,
} from '@expo/ui/swift-ui';
import {
  Animation,
  accessibilityLabel,
  animation,
  buttonBorderShape,
  buttonStyle,
  controlSize,
  frame,
  padding,
  preferredColorScheme,
  rotationEffect,
} from '@expo/ui/swift-ui/modifiers';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StatusBar, StyleSheet, View } from 'react-native';

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
  // Only the glyphs turn with the phone (the screen stays portrait), like the system Camera.
  const rotation = useDeviceRotation();
  const turn = [
    rotationEffect(rotation),
    animation(Animation.easeInOut({ duration: 0.3 }), rotation),
  ];

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
          onPress: () => {
            router.dismiss();
            router.push(`/info?id=${o.id}`);
          },
        })),
        { text: t('camera.retry'), style: 'cancel' as const },
      ],
    );
  };

  const processUri = async (rawUri: string, extraDegrees = 0) => {
    setLoading(true);
    try {
      const uri = await normalizeOrientation(rawUri, extraDegrees);
      const result = await recognizeImage(uri, i18n.language);
      if (result.recognized && result.id) {
        achievements.recordScan();
        scanHistory.record({
          monumentId: result.id,
          confidence: result.confidence,
          recognized: true,
          photoUri: uri,
        });
        router.push({
          pathname: '/scan-result',
          params: { id: result.id, p: String(result.confidence) },
        });
      } else {
        const options = result.top.filter((c) => !c.neg && c.id && c.p >= 0.1).slice(0, 2);
        if (options.length > 0) {
          scanHistory.record({
            monumentId: options[0].id as string,
            confidence: options[0].p,
            recognized: false,
            photoUri: uri,
          });
          router.push({
            pathname: '/scan-result',
            params: { alt: options.map((o) => `${o.id}:${o.p}`).join(',') },
          });
        } else {
          showFailure('notFound');
        }
      }
    } catch (e) {
      console.warn('[scan] recognition failed:', e);
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
      // `rotation` is the angle the icons turn to stay upright; the picture needs the opposite turn.
      if (photo?.uri) await processUri(photo.uri, -rotation);
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

        {/* Native glass controls. The SwiftUI host fills the screen and lays the row out inside the
            system safe area, so no manual inset maths: gallery, shutter, flip. */}
        <Host style={StyleSheet.absoluteFill} modifiers={[dark]}>
          <VStack>
            <Spacer />
            <HStack modifiers={[padding({ horizontal: 28, bottom: 16 })]}>
              <Button
                onPress={handlePickFromGallery}
                modifiers={[
                  buttonStyle('glass'),
                  buttonBorderShape('circle'),
                  controlSize('large'),
                  frame({ width: SIDE_BUTTON, height: SIDE_BUTTON }),
                  accessibilityLabel(t('camera.gallery')),
                ]}
              >
                <SymbolImage systemName="photo.on.rectangle" size={22} color="#FFFFFF" modifiers={turn} />
              </Button>
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
                onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
                modifiers={[
                  buttonStyle('glass'),
                  buttonBorderShape('circle'),
                  controlSize('large'),
                  frame({ width: SIDE_BUTTON, height: SIDE_BUTTON }),
                  accessibilityLabel(t('camera.flip')),
                ]}
              >
                <SymbolImage systemName="arrow.triangle.2.circlepath.camera" size={22} color="#FFFFFF" modifiers={turn} />
              </Button>
            </HStack>
          </VStack>
        </Host>

        <LoadingOverlay visible={loading} text={t('camera.processing')} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  frameWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
