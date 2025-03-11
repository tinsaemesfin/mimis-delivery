import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { createShadow } from '../utils/styling';
import { supabase } from '../utils/supabase';

const { width } = Dimensions.get('window');

interface PriceOption {
  id: string;
  name: string;
  price: number;
  description: string | null;
}

export default function PriceSelectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  const [priceOptions, setPriceOptions] = useState<PriceOption[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch price options when component mounts
  useEffect(() => {
    fetchPriceOptions();
  }, []);

  const fetchPriceOptions = async () => {
    try {
      console.log('Fetching price options for animal size option:', params.sizeOptionId);
      
      const { data: priceData, error: priceError } = await supabase
        .from('price_options')
        .select('id, name, price, description')
        .eq('animal_size_id', params.sizeOptionId)
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (priceError) {
        console.error('Error fetching price options:', priceError);
        setError('Failed to load price options');
        return;
      }

      if (!priceData || priceData.length === 0) {
        console.log('No price options found');
        setError('No price options available');
        return;
      }

      console.log('Price options fetched successfully:', priceData);
      setPriceOptions(priceData);
    } catch (err) {
      console.error('Unexpected error fetching price options:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePriceSelect = (priceId: string) => {
    console.log('Selected price option:', priceId);
    setSelectedPrice(priceId);
  };

  const handleNextStep = () => {
    if (!selectedPrice) {
      alert('Please select a price option to continue');
      return;
    }

    const selectedOption = priceOptions.find(option => option.id === selectedPrice);
    
    router.push({
      pathname: '/cut-selection',
      params: {
        ...params, // Forward previous params
        priceOptionId: selectedPrice,
        price: selectedOption?.price.toString() || '',
        priceName: selectedOption?.name || ''
      }
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading price options...</Text>
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
            onPress={fetchPriceOptions}
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
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Select Price Option</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.selectionInfo}>
        <Text style={[styles.selectionText, { color: colors.text }]}>
          Selected: {params.animalType} - {params.size}
        </Text>
      </View>

      <FlatList
        data={priceOptions}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.priceList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.priceCard,
              { backgroundColor: colors.card },
              selectedPrice === item.id && styles.selectedPrice,
              createShadow(colors.text, { width: 0, height: 2 }, 0.1, 3)
            ]}
            onPress={() => handlePriceSelect(item.id)}
          >
            <Text style={[
              styles.priceName,
              { color: colors.text },
              selectedPrice === item.id && styles.selectedText
            ]}>
              {item.name}
            </Text>
            <Text style={[
              styles.priceAmount,
              { color: colors.primary },
              selectedPrice === item.id && styles.selectedText
            ]}>
              {formatPrice(item.price)}
            </Text>
            {item.description && (
              <Text style={[
                styles.priceDescription,
                { color: colors.text },
                selectedPrice === item.id && styles.selectedText
              ]}>
                {item.description}
              </Text>
            )}
          </TouchableOpacity>
        )}
      />

      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        <Button
          title="Continue"
          onPress={handleNextStep}
          disabled={!selectedPrice}
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
  selectionInfo: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  selectionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  priceList: {
    padding: 16,
  },
  priceCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  selectedPrice: {
    backgroundColor: Colors.light.primary,
  },
  priceName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  priceAmount: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  priceDescription: {
    fontSize: 14,
    opacity: 0.8,
  },
  selectedText: {
    color: 'white',
  },
  footer: {
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