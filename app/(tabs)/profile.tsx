import React from 'react';
import { StyleSheet, SafeAreaView, View, Text, ScrollView, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  const renderMenuItem = (
    icon: string,
    title: string,
    subtitle: string,
    onPress: () => void
  ) => (
    <TouchableOpacity
      style={[styles.menuItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
        <Ionicons name={icon as any} size={22} color="#FFF" />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.menuSubtitle, { color: colors.lightText }]}>
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.lightText} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
          <Text style={[styles.subtitle, { color: colors.lightText }]}>
            Manage your account
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.profileIconContainer, { backgroundColor: colors.primary }]}>
            <Text style={styles.profileIconText}>M</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>Guest User</Text>
            <Text style={[styles.profileEmail, { color: colors.lightText }]}>
              Sign in to view your profile
            </Text>
          </View>
        </View>

        <View style={[styles.menuSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
          
          {renderMenuItem(
            'person-outline',
            'Personal Information',
            'Manage your personal details',
            () => {}
          )}
          
          {renderMenuItem(
            'location-outline',
            'Saved Addresses',
            'Manage your delivery addresses',
            () => {}
          )}
          
          {renderMenuItem(
            'card-outline',
            'Payment Methods',
            'Manage your payment options',
            () => {}
          )}
        </View>

        <View style={[styles.menuSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Text>
          
          {renderMenuItem(
            'notifications-outline',
            'Notifications',
            'Manage notification settings',
            () => {}
          )}
          
          {renderMenuItem(
            'moon-outline',
            'Dark Mode',
            'Change app appearance',
            () => {}
          )}
          
          {renderMenuItem(
            'language-outline',
            'Language',
            'Change app language',
            () => {}
          )}
        </View>

        <View style={[styles.menuSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Support</Text>
          
          {renderMenuItem(
            'help-circle-outline',
            'Help Center',
            'Get help with your orders',
            () => {}
          )}
          
          {renderMenuItem(
            'information-circle-outline',
            'About Us',
            'Learn more about Mimi\'s Delivery',
            () => {}
          )}
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  profileIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileIconText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
  },
  menuSection: {
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    padding: 16,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
  },
}); 