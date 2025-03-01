import { ColorSchemeName } from 'react-native';

export function useColorScheme(): NonNullable<ColorSchemeName> {
  // Always return 'light' regardless of system preference
  return 'light';
}
