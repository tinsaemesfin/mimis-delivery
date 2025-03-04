import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageSourcePropType, ViewStyle, Dimensions } from 'react-native';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { createShadow } from '../utils/styling';

interface CardProps {
  title: string;
  description?: string;
  image?: ImageSourcePropType;
  onPress: () => void;
  selected?: boolean;
  style?: ViewStyle;
}

const { width } = Dimensions.get('window');

const Card: React.FC<CardProps> = ({
  title,
  description,
  image,
  onPress,
  selected = false,
  style,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  const shadowColor = selected ? colors.primary : '#000';
  const shadowOpacity = selected ? 0.25 : 0.15;
  const shadowRadius = selected ? 10 : 6;
  const elevation = selected ? 8 : 4;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { 
          backgroundColor: colors.card, 
          borderColor: selected ? colors.primary : 'transparent',
          ...createShadow(shadowColor, { width: 0, height: 2 }, shadowOpacity, shadowRadius, elevation)
        },
        selected && styles.selectedCard,
        style,
      ]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      {image && (
        <View style={styles.imageContainer}>
          <Image source={image} style={styles.image} resizeMode="cover" />
          {selected && (
            <View style={[styles.selectedBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}
        </View>
      )}
      <View style={styles.content}>
        <Text 
          style={[
            styles.title, 
            { color: colors.text }
          ]}
        >
          {title}
        </Text>
        {description && (
          <Text 
            style={[
              styles.description, 
              { color: colors.lightText }
            ]}
          >
            {description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginVertical: 10,
    marginHorizontal: 2,
    overflow: 'hidden',
    borderWidth: 2,
  },
  selectedCard: {
    transform: [{ scale: 1.02 }],
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
  },
  image: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  checkmarkText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default Card; 