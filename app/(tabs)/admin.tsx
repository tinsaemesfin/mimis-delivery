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
  Pressable
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/Button';
import { createShadow } from '@/utils/styling';

// Import tab components
import AnimalsTab from '../components/admin-tabs/AnimalsTab';
import CuttingStylesTab from '../components/admin-tabs/CuttingStylesTab';
import OrdersTab from '../components/admin-tabs/OrdersTab';
import DatesTab from '../components/admin-tabs/DatesTab';

// Mock data for the animals
const initialAnimals = [
  { id: '1', name: 'Lamb', sizes: ['Small', 'Medium', 'Large'], active: true },
  { id: '2', name: 'Sheep', sizes: ['Small', 'Medium', 'Large'], active: true },
  { id: '3', name: 'Goat', sizes: ['Small', 'Medium'], active: false },
];

// Mock data for cutting styles
const initialCuttingStyles = [
  { id: '1', name: 'Traditional', active: true },
  { id: '2', name: 'Modern', active: true },
  { id: '3', name: 'Special', active: false },
];

// Mock data for orders
const initialOrders = [
  { 
    id: '1', 
    date: '2023-12-15', 
    status: 'Pending',
    customerName: 'John Smith',
    animalType: 'Lamb',
    size: 'Medium',
    cutStyle: 'Traditional',
    divided: 'No',
    phoneNumber: '555-123-4567',
    address: '123 Main St, City',
    total: 325.50,
  },
  { 
    id: '2', 
    date: '2023-12-10', 
    status: 'Delivered',
    customerName: 'Jane Doe',
    animalType: 'Sheep',
    size: 'Large',
    cutStyle: 'Modern',
    divided: 'Yes (2 parts)',
    phoneNumber: '555-987-6543',
    address: '456 Oak Ave, Town',
    total: 412.75,
  },
  { 
    id: '3', 
    date: '2023-12-05', 
    status: 'Processing',
    customerName: 'Bob Johnson',
    animalType: 'Lamb',
    size: 'Small',
    cutStyle: 'Traditional',
    divided: 'No',
    phoneNumber: '555-567-8901',
    address: '789 Pine St, Village',
    total: 275.00,
  },
];

// Mock data for available delivery dates
const initialDeliveryDates = [
  { id: '1', date: '2023-12-20', slots: 5, booked: 2, active: true },
  { id: '2', date: '2023-12-22', slots: 3, booked: 1, active: true },
  { id: '3', date: '2023-12-25', slots: 0, booked: 0, active: false },
  { id: '4', date: '2023-12-27', slots: 8, booked: 0, active: true },
];

type AdminTab = 'animals' | 'cuttingStyles' | 'orders' | 'dates';

