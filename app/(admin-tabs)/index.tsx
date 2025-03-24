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
import { Picker } from '@react-native-picker/picker';

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
  special_instructions?: string;
  organs?: string[];
  extras?: {
    id: string;
    title: string;
    price: number;
  }[];
  price_option?: {
    id?: string;
    name: string;
    price: number;
  };
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
  
  // Add state for edit modal and data
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Add state for form options
  const [animals, setAnimals] = useState<{ id: string; title: string }[]>([]);
  const [sizes, setSizes] = useState<{ id: string; name: string }[]>([]);
  const [animalSizeOptions, setAnimalSizeOptions] = useState<{ id: string; animal_id: string; size_id: string }[]>([]);
  const [cuttingStyles, setCuttingStyles] = useState<{ id: string; title: string }[]>([]);
  const [priceOptions, setPriceOptions] = useState<{ id: string; name: string; price: number; animal_size_id: string }[]>([]);
  const [extras, setExtras] = useState<{ id: string; title: string; price: number }[]>([]);

  // Add state for form values
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>('');
  const [selectedSizeId, setSelectedSizeId] = useState<string>('');
  const [selectedCuttingStyleId, setSelectedCuttingStyleId] = useState<string>('');
  const [selectedPriceOptionId, setSelectedPriceOptionId] = useState<string>('');
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [selectedOrgans, setSelectedOrgans] = useState<string[]>([]);
  const [isDivided, setIsDivided] = useState<boolean>(false);
  
  // Add form loading state
  const [formLoading, setFormLoading] = useState(false);

  // Add state for organ options
  const [organOptions, setOrganOptions] = useState<{ id: string; name: string; is_active: boolean }[]>([]);

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

  // Update the useEffect for edit modal visibility to properly handle organs initialization
  useEffect(() => {
    if (editModalVisible && editingOrder) {
      // Clear form values first
      setSelectedAnimalId('');
      setSelectedSizeId('');
      setSelectedCuttingStyleId('');
      setSelectedPriceOptionId('');
      setSelectedExtras([]);
      setSelectedOrgans([]);
      setIsDivided(false);
      
      // Then fetch options and set values after options are loaded
      fetchFormOptions().then((data) => {
        if (!data) return; // If there was an error fetching data
        
        console.log("Form options loaded, initializing form values");
        console.log("EditingOrder:", editingOrder);
        
        // Use the data directly from the fetchFormOptions result
        const { animals: fetchedAnimals, sizes: fetchedSizes, cuttingStyles: fetchedStyles, priceOptions: fetchedPriceOptions } = data;
        
        // Log each match attempt
        console.log("Matching animal:", editingOrder.animalType);
        console.log("Available animals:", fetchedAnimals.map(a => a.title));
        
        // Match by title/name to find the right IDs
        const matchingAnimal = fetchedAnimals.find(a => a.title === editingOrder.animalType);
        if (matchingAnimal) {
          console.log("Found matching animal:", matchingAnimal.id);
          setSelectedAnimalId(matchingAnimal.id);
        } else {
          console.log("No matching animal found for:", editingOrder.animalType);
        }
        
        console.log("Matching size:", editingOrder.size);
        console.log("Available sizes:", fetchedSizes.map(s => s.name));
        
        const matchingSize = fetchedSizes.find(s => s.name === editingOrder.size);
        if (matchingSize) {
          console.log("Found matching size:", matchingSize.id);
          setSelectedSizeId(matchingSize.id);
        } else {
          console.log("No matching size found for:", editingOrder.size);
        }
        
        console.log("Matching cutting style:", editingOrder.cutStyle);
        console.log("Available cutting styles:", fetchedStyles.map(cs => cs.title));
        
        const matchingCuttingStyle = fetchedStyles.find(cs => cs.title === editingOrder.cutStyle);
        if (matchingCuttingStyle) {
          console.log("Found matching cutting style:", matchingCuttingStyle.id);
          setSelectedCuttingStyleId(matchingCuttingStyle.id);
        } else {
          console.log("No matching cutting style found for:", editingOrder.cutStyle);
        }
        
        // For price option, find by id directly if available, otherwise match by name
        if (editingOrder.price_option?.id) {
          console.log("Using price option ID directly:", editingOrder.price_option.id);
          setSelectedPriceOptionId(editingOrder.price_option.id);
        } else if (editingOrder.price_option?.name) {
          console.log("Matching price option name:", editingOrder.price_option.name);
          console.log("Available price options:", fetchedPriceOptions.map(po => po.name));
          
          const matchingPriceOption = fetchedPriceOptions.find(po => po.name === editingOrder.price_option?.name);
          if (matchingPriceOption) {
            console.log("Found matching price option:", matchingPriceOption.id);
            setSelectedPriceOptionId(matchingPriceOption.id);
          } else {
            console.log("No matching price option found for:", editingOrder.price_option.name);
          }
        }
        
        if (editingOrder.extras) {
          console.log("Setting extras:", editingOrder.extras.map(e => e.id));
          setSelectedExtras(editingOrder.extras.map(e => e.id));
        }
        
        // Make sure organs are properly set after form options are loaded
        if (editingOrder.organs) {
          console.log("Setting organs after form options loaded:", editingOrder.organs);
          setSelectedOrgans(editingOrder.organs);
        }
        
        console.log("Setting divided:", editingOrder.divided);
        setIsDivided(editingOrder.divided === 'Yes');
      });
    }
  }, [editModalVisible, editingOrder]);

  // Also add animals, sizes, etc. as dependencies to trigger re-initialization when they change
  useEffect(() => {
    if (editingOrder && animals.length > 0 && sizes.length > 0) {
      // Case-insensitive matching for better results
      console.log("Options changed, re-initializing form values");
      console.log("Current editingOrder:", editingOrder);
      
      // Improved matching with case-insensitive comparison
      const matchingAnimal = animals.find(a => 
        a.title.toLowerCase() === editingOrder.animalType?.toLowerCase()
      );
      if (matchingAnimal) {
        console.log("Re-matched animal:", matchingAnimal.id);
        setSelectedAnimalId(matchingAnimal.id);
      }
      
      const matchingSize = sizes.find(s => 
        s.name.toLowerCase() === editingOrder.size?.toLowerCase()
      );
      if (matchingSize) {
        console.log("Re-matched size:", matchingSize.id);
        setSelectedSizeId(matchingSize.id);
      }
      
      const matchingCuttingStyle = cuttingStyles.find(cs => 
        cs.title.toLowerCase() === editingOrder.cutStyle?.toLowerCase()
      );
      if (matchingCuttingStyle) {
        console.log("Re-matched cutting style:", matchingCuttingStyle.id);
        setSelectedCuttingStyleId(matchingCuttingStyle.id);
      }
      
      const matchingPriceOption = priceOptions.find(po => 
        po.name.toLowerCase() === editingOrder.price_option?.name?.toLowerCase()
      );
      if (matchingPriceOption) {
        console.log("Re-matched price option:", matchingPriceOption.id);
        setSelectedPriceOptionId(matchingPriceOption.id);
      } else {
        console.log("Could not match price option:", editingOrder.price_option);
        console.log("Available price options:", priceOptions);
      }
    }
  }, [animals, sizes, cuttingStyles, priceOptions, editingOrder]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
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
      
      if (error) {
        throw error;
      }

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
      
      // Transform data to match our Order interface
      const formattedOrders: Order[] = ordersWithExtras.map(order => {
        // Calculate total including extras
        const basePrice = order.price_option?.price || 0;
        const extrasTotal = order.extras?.reduce((sum: number, extra: { price: number }) => sum + extra.price, 0) || 0;
        const total = basePrice + extrasTotal;

        return {
          id: order.id,
          customerName: order.customer_name || 'Unknown',
          date: order.created_at,
          status: order.status || 'Pending',
          total: total,
          animalType: order.animal_size_option?.animal?.title || 'Not specified',
          size: order.animal_size_option?.size?.name || 'Not specified',
          cutStyle: order.cutting_style?.title || 'Not specified',
          divided: order.divided ? 'Yes' : 'No',
          phoneNumber: order.phone_number || '',
          address: order.address || '',
          user_id: order.user_id,
          order_ticket: order.order_ticket,
          created_at: order.created_at,
          special_instructions: order.special_instructions,
          organs: order.organs,
          extras: order.extras,
          price_option: order.price_option
        };
      });
      
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

  // Update handleEditOrder to be simpler and more robust
  const handleEditOrder = (order: Order) => {
    console.log("EDIT ORDER:", order.id, order.animalType, order.size, order.cutStyle);
    console.log("ORGANS:", order.organs); // Log organs for debugging
    
    // Set the order and show modal
    setEditingOrder(order);
    setEditModalVisible(true);
    
    // Manually reset form values first to prevent stale data
    setSelectedAnimalId('');
    setSelectedSizeId('');
    setSelectedCuttingStyleId('');
    setSelectedPriceOptionId('');
    setSelectedExtras(order.extras?.map(e => e.id) || []);
    
    // Ensure organs are handled properly - could be null, undefined, or an array
    const orderOrgans = order.organs || [];
    console.log("Setting selected organs:", orderOrgans);
    setSelectedOrgans(orderOrgans);
    
    setIsDivided(order.divided === 'Yes');
    
    // Wait a moment then manually try to set values
    setTimeout(() => {
      // Try to find and set values after a short delay
      console.log("Attempting to set form values");
      
      if (order.animalType) {
        const animal = animals.find(a => a.title === order.animalType);
        if (animal) setSelectedAnimalId(animal.id);
      }
      
      if (order.size) {
        const size = sizes.find(s => s.name === order.size);
        if (size) setSelectedSizeId(size.id);
      }
      
      if (order.cutStyle) {
        const style = cuttingStyles.find(cs => cs.title === order.cutStyle);
        if (style) setSelectedCuttingStyleId(style.id);
      }
      
      if (order.price_option?.id) {
        setSelectedPriceOptionId(order.price_option.id);
      }
    }, 500);
  };

  // Function to fetch form options from Supabase
  const fetchFormOptions = async () => {
    try {
      setFormLoading(true);
      
      // Fetch animals
      const { data: animalsData, error: animalsError } = await supabase
        .from('animals')
        .select('id, title');
      
      if (animalsError) {
        console.error('Error fetching animals:', animalsError);
      } else {
        console.log('Animals loaded:', animalsData?.length || 0);
        setAnimals(animalsData || []);
      }
      
      // Fetch sizes
      const { data: sizesData, error: sizesError } = await supabase
        .from('sizes')
        .select('id, name');
      
      if (sizesError) {
        console.error('Error fetching sizes:', sizesError);
      } else {
        console.log('Sizes loaded:', sizesData?.length || 0);
        setSizes(sizesData || []);
      }
      
      // Fetch animal_size_options
      const { data: animalSizeOptionsData, error: animalSizeOptionsError } = await supabase
        .from('animal_size_options')
        .select('id, animal_id, size_id');
      
      if (animalSizeOptionsError) {
        console.error('Error fetching animal size options:', animalSizeOptionsError);
      } else {
        console.log('Animal size options loaded:', animalSizeOptionsData?.length || 0);
        setAnimalSizeOptions(animalSizeOptionsData || []);
      }
      
      // Fetch cutting styles
      const { data: cuttingStylesData, error: cuttingStylesError } = await supabase
        .from('cutting_styles')
        .select('id, title');
      
      if (cuttingStylesError) {
        console.error('Error fetching cutting styles:', cuttingStylesError);
      } else {
        console.log('Cutting styles loaded:', cuttingStylesData?.length || 0);
        setCuttingStyles(cuttingStylesData || []);
      }
      
      // Fetch price options
      const { data: priceOptionsData, error: priceOptionsError } = await supabase
        .from('price_options')
        .select('id, name, price, animal_size_id');
      
      if (priceOptionsError) {
        console.error('Error fetching price options:', priceOptionsError);
      } else {
        console.log('Price options loaded:', priceOptionsData?.length || 0);
        setPriceOptions(priceOptionsData || []);
      }
      
      // Fetch extras
      const { data: extrasData, error: extrasError } = await supabase
        .from('extras')
        .select('id, title, price');
      
      if (extrasError) {
        console.error('Error fetching extras:', extrasError);
      } else {
        console.log('Extras loaded:', extrasData?.length || 0);
        setExtras(extrasData || []);
      }
      
      // Fetch organs from the database (only active ones for new selections)
      const { data: organsData, error: organsError } = await supabase
        .from('organs')
        .select('id, name, is_active');
      
      if (organsError) {
        console.error('Error fetching organs:', organsError);
      } else {
        console.log('Organs loaded:', organsData?.length || 0);
        
        // Filter only active organs for new selections, but keep all for display
        const allOrgans = organsData || [];
        console.log('Active organs:', allOrgans.filter(o => o.is_active).map(o => o.name));
        setOrganOptions(allOrgans);
      }
      
      console.log('All data fetched successfully');
      
      // Add a small delay to ensure state updates have time to propagate
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return {
        animals: animalsData || [],
        sizes: sizesData || [],
        animalSizeOptions: animalSizeOptionsData || [],
        cuttingStyles: cuttingStylesData || [],
        priceOptions: priceOptionsData || [],
        extras: extrasData || [],
        organs: organsData || []
      };
      
    } catch (err) {
      console.error('Error fetching form options:', err);
      Alert.alert('Error', 'Failed to load form options: ' + (err instanceof Error ? err.message : String(err)));
      return null;
    } finally {
      setFormLoading(false);
    }
  };

  // Update handleUpdateOrder to ensure organs are properly handled
  const handleUpdateOrder = async () => {
    if (!editingOrder) return;
    
    try {
      setLoading(true);
      
      // Find the animal_size_option_id based on selected animal and size
      const animalSizeOption = animalSizeOptions.find(
        aso => aso.animal_id === selectedAnimalId && aso.size_id === selectedSizeId
      );
      
      if (!animalSizeOption) {
        Alert.alert('Error', 'Invalid animal and size combination');
        return;
      }
      
      // Find the selected price option from the available options
      const selectedPriceOption = priceOptions.find(po => po.id === selectedPriceOptionId);
      
      if (!selectedPriceOption) {
        Alert.alert('Error', 'Please select a valid price option');
        return;
      }
      
      // Log data before update for debugging
      console.log("Updating order with organs:", selectedOrgans);
      console.log("Updating order with extras:", selectedExtras);
      
      // Prepare the update data - ensure arrays are properly formatted for PostgreSQL
      const updateData = {
        animal_size_id: animalSizeOption.id,
        cutting_style_id: selectedCuttingStyleId,
        price_option_id: selectedPriceOptionId,
        divided: isDivided ? 'Yes' : 'No',
        organs: selectedOrgans.length > 0 ? selectedOrgans : null,
        extras: selectedExtras.length > 0 ? selectedExtras : null
      };
      
      console.log("Update data being sent to database:", updateData);
      
      // Update order in Supabase
      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', editingOrder.id);
      
      if (error) throw error;
      
      // Fetch the updated order to get the new data
      const { data: updatedOrderData, error: fetchError } = await supabase
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
        .eq('id', editingOrder.id)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Fetch extras for the updated order
      let updatedOrderWithExtras = updatedOrderData;
      
      if (updatedOrderData.extras && updatedOrderData.extras.length > 0) {
        const { data: extrasData, error: extrasError } = await supabase
          .from('extras')
          .select('id, title, price')
          .in('id', updatedOrderData.extras);
        
        if (extrasError) {
          console.error('Error fetching extras for updated order:', extrasError);
        } else {
          updatedOrderWithExtras = {
            ...updatedOrderData,
            extras: extrasData
          };
        }
      }
      
      // Calculate total including extras
      const basePrice = updatedOrderWithExtras.price_option?.price || 0;
      const extrasTotal = updatedOrderWithExtras.extras?.reduce((sum: number, extra: { price: number }) => sum + extra.price, 0) || 0;
      const total = basePrice + extrasTotal;
      
      // Format the order to match our Order interface
      const updatedOrder: Order = {
        id: updatedOrderWithExtras.id,
        customerName: updatedOrderWithExtras.customer_name || 'Unknown',
        date: updatedOrderWithExtras.created_at,
        status: updatedOrderWithExtras.status || 'Pending',
        total: total,
        animalType: updatedOrderWithExtras.animal_size_option?.animal?.title || 'Not specified',
        size: updatedOrderWithExtras.animal_size_option?.size?.name || 'Not specified',
        cutStyle: updatedOrderWithExtras.cutting_style?.title || 'Not specified',
        divided: updatedOrderWithExtras.divided ? 'Yes' : 'No',
        phoneNumber: updatedOrderWithExtras.phone_number || '',
        address: updatedOrderWithExtras.address || '',
        user_id: updatedOrderWithExtras.user_id,
        order_ticket: updatedOrderWithExtras.order_ticket,
        created_at: updatedOrderWithExtras.created_at,
        special_instructions: updatedOrderWithExtras.special_instructions,
        organs: updatedOrderWithExtras.organs,
        extras: updatedOrderWithExtras.extras,
        price_option: updatedOrderWithExtras.price_option
      };
      
      // Update the orders state
      const updatedOrders = orders.map(order => 
        order.id === updatedOrder.id ? updatedOrder : order
      );
      
      setOrders(updatedOrders);
      
      // Close the modal and reset form
      setEditModalVisible(false);
      setEditingOrder(null);
      
      Alert.alert('Success', 'Order updated successfully');
    } catch (err) {
      console.error('Error updating order:', err);
      Alert.alert('Error', 'Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  // Add helper functions for filtering
  const getAvailableSizes = () => {
    if (!selectedAnimalId) return sizes;
    
    const animalSizeIds = animalSizeOptions
      .filter(aso => aso.animal_id === selectedAnimalId)
      .map(aso => aso.size_id);
    
    return sizes.filter(size => animalSizeIds.includes(size.id));
  };

  const getAvailablePriceOptions = () => {
    if (!selectedAnimalId || !selectedSizeId) return [];
    
    const animalSizeOption = animalSizeOptions.find(
      aso => aso.animal_id === selectedAnimalId && aso.size_id === selectedSizeId
    );
    
    if (!animalSizeOption) return [];
    
    return priceOptions.filter(po => po.animal_size_id === animalSizeOption.id);
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
          onEditOrder={handleEditOrder}
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

      {/* Edit Order Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={[styles.editModalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Order</Text>
              <TouchableOpacity 
                style={[styles.modalCloseButton, { backgroundColor: colors.card }]}
                onPress={() => setEditModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              {formLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#0000ff" />
                  <Text style={styles.loadingText}>Loading form options...</Text>
                </View>
              ) : editingOrder && (
                <>
                  <View style={styles.formRow}>
                    <Text style={styles.label}>Animal Type</Text>
                    <View style={[styles.pickerContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Picker
                        selectedValue={selectedAnimalId}
                        onValueChange={(itemValue: string) => {
                          setSelectedAnimalId(itemValue);
                          setSelectedSizeId('');
                          setSelectedPriceOptionId('');
                        }}
                        style={{ color: colors.text }}
                        dropdownIconColor={colors.text}
                      >
                        <Picker.Item label="Select Animal" value="" />
                        {animals.map((animal) => (
                          <Picker.Item key={animal.id} label={animal.title} value={animal.id} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                  
                  <View style={styles.formRow}>
                    <Text style={styles.label}>Size</Text>
                    <View style={[styles.pickerContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Picker
                        selectedValue={selectedSizeId}
                        onValueChange={(itemValue: string) => {
                          setSelectedSizeId(itemValue);
                          setSelectedPriceOptionId('');
                        }}
                        style={{ color: colors.text }}
                        dropdownIconColor={colors.text}
                        enabled={selectedAnimalId !== ''}
                      >
                        <Picker.Item label="Select Size" value="" />
                        {getAvailableSizes().map((size) => (
                          <Picker.Item key={size.id} label={size.name} value={size.id} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                  
                  <View style={styles.formRow}>
                    <Text style={styles.label}>Cutting Style</Text>
                    <View style={[styles.pickerContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Picker
                        selectedValue={selectedCuttingStyleId}
                        onValueChange={(itemValue: string) => setSelectedCuttingStyleId(itemValue)}
                        style={{ color: colors.text }}
                        dropdownIconColor={colors.text}
                      >
                        <Picker.Item label="Select Cutting Style" value="" />
                        {cuttingStyles.map((style) => (
                          <Picker.Item key={style.id} label={style.title} value={style.id} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                  
                  <View style={styles.formRow}>
                    <Text style={styles.label}>Price Option</Text>
                    <View style={[styles.pickerContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Picker
                        selectedValue={selectedPriceOptionId}
                        onValueChange={(itemValue: string) => setSelectedPriceOptionId(itemValue)}
                        style={{ color: colors.text }}
                        dropdownIconColor={colors.text}
                        enabled={selectedAnimalId !== '' && selectedSizeId !== ''}
                      >
                        <Picker.Item label="Select Price Option" value="" />
                        {getAvailablePriceOptions().map((option) => (
                          <Picker.Item 
                            key={option.id} 
                            label={`${option.name} - $${option.price.toFixed(2)}`} 
                            value={option.id} 
                          />
                        ))}
                      </Picker>
                    </View>
                  </View>
                  
                  <View style={styles.formRow}>
                    <Text style={styles.label}>Divided in Two</Text>
                    <View style={styles.dividedContainer}>
                      <TouchableOpacity
                        style={[
                          styles.dividedOption,
                          { borderColor: colors.border },
                          isDivided && { backgroundColor: colors.primary }
                        ]}
                        onPress={() => setIsDivided(true)}
                      >
                        <Text style={[
                          styles.dividedOptionText,
                          { color: isDivided ? 'white' : colors.text }
                        ]}>
                          Yes
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.dividedOption,
                          { borderColor: colors.border },
                          !isDivided && { backgroundColor: colors.primary }
                        ]}
                        onPress={() => setIsDivided(false)}
                      >
                        <Text style={[
                          styles.dividedOptionText,
                          { color: !isDivided ? 'white' : colors.text }
                        ]}>
                          No
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.formRow}>
                    <Text style={styles.label}>Additional Services</Text>
                    <View style={styles.extrasContainer}>
                      {extras.map((extra) => (
                        <TouchableOpacity
                          key={extra.id}
                          style={[
                            styles.extraOption,
                            { borderColor: colors.border },
                            selectedExtras.includes(extra.id) && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
                          ]}
                          onPress={() => {
                            if (selectedExtras.includes(extra.id)) {
                              setSelectedExtras(selectedExtras.filter(id => id !== extra.id));
                            } else {
                              setSelectedExtras([...selectedExtras, extra.id]);
                            }
                          }}
                        >
                          <View style={styles.extraCheckbox}>
                            {selectedExtras.includes(extra.id) && (
                              <Ionicons name="checkmark" size={16} color={colors.primary} />
                            )}
                          </View>
                          <View style={styles.extraInfo}>
                            <Text style={[styles.extraTitle, { color: colors.text }]}>{extra.title}</Text>
                            <Text style={[styles.extraPrice, { color: colors.primary }]}>
                              ${extra.price.toFixed(2)}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  
                  <View style={styles.formRow}>
                    <Text style={styles.label}>Selected Organs</Text>
                    <View style={styles.organsContainer}>
                      {/* Show organs loaded from the database - only the active ones */}
                      {organOptions
                        .filter(organ => organ.is_active || (selectedOrgans && selectedOrgans.includes(organ.name)))
                        .map((organ) => (
                          <TouchableOpacity
                            key={organ.id}
                            style={[
                              styles.organOption,
                              { borderColor: colors.border },
                              selectedOrgans.includes(organ.name) && { backgroundColor: colors.primary + '20', borderColor: colors.primary },
                              !organ.is_active && { opacity: 0.6 } // Show inactive organs as faded
                            ]}
                            onPress={() => {
                              console.log("Current selected organs:", selectedOrgans);
                              console.log("Toggling organ:", organ.name);
                              
                              if (selectedOrgans.includes(organ.name)) {
                                const updatedOrgans = selectedOrgans.filter(o => o !== organ.name);
                                console.log("Removing organ, new selection:", updatedOrgans);
                                setSelectedOrgans(updatedOrgans);
                              } else {
                                const updatedOrgans = [...selectedOrgans, organ.name];
                                console.log("Adding organ, new selection:", updatedOrgans);
                                setSelectedOrgans(updatedOrgans);
                              }
                            }}
                          >
                            <View style={styles.organCheckbox}>
                              {selectedOrgans.includes(organ.name) && (
                                <Ionicons name="checkmark" size={16} color={colors.primary} />
                              )}
                            </View>
                            <Text style={[
                              styles.organName, 
                              { color: colors.text },
                              !organ.is_active && { fontStyle: 'italic' } // Style inactive organs differently
                            ]}>
                              {organ.name}
                              {!organ.is_active && " (inactive)"}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      
                      {/* Show a message if there are no active organs */}
                      {organOptions.filter(o => o.is_active).length === 0 && (
                        <Text style={{ color: colors.lightText, fontStyle: 'italic' }}>
                          No active organs available
                        </Text>
                      )}
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                onPress={() => setEditModalVisible(false)}
                style={{...styles.footerButton}}
                variant="outline"
              />
              <Button
                title="Update Order"
                onPress={handleUpdateOrder}
                style={{...styles.footerButton}}
                disabled={
                  !selectedAnimalId || 
                  !selectedSizeId || 
                  !selectedCuttingStyleId || 
                  !selectedPriceOptionId
                }
              />
            </View>
          </View>
        </SafeAreaView>
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  editModalContent: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    margin: 16,
    marginTop: 24,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalContent: {
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  footerButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  formRow: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  pickerContainer: {
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dividedContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dividedOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  dividedOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  extrasContainer: {
    marginBottom: 16,
  },
  extraOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  extraCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  extraTitle: {
    fontSize: 16,
  },
  extraPrice: {
    fontSize: 16,
    fontWeight: '600',
  },
  organsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  organOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  organCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  organName: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalCloseButton: {
    padding: 8,
    borderRadius: 8,
  },
});
