import React, { useState } from 'react';
import { 
  StyleSheet, 
  SafeAreaView, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  StatusBar as RNStatusBar,
  Dimensions,
  ScrollView,
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import Card from '../components/Card';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { createShadow } from '../utils/styling';

const { width } = Dimensions.get('window');

// Mock data for animals
const animals = [
  {
    id: 'lamb',
    title: 'Lamb',
    description: 'Young sheep, tender meat with a mild flavor.',
    image: require('../assets/images/meat-banner.png'),
    sizes: ['small', 'medium', 'large']
  },
  {
    id: 'sheep',
    title: 'Sheep',
    description: 'Adult sheep with richer flavor and firmer texture.',
    image: require('../assets/images/meat-banner.png'),
    sizes: ['medium', 'large']
  }
];

export default function AnimalSelectionScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  
  const [selectedAnimal, setSelectedAnimal] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  
  const handleAnimalSelect = (animalId: string) => {
    setSelectedAnimal(animalId);
    setSelectedSize(null); // Reset size selection when animal changes
  };
  
  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
  };
  
  const handleNextStep = () => {
    if (selectedAnimal && selectedSize) {
      router.push({
        pathname: '/order-details',
        params: {
          animalType: selectedAnimal,
          animalSize: selectedSize
        }
      });
    } else {
      // Show an error message if animal or size is not selected
      alert('Please select an animal and size to continue');
    }
  };
  
  const getAvailableSizes = () => {
    if (!selectedAnimal) return [];
    const animal = animals.find(a => a.id === selectedAnimal);
    return animal ? animal.sizes : [];
  };
  
  const renderAnimalItem = ({ item }: { item: typeof animals[0] }) => (
    <Card
      title={item.title}
      description={item.description}
      image={item.image}
      selected={selectedAnimal === item.id}
      onPress={() => handleAnimalSelect(item.id)}
    />
  );
  
  const renderSizeItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.sizeCard,
        { backgroundColor: colors.card },
        selectedSize === item && styles.selectedSize,
        createShadow(colors.text, { width: 0, height: 2 }, 0.1, 3)
      ]}
      onPress={() => handleSizeSelect(item)}
    >
      <Text style={[
        styles.sizeText,
        { color: colors.text },
        selectedSize === item && styles.selectedSizeText
      ]}>
        {item.charAt(0).toUpperCase() + item.slice(1)}
      </Text>
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Select Animal</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Choose Animal Type</Text>
        <FlatList
          data={animals}
          renderItem={renderAnimalItem}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.animalList}
          style={styles.flatList}
        />
        
        {selectedAnimal && (
          <View style={styles.sizeSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Choose Size</Text>
            <View style={styles.sizesContainer}>
              {getAvailableSizes().map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.sizeCard,
                    { backgroundColor: colors.card },
                    selectedSize === size && styles.selectedSize,
                    createShadow(colors.text, { width: 0, height: 2 }, 0.1, 3)
                  ]}
                  onPress={() => handleSizeSelect(size)}
                >
                  <Text style={[
                    styles.sizeText,
                    { color: colors.text },
                    selectedSize === size && styles.selectedSizeText
                  ]}>
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        
        <View style={styles.infoSection}>
          <View style={[styles.infoCard, { backgroundColor: colors.card }, createShadow(colors.text, { width: 0, height: 2 }, 0.1, 3)]}>
            <Ionicons name="information-circle-outline" size={24} color={colors.primary} style={styles.infoIcon} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              We source all our animals from local farms that practice ethical and sustainable farming methods.
            </Text>
          </View>
        </View>
      </ScrollView>
      
      <View style={[styles.footer, { backgroundColor: colors.background }, createShadow(colors.text, { width: 0, height: -2 }, 0.1, 3)]}>
        <Button
          title="Continue"
          onPress={handleNextStep}
          disabled={!selectedAnimal || !selectedSize}
          style={styles.continueButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginVertical: 16,
    marginHorizontal: 16,
  },
  flatList: {
    flexGrow: 0,
  },
  animalList: {
    paddingHorizontal: 16,
  },
  sizeSection: {
    marginTop: 20,
  },
  sizesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  sizeCard: {
    width: (width - 48) / 3,
    height: 60,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  selectedSize: {
    backgroundColor: Colors.light.primary,
  },
  sizeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  selectedSizeText: {
    color: 'white',
  },
  infoSection: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  continueButton: {
    marginBottom: Platform.OS === 'ios' ? 16 : 0,
  },
}); 