import React from 'react';
import { 
  StyleSheet, 
  SafeAreaView, 
  View, 
  Text, 
  ScrollView,
  Dimensions,
  Platform 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Button from '../components/Button';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { createShadow, createTextShadow } from '../utils/styling';

const { width, height } = Dimensions.get('window');

export default function OrderConfirmationScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  const { 
    animalType, 
    animalSize, 
    cuttingStyle, 
    divided,
    deliveryDate,
    name, 
    phone, 
    address 
  } = params;

  const handleBackToHome = () => {
    router.push('/');
  };

  const formatDate = (dateString: string) => {
    return dateString;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.scrollContent]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#e63946', '#9d0208']}
          style={styles.header}
        >
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color="white" />
          </View>
          <Text style={[styles.headerTitle, createTextShadow('rgba(0, 0, 0, 0.3)', { width: 0, height: 1 }, 3)]}>Thank You!</Text>
          <Text style={styles.headerSubtitle}>Your order has been placed successfully</Text>
        </LinearGradient>

        <View style={styles.contentContainer}>
          <View style={[styles.card, { backgroundColor: colors.card }, createShadow(colors.text, { width: 0, height: 2 }, 0.1, 3)]}>
            <View style={styles.cardHeader}>
              <Ionicons name="calendar-outline" size={24} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Delivery Information</Text>
            </View>
            
            <View style={styles.cardContent}>
              <Text style={[styles.deliveryLabel, { color: colors.lightText }]}>Estimated Delivery:</Text>
              <Text style={[styles.deliveryDate, { color: colors.text }]}>
                {formatDate(deliveryDate as string)}
              </Text>
              <Text style={[styles.deliveryMessage, { color: colors.lightText }]}>
                We'll call you shortly to confirm delivery details
              </Text>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card }, createShadow(colors.text, { width: 0, height: 2 }, 0.1, 3)]}>
            <View style={styles.cardHeader}>
              <Ionicons name="layers-outline" size={24} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Order Summary</Text>
            </View>
            
            <View style={styles.cardContent}>
              <View style={styles.orderDetail}>
                <Text style={[styles.detailLabel, { color: colors.lightText }]}>Animal Type:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{animalType as string}</Text>
              </View>
              
              <View style={styles.orderDetail}>
                <Text style={[styles.detailLabel, { color: colors.lightText }]}>Size:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{animalSize as string}</Text>
              </View>
              
              <View style={styles.orderDetail}>
                <Text style={[styles.detailLabel, { color: colors.lightText }]}>Cutting Style:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{cuttingStyle as string}</Text>
              </View>
              
              <View style={styles.orderDetail}>
                <Text style={[styles.detailLabel, { color: colors.lightText }]}>Divided:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{divided as string}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card }, createShadow(colors.text, { width: 0, height: 2 }, 0.1, 3)]}>
            <View style={styles.cardHeader}>
              <Ionicons name="location-outline" size={24} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Delivery Details</Text>
            </View>
            
            <View style={styles.cardContent}>
              <View style={styles.deliveryDetail}>
                <Ionicons name="person-outline" size={20} color={colors.lightText} style={styles.detailIcon} />
                <Text style={[styles.detailText, { color: colors.text }]}>{name as string}</Text>
              </View>
              
              <View style={styles.deliveryDetail}>
                <Ionicons name="call-outline" size={20} color={colors.lightText} style={styles.detailIcon} />
                <Text style={[styles.detailText, { color: colors.text }]}>{phone as string}</Text>
              </View>
              
              <View style={styles.deliveryDetail}>
                <Ionicons name="location-outline" size={20} color={colors.lightText} style={styles.detailIcon} />
                <Text style={[styles.detailText, { color: colors.text }]}>{address as string}</Text>
              </View>
            </View>
          </View>

          <Button 
            title="Return to Home" 
            onPress={handleBackToHome} 
            style={styles.button}
          />
        </View>
      </ScrollView>
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
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    paddingTop: 30,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    ...createShadow('#000', { width: 0, height: 2 }, 0.25, 3.84, 5), 
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  card: {
    borderRadius: 15,
    marginBottom: 20,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  cardContent: {
    padding: 20,
  },
  deliveryLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  deliveryDate: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  deliveryMessage: {
    fontSize: 13,
    lineHeight: 20,
  },
  orderDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  detailLabel: {
    fontSize: 15,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  deliveryDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  detailIcon: {
    marginRight: 10,
  },
  detailText: {
    fontSize: 15,
    flex: 1,
  },
  button: {
    marginTop: 10,
    marginBottom: 30,
  },
}); 