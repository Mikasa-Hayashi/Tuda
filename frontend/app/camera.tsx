import { BottomControlPanel } from '@/src/components/BottomControlPanel';
import { LoadingOverlay } from '@/src/components/LoadingOverlay';
import { ScannerFrame } from '@/src/components/ScannerFrame';
import { TopControlPanel } from '@/src/components/TopControlPanel';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
// import Toast from 'react-native-toast-message';

// --- Main Screen Component ---
export default function CameraScreen() {
  const [loading, setLoading] = useState(false);


  const router = useRouter(); 
  const [permission, requestPermission] = useCameraPermissions();
  // const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  
  const cameraRef = useRef<CameraView>(null);

  // Initial Permissions Check
  useEffect(() => {
    if (!permission?.granted) requestPermission();
    // if (!mediaPermission?.granted) requestMediaPermission();
  }, []);

  if (!permission) {
    return <View />; // Loading state
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', color: 'white' }}>
          We need your permission to show the camera
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permButton}>
          <Text style={{ color: 'black' }}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- Logic Functions ---

  const handleToggleTorch = () => {
    setIsTorchOn(prev => !prev);
  };

  const handleOpenGallery = () => {
    // In a real app, you would navigate to an ImagePicker or Gallery Screen
    Alert.alert("Gallery", "Opening Gallery...");
    // router.push('/map');
  };

  const sendToServer = async (imageUri: string) => {
    router.push('/info?id=1')
    // console.log("Sending image to server:", imageUri);

    // const formData = new FormData();

    // formData.append("image", {
    //   uri: imageUri,
    //   name: "iamge.jpg",
    //   type: "image/jpeg",
    // } as any);

    // try {
    //   const result = await api.post('/inference/fruit', formData, {
    //     headers: {
    //       'Content-Type': 'multipart/form-data',
    //     },
    //   });
    //   if (result.data.message === 'No objects detected')  {
    //     Toast.show({
    //       type: 'error',
    //       text1: 'No fruits detected',
    //     });
    //     return;
    //   }
        
    //   useFruitStore.getState().setFruitData(result.data.fruit_info);
    //   router.push('/info', result.data.fruit_info );
    // } catch (error) {
    //   Alert.alert("Error", "Failed to send image to server.");
    //   console.error(error);
    // }
  };

  const handleTakePicture = async () => {
    setLoading(true);
    if (cameraRef.current) {
      try {
        await cameraRef.current.pausePreview();
        setIsProcessing(true);
        const photo = await cameraRef.current.takePictureAsync();
        
        if (photo) {
          // await new Promise(resolve => setTimeout(resolve, 2500));
          // 1. Send request to server
          await sendToServer(photo.uri);
        }


        // await new Promise(resolve => setTimeout(resolve, 2500));
        // router.push('/info');
      } catch (error) {
        Alert.alert("Error", "Failed to take picture.");
        console.error(error);
      } finally {
        setLoading(false);
        setIsProcessing(false);
        await cameraRef.current?.resumePreview();
      }
    }
  };

  const handleOpenMap = () => {
    router.replace('/')
  }

  return (
    <View style={styles.container}>
      
      <View style={styles.topOpaqueBlock}>
        <TopControlPanel 
          isTorchOn={isTorchOn} 
          onToggleTorch={handleToggleTorch} 
          onToggleMap={handleOpenMap}
        />
      </View>

      <View style={styles.cameraContainer}>
        <View style={styles.cameraWrapper}>
          <CameraView 
            ref={cameraRef}
            style={styles.camera} 
            enableTorch={isTorchOn}
          >
            <ScannerFrame />
          </CameraView>
        </View>

        <BottomControlPanel 
          onTakePicture={handleTakePicture} 
          onOpenGallery={handleOpenGallery}
          isProcessing={isProcessing}
        />
      </View>
      <LoadingOverlay visible={loading} text="Обработка фото..." />
      {/* <Toast /> */}
    </View>
  );
}

// --- Styles ---
const { width } = Dimensions.get('window');
const FRAME_SIZE = 250;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  permButton: {
    backgroundColor: 'white',
    padding: 10,
    marginTop: 20,
    borderRadius: 5
  },
  
  // Layout Structure
  topOpaqueBlock: {
    backgroundColor: 'black',
    zIndex: 10, // Ensure it sits on top
    // Note: Height is determined by SafeAreaView inside the component
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  cameraWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  camera: {
    width: '100%',
    aspectRatio: 3 / 4,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Top Panel Styles
  topPanelContainer: {
    backgroundColor: 'black',
  },
  topPanelContent: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Pushes items to edges
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  iconButton: {
    // padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
  },

  // QR Frame Styles
  qrFrameContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrFrame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    position: 'relative',
  },
  qrText: {
    color: 'white',
    marginTop: 10,
    fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: 'white',
    borderWidth: 4,
  },
  topLeft: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0 },
  topRight: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0 },

  // Bottom Panel Styles
  bottomPanelContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150, // Height of the semi-transparent area
    backgroundColor: 'black', // Semi-transparent black
    justifyContent: 'center',
    paddingBottom: 20,
  },
  bottomControlsRow: {
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
  
  // iPhone-style Shutter Button
  shutterButtonOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  shutterButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  
  emptySpacer: {
    width: 50, // Matches gallery button width to keep center button centered
  },
});