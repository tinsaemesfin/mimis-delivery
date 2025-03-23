import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

interface AgreementDialogProps {
  visible: boolean;
  onAccept: () => void;
}

export default function AgreementDialog({ visible, onAccept }: AgreementDialogProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
    >
      <SafeAreaView style={styles.container}>
        <View style={[styles.content, { backgroundColor: colors.background }]}>
          <Text style={[styles.title, { color: colors.text }]}>App Usage Agreement</Text>
          
          <ScrollView style={styles.scrollView}>
            <Text style={[styles.paragraph, { color: colors.text }]}>
              This Agreement is made between Mimi deliver, hereinafter referred to as "Provider," and [User], hereinafter referred to as "User."
            </Text>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Scope of Use</Text>
            <Text style={[styles.paragraph, { color: colors.text }]}>
              The User is granted a non-exclusive, non-transferable right to use the Mimi's Dellivery App in accordance with the terms outlined herein.
            </Text>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>2. Payment Terms</Text>
            <Text style={[styles.paragraph, { color: colors.text }]}>
              The User agrees to pay the applicable amount for the use of the App as per the payment schedule specified in the order section selected by the customer. Payment will be made in person upon delivery.
            </Text>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>3. Privacy and Data Security</Text>
            <Text style={[styles.paragraph, { color: colors.text }]}>
              The Provider will handle the User's data in compliance with all applicable privacy laws.
            </Text>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>4. Liability</Text>
            <Text style={[styles.paragraph, { color: colors.text }]}>
              The Provider's liability is limited as specified in this Agreement, and the Provider is not liable for any indirect damages. The Provider's responsibility is to act on behalf of the User to pick up the designated animal and deliver it in accordance with the User's instructions.
            </Text>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>5. Termination</Text>
            <Text style={[styles.paragraph, { color: colors.text }]}>
              Either party may terminate this Agreement with one day's written notice, or by using the cancellation option available on the App.
            </Text>
          </ScrollView>

          <TouchableOpacity
            style={[styles.acceptButton, { backgroundColor: colors.primary }]}
            onPress={onAccept}
          >
            <Text style={styles.acceptButtonText}>I Accept</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  scrollView: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  acceptButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
}); 