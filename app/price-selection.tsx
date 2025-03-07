import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import Button from '../components/Button';
import { Ionicons } from '@expo/vector-icons';

interface PriceOption {
  id: string;
  animalId: string;
  animalSize: string;
  name: string;
  price: number;
  description: string;
  isActive: boolean;
}

// This would come from your API/database in a real app
const fetchPriceOptions = async (animalId: string, size: string): Promise<PriceOption[]> => {
  // Simulating API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // For now, return mock data that matches the admin panel structure
  return [
    {
      id: '1',
      animalId: '1',
      animalSize: 'Small',
      name: 'Premium Package',
      price: 320,
      description: 'Premium cuts with extra care',
      isActive: true
    },
    {
      id: '2',
      animalId: '1',
      animalSize: 'Medium',
      name: 'Family Package',
      price: 480,
      description: 'Perfect for family gatherings',
      isActive: true
    },
    {
      id: '3',
      animalId: '2',
      animalSize: 'Large',
      name: 'Bulk Value',
      price: 550,
      description: 'Best value for larger orders',
      isActive: true
    }
  ].filter(option => 
    option.animalId === animalId && 
    option.animalSize.toLowerCase() === size.toLowerCase() &&
    option.isActive
  );
};

export default function PriceSelectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { animalId, animalType, animalSize } = params;
  
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  
  const [selectedPrice, setSelectedPrice] = useState<PriceOption | null>(null);
  const [priceOptions, setPriceOptions] = useState<PriceOption[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadPriceOptions = async () => {
      try {
        console.log('Loading price options with:', {
          animalId,
          animalSize,
          params: JSON.stringify(params)
        });
        
        const options = await fetchPriceOptions(animalId as string, animalSize as string);
        console.log('Fetched price options:', options);
        setPriceOptions(options);
      } catch (error) {
        console.error('Error loading price options:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadPriceOptions();
  }, [animalId, animalSize]);
  
  const handleContinue = () => {
    if (selectedPrice) {
      router.push({
        pathname: '/order-details',
        params: {
          ...params,
          priceOptionId: selectedPrice.id,
          priceOptionName: selectedPrice.name,
          price: selectedPrice.price
        }
      });
    }
  };
  
  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };
  
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading price options...
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <View style={styles.header}>
      
        <Text style={[styles.subtitle, { color: colors.lightText }]}>
          Choose your preferred pricing package for {animalType} ({animalSize})
        </Text>
      </View>
      
      <ScrollView 
        style={styles.optionsContainer}
        contentContainerStyle={styles.optionsContent}
        showsVerticalScrollIndicator={false}
      >
        {priceOptions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.lightText }]}>
              No price options available for this selection.
            </Text>
          </View>
        ) : (
          priceOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                selectedPrice?.id === option.id && styles.selectedOption,
                { backgroundColor: colors.card, borderColor: selectedPrice?.id === option.id ? colors.primary : colors.border }
              ]}
              onPress={() => setSelectedPrice(option)}
            >
              <View style={styles.optionContent}>
                <View style={styles.optionHeader}>
                  <Text style={[styles.optionName, { color: colors.text }]}>
                    {option.name}
                  </Text>
                  <Text style={[styles.optionPrice, { color: colors.primary }]}>
                    {formatCurrency(option.price)}
                  </Text>
                </View>
                
                <Text style={[styles.optionDescription, { color: colors.lightText }]}>
                  {option.description}
                </Text>
              </View>
              
              {selectedPrice?.id === option.id && (
                <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      
      <View style={styles.footer}>
        <Button
          title="Continue"
          onPress={handleContinue}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 10,
  },
  optionsContainer: {
    flex: 1,
  },
  optionsContent: {
    padding: 16,
  },
  optionCard: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedOption: {
    borderWidth: 2,
  },
  optionContent: {
    flex: 1,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionName: {
    fontSize: 18,
    fontWeight: '600',
  },
  optionPrice: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  optionDescription: {
    fontSize: 14,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  footer: {
    padding: 20,
    paddingBottom: 30,
  },
  continueButton: {
    paddingVertical: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  }
}); 