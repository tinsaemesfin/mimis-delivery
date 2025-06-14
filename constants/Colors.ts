/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const primaryLight = '#D50000'; // Mimi's Delivery red
const primaryDark = '#FF5252'; // Lighter red for dark mode
const secondaryLight = '#8B0000'; // Darker red for accents
const secondaryDark = '#FF8A80'; // Lighter red accent for dark mode

export const Colors = {
  light: {
    text: '#000000',
    background: '#FFFFFF',
    primary: primaryLight,
    secondary: secondaryLight,
    card: '#F5F5F5',
    border: '#E0E0E0',
    notification: '#FF4081',
    error: '#F44336',
    success: '#4CAF50',
    warning: '#FFC107',
    lightText: '#757575',
    placeholder: '#9E9E9E',
    tint: primaryLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: primaryLight,
    danger: '#dc3545',
    lightGray: '#E0E0E0',
  },
  dark: {
    text: '#FFFFFF',
    background: '#121212',
    primary: primaryDark,
    secondary: secondaryDark,
    card: '#1E1E1E',
    border: '#333333',
    notification: '#FF4081',
    error: '#F44336',
    success: '#4CAF50',
    warning: '#FFC107',
    lightText: '#BBBBBB',
    placeholder: '#666666',
    tint: primaryDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: primaryDark,
    danger: '#dc3545',
    lightGray: '#424242',
  },
};
