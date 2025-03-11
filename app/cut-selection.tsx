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
  Dimensions,
  Image,
  ScrollView
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

// Dummy data for organs
const AVAILABLE_ORGANS = [
  { id: 'liver', name: 'Liver', description: 'Rich in nutrients and iron' },
  { id: 'heart', name: 'Heart', description: 'Lean and protein-rich' },
  { id: 'kidney', name: 'Kidneys', description: 'High in vitamins and minerals' },
  { id: 'tongue', name: 'Tongue', description: 'Tender and flavorful' },
  { id: 'tripe', name: 'Tripe', description: 'From the stomach lining' },
  { id: 'sweetbread', name: 'Sweetbread', description: 'Thymus or pancreas' },
];

interface CuttingStyle {
  id: string;
  title: string;
  description: string | null;
  is_active?: boolean;
}

interface Organ {
  id: string;
  name: string;
  description: string;
}

export default function CutSelectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  const [cuttingStyles, setCuttingStyles] = useState<CuttingStyle[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedOrgans, setSelectedOrgans] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch cutting styles when component mounts
  useEffect(() => {
    fetchCuttingStyles();
  }, []);

  const fetchCuttingStyles = async () => {
    try {
      console.log('Fetching cutting styles...');
      
      const { data: stylesData, error: stylesError } = await supabase
        .from('cutting_styles')
        .select('id, title, description')
        .eq('is_active', true)
        .order('title');

      if (stylesError) {
        console.error('Error fetching cutting styles:', stylesError);
        setError('Failed to load cutting styles');
        return;
      }

      if (!stylesData || stylesData.length === 0) {
        console.log('No cutting styles found');
        setError('No cutting styles available');
        return;
      }

      console.log('Cutting styles fetched successfully:', stylesData);
      setCuttingStyles(stylesData);
    } catch (err) {
      console.error('Unexpected error fetching cutting styles:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleStyleSelect = (styleId: string) => {
    console.log('Selected cutting style:', styleId);
    setSelectedStyle(styleId);
  };

  const handleOrganToggle = (organId: string) => {
    setSelectedOrgans(prev => {
      if (prev.includes(organId)) {
        return prev.filter(id => id !== organId);
      } else {
        return [...prev, organId];
      }
    });
    console.log('Toggled organ:', organId);
  };

  const handleNextStep = () => {
    if (!selectedStyle) {
      alert('Please select a cutting style to continue');
      return;
    }

    const selectedCutStyle = cuttingStyles.find(style => style.id === selectedStyle);
    const selectedOrganNames = AVAILABLE_ORGANS
      .filter(organ => selectedOrgans.includes(organ.id))
      .map(organ => organ.name);
    
    router.push({
      pathname: '/order-details',
      params: {
        ...params, // Forward previous params
        cuttingStyleId: selectedStyle,
        cuttingStyleName: selectedCutStyle?.title || '',
        selectedOrgans: selectedOrganNames.join(', ')
      }
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading cutting styles...</Text>
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
            onPress={fetchCuttingStyles}
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Select Cutting Style</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.selectionInfo}>
          <Text style={[styles.selectionText, { color: colors.text }]}>
            {params.animalType} - {params.size} - {params.priceName}
          </Text>
          <Text style={[styles.priceText, { color: colors.primary }]}>
            Price: ${params.price}
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Cutting Style</Text>
        <FlatList
          data={cuttingStyles}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.stylesList}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.styleCard,
                { backgroundColor: colors.card },
                selectedStyle === item.id && styles.selectedStyle,
                createShadow(colors.text, { width: 0, height: 2 }, 0.1, 3)
              ]}
              onPress={() => handleStyleSelect(item.id)}
            >
              <View style={styles.styleContent}>
                <Text style={[
                  styles.styleTitle,
                  { color: colors.text },
                  selectedStyle === item.id && styles.selectedText
                ]}>
                  {item.title}
                </Text>
                {item.description && (
                  <Text style={[
                    styles.styleDescription,
                    { color: colors.text },
                    selectedStyle === item.id && styles.selectedText
                  ]}>
                    {item.description}
                  </Text>
                )}
              </View>
              {selectedStyle === item.id && (
                <View style={styles.checkmark}>
                  <Ionicons 
                    name="checkmark-circle" 
                    size={24} 
                    color={colors.primary}
                  />
                </View>
              )}
            </TouchableOpacity>
          )}
        />

        <View style={styles.organsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Would you like any organs?</Text>
          <Text style={[styles.organSubtitle, { color: colors.lightText }]}>
            Select the organs you'd like to include with your order
          </Text>
          {AVAILABLE_ORGANS.map((organ) => (
            <TouchableOpacity
              key={organ.id}
              style={[
                styles.organCard,
                { backgroundColor: colors.card },
                selectedOrgans.includes(organ.id) && styles.selectedOrgan,
                createShadow(colors.text, { width: 0, height: 2 }, 0.1, 3)
              ]}
              onPress={() => handleOrganToggle(organ.id)}
            >
              <View style={styles.organContent}>
                <Text style={[
                  styles.organName,
                  { color: colors.text },
                  selectedOrgans.includes(organ.id) && styles.selectedText
                ]}>
                  {organ.name}
                </Text>
                <Text style={[
                  styles.organDescription,
                  { color: colors.lightText },
                  selectedOrgans.includes(organ.id) && styles.selectedText
                ]}>
                  {organ.description}
                </Text>
              </View>
              <View style={styles.checkbox}>
                <Ionicons 
                  name={selectedOrgans.includes(organ.id) ? "checkbox" : "square-outline"}
                  size={24}
                  color={selectedOrgans.includes(organ.id) ? colors.primary : colors.text}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        <Button
          title="Continue"
          onPress={handleNextStep}
          disabled={!selectedStyle}
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
  scrollView: {
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
    marginBottom: 4,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '600',
  },
  stylesList: {
    padding: 16,
  },
  styleCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  styleContent: {
    flex: 1,
  },
  selectedStyle: {
    backgroundColor: Colors.light.primary,
  },
  styleTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  styleDescription: {
    fontSize: 14,
    opacity: 0.8,
  },
  selectedText: {
    color: 'white',
  },
  checkmark: {
    marginLeft: 12,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  organSubtitle: {
    fontSize: 14,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  organsSection: {
    marginBottom: 100, // Space for footer
  },
  organCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  organContent: {
    flex: 1,
  },
  organName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  organDescription: {
    fontSize: 14,
  },
  checkbox: {
    marginLeft: 12,
  },
  selectedOrgan: {
    backgroundColor: Colors.light.primary + '20', // Add transparency to primary color
  },
}); 