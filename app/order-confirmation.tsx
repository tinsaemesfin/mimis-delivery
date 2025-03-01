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

const { width, height } = Dimensions.get('window');

export default function OrderConfirmationScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  const { meatType, cutType, styleType, name, phone, address } = params;

  const handleHomePress = () => {
    router.push('/');
  };

  const formatDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 1); // Delivery tomorrow
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      
      <View style={styles.headerSection}>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        <SafeAreaView style={styles.headerContent}>
          <View style={styles.successIconContainer}>
            <View style={styles.successIconOuter}>
              <View style={styles.successIconInner}>
                <Ionicons name="checkmark" size={52} color="#FFF" />
              </View>
            </View>
          </View>
          
          <Text style={styles.headerTitle}>Thank You!</Text>
          <Text style={styles.headerSubtitle}>
            Your order has been confirmed
          </Text>
        </SafeAreaView>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.orderIdSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.orderIdLabel, { color: colors.lightText }]}>Estimated Delivery</Text>
          <Text style={[styles.orderId, { color: colors.text }]}>{formatDate()}</Text>
        </View>
        
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Order Summary</Text>
          
          <View style={styles.detailsGroup}>
            <View style={styles.orderDetail}>
              <Text style={[styles.detailLabel, { color: colors.lightText }]}>Meat Type:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{meatType as string}</Text>
            </View>
            
            <View style={styles.orderDetail}>
              <Text style={[styles.detailLabel, { color: colors.lightText }]}>Cut:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{cutType as string}</Text>
            </View>
            
            <View style={styles.orderDetail}>
              <Text style={[styles.detailLabel, { color: colors.lightText }]}>Style:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{styleType as string}</Text>
            </View>
          </View>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Delivery Details</Text>
          
          <View style={styles.detailsGroup}>
            <View style={styles.orderDetail}>
              <View style={styles.labelWithIcon}>
                <Ionicons name="person" size={16} color={colors.primary} style={styles.detailIcon} />
                <Text style={[styles.detailLabel, { color: colors.lightText }]}>Name:</Text>
              </View>
              <Text style={[styles.detailValue, { color: colors.text }]}>{name as string}</Text>
            </View>
            
            <View style={styles.orderDetail}>
              <View style={styles.labelWithIcon}>
                <Ionicons name="call" size={16} color={colors.primary} style={styles.detailIcon} />
                <Text style={[styles.detailLabel, { color: colors.lightText }]}>Phone:</Text>
              </View>
              <Text style={[styles.detailValue, { color: colors.text }]}>{phone as string}</Text>
            </View>
            
            <View style={[styles.orderDetail, styles.addressDetail]}>
              <View style={styles.labelWithIcon}>
                <Ionicons name="location" size={16} color={colors.primary} style={styles.detailIcon} />
                <Text style={[styles.detailLabel, { color: colors.lightText }]}>Address:</Text>
              </View>
              <Text style={[styles.detailValue, styles.addressValue, { color: colors.text }]}>{address as string}</Text>
            </View>
          </View>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <View style={styles.messageContainer}>
            <Ionicons name="information-circle-outline" size={24} color={colors.primary} style={styles.messageIcon} />
            <Text style={[styles.message, { color: colors.text }]}>
              We'll contact you shortly to confirm your delivery details.
            </Text>
          </View>
        </View>
      </ScrollView>

      <SafeAreaView style={styles.buttonContainer}>
        <Button
          title="Return to Home"
          onPress={handleHomePress}
          style={styles.button}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    height: height * 0.35,
    position: 'relative',
  },
  headerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successIconOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerSubtitle: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  scrollView: {
    flex: 1,
    marginTop: -40,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  orderIdSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderIdLabel: {
    fontSize: 14,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  detailsGroup: {
    marginBottom: 16,
  },
  orderDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addressDetail: {
    alignItems: 'flex-start',
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: 6,
  },
  detailLabel: {
    fontSize: 16,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    textTransform: 'capitalize',
    maxWidth: '60%',
    textAlign: 'right',
  },
  addressValue: {
    textTransform: 'none',
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
    padding: 12,
    borderRadius: 10,
  },
  messageIcon: {
    marginRight: 10,
  },
  message: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  buttonContainer: {
    padding: 20,
  },
  button: {
    width: '100%',
    height: 56,
  },
}); 