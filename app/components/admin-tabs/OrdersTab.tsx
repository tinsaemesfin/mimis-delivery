import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  Platform,
  Alert,
  ScrollView,
  SafeAreaView,
  TextStyle,
  ViewStyle,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';
import Button from '../../../components/Button';
import { Calendar, DateData } from 'react-native-calendars';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../utils/supabase';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import Slider from '@react-native-community/slider';

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
  building_number?: string;
  created_at?: string;
  user_id?: string;
  order_ticket?: string;
  special_instructions?: string;
  organs?: string[];
  extras?: {
    id: string;
    title: string;
    price: number;
  }[];
  price_option?: {
    name: string;
    price: number;
  };
  delivery_fee: number;
}

interface FilterOptions {
  customerName: string;
  animalType: string;
  startDate: string | null;
  endDate: string | null;
  status: string | null;
}

interface OrdersTabProps {
  orders: Order[];
  setSelectedOrder: React.Dispatch<React.SetStateAction<Order | null>>;
  openStatusModal: (order: Order) => void;
  onExport?: () => void;
  onEditOrder?: (order: Order) => void;
  isSuperAdmin?: boolean; // Add this prop
}

const ORDERS_PER_PAGE = 10;



// Add the export function at the top level
const exportToExcel = async (orders: Order[]) => {
  try {
    // Transform orders data for Excel
    const excelData = orders.map(order => ({
      'Order ID': order.order_ticket || order.id,
      'Customer Name': order.customerName,
      'Phone Number': order.phoneNumber || 'N/A',
      'Address': order.address || 'N/A',
      'Building Number': order.building_number || 'Not found',
      'Order Date': format(parseISO(order.date), 'MMM dd, yyyy'),
      'Status': order.status.charAt(0).toUpperCase() + order.status.slice(1),
      'Animal Type': order.animalType,
      'Size': order.size,
      'Cut Style': order.cutStyle,
      'Divided': order.divided,
      'Selected Organs': order.organs ? order.organs.join(', ') : 'None',
      'Base Price': order.price_option?.price || 0,
      'Additional Services': order.extras ? order.extras.map(extra => `${extra.title} ($${extra.price})`).join(', ') : 'None',
      'Total Amount': order.total,
      'Special Instructions': order.special_instructions || 'None',
      'Created At': order.created_at ? format(parseISO(order.created_at), 'MMM dd, yyyy HH:mm:ss') : 'N/A'
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const columnWidths = [
      { wch: 15 }, // Order ID
      { wch: 20 }, // Customer Name
      { wch: 15 }, // Phone Number
      { wch: 30 }, // Address
      { wch: 15 }, // Building Number
      { wch: 15 }, // Order Date
      { wch: 12 }, // Status
      { wch: 15 }, // Animal Type
      { wch: 10 }, // Size
      { wch: 15 }, // Cut Style
      { wch: 10 }, // Divided
      { wch: 25 }, // Selected Organs
      { wch: 12 }, // Base Price
      { wch: 40 }, // Additional Services
      { wch: 12 }, // Total Amount
      { wch: 30 }, // Special Instructions
      { wch: 20 }, // Created At
    ];
    ws['!cols'] = columnWidths;

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Orders');

    // Generate Excel file
    const excelFile = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

    // Get current date for filename
    const currentDate = format(new Date(), 'yyyy-MM-dd_HH-mm');
    const fileName = `orders_export_${currentDate}.xlsx`;

    // Save file to cache directory first
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(filePath, excelFile, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    
    if (isAvailable) {
      // Share the file
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Export Orders',
        UTI: 'com.microsoft.excel.xlsx'
      });
    } else {
      throw new Error('Sharing is not available on this device');
    }

    // Clean up the cache file
    try {
      await FileSystem.deleteAsync(filePath, { idempotent: true });
    } catch (err) {
      console.warn('Could not clean up cache file:', err);
    }

    return true;
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
};

export default function OrdersTab({ orders: initialOrders, setSelectedOrder, openStatusModal, onExport, onEditOrder, isSuperAdmin }: OrdersTabProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreOrders, setHasMoreOrders] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedOrders, setPaginatedOrders] = useState<Order[]>([]);

  // Add filter state
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    customerName: '',
    animalType: '',
    startDate: null,
    endDate: null,
    status: null
  });
  const [appliedFilters, setAppliedFilters] = useState<FilterOptions>({
    customerName: '',
    animalType: '',
    startDate: null,
    endDate: null,
    status: null
  });

  // Remove the old date filter states since they're now part of filters
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [filteredOrders, setFilteredOrders] = useState(initialOrders);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [selectingStartDate, setSelectingStartDate] = useState(true);
  const [orderDetailsVisible, setOrderDetailsVisible] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [statusDropdownVisible, setStatusDropdownVisible] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Add these state variables after other state declarations
  const [customerSuggestions, setCustomerSuggestions] = useState<string[]>([]);
  const [availableAnimals, setAvailableAnimals] = useState<{ id: string; title: string }[]>([]);

  // Add new state variables
  const [exportTypeModalVisible, setExportTypeModalVisible] = useState(false);
  const [driversModalVisible, setDriversModalVisible] = useState(false);
  const [numberOfDrivers, setNumberOfDrivers] = useState(1);
  const [exportInProgress, setExportInProgress] = useState(false);

  // Add this effect to load animals from the database
  useEffect(() => {
    const loadAnimals = async () => {
      try {
        const { data, error } = await supabase
          .from('animals')
          .select('id, title')
          .eq('is_active', true);
        
        if (error) throw error;
        setAvailableAnimals(data || []);
      } catch (err) {
        console.error('Error loading animals:', err);
      }
    };
    
    loadAnimals();
  }, []);

  // Update handleCustomerSearch to use orders data
  const handleCustomerSearch = (text: string) => {
    setFilters(f => ({ ...f, customerName: text }));
    if (text.length >= 2) {
      const matches = [...new Set(initialOrders
        .map(order => order.customerName)
        .filter(name => 
          name.toLowerCase().includes(text.toLowerCase())
        ))];
      setCustomerSuggestions(matches);
    } else {
      setCustomerSuggestions([]);
    }
  };

  // Update the handleDateSelect function
  const handleDateSelect = (day: DateData) => {
    const selectedDate = day.dateString;
    
    if (selectingStartDate) {
      setFilters(f => ({ 
        ...f, 
        startDate: selectedDate,
        // If we're selecting start date, also set it as end date for single-day filter
        endDate: selectedDate 
      }));
      setSelectingStartDate(false);
      // Don't close calendar immediately, let user select end date or close manually
    } else {
      // If selecting end date and it's before start date, swap them
      if (filters.startDate && selectedDate < filters.startDate) {
        setFilters(f => ({ 
          ...f, 
          endDate: filters.startDate, 
          startDate: selectedDate 
        }));
      } else {
        setFilters(f => ({ ...f, endDate: selectedDate }));
      }
      setCalendarVisible(false);
      // Reopen filter modal after a short delay
      setTimeout(() => {
        setFilterModalVisible(true);
      }, 50);
    }
  };

  // Update the getMarkedDates function to handle single-day selection
  const getMarkedDates = () => {
    const markedDates: any = {};
    
    if (filters.startDate) {
      if (filters.startDate === filters.endDate) {
        // Single day selection
        markedDates[filters.startDate] = { 
          selected: true,
          color: colors.primary,
          textColor: 'white'
        };
      } else {
        // Start date
        markedDates[filters.startDate] = { 
          selected: true, 
          startingDay: true, 
          color: colors.primary,
          textColor: 'white'
        };
        
        // If we have an end date that's different from start date
        if (filters.endDate && filters.endDate !== filters.startDate) {
          // End date
          markedDates[filters.endDate] = { 
            selected: true, 
            endingDay: true, 
            color: colors.primary,
            textColor: 'white'
          };
          
          // Mark days in between
          try {
            const start = new Date(filters.startDate);
            const end = new Date(filters.endDate);
            
            const currentDate = new Date(start);
            currentDate.setDate(currentDate.getDate() + 1);
            
            while (currentDate < end) {
              const dateString = currentDate.toISOString().split('T')[0];
              markedDates[dateString] = {
                selected: true,
                color: colors.primary,
                textColor: 'white'
              };
              currentDate.setDate(currentDate.getDate() + 1);
            }
          } catch (e) {
            console.warn('Error marking date range:', e);
          }
        }
      }
    }
    
    return markedDates;
  };

  // Update the applyFilters function to handle single-day filtering
  const applyFilters = () => {
    setAppliedFilters(filters);
    let results = [...initialOrders];
    
    // Apply customer name filter
    if (filters.customerName) {
      results = results.filter(order => 
        order.customerName.toLowerCase().includes(filters.customerName.toLowerCase())
      );
    }
    
    // Apply animal type filter
    if (filters.animalType) {
      results = results.filter(order => 
        order.animalType?.toLowerCase().includes(filters.animalType.toLowerCase())
      );
    }
    
    // Apply status filter
    if (filters.status) {
      results = results.filter(order => order.status === filters.status);
    }
    
    // Apply date filter
    if (filters.startDate) {
      try {
        const start = parseISO(filters.startDate);
        const end = filters.endDate ? parseISO(filters.endDate) : start;
        
        // Set the time to start of day for start date and end of day for end date
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        
        results = results.filter(order => {
          try {
            const orderDate = parseISO(order.date);
            return isWithinInterval(orderDate, { start, end });
          } catch (e) {
            console.warn('Error parsing order date:', e);
            return false;
          }
        });
      } catch (e) {
        console.warn('Error with date filtering:', e);
      }
    }
    
    setFilteredOrders(results);
    setFilterModalVisible(false);
  };

  // Add this function to clear filters
  const clearFilters = () => {
    const emptyFilters = {
      customerName: '',
      animalType: '',
      startDate: null,
      endDate: null,
      status: null
    };
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setFilteredOrders(initialOrders);
  };

  // Update useEffect for filters
  useEffect(() => {
    applyFilters();
  }, [initialOrders]); // Only reapply when orders change

  // Add this function to remove a specific filter
  const removeFilter = (key: keyof FilterOptions) => {
    let newFilters: FilterOptions;
    
    if (key === 'startDate' || key === 'endDate') {
      // For date filters, set both to null
      newFilters = { ...appliedFilters, startDate: null, endDate: null };
    } else {
      // For other filters, set to empty string
      newFilters = { ...appliedFilters, [key]: key === 'status' ? null : '' };
    }
    
    setFilters(newFilters);
    setAppliedFilters(newFilters);
    
    // Apply filters directly with the new filter values instead of calling applyFilters()
    let results = [...initialOrders];
    
    // Apply customer name filter
    if (newFilters.customerName) {
      results = results.filter(order => 
        order.customerName.toLowerCase().includes(newFilters.customerName.toLowerCase())
      );
    }
    
    // Apply animal type filter
    if (newFilters.animalType) {
      results = results.filter(order => 
        order.animalType?.toLowerCase().includes(newFilters.animalType.toLowerCase())
      );
    }
    
    // Apply status filter
    if (newFilters.status) {
      results = results.filter(order => order.status === newFilters.status);
    }
    
    // Apply date filter
    if (newFilters.startDate) {
      try {
        const start = parseISO(newFilters.startDate);
        const end = newFilters.endDate ? parseISO(newFilters.endDate) : start;
        
        // Set the time to start of day for start date and end of day for end date
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        
        results = results.filter(order => {
          try {
            const orderDate = parseISO(order.date);
            return isWithinInterval(orderDate, { start, end });
          } catch (e) {
            console.warn('Error parsing order date:', e);
            return false;
          }
        });
      } catch (e) {
        console.warn('Error with date filtering:', e);
      }
    }
    
    setFilteredOrders(results);
  };

  // Update the renderFilterBadges function
  const renderFilterBadges = () => {
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterBadgesContainer}
        contentContainerStyle={styles.filterBadgesContent}
      >
        {appliedFilters.customerName && (
          <TouchableOpacity 
            style={[styles.filterBadge, { backgroundColor: colors.primary + '20' }]}
            onPress={() => removeFilter('customerName')}
          >
            <Text style={[styles.filterBadgeText, { color: colors.primary }]}>
              Customer: {appliedFilters.customerName}
            </Text>
            <Ionicons name="close-circle" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
        
        {appliedFilters.animalType && (
          <TouchableOpacity 
            style={[styles.filterBadge, { backgroundColor: colors.primary + '20' }]}
            onPress={() => removeFilter('animalType')}
          >
            <Text style={[styles.filterBadgeText, { color: colors.primary }]}>
              Animal: {appliedFilters.animalType}
            </Text>
            <Ionicons name="close-circle" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
        
        {appliedFilters.status && (
          <TouchableOpacity 
            style={[styles.filterBadge, { backgroundColor: colors.primary + '20' }]}
            onPress={() => removeFilter('status')}
          >
            <Text style={[styles.filterBadgeText, { color: colors.primary }]}>
              Status: {appliedFilters.status}
            </Text>
            <Ionicons name="close-circle" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
        
        {appliedFilters.startDate && appliedFilters.endDate && (
          <TouchableOpacity 
            style={[styles.filterBadge, { backgroundColor: colors.primary + '20' }]}
            onPress={() => removeFilter('startDate')}
          >
            <Text style={[styles.filterBadgeText, { color: colors.primary }]}>
              {formatDate(appliedFilters.startDate)} - {formatDate(appliedFilters.endDate)}
            </Text>
            <Ionicons name="close-circle" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch (e) {
      console.warn('Error formatting date:', e);
      return dateString;
    }
  };

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  // Get status color
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

  // Open order details modal
  const showOrderDetails = (order: Order) => {
    setSelectedOrderDetails(order);
    setOrderDetailsVisible(true);
  };

  // Handle status update from modal
  const handleStatusUpdate = async (order: Order, newStatus: string) => {
    try {
      setIsUpdatingStatus(true);
      // Update order in Supabase
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      const updatedOrders = initialOrders.map(o => 
        o.id === order.id ? { ...o, status: newStatus } : o
      );
      setFilteredOrders(updatedOrders);
      
      // Update the selected order details
      if (selectedOrderDetails && selectedOrderDetails.id === order.id) {
        setSelectedOrderDetails({ ...selectedOrderDetails, status: newStatus });
      }
      
      // Close the dropdown
      setStatusDropdownVisible(false);
      
      Alert.alert('Success', `Order status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating order status:', err);
      Alert.alert('Error', 'Failed to update order status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Add new function to extract address components
  const extractAddressComponents = (address: string) => {
    if (!address) return { streetName: '', zipCode: '' };
    
    const parts = address.split(',').map(part => part.trim());
    const zipCode = parts[parts.length - 1];
    const streetName = parts.slice(0, -1).join(', ');
    
    return { streetName, zipCode };
  };

  // Add function to generate random color
  const generateRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  // Add function to format order details for note
  const formatOrderNote = (order: Order) => {
    const details = [
      `Animal: ${order.animalType}`,
      `Size: ${order.size}`,
      `Cut Style: ${order.cutStyle}`,
      `Divided: ${order.divided}`,
      order.organs?.length ? `Organs: ${order.organs.join(', ')}` : null,
      order.extras?.length ? `Additional Services: ${order.extras.map(e => `${e.title} ($${e.price})`).join(', ')}` : null,
      `Base Price: $${order.price_option?.price || 0}`,
      `Delivery Fee: $${order.delivery_fee}`,
      `Total: $${order.total}`,
      order.special_instructions ? `Special Instructions: ${order.special_instructions}` : null
    ].filter(Boolean).join(' | ');

    return details.length > 1000 ? details.substring(0, 997) + '...' : details;
  };

  // Add function to group orders by proximity
  const groupOrdersByProximity = (orders: Order[], numberOfDrivers: number) => {
    if (orders.length < numberOfDrivers) {
      throw new Error('Cannot assign more drivers than orders');
    }

    // Sort orders by zipcode to keep nearby deliveries together
    const sortedOrders = [...orders].sort((a, b) => {
      const zipA = extractAddressComponents(a.address || '').zipCode;
      const zipB = extractAddressComponents(b.address || '').zipCode;
      return zipA.localeCompare(zipB);
    });

    // Distribute orders among drivers
    const ordersPerDriver = Math.ceil(sortedOrders.length / numberOfDrivers);
    const groups: Order[][] = [];

    for (let i = 0; i < numberOfDrivers; i++) {
      const start = i * ordersPerDriver;
      const end = Math.min(start + ordersPerDriver, sortedOrders.length);
      if (start < sortedOrders.length) {
        groups.push(sortedOrders.slice(start, end));
      }
    }

    return groups;
  };

  // Add function to export RoadWarrior format
  const exportToRoadWarrior = async (orders: Order[], numberOfDrivers: number) => {
    try {
      // Validate number of drivers
      if (orders.length < numberOfDrivers) {
        throw new Error(`Cannot assign ${numberOfDrivers} drivers to ${orders.length} orders`);
      }

      // Group orders by proximity
      const orderGroups = groupOrdersByProximity(orders, numberOfDrivers);

      // Export a file for each driver
      for (let i = 0; i < orderGroups.length; i++) {
        const driverOrders = orderGroups[i];
        
        // Transform orders data for Excel
        const excelData = driverOrders.map(order => ({
          'Name': order.customerName,
          'Building/House Number': order.building_number || 'Not found',
          'Street Name': extractAddressComponents(order.address || '').streetName,
          'City': 'Seattle',
          'State/Region': 'DC',
          'Postal': extractAddressComponents(order.address || '').zipCode,
          'Country': 'US (UNITED STATES)',
          'Color': generateRandomColor(),
          'Phone': order.phoneNumber || '',
          'Note': formatOrderNote(order),
          'Latitude': '',
          'Longitude': '',
          'Visit Time': ''
        }));

        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(excelData);

        // Set column widths
        const columnWidths = [
          { wch: 20 }, // Name
          { wch: 15 }, // Building/House Number
          { wch: 30 }, // Street Name
          { wch: 15 }, // City
          { wch: 15 }, // State/Region
          { wch: 10 }, // Postal
          { wch: 20 }, // Country
          { wch: 10 }, // Color
          { wch: 15 }, // Phone
          { wch: 50 }, // Note
          { wch: 10 }, // Latitude
          { wch: 10 }, // Longitude
          { wch: 10 }, // Visit Time
        ];
        ws['!cols'] = columnWidths;

        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `Driver ${i + 1}`);

        // Generate Excel file
        const excelFile = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

        // Get current date for filename
        const currentDate = format(new Date(), 'yyyy-MM-dd_HH-mm');
        const fileName = `roadwarrior_driver${i + 1}_${currentDate}.xlsx`;

        // Save file
        const filePath = `${FileSystem.cacheDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(filePath, excelFile, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Share the file
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: `Export Orders - Driver ${i + 1}`,
          UTI: 'com.microsoft.excel.xlsx'
        });

        // Clean up the cache file
        try {
          await FileSystem.deleteAsync(filePath, { idempotent: true });
        } catch (err) {
          console.warn('Could not clean up cache file:', err);
        }
      }

      return true;
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  };

  // Update handleExport function
  const handleExport = async () => {
    if (filteredOrders.length === 0) {
      Alert.alert('No Orders', 'There are no orders to export.');
      return;
    }

    setExportTypeModalVisible(true);
  };

  // Add function to handle export type selection
  const handleExportTypeSelection = (type: 'store' | 'roadwarrior') => {
    setExportTypeModalVisible(false);
    
    if (type === 'store') {
      // Continue with existing export logic
      handleStoreExport();
    } else {
      // Show drivers selection modal
      setDriversModalVisible(true);
    }
  };

  // Add function to handle store export (existing logic)
  const handleStoreExport = async () => {
    try {
      await exportToExcel(filteredOrders);
      Alert.alert(
        'Success', 
        'Orders exported successfully!\n\n' +
        'Please select where to save or share the file from the share sheet.'
      );
    } catch (error) {
      console.error('Export error:', error);
      if (error instanceof Error) {
        if (error.message === 'Sharing is not available on this device') {
          Alert.alert(
            'Error',
            'Sharing is not available on this device. Please try using a development build or the production app.'
          );
        } else {
          Alert.alert(
            'Export Failed',
            'Failed to export orders. Please try again.'
          );
        }
      } else {
        Alert.alert(
          'Export Failed',
          'An unexpected error occurred. Please try again.'
        );
      }
    }
  };

  // Add function to handle road warrior export
  const handleRoadWarriorExport = async () => {
    setDriversModalVisible(false);
    setExportInProgress(true);
    
    try {
      await exportToRoadWarrior(filteredOrders, numberOfDrivers);
      Alert.alert(
        'Success',
        `Orders have been exported successfully for ${numberOfDrivers} driver${numberOfDrivers > 1 ? 's' : ''}!`
      );
    } catch (error) {
      console.error('Export error:', error);
      if (error instanceof Error) {
        Alert.alert('Export Failed', error.message);
      } else {
        Alert.alert('Export Failed', 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setExportInProgress(false);
    }
  };

  // Add onRefresh function
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      // Fetch fresh orders from Supabase
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          animal_size_option:animal_size_options(
            id,
            animal:animals(
              id,
              title
            ),
            size:sizes(
              id,
              name
            )
          ),
          cutting_style:cutting_styles(
            id,
            title
          ),
          price_option:price_options(
            id,
            name,
            price
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('Raw order data:', data[0]); // Log first order to check fields

      // Fetch extras for orders that have them
      const ordersWithExtras = await Promise.all(
        data.map(async (order) => {
          if (order.extras && order.extras.length > 0) {
            const { data: extrasData, error: extrasError } = await supabase
              .from('extras')
              .select('id, title, price')
              .in('id', order.extras);

            if (extrasError) {
              console.error('Error fetching extras:', extrasError);
              return order;
            }

            return {
              ...order,
              extras: extrasData
            };
          }
          return order;
        })
      );

      console.log('Order with extras:', ordersWithExtras[0]); // Log first order after extras

      // Transform and update orders
      const formattedOrders: Order[] = ordersWithExtras.map(order => ({
        id: order.id,
        customerName: order.customer_name || 'Unknown',
        date: order.created_at,
        status: order.status || 'Pending',
        total: (order.price_option?.price || 0) + 
               (order.extras?.reduce((sum: number, extra: { price: number }) => sum + extra.price, 0) || 0) +
               (order.delivery_fee || 0),
        animalType: order.animal_size_option?.animal?.title || 'Not specified',
        size: order.animal_size_option?.size?.name || 'Not specified',
        cutStyle: order.cutting_style?.title || 'Not specified',
        divided: order.divided ? 'Yes' : 'No',
        phoneNumber: order.phone_number || '',
        address: order.address || '',
        building_number: order.building_number || '',
        user_id: order.user_id,
        order_ticket: order.order_ticket,
        created_at: order.created_at,
        special_instructions: order.special_instructions,
        organs: order.organs,
        extras: order.extras,
        price_option: order.price_option,
        delivery_fee: order.delivery_fee || 0
      }));

      console.log('Formatted order:', formattedOrders[0]); // Log first formatted order

      // Update the orders through the prop callback
      setSelectedOrder(null); // Clear any selected order
      setFilteredOrders(formattedOrders);
    } catch (error) {
      console.error('Error refreshing orders:', error);
      Alert.alert('Error', 'Failed to refresh orders. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [setSelectedOrder]);

  // Add useEffect to handle initial pagination
  useEffect(() => {
    if (filteredOrders.length > 0) {
      const initialBatch = filteredOrders.slice(0, ORDERS_PER_PAGE);
      setPaginatedOrders(initialBatch);
      setHasMoreOrders(filteredOrders.length > ORDERS_PER_PAGE);
      setCurrentPage(1);
    } else {
      setPaginatedOrders([]);
      setHasMoreOrders(false);
      setCurrentPage(1);
    }
  }, [filteredOrders]);

  // Add function to load more orders
  const loadMoreOrders = () => {
    if (!hasMoreOrders || isLoadingMore) return;

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    const startIndex = (nextPage - 1) * ORDERS_PER_PAGE;
    const endIndex = startIndex + ORDERS_PER_PAGE;
    const nextBatch = filteredOrders.slice(startIndex, endIndex);

    if (nextBatch.length > 0) {
      setPaginatedOrders(prev => [...prev, ...nextBatch]);
      setCurrentPage(nextPage);
      setHasMoreOrders(endIndex < filteredOrders.length);
    } else {
      setHasMoreOrders(false);
    }

    setIsLoadingMore(false);
  };

  // Add function to handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  // Add loading footer component
  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading more orders...</Text>
      </View>
    );
  };

  return (
    <View style={styles.tabContent}>
      <View style={styles.filterSection}>
        <View style={styles.headerRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Order History</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.filterButton, { backgroundColor: colors.primary }]}
              onPress={() => setFilterModalVisible(true)}
            >
              <Ionicons name="filter" size={24} color="white" />
            </TouchableOpacity>
            <Button 
              title="Export" 
              onPress={handleExport}
              style={styles.exportButton}
              variant="primary"
            />
          </View>
        </View>
        
        {/* Render filter badges */}
        {renderFilterBadges()}
      </View>
      
      <FlatList
        data={paginatedOrders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => showOrderDetails(item)}
          >
            <View style={styles.orderHeader}>
              <Text style={[styles.orderCustomer, { color: colors.text }]}>{item.customerName}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
            
            <View style={styles.orderDetails}>
              <Text style={[styles.orderDate, { color: colors.lightText }]}>
                Order Date: {formatDate(item.date)}
              </Text>
              <Text style={[styles.orderTotal, { color: colors.text }]}>
                Total: {formatCurrency(item.total)}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        onEndReached={loadMoreOrders}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.lightText }]}>
              No orders found with the current filters
            </Text>
          </View>
        }
      />
      
      {/* Order Details Modal */}
      <Modal
        visible={orderDetailsVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setOrderDetailsVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Order Details</Text>
                <View style={[styles.orderTicketBadge, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.orderTicketText, { color: colors.primary }]}>
                    #{selectedOrderDetails?.order_ticket}
                  </Text>
                </View>
              </View>
              <View style={styles.modalHeaderButtons}>
                {onEditOrder && selectedOrderDetails && isSuperAdmin && (
                  <TouchableOpacity 
                    style={[styles.modalActionButton, { backgroundColor: colors.secondary }]}
                    onPress={() => {
                      setOrderDetailsVisible(false);
                      onEditOrder(selectedOrderDetails);
                    }}
                  >
                    <Ionicons name="create-outline" size={20} color="white" />
                    <Text style={styles.modalActionButtonText}>Edit</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  style={[styles.modalCloseButton, { backgroundColor: colors.card }]}
                  onPress={() => setOrderDetailsVisible(false)}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Status Selector at the top */}
            {selectedOrderDetails && (
              <View style={styles.statusSelectorContainer}>
                <Text style={[styles.statusSelectorLabel, { color: colors.text }]}>Order Status</Text>
                <TouchableOpacity
                  style={[
                    styles.statusSelector,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    isUpdatingStatus && styles.disabledSelector
                  ]}
                  onPress={() => !isUpdatingStatus && setStatusDropdownVisible(!statusDropdownVisible)}
                  disabled={isUpdatingStatus}
                >
                  <View style={styles.statusSelectorContent}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(selectedOrderDetails.status) }]} />
                    <Text style={[styles.statusSelectorText, { color: colors.text }]}>
                      {isUpdatingStatus ? 'Updating...' : selectedOrderDetails.status.charAt(0).toUpperCase() + selectedOrderDetails.status.slice(1)}
                    </Text>
                  </View>
                  {isUpdatingStatus ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons 
                      name={statusDropdownVisible ? "chevron-up" : "chevron-down"} 
                      size={24} 
                      color={colors.text} 
                    />
                  )}
                </TouchableOpacity>

                {/* Status Options Dropdown */}
                {statusDropdownVisible && !isUpdatingStatus && (
                  <View style={[styles.statusDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    {['pending', 'confirmed', 'processing', 'ready', 'delivered', 'cancelled'].map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.statusOption,
                          selectedOrderDetails.status === status && styles.selectedStatusOption
                        ]}
                        onPress={() => {
                          if (selectedOrderDetails && status !== selectedOrderDetails.status) {
                            handleStatusUpdate(selectedOrderDetails, status);
                          } else {
                            setStatusDropdownVisible(false);
                          }
                        }}
                        disabled={isUpdatingStatus}
                      >
                        <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
                        <Text style={[styles.statusOptionText, { color: getStatusColor(status) }]}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            <ScrollView style={styles.modalBody}>
              {selectedOrderDetails && (
                <>
                  {/* Customer Information Section */}
                  <View style={styles.detailsSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Customer Information</Text>
                    <View style={[styles.sectionContent, { backgroundColor: colors.card }]}>
                      <View style={styles.detailRow}>
                        <View style={styles.detailItem}>
                          <Ionicons name="person-outline" size={20} color={colors.primary} />
                          <View style={styles.detailTextContainer}>
                            <Text style={[styles.detailLabel, { color: colors.lightText }]}>Customer Name</Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>
                              {selectedOrderDetails.customerName}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <View style={styles.detailItem}>
                          <Ionicons name="call-outline" size={20} color={colors.primary} />
                          <View style={styles.detailTextContainer}>
                            <Text style={[styles.detailLabel, { color: colors.lightText }]}>Phone Number</Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>
                              {selectedOrderDetails.phoneNumber || 'Not provided'}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <View style={styles.detailItem}>
                          <Ionicons name="location-outline" size={20} color={colors.primary} />
                          <View style={styles.detailTextContainer}>
                            <Text style={[styles.detailLabel, { color: colors.lightText }]}>Delivery Address</Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>
                              {selectedOrderDetails.address || 'Not provided'}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <View style={styles.detailItem}>
                          <Ionicons name="caret-back-outline" size={20} color={colors.primary} />
                          <View style={styles.detailTextContainer}>
                            <Text style={[styles.detailLabel, { color: colors.lightText }]}>Building</Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>
                              {selectedOrderDetails.building_number || 'Not provided'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Order Information Section */}
                  <View style={styles.detailsSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Information</Text>
                    <View style={[styles.sectionContent, { backgroundColor: colors.card }]}>
                      <View style={styles.detailRow}>
                        <View style={styles.detailItem}>
                          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                          <View style={styles.detailTextContainer}>
                            <Text style={[styles.detailLabel, { color: colors.lightText }]}>Order Date</Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>
                              {formatDate(selectedOrderDetails.date)}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <View style={styles.detailItem}>
                          <Ionicons name="paw-outline" size={20} color={colors.primary} />
                          <View style={styles.detailTextContainer}>
                            <Text style={[styles.detailLabel, { color: colors.lightText }]}>Animal & Size</Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>
                              {selectedOrderDetails.animalType} - {selectedOrderDetails.size}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <View style={styles.detailItem}>
                          <Ionicons name="cut-outline" size={20} color={colors.primary} />
                          <View style={styles.detailTextContainer}>
                            <Text style={[styles.detailLabel, { color: colors.lightText }]}>Cutting Style</Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>
                              {selectedOrderDetails.cutStyle}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <View style={styles.detailItem}>
                          <Ionicons name="git-branch-outline" size={20} color={colors.primary} />
                          <View style={styles.detailTextContainer}>
                            <Text style={[styles.detailLabel, { color: colors.lightText }]}>Divided</Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>
                              {selectedOrderDetails.divided}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {selectedOrderDetails.organs && selectedOrderDetails.organs.length > 0 && (
                        <View style={styles.detailRow}>
                          <View style={styles.detailItem}>
                            <Ionicons name="heart-outline" size={20} color={colors.primary} />
                            <View style={styles.detailTextContainer}>
                              <Text style={[styles.detailLabel, { color: colors.lightText }]}>Selected Organs</Text>
                              <Text style={[styles.detailValue, { color: colors.text }]}>
                                {selectedOrderDetails.organs.join(', ')}
                              </Text>
                            </View>
                          </View>
                        </View>
                      )}

                      <View style={styles.detailRow}>
                        <View style={styles.detailItem}>
                          <Ionicons name="cash-outline" size={20} color={colors.primary} />
                          <View style={styles.detailTextContainer}>
                            <Text style={[styles.detailLabel, { color: colors.lightText }]}>Base Price</Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>
                              {formatCurrency(selectedOrderDetails.price_option?.price || 0)}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <View style={styles.detailItem}>
                          <Ionicons name="car-outline" size={20} color={colors.primary} />
                          <View style={styles.detailTextContainer}>
                            <Text style={[styles.detailLabel, { color: colors.lightText }]}>Delivery Fee</Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>
                              {formatCurrency(selectedOrderDetails.delivery_fee)}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {selectedOrderDetails.extras && selectedOrderDetails.extras.length > 0 && (
                        <View style={styles.detailRow}>
                          <View style={styles.detailItem}>
                            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                            <View style={styles.detailTextContainer}>
                              <Text style={[styles.detailLabel, { color: colors.lightText }]}>Additional Services</Text>
                              <View style={styles.extrasContainer}>
                                {selectedOrderDetails.extras.map((extra, index) => (
                                  <View key={extra.id} style={styles.extraItem}>
                                    <Text style={[styles.extraTitle, { color: colors.text }]}>{extra.title}</Text>
                                    <Text style={[styles.extraPrice, { color: colors.text }]}>${extra.price.toFixed(2)}</Text>
                                  </View>
                                ))}
                              </View>
                            </View>
                          </View>
                        </View>
                      )}

                      <View style={styles.detailRow}>
                        <View style={styles.detailItem}>
                          <Ionicons name="cash-outline" size={20} color={colors.primary} />
                          <View style={styles.detailTextContainer}>
                            <Text style={[styles.detailLabel, { color: colors.lightText }]}>Total Amount</Text>
                            <View style={[styles.totalAmountContainer, { backgroundColor: colors.primary + '10' }]}>
                              <Text style={[styles.totalAmount, { color: 'black' }]}>
                                {formatCurrency(selectedOrderDetails.total)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
      
      {/* Calendar modal */}
      <Modal
        visible={calendarVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setCalendarVisible(false);
          // Reopen filter modal if it was closed
          setTimeout(() => {
            setFilterModalVisible(true);
          }, 50);
        }}
        presentationStyle="overFullScreen"
      >
        <View style={styles.calendarModalOverlay}>
          <View style={[styles.calendarContainer, { backgroundColor: colors.background }]}>
            <View style={styles.calendarHeader}>
              <Text style={[styles.calendarTitle, { color: colors.text }]}>
                {selectingStartDate 
                  ? 'Select Start Date' 
                  : `Start: ${filters.startDate ? format(parseISO(filters.startDate), 'MMM dd') : ''} - Select End Date`
                }
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  setCalendarVisible(false);
                  // Reopen filter modal
                  setTimeout(() => {
                    setFilterModalVisible(true);
                  }, 50);
                }}
                style={styles.calendarCloseButton}
              >
                <Text style={[styles.closeButton, { color: colors.primary }]}>
                  {selectingStartDate || filters.startDate !== filters.endDate ? 'Close' : 'Done'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <Calendar
              onDayPress={handleDateSelect}
              markedDates={getMarkedDates()}
              markingType="period"
              enableSwipeMonths={true}
              hideArrows={false}
              disableMonthChange={false}
              monthFormat={'MMMM yyyy'}
              theme={{
                backgroundColor: colors.background,
                calendarBackground: colors.background,
                textSectionTitleColor: colors.text,
                textSectionTitleDisabledColor: colors.lightText,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: '#ffffff',
                todayTextColor: colors.primary,
                dayTextColor: colors.text,
                textDisabledColor: colors.lightText,
                dotColor: colors.primary,
                selectedDotColor: '#ffffff',
                arrowColor: colors.primary,
                disabledArrowColor: colors.lightText,
                monthTextColor: colors.text,
                indicatorColor: colors.primary,
                textDayFontWeight: '300',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '300',
                textDayFontSize: 16,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 14
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Updated Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={[styles.filterModalContent, { backgroundColor: colors.background, marginHorizontal: 8 }]}>
            <View style={styles.filterModalHeader}>
              <Text style={[styles.filterModalTitle, { color: colors.text }]}>Filter Orders</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setFilterModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterModalBody}>
              {/* Customer Name Filter */}
              <View style={styles.filterInputContainer}>
                <Text style={[styles.filterInputLabel, { color: colors.text }]}>Customer Name</Text>
                <TextInput
                  style={[styles.filterInput, { 
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: colors.border
                  }]}
                  value={filters.customerName}
                  onChangeText={handleCustomerSearch}
                  placeholder="Search by customer name"
                  placeholderTextColor={colors.lightText}
                />
                {customerSuggestions.length > 0 && (
                  <View style={[styles.suggestionsContainer, { backgroundColor: colors.card }]}>
                    {customerSuggestions.map((name, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.suggestionItem}
                        onPress={() => {
                          setFilters(f => ({ ...f, customerName: name }));
                          setCustomerSuggestions([]);
                        }}
                      >
                        <Text style={[styles.suggestionText, { color: colors.text }]}>{name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Animal Type Select */}
              <View style={styles.filterInputContainer}>
                <Text style={[styles.filterInputLabel, { color: colors.text }]}>Animal Type</Text>
                <View style={styles.animalTypeContainer}>
                  {availableAnimals.map((animal) => (
                    <TouchableOpacity
                      key={animal.id}
                      style={[
                        styles.animalTypeButton,
                        filters.animalType === animal.title && styles.activeAnimalType
                      ]}
                      onPress={() => setFilters(f => ({ 
                        ...f, 
                        animalType: animal.title === f.animalType ? '' : animal.title 
                      }))}
                    >
                      <Text style={[
                        styles.animalTypeText,
                        filters.animalType === animal.title && styles.activeAnimalTypeText
                      ]}>
                        {animal.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Status Filter */}
              <View style={styles.filterInputContainer}>
                <Text style={[styles.filterInputLabel, { color: colors.text }]}>Status</Text>
                <View style={styles.statusButtonsContainer}>
                  {[
                    { value: 'pending', color: '#FFA000' },
                    { value: 'confirmed', color: '#2196F3' },
                    { value: 'processing', color: '#9C27B0' },
                    { value: 'ready', color: '#4CAF50' },
                    { value: 'delivered', color: '#4CAF50' },
                    { value: 'cancelled', color: '#F44336' }
                  ].map((status) => (
                    <TouchableOpacity
                      key={status.value}
                      style={[
                        styles.filterStatusButton,
                        filters.status === status.value && { backgroundColor: status.color + '10' }
                      ]}
                      onPress={() => setFilters(f => ({ 
                        ...f, 
                        status: status.value === f.status ? null : status.value 
                      }))}
                    >
                      <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                      <Text style={[
                        styles.filterStatusText,
                        { color: filters.status === status.value ? status.color : colors.text }
                      ]}>
                        {status.value.charAt(0).toUpperCase() + status.value.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Date Range Filter */}
              <View style={styles.filterInputContainer}>
                <Text style={[styles.filterInputLabel, { color: colors.text }]}>Date Range</Text>
                <View style={styles.dateFilterRow}>
                  <TouchableOpacity
                    style={[styles.dateButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => {
                      setFilterModalVisible(false);
                      setTimeout(() => {
                        setSelectingStartDate(true);
                        setCalendarVisible(true);
                      }, 50);
                    }}
                  >
                    <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                    <Text style={[styles.dateButtonText, { color: colors.text }]}>
                      {filters.startDate ? formatDate(filters.startDate) : 'Select Date'}
                    </Text>
                  </TouchableOpacity>
                  
                  {filters.startDate !== filters.endDate && (
                    <>
                      <Text style={[styles.dateRangeSeparator, { color: colors.text }]}>to</Text>
                      
                      <TouchableOpacity
                        style={[styles.dateButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={() => {
                          if (filters.startDate) {
                            setFilterModalVisible(false);
                            setTimeout(() => {
                              setSelectingStartDate(false);
                              setCalendarVisible(true);
                            }, 50);
                          } else {
                            Alert.alert('Error', 'Please select a start date first');
                          }
                        }}
                      >
                        <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                        <Text style={[styles.dateButtonText, { color: colors.text }]}>
                          {filters.endDate ? formatDate(filters.endDate) : 'End Date'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            </ScrollView>

            <View style={styles.filterModalFooter}>
              <TouchableOpacity
                style={[styles.filterModalButton, styles.filterModalClearButton]}
                onPress={clearFilters}
              >
                <Ionicons name="trash-outline" size={20} color={colors.text} />
                <Text style={styles.filterModalButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterModalButton, styles.filterModalApplyButton]}
                onPress={applyFilters}
              >
                <Ionicons name="checkmark" size={20} color="white" />
                <Text style={[styles.filterModalButtonText, { color: 'white' }]}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Add Export Type Modal */}
      <Modal
        visible={exportTypeModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setExportTypeModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={[styles.exportTypeModal, { backgroundColor: colors.background }]}>
            <View style={styles.exportModalHeader}>
              <View style={[styles.exportModalIconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="download-outline" size={32} color={colors.primary} />
              </View>
              <Text style={[styles.exportTypeTitle, { color: colors.text }]}>
                Choose Export Format
              </Text>
              <Text style={[styles.exportTypeSubtitle, { color: colors.lightText }]}>
                Select the format that best suits your needs
              </Text>
            </View>
            
            <View style={styles.exportOptionsContainer}>
              <TouchableOpacity
                style={[styles.exportTypeButton, { 
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  ...Platform.select({
                    ios: {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                    },
                    android: {
                      elevation: 3,
                    },
                  }),
                }]}
                onPress={() => handleExportTypeSelection('store')}
              >
                <View style={[styles.exportButtonIconContainer, { backgroundColor: '#4CAF50' + '20' }]}>
                  <Ionicons name="document-text-outline" size={28} color="#4CAF50" />
                </View>
                <View style={styles.exportButtonContent}>
                  <Text style={[styles.exportTypeButtonTitle, { color: colors.text }]}>
                    Store Data Export
                  </Text>
                  <Text style={[styles.exportTypeButtonDescription, { color: colors.lightText }]}>
                    Complete order details for store records and analysis
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.lightText} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.exportTypeButton, { 
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  ...Platform.select({
                    ios: {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                    },
                    android: {
                      elevation: 3,
                    },
                  }),
                }]}
                onPress={() => handleExportTypeSelection('roadwarrior')}
              >
                <View style={[styles.exportButtonIconContainer, { backgroundColor: '#2196F3' + '20' }]}>
                  <Ionicons name="car-outline" size={28} color="#2196F3" />
                </View>
                <View style={styles.exportButtonContent}>
                  <Text style={[styles.exportTypeButtonTitle, { color: colors.text }]}>
                    RoadWarrior Format
                  </Text>
                  <Text style={[styles.exportTypeButtonDescription, { color: colors.lightText }]}>
                    Optimized delivery routes for multiple drivers
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.lightText} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.exportCancelButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setExportTypeModalVisible(false)}
            >
              <Text style={[styles.exportCancelButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Add Drivers Selection Modal */}
      <Modal
        visible={driversModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDriversModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={[styles.driversModal, { backgroundColor: colors.background }]}>
            <View style={styles.driversModalHeader}>
              <View style={[styles.driversModalIconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="people-outline" size={32} color={colors.primary} />
              </View>
              <Text style={[styles.driversModalTitle, { color: colors.text }]}>
                Select Number of Drivers
              </Text>
              <Text style={[styles.driversModalSubtitle, { color: colors.lightText }]}>
                Orders will be distributed evenly among drivers
              </Text>
            </View>

            <View style={[styles.driversSliderContainer, { backgroundColor: colors.card }]}>
              <View style={styles.driversCountDisplay}>
                <Text style={[styles.driversCountNumber, { color: colors.primary }]}>
                  {numberOfDrivers}
                </Text>
                <Text style={[styles.driversCountLabel, { color: colors.text }]}>
                  Driver{numberOfDrivers > 1 ? 's' : ''}
                </Text>
              </View>
              
              <Slider
                style={styles.driversSlider}
                minimumValue={1}
                maximumValue={Math.min(5, filteredOrders.length)}
                step={1}
                value={numberOfDrivers}
                onValueChange={setNumberOfDrivers}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
              />
              
              <View style={styles.driversSliderLabels}>
                <Text style={[styles.driversSliderLabel, { color: colors.lightText }]}>1</Text>
                <Text style={[styles.driversSliderLabel, { color: colors.lightText }]}>
                  {Math.min(5, filteredOrders.length)}
                </Text>
              </View>
            </View>

            <View style={styles.driversModalActions}>
              <TouchableOpacity
                style={[styles.driversExportButton, { backgroundColor: colors.primary }]}
                onPress={handleRoadWarriorExport}
                disabled={exportInProgress}
              >
                {exportInProgress ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons name="download-outline" size={20} color="white" />
                    <Text style={styles.driversExportButtonText}>Export Routes</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.driversCancelButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setDriversModalVisible(false)}
                disabled={exportInProgress}
              >
                <Text style={[styles.driversCancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  tabContent: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterRow: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  statusFilterScroll: {
    flexDirection: 'row',
  },
  statusFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  activeFilter: {
    backgroundColor: '#D50000',
  },
  statusFilterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeFilterText: {
    color: 'white',
  },
  dateFilterContainer: {
    marginTop: 8,
  },
  dateFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 44,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  dateButtonText: {
    fontSize: 14,
    flex: 1,
    textAlign: 'left',
  },
  dateRangeSeparator: {
    marginHorizontal: 4,
    fontSize: 14,
    color: '#666',
  },
  clearFilterButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearFilterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 20,
  },
  orderCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
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
  orderCustomer: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderDate: {
    fontSize: 14,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 0,
  },
  calendarContainer: {
    width: '100%',
    maxWidth: 450,
    borderRadius: 12,
    overflow: 'hidden',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    position: 'relative',
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'left',
  },
  closeButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exportButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    flex: 1,
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginRight: 12,
  },
  orderTicketBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  orderTicketText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalBody: {
    flex: 1,
  },
  detailsSection: {
    padding: 16,
  },
  sectionContent: {
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusSelectorContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  statusSelectorLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  statusSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusSelectorText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  statusDropdown: {
    position: 'absolute',
    top: '100%',
    left: 16,
    right: 16,
    marginTop: 4,
    borderRadius: 8,
    borderWidth: 1,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  selectedStatusOption: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalCloseButton: {
    padding: 8,
    borderRadius: 20,
  },
  disabledSelector: {
    opacity: 0.7,
  },
  pricingSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  pricingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 8,
  },
  extrasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  extraItem: {
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
  },
  extraTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  extraPrice: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalAmountContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  modalActionButtonText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 4,
  },
  priceBreakdown: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalRow: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    padding: 12,
    borderRadius: 12,
    marginRight: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  filterModalContent: {
    flex: 1,
    marginTop: 40,
    marginHorizontal: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: 'white',
    maxHeight: '90%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  filterModalTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  filterInputContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  filterInputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  filterInput: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  suggestionsContainer: {
    marginTop: 4,
    borderRadius: 8,
    borderWidth: 1,
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  suggestionText: {
    fontSize: 16,
  },
  animalTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  animalTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    margin: 4,
  },
  activeAnimalType: {
    backgroundColor: '#D50000',
    borderColor: '#D50000',
  },
  animalTypeText: {
    fontSize: 14,
    color: '#000000',
  },
  activeAnimalTypeText: {
    color: 'white',
  },
  statusButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  filterStatusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 4,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    flex: 1,
    minWidth: '45%',
  },
  filterStatusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterModalFooter: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    backgroundColor: 'white',
  },
  filterModalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
    minHeight: 44,
  },
  filterModalClearButton: {
    backgroundColor: '#F5F5F5',
  },
  filterModalApplyButton: {
    backgroundColor: '#D50000',
  },
  filterModalButtonText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  filterBadgesContainer: {
    flexDirection: 'row',
    padding: 8,
  },
  filterBadgesContent: {
    alignItems: 'center',
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  filterBadgeText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
    color: '#000',
  },
  filterModalBody: {
    flex: 1,
  },
  exportTypeModal: {
    width: '90%',
    maxWidth: 400,
    padding: 20,
    borderRadius: 12,
  },
  exportTypeTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  exportTypeSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 16,
    textAlign: 'center',
  },
  exportModalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  exportModalIconContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  exportOptionsContainer: {
    marginBottom: 20,
  },
  exportTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  exportButtonIconContainer: {
    padding: 12,
    borderRadius: 12,
  },
  exportButtonContent: {
    flex: 1,
    marginLeft: 4,
  },
  exportTypeButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  exportTypeButtonDescription: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  exportCancelButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  exportCancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  driversModal: {
    width: '90%',
    maxWidth: 400,
    padding: 20,
    borderRadius: 12,
  },
  driversModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  driversModalSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 16,
    textAlign: 'center',
  },
  driversModalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  driversModalIconContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  driversSliderContainer: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
  },
  driversSlider: {
    width: '100%',
    height: 40,
  },
  driversCountDisplay: {
    alignItems: 'center',
    marginBottom: 16,
  },
  driversCountNumber: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  driversCountLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
  },
  driversSliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  driversSliderLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  driversModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  driversExportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    minHeight: 48,
  },
  driversExportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  driversCancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    minHeight: 48,
    borderWidth: 1,
  },
  driversCancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  loadingFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 16,
    gap: 8,
  } as ViewStyle,
  loadingText: {
    fontSize: 14,
  } as TextStyle,
  calendarModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 16,
  },
  calendarCloseButton: {
    padding: 8,
    borderRadius: 8,
  },
}); 