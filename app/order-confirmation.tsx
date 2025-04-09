import React from 'react';
import { 
  StyleSheet, 
  SafeAreaView, 
  View, 
  Text, 
  ScrollView,
  Platform,
  Share,
  TouchableOpacity,
  Alert,
  ViewStyle
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { createShadow } from '../utils/styling';

export default function OrderConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  const handleShare = async () => {
    try {
      const message = `
Order Details:
Order Ticket: ${params.orderTicket}
Name: ${params.customerName}
Phone: ${params.phoneNumber}
Address: ${params.address}
Animal: ${params.animalType} (${params.size})
Price Option: ${params.priceName}
Total: $${params.finalPrice}
Cutting Style: ${params.cuttingStyleName}
${params.selectedOrgans ? `Selected Organs: ${params.selectedOrgans}` : ''}

Please keep this information for your records.
      `;

      await Share.share({
        message,
        title: `Order Ticket: ${params.orderTicket}`,
      });
    } catch (error) {
      console.error('Error sharing order details:', error);
    }
  };

  const handleDone = () => {
    if (params.isGuest === 'true') {
      Alert.alert(
        "Save Your Order Details",
        "Please take a screenshot or share your order details for future reference. You can track your order using your order ticket number.",
        [
          {
            text: "Share Details",
            onPress: handleShare,
          },
          {
            text: "Done",
            onPress: () => router.push('/(tabs)/orders'),
            style: "default"
          }
        ]
      );
    } else {
      router.push('/(tabs)/orders');
    }
  };

  const shareButtonStyle: ViewStyle = {
    ...styles.shareButton,
    backgroundColor: colors.card
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={[styles.successIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name="checkmark" size={48} color="white" />
          </View>
          
          <Text style={[styles.title, { color: colors.text }]}>Order Confirmed!</Text>
          
          <View style={[styles.ticketContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.ticketLabel, { color: colors.lightText }]}>Order Ticket</Text>
            <Text style={[styles.ticketNumber, { color: colors.primary }]}>{params.orderTicket}</Text>
            <Text style={[styles.ticketInfo, { color: colors.lightText }]}>
              Use this ticket number to track your order
            </Text>
          </View>

          <View style={[styles.detailsCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Details</Text>
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.lightText }]}>Name:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{params.customerName}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.lightText }]}>Phone:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{params.phoneNumber}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.lightText }]}>Address:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{params.address}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.lightText }]}>Animal Type:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{params.animalType}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.lightText }]}>Size:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{params.size}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.lightText }]}>Price Option:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{params.priceName}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.lightText }]}>Base Price:</Text>
              <Text style={[styles.detailValue, { color: colors.primary, fontWeight: '700' }]}>
                ${params.price}
              </Text>
            </View>

            {params.selectedExtras && (
              <>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.lightText }]}>Additional Services:</Text>
                  <View style={styles.extrasContainer}>
                    {JSON.parse(params.selectedExtras as string).map((extra: any, index: number) => (
                      <View key={index} style={styles.extraItem}>
                        <Text style={[styles.extraTitle, { color: colors.text }]}>
                          {extra.title}
                        </Text>
                        <Text style={[styles.extraPrice, { color: colors.primary }]}>
                          ${extra.price.toFixed(2)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.lightText }]}>Extras Total:</Text>
                  <Text style={[styles.detailValue, { color: colors.primary }]}>
                    ${params.totalExtrasPrice}
                  </Text>
                </View>
              </>
            )}

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.lightText }]}>Delivery Fee:</Text>
              <Text style={[styles.detailValue, { color: colors.primary }]}>
                ${parseFloat(params.deliveryFee as string).toFixed(2)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.lightText }]}>Cutting Style:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{params.cuttingStyleName}</Text>
            </View>

            {params.selectedOrgans && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.lightText }]}>Selected Organs:</Text>
                <View style={styles.organsContainer}>
                  {(typeof params.selectedOrgans === 'string' ? params.selectedOrgans.split(', ') : []).map((organ: string, index: number) => (
                    <View key={index} style={styles.organChip}>
                      <Text style={styles.organChipText}>{organ}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.lightText }]}>Divided:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{params.divided}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.lightText }]}>Delivery Date:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {params.deliveryDate ? new Date(params.deliveryDate as string).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }) : 'Not set'}
              </Text>
            </View>

            {params.special_instructions && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.lightText }]}>Special Instructions:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{params.special_instructions}</Text>
              </View>
            )}

            <View style={styles.divider} />
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.text, fontWeight: '600' }]}>Final Price:</Text>
              <Text style={[styles.detailValue, { color: colors.primary, fontWeight: '700', fontSize: 18 }]}>
                ${params.finalPrice}
              </Text>
            </View>
          </View>

          {params.isGuest === 'true' && (
            <View style={[styles.guestMessage, { backgroundColor: colors.card }]}>
              <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
              <Text style={[styles.guestMessageText, { color: colors.text }]}>
                Please save or share these details for future reference. You can track your order using the order ticket number above.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        <Button
          title="Share Details"
          onPress={handleShare}
          style={shareButtonStyle}
          textStyle={{ color: colors.primary }}
        />
        <Button
          title="Done"
          onPress={handleDone}
          style={styles.doneButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    alignItems: 'center',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
  },
  ticketContainer: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 24,
    ...createShadow('#000', { width: 0, height: 2 }, 0.1, 3),
  },
  ticketLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  ticketNumber: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  ticketInfo: {
    fontSize: 12,
  },
  detailsCard: {
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 24,
    ...createShadow('#000', { width: 0, height: 2 }, 0.1, 3),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  guestMessage: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    ...createShadow('#000', { width: 0, height: 2 }, 0.1, 3),
  },
  guestMessageText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  shareButton: {
    marginBottom: 8,
  },
  doneButton: {
    marginBottom: Platform.OS === 'ios' ? 16 : 0,
  },
  extrasContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  extraItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  extraTitle: {
    fontSize: 14,
    marginRight: 8,
  },
  extraPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  organsContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
  },
  organChip: {
    backgroundColor: Colors.light.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  organChipText: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 12,
  },
}); 