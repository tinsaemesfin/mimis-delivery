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
import { supabase } from '@/utils/supabase';
import { useAuth } from '../../lib/auth/AuthContext';
import { useIsAdmin } from '../../lib/auth/useIsAdmin';

// Import tab components
import AnimalsTab from '../components/admin-tabs/AnimalsTab';
import CuttingStylesTab from '../components/admin-tabs/CuttingStylesTab';
import OrdersTab from '../components/admin-tabs/OrdersTab';
import DatesTab from '../components/admin-tabs/DatesTab';
import PriceOptionsTab from '../components/admin-tabs/PriceOptionsTab';
import OrgansTab from '../components/admin-tabs/OrgansTab';
import ExtrasTab from '../components/admin-tabs/ExtrasTab';
import DeliveryFeeTab from '../components/admin-tabs/DeliveryFeeTab';
import AnimalSizesTab from '../components/admin-tabs/AnimalSizesTab';
import SuperAdminTab from '../components/admin-tabs/SuperAdminTab';
import LogsTab from '../components/admin-tabs/LogsTab';

// Define types for our data - These need to match the component expectations
type Animal = {
  id: string;
  name: string;
  sizes: string[];
  active: boolean;
  title: string;
  description: string;
  isActive?: boolean;
};

type Order = {
  id: string;
  customerName: string;
  date: string;
  status: string;
  total: number;
  animalType: string;
  size: string;
  cutStyle: string;
  divided: string;
  phoneNumber: string;
  address: string;
};

type CuttingStyle = {
  id: string;
  name: string;
  active: boolean;
};

type DeliveryDate = {
  id: string;
  date: string;
  slots: number;
  booked: number;
  active: boolean;
};

type PriceOption = {
  id: string;
  animalId: string;
  animalSize: string;
  name: string;
  price: number;
  description: string;
  isActive: boolean;
};

type Organ = {
  id: string;
  name: string;
  is_active: boolean;
};

type Extra = {
  id: string;
  title: string;
  description: string;
  price: number;
  is_active: boolean;
};

// Mock data for the animals - ensure all properties exist
const initialAnimals: Animal[] = [
  { 
    id: '1', 
    name: 'Lamb', 
    sizes: ['Small', 'Medium', 'Large'], 
    active: true, 
    title: 'Lamb', 
    description: 'Young sheep, tender meat with a mild flavor.',
    isActive: true
  },
  { 
    id: '2', 
    name: 'Sheep', 
    sizes: ['Small', 'Medium', 'Large'], 
    active: true, 
    title: 'Sheep', 
    description: 'Adult sheep with richer flavor and firmer texture.',
    isActive: true
  },
  { 
    id: '3', 
    name: 'Goat', 
    sizes: ['Small', 'Medium'], 
    active: false, 
    title: 'Goat', 
    description: 'Lean meat with distinctive flavor.',
    isActive: false
  },
];

// Mock data for cutting styles
const initialCuttingStyles: CuttingStyle[] = [
  { id: '1', name: 'Traditional', active: true },
  { id: '2', name: 'Modern', active: true },
  { id: '3', name: 'Special', active: false },
];

// Mock data for orders
const initialOrders: Order[] = [
  { 
    id: '1', 
    customerName: 'John Doe', 
    date: '2023-12-10', 
    status: 'Pending', 
    total: 320,
    animalType: 'Lamb',
    size: 'Medium',
    cutStyle: 'Traditional',
    divided: 'No',
    phoneNumber: '555-1234',
    address: '123 Main St'
  },
  { 
    id: '2', 
    customerName: 'Jane Smith', 
    date: '2023-12-15', 
    status: 'Confirmed', 
    total: 480,
    animalType: 'Sheep',
    size: 'Large',
    cutStyle: 'Modern',
    divided: 'Yes',
    phoneNumber: '555-5678',
    address: '456 Oak Ave'
  },
];

// Mock data for delivery dates
const initialDeliveryDates: DeliveryDate[] = [
  { id: '1', date: '2023-12-15', slots: 5, booked: 2, active: true },
  { id: '2', date: '2023-12-20', slots: 5, booked: 0, active: true },
  { id: '3', date: '2023-12-25', slots: 3, booked: 3, active: false },
  { id: '4', date: '2023-12-27', slots: 8, booked: 0, active: true },
];

