import React, { useState, useEffect } from 'react';
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
  Platform,
  ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import Card from '../components/Card';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { createShadow } from '../utils/styling';
import { supabase } from '../utils/supabase';

const { width } = Dimensions.get('window');

// Types for our data structure
interface Animal {
  id: string;
  title: string;
  description: string;
  image_url: string;
  sizes?: Size[]; // Make sizes optional since we're not fetching them directly
}

interface Size {
  id: string;
  name: string;
  description: string;
}

interface AnimalSizeOption {
  id: string;
  animal_id: string;
  size_id: string;
  description: string;
  size: Size;
}

export default function AnimalSelectionScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnimal, setSelectedAnimal] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [animalSizeOptions, setAnimalSizeOptions] = useState<AnimalSizeOption[]>([]);
  
  // Fetch animals and their available sizes
  useEffect(() => {
    fetchAnimals();
  }, []);

  // Fetch size options when an animal is selected
  useEffect(() => {
    if (selectedAnimal) {
      fetchAnimalSizeOptions(selectedAnimal);
    }
  }, [selectedAnimal]);

  const fetchAnimals = async () => {
    try {
      console.log('Starting to fetch animals from Supabase...');
      
      // Log that we're making the query
      console.log('Querying animals table with is_active = true');
      
      const { data: animalsData, error: animalsError } = await supabase
        .from('animals')
        .select('id, title, description, image_url')
        .eq('is_active', true);

      console.log('Raw response:', { animalsData, animalsError });

      if (animalsError) {
        console.error('Error fetching animals:', animalsError);
        setError('Failed to load animals');
        return;
      }

      if (!animalsData || animalsData.length === 0) {
        console.log('No animals found in the database');
        setError('No animals available');
        return;
      }

      console.log('Animals fetched successfully:', animalsData);
      
      const transformedData: Animal[] = (animalsData || []).map(animal => ({
        id: animal.id,
        title: animal.title,
        description: animal.description,
        image_url: animal.image_url
      }));
      
      console.log('Transformed data:', transformedData);
      setAnimals(transformedData);
    } catch (err) {
      console.error('Unexpected error fetching animals:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnimalSizeOptions = async (animalId: string) => {
    try {
      console.log('Fetching size options for animal:', animalId);
      const { data: sizeOptionsData, error: sizeOptionsError } = await supabase
        .from('animal_size_options')
        .select(`
          id,
          animal_id,
          size_id,
          description,
          sizes (
            id,
            name,
            description
          )
        `)
        .eq('animal_id', animalId)
        .eq('is_active', true)
        .returns<Array<{
          id: string;
          animal_id: string;
          size_id: string;
          description: string;
          sizes: Size;
        }>>();

      if (sizeOptionsError) {
        console.error('Error fetching size options:', sizeOptionsError);
        setError('Failed to load size options');
        return;
      }

      console.log('Size options fetched successfully:', sizeOptionsData);
      
      // Transform the data to match our TypeScript interface
      const transformedData: AnimalSizeOption[] = (sizeOptionsData || []).map(option => ({
        id: option.id,
        animal_id: option.animal_id,
        size_id: option.size_id,
        description: option.description,
        size: option.sizes // Rename sizes to size in the transformation
      }));
      
      setAnimalSizeOptions(transformedData);
    } catch (err) {
      console.error('Unexpected error fetching size options:', err);
      setError('An unexpected error occurred');
    }
  };
  
  const handleAnimalSelect = (animalId: string) => {
    console.log('Selected animal:', animalId);
    setSelectedAnimal(animalId);
    setSelectedSize(null); // Reset size selection when animal changes
  };
  
  const handleSizeSelect = (sizeId: string) => {
    console.log('Selected size:', sizeId);
    setSelectedSize(sizeId);
  };
  
  const handleNextStep = () => {
    if (selectedAnimal && selectedSize) {
      const animal = animals.find(a => a.id === selectedAnimal);
      const sizeOption = animalSizeOptions.find(option => option.size.id === selectedSize);
      
      console.log('Proceeding to next step with:', {
        animalId: selectedAnimal,
        animalType: animal?.title,
        sizeOptionId: sizeOption?.id,
        size: sizeOption?.size.name
      });

      router.push({
        pathname: '/price-selection',
        params: {
          animalId: selectedAnimal,
          animalType: animal?.title || '',
          sizeOptionId: sizeOption?.id || '',
          size: sizeOption?.size.name || ''
        }
      });
    } else {
      console.warn('Cannot proceed: animal or size not selected');
      alert('Please select an animal and size to continue');
    }
  };
  
  const getAvailableSizes = () => {
    if (!selectedAnimal || !animalSizeOptions.length) return [];
    return animalSizeOptions.map(option => option.size);
  };
  
  const renderAnimalItem = ({ item }: { item: Animal }) => (
    <Card
      title={item.title}
      description={item.description}
      image={item.image_url ? { uri: item.image_url } : require('../assets/images/meat-banner.png')}
      selected={selectedAnimal === item.id}
      onPress={() => handleAnimalSelect(item.id)}
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading animals...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={fetchAnimals}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
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
                  key={size.id}
                  style={[
                    styles.sizeCard,
                    { backgroundColor: colors.card },
                    selectedSize === size.id && styles.selectedSize,
                    createShadow(colors.text, { width: 0, height: 2 }, 0.1, 3)
                  ]}
                  onPress={() => handleSizeSelect(size.id)}
                >
                  <Text style={[
                    styles.sizeText,
                    { color: colors.text },
                    selectedSize === size.id && styles.selectedSizeText
                  ]}>
                    {size.name}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
}); 