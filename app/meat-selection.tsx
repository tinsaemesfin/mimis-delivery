import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, View, Text, FlatList, Platform, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import Card from '../components/Card';
import Button from '../components/Button';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

// Define meat options
const meatOptions = [
  {
    id: 'beef',
    title: 'Beef',
    description: 'Premium quality beef cuts',
    image: require('../assets/images/meat-banner.png'),
  },
  {
    id: 'lamb',
    title: 'lamb',
    description: 'Fresh lamb cuts',
    image: require('../assets/images/meat-banner.png'),
  },
  {
    id: 'sheep',
    title: 'sheep',
    description: 'Juicy sheep cuts',
    image: require('../assets/images/meat-banner.png'),
  },
  {
    id: 'goat',
    title: 'Goat',
    description: 'Tender Goat cuts',
    image: require('../assets/images/meat-banner.png'),
  },
];

const { width, height } = Dimensions.get('window');

export default function MeatSelectionScreen() {
  const [selectedMeat, setSelectedMeat] = useState<string | null>(null);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  const handleNextStep = () => {
    if (selectedMeat) {
      router.push({
        pathname: '/cut-selection',
        params: { meatType: selectedMeat },
      });
    }
  };

  const renderItem = ({ item }: { item: typeof meatOptions[0] }) => (
    <Card
      title={item.title}
      description={item.description}
      image={item.image}
      selected={selectedMeat === item.id}
      onPress={() => setSelectedMeat(item.id)}
      style={styles.card}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />
      
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Select Meat Type</Text>
          <Text style={[styles.subtitle, { color: colors.lightText }]}>
            Choose the type of meat you'd like to order
          </Text>
        </View>
      </View>

      <FlatList
        data={meatOptions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Button
          title="Next Step"
          onPress={handleNextStep}
          disabled={!selectedMeat}
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
    backgroundColor: 'rgba(255,255,255,0.95)',
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