export default function AdminScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');
  const [animals, setAnimals] = useState(initialAnimals);
  const [cuttingStyles, setCuttingStyles] = useState(initialCuttingStyles);
  const [orders, setOrders] = useState(initialOrders);
  const [deliveryDates, setDeliveryDates] = useState(initialDeliveryDates);
  
  // Status update modal state
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  // Date filter state
  const [dateFilterVisible, setDateFilterVisible] = useState(false);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [tempStartDate, setTempStartDate] = useState<string | null>(null);
  const [tempEndDate, setTempEndDate] = useState<string | null>(null);
  const [filteredOrders, setFilteredOrders] = useState(initialOrders);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [newAnimalName, setNewAnimalName] = useState('');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  
  const [cuttingStyleModal, setCuttingStyleModal] = useState(false);
  const [newStyleName, setNewStyleName] = useState('');
  
  const [dateModal, setDateModal] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newSlots, setNewSlots] = useState('');

  // Filter orders when date filter or orders list changes
  useEffect(() => {
    if (dateFilterVisible) {
      setFilteredOrders(filterOrdersByDateRange());
    } else {
      setFilteredOrders(orders);
    }
  }, [dateFilterVisible, orders, startDate, endDate]);

  // Add effect to defer tab initialization
  useEffect(() => {
    // This ensures the root layout is mounted before any operations
    const timer = setTimeout(() => {
      // The component is now mounted
    }, 0);
    
    return () => clearTimeout(timer);
  }, []);

  // Function to handle adding a new animal
  const handleAddAnimal = () => {
    if (newAnimalName.trim() === '') {
      Alert.alert('Error', 'Please enter an animal name');
      return;
    }
    
    if (selectedSizes.length === 0) {
      Alert.alert('Error', 'Please select at least one size');
      return;
    }
    
    const newAnimal = {
      id: (animals.length + 1).toString(),
      name: newAnimalName,
      sizes: selectedSizes,
      active: true
    };
    
    setAnimals([...animals, newAnimal]);
    setNewAnimalName('');
    setSelectedSizes([]);
    setModalVisible(false);
  };
  
  // Function to toggle animal active status
  const toggleAnimalStatus = (id: string) => {
    setAnimals(
      animals.map(animal => 
        animal.id === id ? { ...animal, active: !animal.active } : animal
      )
    );
  };
  
  // Function to handle adding a new cutting style
  const handleAddCuttingStyle = () => {
    if (newStyleName.trim() === '') {
      Alert.alert('Error', 'Please enter a cutting style name');
      return;
    }
    
    const newStyle = {
      id: (cuttingStyles.length + 1).toString(),
      name: newStyleName,
      active: true
    };
    
    setCuttingStyles([...cuttingStyles, newStyle]);
    setNewStyleName('');
    setCuttingStyleModal(false);
  };
  
  // Function to toggle cutting style active status
  const toggleCuttingStyleStatus = (id: string) => {
    setCuttingStyles(
      cuttingStyles.map(style => 
        style.id === id ? { ...style, active: !style.active } : style
      )
    );
  };
  
  // Function to handle adding a new delivery date
  const handleAddDeliveryDate = () => {
    if (newDate.trim() === '' || newSlots.trim() === '') {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    const slots = parseInt(newSlots);
    if (isNaN(slots) || slots <= 0) {
      Alert.alert('Error', 'Slots must be a positive number');
      return;
    }
    
    const newDateEntry = {
      id: (deliveryDates.length + 1).toString(),
      date: newDate,
      slots: slots,
      booked: 0,
      active: true,
    };
    
    setDeliveryDates([...deliveryDates, newDateEntry]);
    setNewDate('');
    setNewSlots('');
    setDateModal(false);
  };
  
  // Function to toggle date active status
  const toggleDateStatus = (id: string) => {
    setDeliveryDates(
      deliveryDates.map(date => 
        date.id === id ? { ...date, active: !date.active } : date
      )
    );
  };
  
  // Function to handle exporting orders to Excel
  const handleExportOrders = () => {
    Alert.alert('Success', 'Orders exported to Excel successfully');
  };
  
  const updateOrderStatus = (status: string) => {
    setOrders(
      orders.map(order => 
        order.id === selectedOrder.id 
          ? { ...order, status: status } 
          : order
      )
    );
    setStatusModalVisible(false);
  };
  
  const openStatusModal = (order: any) => {
    setSelectedOrder(order);
    setStatusModalVisible(true);
  };
  
  const filterOrdersByDateRange = () => {
    if (startDate || endDate) {
      const filtered = orders.filter(order => {
        // Parse the order date, ensuring it's treated as UTC
        const orderDateParts = order.date.split('-');
        const orderDate = new Date(
          parseInt(orderDateParts[0]),
          parseInt(orderDateParts[1]) - 1,
          parseInt(orderDateParts[2])
        );
        
        let includeOrder = true;
        
        if (startDate) {
          // Parse the start date
          const startDateParts = startDate.split('-');
          const start = new Date(
            parseInt(startDateParts[0]),
            parseInt(startDateParts[1]) - 1,
            parseInt(startDateParts[2])
          );
          
          // Compare dates without time
          const orderDateString = orderDate.toISOString().split('T')[0];
          const startDateString = start.toISOString().split('T')[0];
          includeOrder = includeOrder && orderDateString >= startDateString;
        }
        
        if (endDate) {
          // Parse the end date
          const endDateParts = endDate.split('-');
          const end = new Date(
            parseInt(endDateParts[0]),
            parseInt(endDateParts[1]) - 1,
            parseInt(endDateParts[2])
          );
          end.setHours(23, 59, 59, 999); // Include the entire end day
          
          // Compare dates without time
          const orderDateString = orderDate.toISOString().split('T')[0];
          const endDateString = end.toISOString().split('T')[0];
          includeOrder = includeOrder && orderDateString <= endDateString;
        }
        
        return includeOrder;
      });
      
      return filtered;
    }
    return orders;
  };

  const formatDateForDisplay = (dateString: string | null) => {
    if (!dateString) return 'Any';
    return new Date(dateString).toLocaleDateString();
  };

  const openDateFilter = () => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setDateFilterVisible(true);
  };

  const applyDateFilter = () => {
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setDateFilterVisible(false);
  };

  const clearDateFilter = () => {
    setStartDate(null);
    setEndDate(null);
    setTempStartDate(null);
    setTempEndDate(null);
    setDateFilterVisible(false);
  };

  const cancelDateFilter = () => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setDateFilterVisible(false);
  };

  const handleDateSelect = (year: number, month: number, isStart: boolean) => {
    // Create a date string (YYYY-MM-DD) with the first day for start date or last day for end date
    const date = new Date(year, month, isStart ? 1 : new Date(year, month + 1, 0).getDate());
    
    // Format the date as YYYY-MM-DD manually to avoid timezone issues
    const pad = (num: number) => num.toString().padStart(2, '0');
    const dateString = `${year}-${pad(month + 1)}-${pad(isStart ? 1 : new Date(year, month + 1, 0).getDate())}`;
    
    console.log(`Setting ${isStart ? 'start' : 'end'} date to: ${dateString}`);
    
    if (isStart) {
      setTempStartDate(dateString);
    } else {
      setTempEndDate(dateString);
    }
  };

  // Function to render admin tabs
  const renderTabs = () => {
    return (
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>

        <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'orders' && { ...styles.activeTab, borderBottomColor: colors.primary }
            ]}
            onPress={() => {
              // Defer tab change to ensure it happens after layout is ready
              setTimeout(() => setActiveTab('orders'), 0);
            }}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'orders' && { ...styles.activeTabText, color: colors.primary }
              ]}
            >
              Orders
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'animals' && { ...styles.activeTab, borderBottomColor: colors.primary }
            ]}
            onPress={() => {
              // Defer tab change to ensure it happens after layout is ready
              setTimeout(() => setActiveTab('animals'), 0);
            }}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'animals' && { ...styles.activeTabText, color: colors.primary }
              ]}
            >
              Animals
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'cuttingStyles' && { ...styles.activeTab, borderBottomColor: colors.primary }
            ]}
            onPress={() => {
              // Defer tab change to ensure it happens after layout is ready
              setTimeout(() => setActiveTab('cuttingStyles'), 0);
            }}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'cuttingStyles' && { ...styles.activeTabText, color: colors.primary }
              ]}
            >
              Cutting Styles
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'dates' && { ...styles.activeTab, borderBottomColor: colors.primary }
            ]}
            onPress={() => {
              // Defer tab change to ensure it happens after layout is ready
              setTimeout(() => setActiveTab('dates'), 0);
            }}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'dates' && { ...styles.activeTabText, color: colors.primary }
              ]}
            >
              Delivery Dates
            </Text>
          </TouchableOpacity>
          
          
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />
      
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Admin Panel</Text>
          <Text style={[styles.subtitle, { color: colors.lightText }]}>
            Manage your business
          </Text>
        </View>
      </View>
      
      {renderTabs()}
      
      <View style={styles.contentContainer}>
        {activeTab === 'animals' && (
          <AnimalsTab 
            animals={animals} 
            setAnimals={setAnimals} 
          />
        )}
        {activeTab === 'cuttingStyles' && (
          <CuttingStylesTab 
            cuttingStyles={cuttingStyles} 
            setCuttingStyles={setCuttingStyles}
          />
        )}
        {activeTab === 'dates' && (
          <DatesTab 
            deliveryDates={deliveryDates} 
            setDeliveryDates={setDeliveryDates}
          />
        )}
        {activeTab === 'orders' && (
          <OrdersTab 
            orders={orders} 
            setSelectedOrder={setSelectedOrder}
            openStatusModal={openStatusModal}
            onExport={handleExportOrders}
          />
        )}
      </View>
      
      {/* Status update modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={statusModalVisible}
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Update Order Status</Text>
            
            {selectedOrder && (
              <Text style={[styles.orderInfo, { color: colors.text }]}>
                Order by {selectedOrder.customerName}
              </Text>
            )}
            
            <View style={styles.statusOptions}>
              {['Pending', 'Confirmed', 'Processing', 'Ready', 'Delivered', 'Canceled'].map((status) => (
                <Button
                  key={status}
                  title={status}
                  onPress={() => updateOrderStatus(status)}
                  style={{
                    marginBottom: 8,
                    ...(selectedOrder?.status === status ? { backgroundColor: colors.secondary } : {})
                  }}
                />
              ))}
            </View>
            
            <Button 
              title="Cancel" 
              onPress={() => setStatusModalVisible(false)}
              style={styles.cancelButton}
              variant="outline"
            />
          </View>
        </View>
      </Modal>
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
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tabsScroll: {
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  tab: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginRight: 5,
  },
  activeTab: {
    borderBottomWidth: 3,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    fontWeight: '700',
  },
  contentContainer: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'white',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  orderInfo: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  statusOptions: {
    width: '100%',
    marginBottom: 20,
  },
  cancelButton: {
    marginTop: 8,
  },
}); 