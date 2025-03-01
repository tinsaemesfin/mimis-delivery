import React from 'react';
import { StyleSheet, SafeAreaView, View, Text, FlatList, StatusBar, Platform } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';

// Example data for orders
const orderHistory = [
  {
    id: '1',
    date: '2023-10-15',
    status: 'Delivered',
    items: 'Beef - Ribeye - Sliced',
  },
  {
    id: '2',
    date: '2023-10-01',
    status: 'Delivered',
    items: 'Pork - Chop - Whole',
  },
  {
    id: '3',
    date: '2023-09-20',
    status: 'Cancelled',
    items: 'Chicken - Breast - Boneless',
  },
];

export default function OrdersScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  const renderOrderItem = ({ item }: { item: typeof orderHistory[0] }) => (
    <View style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.orderHeader}>
        <Text style={[styles.orderDate, { color: colors.text }]}>
          Order placed: {new Date(item.date).toLocaleDateString()}
        </Text>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: item.status === 'Delivered' ? '#E1F5E1' : '#FFEBEE' }
        ]}>
          <Text style={[
            styles.statusText, 
            { color: item.status === 'Delivered' ? '#2E7D32' : '#C62828' }
          ]}>
            {item.status}
          </Text>
        </View>
      </View>
      
      <View style={styles.orderContent}>
        <Ionicons 
          name={item.status === 'Delivered' ? 'checkmark-circle' : 'close-circle'} 
          size={28} 
          color={item.status === 'Delivered' ? '#4CAF50' : '#F44336'} 
          style={styles.statusIcon}
        />
        <View style={styles.orderDetails}>
          <Text style={[styles.orderItems, { color: colors.text }]}>{item.items}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Your Orders</Text>
          <Text style={[styles.subtitle, { color: colors.lightText }]}>
            View your order history
          </Text>
        </View>
      </View>

      {orderHistory.length > 0 ? (
        <FlatList
          data={orderHistory}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={56} color={colors.lightText} />
          <Text style={[styles.emptyText, { color: colors.lightText }]}>
            You don't have any orders yet
          </Text>
        </View>
      )}
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
  listContent: {
    padding: 16,
  },
  orderCard: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginRight: 12,
  },
  orderDetails: {
    flex: 1,
  },
  orderItems: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
}); 