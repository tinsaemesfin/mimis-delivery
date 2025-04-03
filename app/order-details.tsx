import React, { useState, useEffect } from 'react';
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
  TouchableWithoutFeedback,
  FlatList,
  Alert,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Button from '../components/Button';
import Input from '../components/Input';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { createShadow } from '../utils/styling';
import { supabase } from '../utils/supabase';
import { useAuth } from '../lib/auth/AuthContext';

// Mock data for cutting styles - in the real app, this would come from your database


interface DeliveryDate {
  id: string;
  date: string;
  available_slots: number;
}

interface OrderDetails {
  customerName: string;
  phoneNumber: string;
  zipCode: string;
  address: string;
  email?: string;
  isValidZip: boolean;
  notes: string;
  divided: string;
}

interface Profile {
  email?: string;
  phone?: string;
  full_name?: string;
}

interface Extra {
  id: string;
  title: string;
  price: number;
}

const formatPhoneNumber = (phoneNumber: string) => {
  // Remove all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX
  if (cleaned.length >= 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  }
  return cleaned;
};

const isValidUSPhone = (phone: string) => {
  const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
  return phoneRegex.test(phone);
};

// Seattle Coordinates (approximate center)
const DC_CENTER = {
  lat: 47.6062,
  lng: -122.3321
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 3959; // Radius of the Earth in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in miles
};

