import { Dimensions, StyleSheet, Text, View } from "react-native";

export const ScannerFrame: React.FC = () => {
  return (
    <View style={styles.qrFrameContainer}>
      <View style={styles.qrFrame}>
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
      </View>
      {/* <Text style={styles.qrText}>Scan fruit</Text> */}
    </View>
  );
};

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