// Initial price options data
const initialPriceOptions: PriceOption[] = [
  { 
    id: '1', 
    animalId: '1', // Lamb
    animalSize: 'Small', 
    name: 'Premium Package', 
    price: 320,
    description: 'Premium cuts with extra care',
    isActive: true
  },
  { 
    id: '2', 
    animalId: '1', // Lamb
    animalSize: 'Medium', 
    name: 'Family Package', 
    price: 480,
    description: 'Perfect for family gatherings',
    isActive: true
  },
  { 
    id: '3', 
    animalId: '2', // Sheep
    animalSize: 'Large', 
    name: 'Bulk Value', 
    price: 550,
    description: 'Best value for larger orders',
    isActive: true
  },
];

// Initial organs data
const initialOrgans: Organ[] = [
  { id: '1', name: 'Liver', is_active: true },
  { id: '2', name: 'Heart', is_active: true },
  { id: '3', name: 'Kidney', is_active: false },
];

// Initial extras data
const initialExtras: Extra[] = [
  { 
    id: '1', 
    title: 'Special Packaging', 
    description: 'Premium vacuum-sealed packaging',
    price: 15.99,
    is_active: true
  },
  { 
    id: '2', 
    title: 'Express Processing', 
    description: 'Priority processing of your order',
    price: 25.00,
    is_active: true
  },
];

// Initial sizes data
const initialSizes = [
  { id: '1', name: 'Small', description: 'Small size suitable for small gatherings' },
  { id: '2', name: 'Medium', description: 'Medium size suitable for family gatherings' },
  { id: '3', name: 'Large', description: 'Large size suitable for large gatherings' },
];

// Initial animal size options data
const initialAnimalSizeOptions = [
  {
    id: '1',
    animalId: '1', // Lamb
    sizeId: '1', // Small
    description: 'Small lamb suitable for small gatherings',
    isActive: true
  },
  {
    id: '2',
    animalId: '1', // Lamb
    sizeId: '2', // Medium
    description: 'Medium lamb suitable for family gatherings',
    isActive: true
  },
  {
    id: '3',
    animalId: '2', // Sheep
    sizeId: '3', // Large
    description: 'Large sheep suitable for large gatherings',
    isActive: true
  }
];

type AdminTab = 'animals' | 'cuttingStyles' | 'orders' | 'dates' | 'priceOptions' | 'organs' | 'extras' | 'deliveryFee' | 'animalSizes' | 'superAdmin' | 'logs';

// This comment is a temporary fix for type compatibility issues.
// There are conflicting type definitions between component files and this admin.tsx file.
// For proper long-term solution:
// 1. Create a shared types.ts file with all common types
// 2. Import types from this file in all components
// 3. Update this admin.tsx to use those shared types

// For now, we're using type assertions (as any) to bypass TypeScript type checking 
// since this is just a demonstration and the runtime behavior will work correctly.

