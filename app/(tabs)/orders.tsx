import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  SafeAreaView, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity,
  Modal,
  Platform,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { createShadow } from '../../utils/styling';
import Button from '../../components/Button';
import { supabase } from '../../utils/supabase';
import { User } from '@supabase/supabase-js';

interface Order {
  id: string;
  order_ticket: string;
  created_at: string;
  status: string;
  customer_name: string;
  total: number;
  animal_size_id: string;
  price_option_id: string;
  cutting_style_id: string;
  delivery_date_id: string;
  address: string;
  phone_number: string;
  guest_email?: string;
  guest_phone?: string;
  payment_status: string;
  divided: boolean;
  special_instructions?: string;
  animal_size?: {
    id: string;
    animal: {
      title: string;
      description: string;
    };
    size: {
      name: string;
      description: string;
    };
  };
  price_option?: {
    name: string;
    price: number;
  };
  cutting_style?: {
    title: string;
    description: string;
  };
  delivery_date?: {
    date: string;
    available_slots: number;
  };
}

export default function OrdersScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  const [user, setUser] = useState<User | null>(null);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketNumber, setTicketNumber] = useState('');
  const [dateFilterVisible, setDateFilterVisible] = useState(false);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [tempStartDate, setTempStartDate] = useState<string | null>(null);
  const [tempEndDate, setTempEndDate] = useState<string | null>(null);
  
  // Check auth state
  useEffect(() => {
    checkUser();
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  // Fetch orders when user changes
  useEffect(() => {
    if (user) {
      fetchUserOrders();
    }
  }, [user]);

  const fetchUserOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          animal_size:animal_size_options!animal_size_id (
            id,
            animal:animals!animal_id (
              title,
              description
            ),
            size:sizes!size_id (
              name,
              description
            )
          ),
          price_option:price_options!price_option_id (
            name,
            price
          ),
          cutting_style:cutting_styles!cutting_style_id (
            title,
            description
          ),
          delivery_date:delivery_dates!delivery_date_id (
            date,
            available_slots
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setOrders(data || []);
      setFilteredOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const lookupOrderByTicket = async () => {
    if (!ticketNumber.trim()) {
      Alert.alert('Error', 'Please enter a ticket number');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          animal_size:animal_size_options!animal_size_id (
            id,
            animal:animals!animal_id (
              title,
              description
            ),
            size:sizes!size_id (
              name,
              description
            )
          ),
          price_option:price_options!price_option_id (
            name,
            price
          ),
          cutting_style:cutting_styles!cutting_style_id (
            title,
            description
          ),
          delivery_date:delivery_dates!delivery_date_id (
            date,
            available_slots
          )
        `)
        .eq('order_ticket', ticketNumber.toUpperCase())
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        setOrders([data]);
        setFilteredOrders([data]);
      } else {
        setError('No order found with this ticket number');
        setOrders([]);
        setFilteredOrders([]);
      }
    } catch (err) {
      console.error('Error looking up order:', err);
      setError('Failed to find order');
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
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

  // Simple date picker for demo - in a real app, you'd use a proper date picker component
  const renderDatePicker = () => {
    // Current year and years for selection
    const currentYear = new Date().getFullYear();
    const years = Array.from({length: 5}, (_, i) => currentYear - 2 + i);
    
    // Months for selection
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const handleDateSelect = (year: number, month: number, isStart: boolean) => {
      // Create a date string (YYYY-MM-DD) with the first day for start date or last day for end date
      const date = new Date(year, month, isStart ? 1 : new Date(year, month + 1, 0).getDate());
      const dateString = date.toISOString().split('T')[0];
      
      if (isStart) {
        setTempStartDate(dateString);
      } else {
        setTempEndDate(dateString);
      }
    };

    return (
      <View style={styles.datePickerContainer}>
        <View style={styles.datePickerSection}>
          <Text style={[styles.datePickerTitle, { color: colors.text }]}>Start Date</Text>
          <View style={styles.datePickerControls}>
            <View style={styles.pickerRow}>
              {/* Month Selection */}
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pickerScroll}
              >
                {months.map((month, index) => (
                  <TouchableOpacity
                    key={`start-month-${index}`}
                    style={[
                      styles.pickerItem,
                      tempStartDate && new Date(tempStartDate).getMonth() === index ? 
                        { backgroundColor: colors.primary } : { backgroundColor: colors.card }
                    ]}
                    onPress={() => {
                      const year = tempStartDate ? 
                        new Date(tempStartDate).getFullYear() : 
                        new Date().getFullYear();
                      handleDateSelect(year, index, true);
                    }}
                  >
                    <Text style={[
                      styles.pickerText,
                      { color: tempStartDate && new Date(tempStartDate).getMonth() === index ? 
                        'white' : colors.text }
                    ]}>
                      {month.substring(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <View style={styles.pickerRow}>
              {/* Year Selection */}
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pickerScroll}
              >
                {years.map((year) => (
                  <TouchableOpacity
                    key={`start-year-${year}`}
                    style={[
                      styles.pickerItem,
                      tempStartDate && new Date(tempStartDate).getFullYear() === year ? 
                        { backgroundColor: colors.primary } : { backgroundColor: colors.card }
                    ]}
                    onPress={() => {
                      const month = tempStartDate ? 
                        new Date(tempStartDate).getMonth() : 
                        0;
                      handleDateSelect(year, month, true);
                    }}
                  >
                    <Text style={[
                      styles.pickerText,
                      { color: tempStartDate && new Date(tempStartDate).getFullYear() === year ? 
                        'white' : colors.text }
                    ]}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
        
        <View style={styles.datePickerSection}>
          <Text style={[styles.datePickerTitle, { color: colors.text }]}>End Date</Text>
          <View style={styles.datePickerControls}>
            <View style={styles.pickerRow}>
              {/* Month Selection */}
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pickerScroll}
              >
                {months.map((month, index) => (
                  <TouchableOpacity
                    key={`end-month-${index}`}
                    style={[
                      styles.pickerItem,
                      tempEndDate && new Date(tempEndDate).getMonth() === index ? 
                        { backgroundColor: colors.primary } : { backgroundColor: colors.card }
                    ]}
                    onPress={() => {
                      const year = tempEndDate ? 
                        new Date(tempEndDate).getFullYear() : 
                        new Date().getFullYear();
                      handleDateSelect(year, index, false);
                    }}
                  >
                    <Text style={[
                      styles.pickerText,
                      { color: tempEndDate && new Date(tempEndDate).getMonth() === index ? 
                        'white' : colors.text }
                    ]}>
                      {month.substring(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <View style={styles.pickerRow}>
              {/* Year Selection */}
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pickerScroll}
              >
                {years.map((year) => (
                  <TouchableOpacity
                    key={`end-year-${year}`}
                    style={[
                      styles.pickerItem,
                      tempEndDate && new Date(tempEndDate).getFullYear() === year ? 
                        { backgroundColor: colors.primary } : { backgroundColor: colors.card }
                    ]}
                    onPress={() => {
                      const month = tempEndDate ? 
                        new Date(tempEndDate).getMonth() : 
                        11; // Default to December if no month selected
                      handleDateSelect(year, month, false);
                    }}
                  >
                    <Text style={[
                      styles.pickerText,
                      { color: tempEndDate && new Date(tempEndDate).getFullYear() === year ? 
                        'white' : colors.text }
                    ]}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>

        <View style={styles.datePickerActions}>
          <Button
            title="Clear"
            onPress={clearDateFilter}
            variant="outline"
            style={styles.datePickerButton}
          />
          <Button
            title="Cancel"
            onPress={cancelDateFilter}
            variant="secondary"
            style={styles.datePickerButton}
          />
          <Button
            title="Apply"
            onPress={applyDateFilter}
            style={styles.datePickerButton}
          />
        </View>
      </View>
    );
  };

  const renderOrderDetails = (order: Order) => (
    <View style={[styles.orderDetailsCard, { backgroundColor: colors.card }]}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={[styles.orderTicket, { color: colors.primary }]}>
            #{order.order_ticket}
          </Text>
          <Text style={[styles.orderDate, { color: colors.text }]}>
            {new Date(order.created_at).toLocaleString()}
          </Text>
        </View>
        <View style={[
          styles.statusBadge, 
          { 
            backgroundColor: 
              order.status === 'delivered' ? '#E1F5E1' : 
              order.status === 'processing' ? '#FFF9C4' : '#FFEBEE' 
          }
        ]}>
          <Text style={[
            styles.statusText, 
            { 
              color: 
                order.status === 'delivered' ? '#2E7D32' : 
                order.status === 'processing' ? '#F57F17' : '#C62828' 
            }
          ]}>
            {order.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.orderSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Customer Details</Text>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.lightText }]}>Name:</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>{order.customer_name}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.lightText }]}>Phone:</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>{order.phone_number}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.lightText }]}>Address:</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>{order.address}</Text>
        </View>
        {order.guest_email && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.lightText }]}>Email:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{order.guest_email}</Text>
          </View>
        )}
      </View>

      <View style={styles.orderSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Animal Details</Text>
        {order.animal_size && (
          <>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.lightText }]}>Animal Type:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {order.animal_size.animal.title}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.lightText }]}>Size:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {order.animal_size.size.name}
              </Text>
            </View>
          </>
        )}
        {order.cutting_style && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.lightText }]}>Cutting Style:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {order.cutting_style.title}
            </Text>
          </View>
        )}
        {order.price_option && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.lightText }]}>Package:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {order.price_option.name}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.orderSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Delivery Details</Text>
        {order.delivery_date && (
          <>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.lightText }]}>Date:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {new Date(order.delivery_date.date).toLocaleDateString()}
              </Text>
            </View>
          </>
        )}
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.lightText }]}>Total:</Text>
          <Text style={[styles.detailValue, { color: colors.primary, fontWeight: '600' }]}>
            ${order.total.toFixed(2)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.lightText }]}>Payment Status:</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {order.payment_status.toUpperCase()}
          </Text>
        </View>
        {order.special_instructions && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.lightText }]}>Special Instructions:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{order.special_instructions}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderGuestView = () => (
    <View style={styles.guestContainer}>
      {!orders.length ? (
        <View style={styles.guestContent}>
          <View style={styles.guestHeader}>
            <Ionicons name="ticket-outline" size={64} color={colors.primary} />
            <Text style={[styles.guestTitle, { color: colors.text }]}>
              Track Your Order
            </Text>
            <Text style={[styles.guestSubtitle, { color: colors.lightText }]}>
              Enter your order ticket number to view your order details
            </Text>
          </View>
          
          <View style={styles.ticketInputContainer}>
            <TextInput
              style={[styles.ticketInput, { 
                backgroundColor: colors.card,
                color: colors.text,
                borderColor: error ? colors.error : colors.border
              }]}
              placeholder="Enter Ticket Number (e.g., ABC123)"
              placeholderTextColor={colors.lightText}
              value={ticketNumber}
              onChangeText={(text) => {
                setTicketNumber(text.toUpperCase());
                setError(null);
              }}
              autoCapitalize="characters"
              maxLength={6}
            />
            <Button
              title="Look Up Order"
              onPress={lookupOrderByTicket}
              style={styles.lookupButton}
              disabled={!ticketNumber.trim() || ticketNumber.trim().length < 6}
            />
          </View>

          {error && (
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          )}
        </View>
      ) : (
        <View style={styles.orderDetailsContainer}>
          <ScrollView contentContainerStyle={styles.orderDetailsContent}>
            {renderOrderDetails(orders[0])}
            <Button
              title="Look Up Another Order"
              onPress={() => {
                setOrders([]);
                setTicketNumber('');
                setError(null);
              }}
              style={styles.lookupAnotherButton}
            />
          </ScrollView>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {user ? 'Your Orders' : 'Track Order'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.lightText }]}>
            {user ? 'View your order history' : 'Look up your order details'}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {user ? 'Loading orders...' : 'Looking up order...'}
          </Text>
        </View>
      ) : user ? (
        <React.Fragment>
          <View style={styles.filterContainer}>
            <TouchableOpacity 
              style={[
                styles.dateFilterButton, 
                { 
                  backgroundColor: colors.card,
                  borderColor: (startDate || endDate) ? colors.primary : colors.border
                }
              ]}
              onPress={() => setDateFilterVisible(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Text style={[styles.filterText, { color: colors.text }]}>
                {startDate || endDate ? 
                  `${formatDateForDisplay(startDate)} - ${formatDateForDisplay(endDate)}` : 
                  'All Orders'}
              </Text>
            </TouchableOpacity>
          </View>
          {filteredOrders.length > 0 ? (
            <FlatList
              data={filteredOrders}
              renderItem={({ item }) => renderOrderDetails(item)}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={56} color={colors.lightText} />
              <Text style={[styles.emptyText, { color: colors.lightText }]}>
                No orders found
              </Text>
            </View>
          )}
        </React.Fragment>
      ) : (
        renderGuestView()
      )}

      {/* Date Range Picker Modal */}
      <Modal
        visible={dateFilterVisible}
        transparent
        animationType="slide"
        onRequestClose={cancelDateFilter}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={cancelDateFilter}
        >
          <Pressable style={[
            styles.modalContent, 
            { backgroundColor: colors.background }
          ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Filter Orders by Date
              </Text>
              <TouchableOpacity onPress={cancelDateFilter}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            {renderDatePicker()}
          </Pressable>
        </Pressable>
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
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateFilterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  filterIcon: {
    marginRight: 8,
  },
  dateRangeTextContainer: {
    flex: 1,
  },
  dateRangeLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  dateRangeValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  clearFilterButton: {
    marginLeft: 12,
    padding: 8,
  },
  clearFilterText: {
    fontSize: 16,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  orderCard: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
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
    marginBottom: 12,
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
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
  },
  actionIcon: {
    marginRight: 4,
  },
  actionText: {
    fontSize: 14,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    height: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  datePickerContainer: {
    padding: 20,
  },
  datePickerSection: {
    marginBottom: 20,
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  datePickerControls: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  pickerRow: {
    marginBottom: 10,
  },
  pickerScroll: {
    paddingVertical: 5,
  },
  pickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: 8,
  },
  pickerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  datePickerButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  guestContainer: {
    flex: 1,
    width: '100%',
  },
  guestContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  guestHeader: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
    maxWidth: 400,
  },
  guestTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 0,
    lineHeight: 24,
  },
  ticketInputContainer: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 20,
  },
  ticketInput: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 20,
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'left',
    letterSpacing: 1,
  },
  lookupButton: {
    width: '100%',
    height: 56,
    borderRadius: 12,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    maxWidth: 400,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  filterText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  orderDetailsCard: {
    borderRadius: 12,
    padding: 16,
    margin: 16,
    ...createShadow('#000', { width: 0, height: 2 }, 0.1, 3),
  },
  orderTicket: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  orderSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    flex: 2,
    textAlign: 'right',
  },
  orderDetailsContainer: {
    flex: 1,
    width: '100%',
  },
  orderDetailsContent: {
    padding: 16,
    paddingBottom: 32,
  },
  lookupAnotherButton: {
    margin: 16,
    marginTop: 0,
    height: 56,
    borderRadius: 12,
  },
}); 