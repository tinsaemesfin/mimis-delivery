import { Platform } from 'react-native';

/**
 * Creates cross-platform shadow styles
 * Uses shadowProps on native and boxShadow on web
 */
export const createShadow = (
  color: string = '#000',
  offset = { width: 0, height: 2 },
  opacity: number = 0.1,
  radius: number = 3,
  elevation: number = 3
) => {
  if (Platform.OS === 'web') {
    // For web, use boxShadow
    const { width, height } = offset;
    return {
      boxShadow: `${width}px ${height}px ${radius}px rgba(0, 0, 0, ${opacity})`
    };
  }
  
  // For native, use regular shadow properties
  return {
    shadowColor: color,
    shadowOffset: offset,
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation
  };
};

/**
 * Creates cross-platform text shadow styles
 */
export const createTextShadow = (
  color: string = 'rgba(0, 0, 0, 0.3)',
  offset = { width: 0, height: 1 },
  radius: number = 2
) => {
  if (Platform.OS === 'web') {
    // For web, use textShadow
    const { width, height } = offset;
    return {
      textShadow: `${width}px ${height}px ${radius}px ${color}`
    };
  }
  
  // For native, use regular textShadow properties
  return {
    textShadowColor: color,
    textShadowOffset: offset,
    textShadowRadius: radius
  };
}; 