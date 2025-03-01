import React from 'react';
import { StyleSheet, Image, View, Text, SafeAreaView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Link } from 'expo-router';
import Button from '../../components/Button';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />
      
      <View style={styles.heroSection}>
        <Image
          source={require('../../assets/images/meat-banner.png')}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
          style={styles.gradient}
        />
        <SafeAreaView style={styles.heroContent}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>M</Text>
          </View>
          <Text style={styles.title}>Mimi's Delivery</Text>
          <Text style={styles.subtitle}>
            Premium meat cuts delivered to your door
          </Text>
        </SafeAreaView>
      </View>
      
      <SafeAreaView style={styles.contentSection}>
        <View style={styles.infoContainer}>
          <View style={styles.featureRow}>
            <View style={[styles.featureIcon, { backgroundColor: colors.primary }]}>
              <Text style={styles.featureIconText}>🥩</Text>
            </View>
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Premium Selection</Text>
              <Text style={[styles.featureDescription, { color: colors.lightText }]}>
                Choose from our wide variety of quality meats
              </Text>
            </View>
          </View>
          
          <View style={styles.featureRow}>
            <View style={[styles.featureIcon, { backgroundColor: colors.primary }]}>
              <Text style={styles.featureIconText}>✂️</Text>
            </View>
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Custom Cuts</Text>
              <Text style={[styles.featureDescription, { color: colors.lightText }]}>
                Select your preferred cut styles and preparations
              </Text>
            </View>
          </View>
          
          <View style={styles.featureRow}>
            <View style={[styles.featureIcon, { backgroundColor: colors.primary }]}>
              <Text style={styles.featureIconText}>🚚</Text>
            </View>
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Fast Delivery</Text>
              <Text style={[styles.featureDescription, { color: colors.lightText }]}>
                Get your order delivered fresh to your doorstep
              </Text>
            </View>
          </View>
        </View>

        <Link href="/meat-selection" asChild>
          <Button 
            title="Start Your Order"
            onPress={() => {}}
            style={styles.startButton}
          />
        </Link>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#D50000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  contentSection: {
    flex: 1,
    padding: 20,
    paddingTop: 30,
  },
  infoContainer: {
    flex: 1,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  featureIconText: {
    fontSize: 22,
  },
  featureText: {
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
  startButton: {
    width: '100%',
    marginBottom: Platform.OS === 'ios' ? 0 : 20,
    height: 60,
  },
});