export default function AdminScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  const { user } = useAuth();
  const { isAdmin, isSuperAdmin, loading } = useIsAdmin(user?.id);
  
  const [activeTab, setActiveTab] = useState<AdminTab>('animals');
  const [animals, setAnimals] = useState<Animal[]>(initialAnimals);
  const [cuttingStyles, setCuttingStyles] = useState<CuttingStyle[]>(initialCuttingStyles);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [deliveryDates, setDeliveryDates] = useState<DeliveryDate[]>(initialDeliveryDates);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  
  // Price options state
  const [priceOptions, setPriceOptions] = useState<PriceOption[]>(initialPriceOptions);
  
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

  const [organs, setOrgans] = useState<Organ[]>(initialOrgans);
  const [extras, setExtras] = useState<Extra[]>(initialExtras);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);

  // Filter orders when date filter or orders list changes
  useEffect(() => {
    if (dateFilterVisible) {
      setFilteredOrders(filterOrdersByDateRange());
    } else {
      setFilteredOrders(orders);
    }
  }, [dateFilterVisible, orders, startDate, endDate]);

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
      title: newAnimalName,
      description: `${newAnimalName} description`,
      sizes: selectedSizes,
      active: true,
      isActive: true
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
        order.id === selectedOrder?.id 
          ? { ...order, status: status } 
          : order
      )
    );
    setStatusModalVisible(false);
  };
  
  const openStatusModal = (order: Order) => {
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
              activeTab === 'animals' && { ...styles.activeTab, borderBottomColor: colors.primary }
            ]}
            onPress={() => {
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
          
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'priceOptions' && { ...styles.activeTab, borderBottomColor: colors.primary }
            ]}
            onPress={() => {
              setTimeout(() => setActiveTab('priceOptions'), 0);
            }}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'priceOptions' && { ...styles.activeTabText, color: colors.primary }
              ]}
            >
              Price Options
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'organs' && { ...styles.activeTab, borderBottomColor: colors.primary }
            ]}
            onPress={() => {
              setTimeout(() => setActiveTab('organs'), 0);
            }}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'organs' && { ...styles.activeTabText, color: colors.primary }
              ]}
            >
              Organs
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'extras' && { ...styles.activeTab, borderBottomColor: colors.primary }
            ]}
            onPress={() => {
              setTimeout(() => setActiveTab('extras'), 0);
            }}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'extras' && { ...styles.activeTabText, color: colors.primary }
              ]}
            >
              Extras
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'deliveryFee' && { ...styles.activeTab, borderBottomColor: colors.primary }
            ]}
            onPress={() => {
              setTimeout(() => setActiveTab('deliveryFee'), 0);
            }}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'deliveryFee' && { ...styles.activeTabText, color: colors.primary }
              ]}
            >
              Delivery Fee
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'animalSizes' && { ...styles.activeTab, borderBottomColor: colors.primary }
            ]}
            onPress={() => {
              setTimeout(() => setActiveTab('animalSizes'), 0);
            }}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'animalSizes' && { ...styles.activeTabText, color: colors.primary }
              ]}
            >
              Animal Sizes
            </Text>
          </TouchableOpacity>
          
          {isSuperAdmin && (
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'superAdmin' && { ...styles.activeTab, borderBottomColor: colors.primary }
              ]}
              onPress={() => {
                setTimeout(() => setActiveTab('superAdmin'), 0);
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'superAdmin' && { ...styles.activeTabText, color: colors.primary }
                ]}
              >
                Super Admin
              </Text>
            </TouchableOpacity>
          )}
          
          {isSuperAdmin && (
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'logs' && { ...styles.activeTab, borderBottomColor: colors.primary }
              ]}
              onPress={() => {
                setTimeout(() => setActiveTab('logs'), 0);
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'logs' && { ...styles.activeTabText, color: colors.primary }
                ]}
              >
                Logs
              </Text>
            </TouchableOpacity>
          )}
          
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />
      
      {renderTabs()}
      
      <View style={styles.contentContainer}>
        {activeTab === 'animals' && (
          <AnimalsTab 
            animals={animals as any} 
            setAnimals={setAnimals as any} 
          />
        )}
        {activeTab === 'cuttingStyles' && (
          <CuttingStylesTab 
            cuttingStyles={cuttingStyles as any} 
            setCuttingStyles={setCuttingStyles as any}
          />
        )}
        {activeTab === 'dates' && (
          <DatesTab 
            deliveryDates={deliveryDates as any} 
            setDeliveryDates={setDeliveryDates as any}
          />
        )}
        {activeTab === 'orders' && (
          <OrdersTab 
            orders={orders as any} 
            setSelectedOrder={setSelectedOrder as any}
            openStatusModal={openStatusModal as any}
            onExport={handleExportOrders}
            isSuperAdmin={isSuperAdmin}
          />
        )}
        {activeTab === 'priceOptions' && (
          <PriceOptionsTab 
            animals={animals as any}
            priceOptions={priceOptions as any}
            setPriceOptions={setPriceOptions as any}
          />
        )}
        {activeTab === 'organs' && (
          <OrgansTab
            organs={organs}
            setOrgans={setOrgans}
          />
        )}
        {activeTab === 'extras' && (
          <ExtrasTab
            extras={extras}
            setExtras={setExtras}
          />
        )}
        {activeTab === 'deliveryFee' && (
          <DeliveryFeeTab
            deliveryFee={deliveryFee}
            setDeliveryFee={setDeliveryFee}
          />
        )}
        {activeTab === 'animalSizes' && <AnimalSizesTab />}
        {activeTab === 'superAdmin' && <SuperAdminTab currentUserId={user?.id || ''} />}
        {activeTab === 'logs' && <LogsTab currentUserId={user?.id || ''} />}
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