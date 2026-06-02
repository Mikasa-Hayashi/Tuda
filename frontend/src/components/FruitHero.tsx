import React from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';

export type HeroProps = {
  imageUrl: string;
  name: string;
  scientificName?: string;
};

export const FruitHero: React.FC<HeroProps> = ({ imageUrl, name, scientificName }) => {
  return (
    <View style={styles.heroContainer}>
      <Image 
        // source={{ uri: imageUrl }} 
        source={require('../../assets/images/orange.jpg')}
        style={styles.heroImage} 
        resizeMode="cover" 
      />
      <View style={styles.heroTextOverlay}>
        <Text style={styles.fruitName}>{name}</Text>
        {scientificName && (
          <Text style={styles.scientificName}>{scientificName}</Text>
        )}
      </View>
    </View>
  );
};
// --- Styles ---
const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black', // Основной фон как в камере
  },
  
  // --- Nav Styles ---
  navContainer: {
    backgroundColor: 'black',
    zIndex: 10,
  },
  navContent: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  navTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },

  // --- Scroll Styles ---
  scrollContent: {
    paddingBottom: 20,
  },

  // --- Hero Styles ---
  heroContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  heroImage: {
    width: width,
    height: 300,
  },
  heroTextOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    // Градиент или полупрозрачный фон для читаемости текста на картинке
    backgroundColor: 'rgba(0,0,0,0.6)', 
  },
  fruitName: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  scientificName: {
    color: '#ccc',
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: 4,
  },

  // --- Section & Table Styles ---
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    color: '#FFD700', // Используем тот же желтый цвет, что был у вспышки
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  descriptionText: {
    color: '#E0E0E0',
    fontSize: 16,
    lineHeight: 24,
  },

  // Table styling (iOS Settings style dark mode)
  tableContainer: {
    backgroundColor: '#1C1C1E', // Темно-серый фон плашки
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#38383A', // Разделитель
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  tableLabel: {
    color: 'white',
    fontSize: 16,
  },
  tableValue: {
    color: '#A0A0A0', // Чуть более тусклый для значений
    fontSize: 16,
  },
});
