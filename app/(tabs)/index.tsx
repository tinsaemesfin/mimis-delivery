import React, { useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions, 
  SafeAreaView,
  Platform,
  Animated
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Button from '../../components/Button';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { createShadow, createTextShadow } from '../../utils/styling';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  const scaleAnim = new Animated.Value(1);

  const handleStartOrder = () => {
    // Navigate directly to animal selection
    router.push('/animal-selection');
  };

  useEffect(() => {
    const pulseAnimation = Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.05,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]);

    Animated.loop(pulseAnimation).start();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />
      
      <View style={styles.mainContainer}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Platform.OS === 'ios' ? 50 : 30 } // Add padding for FAB
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.heroSection}>
            <Image 
              source={require('../../assets/images/View-of-sheep.png')} 
              style={styles.heroImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
              style={styles.heroGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
            <View style={styles.heroContent}>
              <Text style={[styles.heroTitle, createTextShadow('rgba(0, 0, 0, 0.5)', { width: 0, height: 2 }, 3)]}>
                Mimi's Delivery
              </Text>
              <Text style={[styles.heroSubtitle, createTextShadow('rgba(0, 0, 0, 0.5)', { width: 0, height: 1 }, 2)]}>
                Premium Lamb, Goat & Sheep Delivery
              </Text>
            </View>
          </View>

          <View style={styles.contentContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Farm to Table. Directly to You.
            </Text>
            
            <Text style={[styles.description, { color: colors.lightText }]}>
              We deliver premium quality lamb, goat and sheep directly from farm to your doorstep.
            </Text>

            <View style={styles.featuresContainer}>
              <View style={styles.featureRow}>
                <View style={[styles.featureIconContainer, { backgroundColor: colors.primary + '10' }]}>
                  <MaterialCommunityIcons name="sheep" size={24} color={colors.primary} />
                </View>
                <View style={styles.featureTextContainer}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>Whole Animals</Text>
                  <Text style={[styles.featureDescription, { color: colors.lightText }]}>
                    Choose from a variety of premium sheep and lamb
                  </Text>
                </View>
              </View>

              <View style={styles.featureRow}>
                <View style={[styles.featureIconContainer, { backgroundColor: colors.primary + '10' }]}>
                  <MaterialCommunityIcons name="knife" size={24} color={colors.primary} />
                </View>
                <View style={styles.featureTextContainer}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>Custom Cuts</Text>
                  <Text style={[styles.featureDescription, { color: colors.lightText }]}>
                    Select your preferred cutting style and portions
                  </Text>
                </View>
              </View>

              <View style={styles.featureRow}>
                <View style={[styles.featureIconContainer, { backgroundColor: colors.primary + '10' }]}>
                  <Ionicons name="time" size={24} color={colors.primary} />
                </View>
                <View style={styles.featureTextContainer}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>Fast Delivery</Text>
                  <Text style={[styles.featureDescription, { color: colors.lightText }]}>
                    Freshly Produced and delivered directly to your doorstep
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Floating Action Button */}
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={[
              styles.floatingButton,
              { backgroundColor: colors.primary },
              createShadow('0.5')
            ]}
            onPress={handleStartOrder}
            activeOpacity={0.8}
          >
            <Ionicons name="restaurant-outline" size={28} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Start Your Order</Text>
          </TouchableOpacity>
        </Animated.View>
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
  scrollContent: {
    flexGrow: 0, // Prevent infinite scrolling
  },
  heroSection: {
    height: height * 0.35,
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
    paddingHorizontal: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  button: {
    height: 56,
  },
  mainContainer: {
    flex: 1,
    position: 'relative',
  },
  floatingButton: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 20 : 16,
    left: 16,
    right: 16,
    height: 60,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
});
