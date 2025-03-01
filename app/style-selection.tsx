import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, View, Text, FlatList, Platform, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Card from '../components/Card';
import Button from '../components/Button';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

// Define style options for each meat type
const styleOptions = {
  beef: [
    { id: 'ground', title: 'Ground', description: 'Minced beef' },
    { id: 'sliced', title: 'Sliced', description: 'Thinly sliced cuts' },
    { id: 'whole', title: 'Whole', description: 'Uncut piece' },
    { id: 'cubed', title: 'Cubed', description: 'Cut into cubes for stew' },
  ],
  chicken: [
    { id: 'whole', title: 'Whole', description: 'Uncut piece' },
    { id: 'boneless', title: 'Boneless', description: 'Meat without bones' },
    { id: 'cuts', title: 'Cut Pieces', description: 'Portioned pieces' },
    { id: 'ground', title: 'Ground', description: 'Minced chicken' },
  ],
  pork: [
    { id: 'sliced', title: 'Sliced', description: 'Thinly sliced cuts' },
    { id: 'ground', title: 'Ground', description: 'Minced pork' },
    { id: 'whole', title: 'Whole', description: 'Uncut piece' },
    { id: 'cubed', title: 'Cubed', description: 'Cut into cubes for stew' },
  ],
  lamb: [
    { id: 'whole', title: 'Whole', description: 'Uncut piece' },
    { id: 'sliced', title: 'Sliced', description: 'Thinly sliced cuts' },
    { id: 'cubed', title: 'Cubed', description: 'Cut into cubes for stew' },
    { id: 'ground', title: 'Ground', description: 'Minced lamb' },
  ],
};

const { width, height } = Dimensions.get('window');

export default function StyleSelectionScreen() {
  const { meatType, cutType } = useLocalSearchParams();
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  // Get the correct styles based on selected meat type
  const availableStyles = styleOptions[meatType as keyof typeof styleOptions] || [];

  const handleNextStep = () => {
    if (selectedStyle) {
      router.push({
        pathname: '/order-details',
        params: { 
          meatType,
          cutType,
          styleType: selectedStyle 
        },
      });
    }
  };

  const renderItem = ({ item }: { item: { id: string, title: string, description: string } }) => (
    <Card
      title={item.title}
      description={item.description}
      image={require('../assets/images/meat-banner.png')}
      selected={selectedStyle === item.id}
      onPress={() => setSelectedStyle(item.id)}
      style={styles.card}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />
      
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Select Style</Text>
          <Text style={[styles.subtitle, { color: colors.lightText }]}>
            Choose how you would like your {meatType} prepared
          </Text>
        </View>
      </View>

      <FlatList
        data={availableStyles}
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
          disabled={!selectedStyle}
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