import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Button from '@/components/Button';
import { supabase } from '@/utils/supabase';

interface DeliveryFeeTabProps {
  deliveryFee: number;
  setDeliveryFee: (fee: number) => void;
}

// Skeleton loading component
const SkeletonLoader = ({ colors }: { colors: any }) => (
  <View style={[styles.card, { backgroundColor: colors.card }]}>
    <View style={[styles.skeletonTitle, { backgroundColor: colors.border }]} />
    <View style={[styles.skeletonDescription, { backgroundColor: colors.border }]} />
    <View style={[styles.skeletonDescription2, { backgroundColor: colors.border }]} />
    
    <View style={styles.inputContainer}>
      <View style={[styles.skeletonLabel, { backgroundColor: colors.border }]} />
      <View style={[styles.skeletonInput, { backgroundColor: colors.border }]} />
    </View>
    
    <View style={[styles.skeletonButton, { backgroundColor: colors.border }]} />
  </View>
);

export default function DeliveryFeeTab({ deliveryFee, setDeliveryFee }: DeliveryFeeTabProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [tempFee, setTempFee] = useState(deliveryFee.toString());

  useEffect(() => {
    fetchDeliveryFee();
  }, []);

  const fetchDeliveryFee = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_fee')
        .select('fee')
        .limit(1)
        .single();

      if (error) throw error;

      if (data) {
        setDeliveryFee(data.fee);
        setTempFee(data.fee.toString());
      }
    } catch (error) {
      console.error('Error fetching delivery fee:', error);
      Alert.alert('Error', 'Failed to fetch delivery fee');
    } finally {
      setIsInitialLoading(false);
    }
  };

  const handleUpdateFee = async () => {
    const newFee = parseFloat(tempFee);
    
    if (isNaN(newFee) || newFee < 0) {
      Alert.alert('Error', 'Please enter a valid fee amount');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('delivery_fee')
        .update({ fee: newFee })
        .eq('id', (await supabase.from('delivery_fee').select('id').limit(1).single()).data?.id);

      if (error) throw error;

      setDeliveryFee(newFee);
      Alert.alert('Success', 'Delivery fee updated successfully');
    } catch (error) {
      console.error('Error updating delivery fee:', error);
      Alert.alert('Error', 'Failed to update delivery fee');
    } finally {
      setIsLoading(false);
    }
  };

  // Show skeleton loading while fetching initial data
  if (isInitialLoading) {
    return (
      <View style={styles.container}>
        <SkeletonLoader colors={colors} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>Delivery Fee</Text>
        <Text style={[styles.description, { color: colors.text }]}>
          Set the delivery fee that will be added to all orders
        </Text>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Fee Amount ($)</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.background,
              color: colors.text,
              borderColor: colors.border
            }]}
            value={tempFee}
            onChangeText={setTempFee}
            keyboardType="decimal-pad"
            placeholder="Enter delivery fee"
            placeholderTextColor={colors.text + '80'}
          />
        </View>

        <Button
          title="Update Fee"
          onPress={handleUpdateFee}
          disabled={isLoading}
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  card: {
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
    opacity: 0.8,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  button: {
    marginTop: 8,
  },
  // Skeleton styles
  skeletonTitle: {
    height: 28,
    width: '60%',
    borderRadius: 4,
    marginBottom: 8,
    opacity: 0.3,
  },
  skeletonDescription: {
    height: 16,
    width: '90%',
    borderRadius: 4,
    marginBottom: 8,
    opacity: 0.3,
  },
  skeletonDescription2: {
    height: 16,
    width: '70%',
    borderRadius: 4,
    marginBottom: 24,
    opacity: 0.3,
  },
  skeletonLabel: {
    height: 16,
    width: '40%',
    borderRadius: 4,
    marginBottom: 8,
    opacity: 0.3,
  },
  skeletonInput: {
    height: 50,
    borderRadius: 8,
    opacity: 0.3,
  },
  skeletonButton: {
    height: 50,
    borderRadius: 8,
    marginTop: 8,
    opacity: 0.3,
  },
}); 