const generateOrderTicket = () => {
  // Generate a 6-character ticket with 3 letters and 3 numbers
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  let ticket = '';
  
  // Add 3 random letters
  for (let i = 0; i < 3; i++) {
    ticket += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  
  // Add 3 random numbers
  for (let i = 0; i < 3; i++) {
    ticket += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  
  return ticket;
};

export default function OrderDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  // Fetch user profile when component mounts
  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user?.id) return;
    
    try {
      const { data: { user: userData }, error } = await supabase.auth.getUser();

      if (error) {
        console.error('Error fetching user:', error);
        return;
      }

      if (userData) {
        console.log('USers Data',userData)
        setProfile({
          full_name: userData.user_metadata?.full_name,
          phone: userData.user_metadata?.phone,
          email: userData.email,
        });
        setOrderDetails(prev => ({
          ...prev,
          customerName: userData.user_metadata?.full_name || '',
          phoneNumber: userData.user_metadata?.phone_number || '',
          email: userData.email || '',
        }));
      } else {
        console.log('No user data found');
        setProfile(null);
      }
    } catch (err) {
      console.error('Unexpected error fetching user:', err);
    }
  };

  const [deliveryDates, setDeliveryDates] = useState<DeliveryDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetails>({
    customerName: '',
    phoneNumber: '',
    zipCode: '',
    address: '',
    email: user?.email || '',
    isValidZip: false,
    notes: '',
    divided: 'No',
  });

  // Update order details when profile is loaded
  useEffect(() => {
    if (profile) {
      setOrderDetails(prev => ({
        ...prev,
        customerName: profile.full_name || prev.customerName,
        phoneNumber: profile.phone || prev.phoneNumber,
        email: profile.email || prev.email,
      }));
    }
  }, [profile]);

  // Fetch delivery dates when component mounts
  useEffect(() => {
    fetchDeliveryDates();
  }, []);

  const fetchDeliveryDates = async () => {
    try {
      console.log('Fetching delivery dates...');
      
      const { data: datesData, error: datesError } = await supabase
        .from('delivery_dates')
        .select('id, date, available_slots')
        .eq('is_active', true)
        .gt('available_slots', 0)
        .gt('date', new Date().toISOString())
        .order('date');

      if (datesError) {
        console.error('Error fetching delivery dates:', datesError);
        setError('Failed to load delivery dates');
        return;
      }

      if (!datesData || datesData.length === 0) {
        console.log('No delivery dates found');
        setError('No delivery dates available');
        return;
      }

      console.log('Delivery dates fetched successfully:', datesData);
      setDeliveryDates(datesData);
    } catch (err) {
      console.error('Unexpected error fetching delivery dates:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (dateId: string) => {
    console.log('Selected delivery date:', dateId);
    if (selectedDate === dateId) {
      setSelectedDate(null);
    } else {
      setSelectedDate(dateId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const validateZipCode = async (zipCode: string) => {
    try {
      // Using the free Zippopotam.us API to get ZIP code coordinates
      const response = await fetch(`https://api.zippopotam.us/us/${zipCode}`);
      const data = await response.json();
      
      if (data && data.places && data.places[0]) {
        const lat = parseFloat(data.places[0].latitude);
        const lng = parseFloat(data.places[0].longitude);
        
        const distance = calculateDistance(DC_CENTER.lat, DC_CENTER.lng, lat, lng);
        
        if (distance <= 70) {
          setOrderDetails(prev => ({ ...prev, isValidZip: true }));
          return true;
        } else {
          Alert.alert(
            "Invalid ZIP Code",
            `This ZIP code is ${Math.round(distance)} miles from Seattle, which is outside our 70-mile delivery radius.`
          );
          setOrderDetails(prev => ({ ...prev, isValidZip: false }));
          return false;
        }
      }
      Alert.alert("Invalid ZIP Code", "Please enter a valid US ZIP code.");
      setOrderDetails(prev => ({ ...prev, isValidZip: false }));
      return false;
    } catch (error) {
      console.error('Error validating ZIP code:', error);
      Alert.alert("Error", "Unable to validate ZIP code. Please try again.");
      setOrderDetails(prev => ({ ...prev, isValidZip: false }));
      return false;
    }
  };

  const handlePhoneChange = (text: string) => {
    const formattedPhone = formatPhoneNumber(text);
    setOrderDetails(prev => ({ ...prev, phoneNumber: formattedPhone }));
  };

  const handleNextStep = async () => {
    if (!selectedDate) {
      Alert.alert('Error', 'Please select a delivery date');
      return;
    }

    if (!orderDetails.zipCode.trim()) {
      Alert.alert('Error', 'Please enter your ZIP code');
      return;
    }

    if (!orderDetails.address.trim()) {
      Alert.alert('Error', 'Please enter your street address');
      return;
    }

    if (!isValidUSPhone(orderDetails.phoneNumber)) {
      Alert.alert('Error', 'Please enter a valid US phone number');
      return;
    }

    if (!orderDetails.isValidZip) {
      const isValid = await validateZipCode(orderDetails.zipCode);
      if (!isValid) return;
    }

    if (!user && !orderDetails.customerName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    try {
      const orderTicket = generateOrderTicket();
      
      const defaultGuestEmail = 'guest@mimisdelivery.aradatech.com';
      
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id || null,
          guest_email: !user ? (orderDetails.email?.trim() || defaultGuestEmail) : null,
          guest_phone: !user ? orderDetails.phoneNumber : null,
          customer_name: orderDetails.customerName,
          phone_number: orderDetails.phoneNumber,
          address: `${orderDetails.address}, ${orderDetails.zipCode}`,
          animal_size_id: params.sizeOptionId,
          price_option_id: params.priceOptionId,
          cutting_style_id: params.cuttingStyleId,
          total: parseFloat(params.price as string),
          delivery_date_id: selectedDate,
          order_ticket: orderTicket,
          status: 'pending',
          payment_status: 'unpaid',
          special_instructions: orderDetails.notes || null,
          organs: params.selectedOrgans ? (typeof params.selectedOrgans === 'string' ? params.selectedOrgans.split(', ') : []) : null,
          extras: selectedExtras ? selectedExtras.map(extra => extra.id) : null,
          divided: orderDetails.divided
        })
        .select()
        .single();
      if (orderError) {
        console.error('Error creating order:', orderError);
        Alert.alert('Error', 'Failed to create order. Please try again.');
        return;
      }

      router.push({
        pathname: '/order-confirmation' as const,
        params: {
          orderId: orderData.id,
          orderTicket: orderTicket,
          isGuest: !user ? 'true' : 'false',
          ...params,
          deliveryDateId: selectedDate,
          customerName: orderDetails.customerName,
          phoneNumber: orderDetails.phoneNumber,
          address: `${orderDetails.address}, ${orderDetails.zipCode}`,
          email: orderDetails.email,
        }
      });
    } catch (error) {
      console.error('Error processing order:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const selectedExtras = params.selectedExtras ? JSON.parse(params.selectedExtras as string) as Extra[] : [];
  const totalExtrasPrice = params.totalExtrasPrice ? parseFloat(params.totalExtrasPrice as string) : 0;
  const finalPrice = params.finalPrice ? parseFloat(params.finalPrice as string) : parseFloat(params.price as string);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading delivery dates...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Order Summary Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Summary</Text>
          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.lightText }]}>Animal Type:</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{params.animalType}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.lightText }]}>Size:</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{params.size}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.lightText }]}>Price Option:</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{params.priceName}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.lightText }]}>Price:</Text>
              <Text style={[styles.summaryValue, { color: colors.primary, fontWeight: '700' }]}>
                ${params.price}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.lightText }]}>Cutting Style:</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{params.cuttingStyleName}</Text>
            </View>
            {params.selectedOrgans && (
              <>
                <View style={styles.divider} />
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.lightText }]}>Selected Organs:</Text>
                  <View style={styles.organsContainer}>
                    {(typeof params.selectedOrgans === 'string' ? params.selectedOrgans.split(', ') : []).map((organ: string, index: number) => (
                      <View key={index} style={styles.organChip}>
                        <Text style={styles.organChipText}>{organ}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            )}
            {selectedExtras.length > 0 && (
              <>
                <View style={styles.divider} />
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.lightText }]}>Additional Services:</Text>
                  <View style={styles.extrasContainer}>
                    {selectedExtras.map((extra, index) => (
                      <View key={index} style={styles.extraItem}>
                        <Text style={[styles.extraTitle, { color: colors.text }]}>
                          {extra.title}
                        </Text>
                        <Text style={[styles.extraPrice, { color: colors.primary }]}>
                          ${extra.price.toFixed(2)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.lightText }]}>Extras Total:</Text>
                  <Text style={[styles.summaryValue, { color: colors.primary }]}>
                    ${totalExtrasPrice.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.lightText, fontWeight: '600' }]}>Final Price:</Text>
                  <Text style={[styles.summaryValue, { color: colors.primary, fontWeight: '700', fontSize: 18 }]}>
                    ${finalPrice.toFixed(2)}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Delivery Date Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Delivery Date</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.datesContainer}
          >
            {deliveryDates.map((date) => (
              <TouchableOpacity
                key={date.id}
                style={[
                  styles.dateCard,
                  { backgroundColor: colors.card },
                  selectedDate === date.id && styles.selectedDate,
                  Platform.select({
                    android: {
                      elevation: selectedDate === date.id ? 8 : 2,
                    },
                    ios: {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: selectedDate === date.id ? 4 : 2 },
                      shadowOpacity: selectedDate === date.id ? 0.2 : 0.1,
                      shadowRadius: selectedDate === date.id ? 8 : 4,
                    },
                  }),
                ]}
                onPress={() => handleDateSelect(date.id)}
              >
                <View style={styles.dateIconContainer}>
                  <Ionicons 
                    name="calendar" 
                    size={24} 
                    color={selectedDate === date.id ? '#FFFFFF' : colors.primary} 
                  />
                </View>
                <Text style={[
                  styles.dateText,
                  { color: colors.text },
                  selectedDate === date.id && styles.selectedText
                ]}>
                  {formatDate(date.date)}
                </Text>
                <Text style={[
                  styles.slotsText,
                  { color: colors.lightText },
                  selectedDate === date.id && styles.selectedText
                ]}>
                  {date.available_slots} slots available
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
              
          <View style={styles.divideContainer}>
              <Text style={[styles.divideLabel, { color: colors.text }]}>Would you like the animal divided in two?</Text>
              <View style={styles.divideButtonsContainer}>
                <TouchableOpacity
                  style={[
                    styles.divideButton,
                    { borderColor: colors.border },
                    orderDetails.divided === 'Yes' && { backgroundColor: colors.primary }
                  ]}
                  onPress={() => setOrderDetails(prev => ({ ...prev, divided: 'Yes' }))}
                >
                  <Text style={[
                    styles.divideButtonText,
                    { color: orderDetails.divided === 'Yes' ? 'white' : colors.text }
                  ]}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.divideButton,
                    { borderColor: colors.border },
                    orderDetails.divided === 'No' && { backgroundColor: colors.primary }
                  ]}
                  onPress={() => setOrderDetails(prev => ({ ...prev, divided: 'No' }))}
                >
                  <Text style={[
                    styles.divideButtonText,
                    { color: orderDetails.divided === 'No' ? 'white' : colors.text }
                  ]}>No</Text>
                </TouchableOpacity>
              </View>
            </View>
            
        </View>

        {/* Customer Details Section */}
        <View style={[styles.section, styles.lastSection]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Delivery Details</Text>
          <View style={styles.formContainer}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              placeholder="Full Name"
              placeholderTextColor={colors.lightText}
              value={orderDetails.customerName}
              onChangeText={(text) => setOrderDetails(prev => ({ ...prev, customerName: text }))}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              placeholder="Phone Number (XXX) XXX-XXXX"
              placeholderTextColor={colors.lightText}
              value={orderDetails.phoneNumber}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              maxLength={14}
            />
            
            {!user && (
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                placeholder="Email"
                placeholderTextColor={colors.lightText}
                value={orderDetails.email}
                onChangeText={(text) => setOrderDetails(prev => ({ ...prev, email: text }))}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
            
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              placeholder="ZIP Code (Must be within 70 miles of Seattle)"
              placeholderTextColor={colors.lightText}
              value={orderDetails.zipCode}
              onChangeText={(text) => {
                const cleaned = text.replace(/\D/g, '').slice(0, 5);
                setOrderDetails(prev => ({ ...prev, zipCode: cleaned, isValidZip: false }));
                if (cleaned.length === 5) {
                  validateZipCode(cleaned);
                }
              }}
              keyboardType="numeric"
              maxLength={5}
            />
        
            <TextInput
              style={[styles.input, styles.addressInput, { backgroundColor: colors.card, color: colors.text }]}
              placeholder="Street Address"
              placeholderTextColor={colors.lightText}
              value={orderDetails.address}
              onChangeText={(text) => setOrderDetails(prev => ({ ...prev, address: text }))}
              multiline
              numberOfLines={3}
            />

            <TextInput
              style={[styles.input, styles.notesInput, { backgroundColor: colors.card, color: colors.text }]}
              placeholder="Add any special notes or requests (optional)"
              placeholderTextColor={colors.lightText}
              value={orderDetails.notes}
              onChangeText={(text) => setOrderDetails(prev => ({ ...prev, notes: text }))}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        <Button
          title="Confirm Order"
          onPress={handleNextStep}
          disabled={!selectedDate || !orderDetails.address || !orderDetails.isValidZip}
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
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  lastSection: {
    marginBottom: 100, // Extra space for footer
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 16,
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
    }),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: 16,
    flex: 1,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  organsContainer: {
    flex: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
  },
  organChip: {
    backgroundColor: Colors.light.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 4,
  },
  organChipText: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  datesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dateCard: {
    padding: 16,
    borderRadius: 16,
    marginRight: 16,
    width: 220,
    alignItems: 'center',
  },
  dateIconContainer: {
    marginBottom: 12,
  },
  selectedDate: {
    backgroundColor: Colors.light.primary,
    transform: [{ scale: 1.02 }],
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  slotsText: {
    fontSize: 14,
    textAlign: 'center',
  },
  selectedText: {
    color: 'white',
  },
  formContainer: {
    gap: 12,
  },
  input: {
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  addressInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    ...Platform.select({
      android: {
        elevation: 8,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
    }),
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
  extrasContainer: {
    flex: 2,
  },
  extraItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  extraTitle: {
    fontSize: 14,
    flex: 1,
  },
  extraPrice: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  divideContainer: {
    marginBottom: 16,
  },
  divideLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  divideButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  divideButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divideButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 








//TODO: roadwarrior integration  and notes 

