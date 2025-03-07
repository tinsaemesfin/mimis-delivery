import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions, 
  SafeAreaView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/Button';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { createShadow, createTextShadow } from '../../utils/styling';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  const handleStartOrder = () => {
    // Navigate directly to animal selection
    router.push('/animal-selection');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <Image 
            source={require('../../assets/images/meat-banner.png')} 
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0)']}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          <View style={styles.heroContent}>
            <Text style={[styles.heroTitle, createTextShadow('rgba(0, 0, 0, 0.5)', { width: 0, height: 2 }, 3)]}>
              Mimi's Delivery
            </Text>
            <Text style={[styles.heroSubtitle, createTextShadow('rgba(0, 0, 0, 0.5)', { width: 0, height: 1 }, 2)]}>
              Premium Lamb & Sheep Delivery
            </Text>
          </View>
        </View>

        <View style={styles.contentContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Farm to Table. Directly to You.
          </Text>
          
          <Text style={[styles.description, { color: colors.lightText }]}>
            We deliver premium quality lamb and sheep directly from our farm to your doorstep. Each animal is carefully raised and prepared according to your preferences.
          </Text>

          <View style={styles.featuresContainer}>
            <View style={[styles.featureRow, { backgroundColor: colors.card }]}>
              <View style={[styles.featureIconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="paw" size={24} color={colors.primary} />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>Whole Animals</Text>
                <Text style={[styles.featureDescription, { color: colors.lightText }]}>
                  Choose from a variety of premium sheep and lamb
                </Text>
              </View>
            </View>

            <View style={[styles.featureRow, { backgroundColor: colors.card }]}>
              <View style={[styles.featureIconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="cut" size={24} color={colors.primary} />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>Custom Cuts</Text>
                <Text style={[styles.featureDescription, { color: colors.lightText }]}>
                  Select your preferred cutting style and portions
                </Text>
              </View>
            </View>

            <View style={[styles.featureRow, { backgroundColor: colors.card }]}>
              <View style={[styles.featureIconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="time" size={24} color={colors.primary} />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>Fast Delivery</Text>
                <Text style={[styles.featureDescription, { color: colors.lightText }]}>
                  Fresh meat delivered directly to your doorstep
                </Text>
              </View>
            </View>
          </View>

          <Button
            title="Start Your Order"
            onPress={handleStartOrder}
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
  scrollContent: {
    flexGrow: 1,
  },
  heroSection: {
    height: height * 0.45,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  heroContent: {
    padding: 20,
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 18,
    color: 'white',
  },
  contentContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  featuresContainer: {
    marginBottom: 30,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    ...createShadow(),
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    height: 56,
  },
});
