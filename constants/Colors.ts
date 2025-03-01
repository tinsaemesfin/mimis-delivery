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
    primary: primaryLight,
    secondary: secondaryLight,
    text: '#11181C',
    lightText: '#687076',
    background: '#fff',
    card: '#F9F9F9',
    border: '#EAEAEA',
    tint: primaryLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: primaryLight,
  },
  dark: {
    primary: primaryDark,
    secondary: secondaryDark,
    text: '#ECEDEE',
    lightText: '#9BA1A6',
    background: '#151718',
    card: '#202224',
    border: '#2E2E2E',
    tint: primaryDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: primaryDark,
  },
};
