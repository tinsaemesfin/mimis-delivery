import React, { useState } from 'react';
import { 
  StyleSheet, 
  SafeAreaView, 
  View, 
  Text, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Button from '../components/Button';
import Input from '../components/Input';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';

interface FormData {
  name: string;
  phone: string;
  address: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  address?: string;
}

export default function OrderDetailsScreen() {
  const { meatType, cutType, styleType } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    address: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
    
    // Clear error when user types
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: undefined,
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10,}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      router.push({
        pathname: '/order-confirmation',
        params: {
          meatType,
          cutType,
          styleType,
          ...formData,
        },
      });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />
      
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        >
          <View style={styles.headerContainer}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>Your Details</Text>
              <Text style={[styles.subtitle, { color: colors.lightText }]}>
                Please provide your delivery information
              </Text>
            </View>
          </View>

          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.orderSummary, { backgroundColor: colorScheme === 'dark' ? colors.card : 'rgba(0,0,0,0.03)' }]}>
              <Text style={[styles.summaryTitle, { color: colors.text }]}>Order Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.lightText }]}>Meat:</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{meatType as string}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.lightText }]}>Cut:</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{cutType as string}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.lightText }]}>Style:</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{styleType as string}</Text>
              </View>
            </View>

            <View style={styles.form}>
              <Input
                label="Your Name"
                placeholder="Enter your full name"
                value={formData.name}
                onChangeText={(text) => handleChange('name', text)}
                error={errors.name}
                icon={<Ionicons name="person-outline" size={20} color={colors.primary} />}
              />
              
              <Input
                label="Phone Number"
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                value={formData.phone}
                onChangeText={(text) => handleChange('phone', text)}
                error={errors.phone}
                icon={<Ionicons name="call-outline" size={20} color={colors.primary} />}
              />
              
              <Input
                label="Delivery Address"
                placeholder="Enter your complete address"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={styles.addressInput}
                value={formData.address}
                onChangeText={(text) => handleChange('address', text)}
                error={errors.address}
                icon={<Ionicons name="location-outline" size={20} color={colors.primary} />}
              />
            </View>
          </ScrollView>

          <View style={[styles.footer, { 
            borderTopColor: colors.border,
            backgroundColor: colorScheme === 'dark' ? 'rgba(25,25,25,0.95)' : 'rgba(255,255,255,0.95)'
          }]}>
            <Button
              title="Complete Order"
              onPress={handleSubmit}
              style={styles.button}
            />
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  header: {
    paddingVertical: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  orderSummary: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 16,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  form: {
    marginBottom: 24,
  },
  addressInput: {
    height: 120,
    paddingTop: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  button: {
    width: '100%',
    height: 56,
  },
}); 



// cutting style creating admin panel 
// we sell only full lamb and sheep and goat the admin should be able to add animal type
// admin export the data in excel file

// if you want to track delivery please register.
// allow people to divide the lamb

// no piture of meat 
