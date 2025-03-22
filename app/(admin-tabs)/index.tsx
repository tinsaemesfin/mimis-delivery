import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  Platform,
  Modal,
  Pressable,
  ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/Button';
import { createShadow } from '@/utils/styling';
import OrdersTab from '../components/admin-tabs/OrdersTab';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../lib/auth/AuthContext';

// Define Order type to match the one expected by OrdersTab
interface Order {
  id: string;
  customerName: string;
  date: string;
  status: string;
  total: number;
  animalType?: string;
  size?: string;
  cutStyle?: string;
  divided?: string;
  phoneNumber?: string;
  address?: string;
  created_at?: string;
  user_id?: string;
  order_ticket?: string;
}

export default function AdminOrdersScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  const { user } = useAuth();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Date filter state
  const [dateFilterVisible, setDateFilterVisible] = useState(false);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [tempStartDate, setTempStartDate] = useState<string | null>(null);
  const [tempEndDate, setTempEndDate] = useState<string | null>(null);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  
  // Load orders from Supabase
  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter orders when date filter or orders list changes
  useEffect(() => {
    if (dateFilterVisible) {
      setFilteredOrders(filterOrdersByDateRange());
    } else {
      setFilteredOrders(orders);
    }
  }, [dateFilterVisible, orders, startDate, endDate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Transform data to match our Order interface
      const formattedOrders: Order[] = data.map(order => ({
        id: order.id,
        customerName: order.customer_name || 'Unknown',
        date: order.created_at,
        status: order.status || 'Pending',
        total: order.total_price || 0,
        animalType: order.animal_type,
        size: order.size,
        cutStyle: order.cut_style,
        divided: order.divided ? 'Yes' : 'No',
        phoneNumber: order.phone_number,
        address: order.delivery_address,
        user_id: order.user_id,
        order_ticket: order.order_ticket
      }));
      
      setOrders(formattedOrders);
      setFilteredOrders(formattedOrders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportOrders = () => {
    Alert.alert('Export Orders', 'Orders would be exported to Excel in a real app.');
  };

  const updateOrderStatus = async (status: string) => {
    if (!selectedOrder) return;
    
    try {
      setLoading(true);
      
      // Update order in Supabase
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', selectedOrder.id);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      const updatedOrders = orders.map(order => 
        order.id === selectedOrder.id ? { ...order, status } : order
      );
      
      setOrders(updatedOrders);
      Alert.alert('Success', `Order status updated to ${status}`);
    } catch (err) {
      console.error('Error updating order status:', err);
      Alert.alert('Error', 'Failed to update order status. Please try again.');
    } finally {
      setStatusModalVisible(false);
      setSelectedOrder(null);
      setLoading(false);
    }
  };

  const openStatusModal = (order: Order) => {
    setSelectedOrder(order);
    setStatusModalVisible(true);
  };

  const filterOrdersByDateRange = () => {
    if (!startDate || !endDate) return orders;
    
    return orders.filter(order => {
      const orderDate = new Date(order.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Set hours to 0 for accurate date comparison
      orderDate.setHours(0, 0, 0, 0);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      
      return orderDate >= start && orderDate <= end;
    });
  };

  if (loading && orders.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading orders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.error || 'red'} />
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={fetchOrders}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <View style={styles.content}>
        {loading && (
          <View style={styles.overlayLoading}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
        
        <OrdersTab 
          orders={filteredOrders}
          setSelectedOrder={setSelectedOrder}
          openStatusModal={openStatusModal}
          onExport={handleExportOrders}
        />
      </View>
      
      {/* Order Status Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={statusModalVisible}
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={[styles.modalView, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Update Order Status</Text>
            
            {selectedOrder && (
              <Text style={[styles.orderInfo, { color: colors.lightText }]}>
                Order #{selectedOrder.order_ticket} - {selectedOrder.customerName}
              </Text>
            )}
            
            <View style={styles.statusButtons}>
              {['pending', 'confirmed', 'processing', 'ready', 'delivered', 'cancelled'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusButton,
                    { backgroundColor: getStatusColor(status) }
                  ]}
                  onPress={() => updateOrderStatus(status)}
                >
                  <Text style={styles.statusButtonText}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: '#000', marginTop: 40, width: '50%' }]}
              onPress={() => setStatusModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Helper function to get status color
const getStatusColor = (status: string) => {
  switch(status) {
    case 'pending': return '#FFA000';
    case 'confirmed': return '#2196F3';
    case 'processing': return '#9C27B0';
    case 'ready': return '#4CAF50';
    case 'delivered': return '#4CAF50';
    case 'cancelled': return '#F44336';
    default: return '#757575';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  overlayLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: '90%',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  orderInfo: {
    fontSize: 16,
    marginBottom: 20,
  },
  statusButtons: {
    width: '100%',
    marginBottom: 20,
  },
  statusButton: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  statusButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  closeButton: {
    borderRadius: 10,
    padding: 12,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
