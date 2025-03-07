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
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Button from '../components/Button';
import Input from '../components/Input';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { createShadow } from '../utils/styling';

// Mock data for cutting styles - in the real app, this would come from your database
const cuttingStyles = [
  { id: '1', name: 'Standard', description: 'Basic cuts including legs, shoulders, and chops' },
  { id: '2', name: 'Ethiopian', description: 'Specialized cuts with more detail and precision' },
  { id: '3', name: 'Mexican', description: 'Tell us exactly how you want your meat prepared' },
];

// Mock data for delivery dates - in the real app, this would come from your database
const availableDeliveryDates = [
  { id: '1', date: 'July 15, 2023', available: true },
  { id: '2', date: 'July 16, 2023', available: true },
  { id: '3', date: 'July 17, 2023', available: true },
  { id: '4', date: 'July 18, 2023', available: false },
  { id: '5', date: 'July 19, 2023', available: true },
];

export default function OrderDetailsScreen() {
  const { animalType, animalSize } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  const [cuttingStyle, setCuttingStyle] = useState('');
  const [divided, setDivided] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  // Define the Record type explicitly
  const [errors, setErrors] = useState<{
    cuttingStyle?: string;
    deliveryDate?: string;
    name?: string;
    phone?: string;
    address?: string;
  }>({});

  const validateForm = () => {
    const newErrors: {
      cuttingStyle?: string;
      deliveryDate?: string;
      name?: string;
      phone?: string;
      address?: string;
    } = {};
    
    if (!cuttingStyle) newErrors.cuttingStyle = 'Please select a cutting style';
    if (!deliveryDate) newErrors.deliveryDate = 'Please select a delivery date';
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!phone.trim()) newErrors.phone = 'Phone number is required';
    if (!address.trim()) newErrors.address = 'Address is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      router.navigate({
        pathname: '/order-confirmation',
        params: {
          animalType,
          animalSize,
          cuttingStyle,
          divided: divided ? 'Yes' : 'No',
          deliveryDate,
          name,
          phone,
          address
        }
      });
    } else {
      Alert.alert('Please fill in all required fields');
    }
  };

  const renderCuttingStyleItem = ({ item }: { item: typeof cuttingStyles[0] }) => (
    <TouchableOpacity
      style={[
        styles.styleOption,
        { 
          backgroundColor: cuttingStyle === item.name ? colors.primary + '20' : colors.card,
          borderColor: cuttingStyle === item.name ? colors.primary : colors.border 
        },
        createShadow(colors.text, { width: 0, height: 1 }, 0.05, 2)
      ]}
      onPress={() => setCuttingStyle(item.name)}
    >
      <View style={styles.styleContent}>
        {cuttingStyle === item.name && (
          <Ionicons name="checkmark-circle" size={20} color={colors.primary} style={styles.checkIcon} />
        )}
        <Text style={[styles.styleName, { color: colors.text }]}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderDeliveryDateItem = ({ item }: { item: typeof availableDeliveryDates[0] }) => (
    <TouchableOpacity
      style={[
        styles.dateOption,
        { 
          backgroundColor: deliveryDate === item.date ? colors.primary + '20' : colors.card,
          borderColor: deliveryDate === item.date ? colors.primary : colors.border,
          opacity: item.available ? 1 : 0.5,
          ...(item.available ? {} : { opacity: 0.5 })
        },
        createShadow(colors.text, { width: 0, height: 1 }, 0.05, 2)
      ]}
      onPress={() => item.available && setDeliveryDate(item.date)}
      disabled={!item.available}
    >
      <View style={styles.dateContent}>
        {deliveryDate === item.date && (
          <Ionicons name="checkmark-circle" size={20} color={colors.primary} style={styles.checkIcon} />
        )}
        <Text style={[styles.dateName, { color: colors.text }]}>{item.date}</Text>
        {!item.available && (
          <Text style={styles.unavailableText}>Unavailable</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" || 'android' ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" || "android" ? 64 : 0}
        >
         
          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.orderSummary, { backgroundColor: colorScheme === 'dark' ? colors.card : 'rgba(0,0,0,0.03)' }]}>
              <Text style={[styles.summaryTitle, { color: colors.text }]}>Order Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.lightText }]}>Animal:</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{animalType as string}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.lightText }]}>Size:</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{animalSize as string}</Text>
              </View>
            </View>

            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Cutting Style</Text>
              <Text style={[styles.sectionDescription, { color: colors.lightText }]}>Select how you would like your meat to be cut</Text>
              <FlatList
                data={cuttingStyles}
                renderItem={renderCuttingStyleItem}
                keyExtractor={(item) => item.id}
                horizontal={false}
                scrollEnabled={false}
              />
            </View>

            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Divide Animal?</Text>
              <Text style={[styles.sectionDescription, { color: colors.lightText }]}>
                Would you like to divide the animal in two parts?
              </Text>
              
              <View style={styles.divideOptions}>
                <TouchableOpacity
                  style={[
                    styles.divideOption,
                    { 
                      backgroundColor: !divided ? colors.primary : 'transparent',
                      borderColor: colors.primary
                    },
                    createShadow(colors.text, { width: 0, height: 1 }, 0.05, 2)
                  ]}
                  onPress={() => setDivided(false)}
                >
                  <Text 
                    style={[
                      styles.divideOptionText, 
                      { color: !divided ? 'white' : colors.primary }
                    ]}
                  >
                    No, Keep Whole
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.divideOption,
                    { 
                      backgroundColor: divided ? colors.primary : 'transparent',
                      borderColor: colors.primary
                    },
                    createShadow(colors.text, { width: 0, height: 1 }, 0.05, 2)
                  ]}
                  onPress={() => setDivided(true)}
                >
                  <Text 
                    style={[
                      styles.divideOptionText, 
                      { color: divided ? 'white' : colors.primary }
                    ]}
                  >
                    Yes, Divide in Two
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Delivery Date</Text>
              <Text style={[styles.sectionDescription, { color: colors.lightText }]}>Select your preferred delivery date</Text>
              <FlatList
                data={availableDeliveryDates}
                renderItem={renderDeliveryDateItem}
                keyExtractor={(item) => item.id}
                horizontal={false}
                scrollEnabled={false}
              />
            </View>

            <View style={styles.form}>
              <Input
                label="Your Name"
                placeholder="Enter your full name"
                value={name}
                onChangeText={setName}
                error={errors.name}
                icon={<Ionicons name="person-outline" size={20} color={colors.primary} />}
              />
              
              <Input
                label="Phone Number"
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
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
                value={address}
                onChangeText={setAddress}
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
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  styleOption: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
  },
  styleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  styleName: {
    fontSize: 16,
    fontWeight: '500',
  },
  dateOption: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
  },
  dateContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateName: {
    fontSize: 16,
    fontWeight: '500',
  },
  unavailableText: {
    fontSize: 14,
    color: '#F44336',
    marginLeft: 'auto',
  },
  checkIcon: {
    marginRight: 8,
  },
  divideOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  divideOption: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  divideOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  form: {
    marginTop: 10,
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightPlaceholder: {
    width: 40,
  },
}); 



// cutting style creating admin panel 
// we sell only full lamb and sheep and goat the admin should be able to add animal type
// admin export the data in excel file

// if you want to track delivery please register.
// allow people to divide the lamb




// Comments on MArch 05
// after selecting size to be able to select price 
// for each size different kind of price


// yemifelgetun organs endimertu masederegu
// roadwarrior integration  and notes 
// 70 miles radius on gthe adress check box 
