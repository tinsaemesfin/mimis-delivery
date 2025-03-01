import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, View, Text, FlatList, Platform, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Card from '../components/Card';
import Button from '../components/Button';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

// Define cut options for each meat type
const cutOptions = {
  beef: [
    { id: 'ribeye', title: 'Ribeye', description: 'Juicy and well-marbled steak' },
    { id: 'sirloin', title: 'Sirloin', description: 'Lean and flavorful cut' },
    { id: 'brisket', title: 'Brisket', description: 'Perfect for slow cooking' },
    { id: 'filet', title: 'Filet Mignon', description: 'Tender and delicate cut' },
  ],
  chicken: [
    { id: 'breast', title: 'Breast', description: 'Lean white meat' },
    { id: 'thigh', title: 'Thigh', description: 'Juicy dark meat' },
    { id: 'wing', title: 'Wing', description: 'Perfect for appetizers' },
    { id: 'whole', title: 'Whole Chicken', description: 'Complete chicken' },
  ],
  pork: [
    { id: 'chop', title: 'Chop', description: 'Classic pork chops' },
    { id: 'shoulder', title: 'Shoulder', description: 'Great for pulled pork' },
    { id: 'tenderloin', title: 'Tenderloin', description: 'Lean and tender' },
    { id: 'belly', title: 'Belly', description: 'Rich and flavorful' },
  ],
  lamb: [
    { id: 'chop', title: 'Chop', description: 'Tender and flavorful' },
    { id: 'leg', title: 'Leg', description: 'Great for roasting' },
    { id: 'rack', title: 'Rack', description: 'Premium cut' },
    { id: 'shoulder', title: 'Shoulder', description: 'Perfect for slow cooking' },
  ],
};

const { width, height } = Dimensions.get('window');

export default function CutSelectionScreen() {
  const { meatType } = useLocalSearchParams();
  const [selectedCut, setSelectedCut] = useState<string | null>(null);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  // Get the correct cuts based on selected meat type
  const availableCuts = cutOptions[meatType as keyof typeof cutOptions] || [];

  const handleNextStep = () => {
    if (selectedCut) {
      router.push({
        pathname: '/style-selection',
        params: { 
          meatType: meatType,
          cutType: selectedCut 
        },
      });
    }
  };

  const renderItem = ({ item }: { item: { id: string, title: string, description: string } }) => (
    <Card
      title={item.title}
      description={item.description}
      image={require('../assets/images/meat-banner.png')}
      selected={selectedCut === item.id}
      onPress={() => setSelectedCut(item.id)}
      style={styles.card}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />
      
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Select Cut</Text>
          <Text style={[styles.subtitle, { color: colors.lightText }]}>
            Choose your preferred {meatType} cut
          </Text>
        </View>
      </View>

      <FlatList
        data={availableCuts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <View style={[styles.footer, { 
        borderTopColor: colors.border,
        backgroundColor: colorScheme === 'dark' ? 'rgba(25,25,25,0.95)' : 'rgba(255,255,255,0.95)'
      }]}>
        <Button
          title="Next Step"
          onPress={handleNextStep}
          disabled={!selectedCut}
          style={styles.button}
        />
      </View>
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
  listContent: {
    padding: 16,
    paddingBottom: 100, // Ensure content isn't hidden behind the footer
  },
  card: {
    marginVertical: 8,
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