import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, ViewStyle, Platform } from 'react-native';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { createShadow } from '../utils/styling';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  containerStyle?: ViewStyle;
  icon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  icon,
  ...rest
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View style={styles.inputContainer}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          style={[
            styles.input,
            { 
              color: colors.text,
              backgroundColor: error ? 'rgba(255, 0, 0, 0.03)' : colors.card,
              borderColor: error ? '#FF0000' : colors.border,
              paddingLeft: icon ? 44 : 16,
              ...createShadow('rgba(0,0,0,0.05)', { width: 0, height: 2 }, 1, 2, 2),
            }
          ]}
          placeholderTextColor={colors.lightText}
          autoCapitalize="none"
          {...rest}
        />
      </View>
      {error ? (
        <Text style={styles.errorText}>
          {error}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
  },
  input: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  errorText: {
    color: '#FF0000',
    fontSize: 14,
    marginTop: 6,
    marginLeft: 4,
  },
});

export default Input; 