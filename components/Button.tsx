import React, { forwardRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { createShadow } from '../utils/styling';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
}

const Button = forwardRef<React.ComponentRef<typeof TouchableOpacity>, ButtonProps>(({
  title,
  onPress,
  style,
  textStyle,
  disabled = false,
  loading = false,
  variant = 'primary',
}, ref) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  const getBackgroundColor = () => {
    if (disabled) return '#CCCCCC';
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.secondary;
      case 'outline':
        return 'transparent';
      default:
        return colors.primary;
    }
  };

  const getBorderColor = () => {
    if (disabled) return '#CCCCCC';
    switch (variant) {
      case 'outline':
        return colors.primary;
      default:
        return 'transparent';
    }
  };

  const getTextColor = () => {
    if (disabled) return '#666666';
    switch (variant) {
      case 'outline':
        return colors.primary;
      default:
        return '#FFFFFF';
    }
  };

  return (
    <TouchableOpacity
      ref={ref}
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor(), borderColor: getBorderColor() },
        variant === 'outline' && styles.outlineButton,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
});

// Add display name for debugging purposes
Button.displayName = 'Button';

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    borderWidth: 0,
    ...createShadow('#000', { width: 0, height: 2 }, 0.1, 4, 3),
  },
  outlineButton: {
    borderWidth: 2,
    elevation: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default Button; 