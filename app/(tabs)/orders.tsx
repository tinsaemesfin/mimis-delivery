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
import { Calendar } from 'react-native-calendars';
import { format, parseISO, isWithinInterval } from 'date-fns';

interface Order {
  id: string;
  order_ticket: string;
  created_at: string;
  status: string;
  customer_name: string;
  total: number;
  delivery_fee: number;
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
  organs?: string[];
  extras?: {
    id: string;
    title: string;
    price: number;
  }[];
}

export default function OrdersScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  const [user, setUser] = useState<User | null>(null);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketNumber, setTicketNumber] = useState('');
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [selectingStartDate, setSelectingStartDate] = useState(true);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  
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

      const { data: ordersData, error: fetchError } = await supabase
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

      // Fetch extras for orders that have them
      const ordersWithExtras = await Promise.all(
        (ordersData || []).map(async (order) => {
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

      setOrders(ordersWithExtras || []);
      setFilteredOrders(ordersWithExtras || []);
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

      const { data: orderData, error: fetchError } = await supabase
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

      if (orderData) {
        // Fetch extras if the order has them
        if (orderData.extras && orderData.extras.length > 0) {
          const { data: extrasData, error: extrasError } = await supabase
            .from('extras')
            .select('id, title, price')
            .in('id', orderData.extras);

          if (extrasError) {
            console.error('Error fetching extras:', extrasError);
          } else {
            orderData.extras = extrasData;
          }
        }

        setOrders([orderData]);
        setFilteredOrders([orderData]);
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

  // Update filtered orders whenever filters change
  useEffect(() => {
    let results = [...orders];
    
    // Apply date filter
    if (startDate && endDate) {
      try {
        const start = parseISO(startDate);
        const end = parseISO(endDate);
        
        // Set end date to end of day (23:59:59) to include the entire day
        end.setHours(23, 59, 59, 999);
        
        results = results.filter(order => {
          try {
            const orderDate = parseISO(order.created_at);
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
  }, [orders, startDate, endDate]);

  // Handle date selection in calendar
  const handleDateSelect = (day: any) => {
    const selectedDate = day.dateString;
    
    if (selectingStartDate) {
      setStartDate(selectedDate);
      setSelectingStartDate(false);
    } else {
      // Ensure endDate is after startDate
      if (startDate && selectedDate < startDate) {
        setEndDate(startDate);
        setStartDate(selectedDate);
      } else {
        setEndDate(selectedDate);
      }
      setCalendarVisible(false);
    }
  };

  // Clear date filter
  const clearDateFilter = () => {
    setStartDate(null);
    setEndDate(null);
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

  // Get marked dates for calendar
  const getMarkedDates = () => {
    const markedDates: any = {};
    
    if (startDate) {
      markedDates[startDate] = { 
        selected: true, 
        startingDay: true, 
        color: colors.primary 
      };
    }
    
    if (endDate) {
      markedDates[endDate] = { 
        selected: true, 
        endingDay: true, 
        color: colors.primary 
      };
    }
    
    // If we have both start and end dates, mark days in between
    if (startDate && endDate && startDate !== endDate) {
      // Create dates between start and end
      try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        const currentDate = new Date(start);
        currentDate.setDate(currentDate.getDate() + 1);
        
        while (currentDate < end) {
          const dateString = currentDate.toISOString().split('T')[0];
          markedDates[dateString] = {
            selected: true,
            color: colors.primary
          };
          currentDate.setDate(currentDate.getDate() + 1);
        }
      } catch (e) {
        console.warn('Error marking date range:', e);
      }
    }
    
    return markedDates;
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
        {order.special_instructions && (
        <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.lightText }]}>Special Instructions:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{order.special_instructions}</Text>
        </View>
        )}

        {order.organs && order.organs.length > 0 && (
        <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.lightText }]}>Selected Organs:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{order.organs.join(', ')}</Text>
          </View>
        )}

        <View style={styles.pricingSection}>
          <Text style={[styles.pricingTitle, { color: colors.text }]}>Price Breakdown</Text>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.lightText }]}>Base Price:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              ${order.price_option?.price.toFixed(2)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.lightText }]}>Delivery Fee:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              ${order.delivery_fee.toFixed(2)}
            </Text>
          </View>

          {order.extras && order.extras.length > 0 && (
            <>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.lightText }]}>Additional Services:</Text>
                <View style={styles.extrasContainer}>
                  {order.extras.map((extra, index) => (
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
                  ${order.extras.reduce((sum, extra) => sum + extra.price, 0).toFixed(2)}
                </Text>
              </View>
            </>
          )}

          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.text, fontWeight: '600' }]}>Total Amount:</Text>
            <Text style={[styles.detailValue, { color: colors.primary, fontWeight: '700', fontSize: 16 }]}>
              ${(
                (order.price_option?.price || 0) + 
                (order.extras?.reduce((sum, extra) => sum + extra.price, 0) || 0) +
                (order.delivery_fee || 0)
              ).toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.lightText }]}>Payment Status:</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {order.payment_status.toUpperCase()}
          </Text>
        </View>
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
            <View style={styles.dateFilterRow}>
            <TouchableOpacity 
                style={[styles.dateButton, { borderColor: colors.border, backgroundColor: colors.card }]}
                onPress={() => {
                  setSelectingStartDate(true);
                  setCalendarVisible(true);
                }}
              >
                <Text style={[styles.dateButtonText, { color: colors.text }]}>
                  {startDate ? formatDate(startDate) : 'Start Date'}
                </Text>
              </TouchableOpacity>
              
              <Text style={[styles.dateRangeSeparator, { color: colors.lightText }]}>to</Text>
              
              <TouchableOpacity
                style={[styles.dateButton, { borderColor: colors.border, backgroundColor: colors.card }]}
                onPress={() => {
                  if (startDate) {
                    setSelectingStartDate(false);
                    setCalendarVisible(true);
                  } else {
                    Alert.alert('Error', 'Please select a start date first');
                  }
                }}
              >
                <Text style={[styles.dateButtonText, { color: colors.text }]}>
                  {endDate ? formatDate(endDate) : 'End Date'}
              </Text>
            </TouchableOpacity>
              
              {(startDate || endDate) && (
                <TouchableOpacity
                  style={[styles.clearFilterButton, { backgroundColor: colors.card }]}
                  onPress={clearDateFilter}
                >
                  <Text style={[styles.clearFilterText, { color: colors.primary }]}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
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

      {/* Calendar Modal */}
      <Modal
        visible={calendarVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCalendarVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.calendarContainer, { backgroundColor: colors.background }]}>
            <View style={styles.calendarHeader}>
              <Text style={[styles.calendarTitle, { color: colors.text }]}>
                Select {selectingStartDate ? 'Start' : 'End'} Date
              </Text>
              <TouchableOpacity onPress={() => setCalendarVisible(false)}>
                <Text style={[styles.closeButton, { color: colors.primary }]}>Close</Text>
              </TouchableOpacity>
            </View>
            
            <Calendar
              onDayPress={handleDateSelect}
              markedDates={getMarkedDates()}
              markingType="period"
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
  dateFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
  },
  dateButtonText: {
    fontSize: 14,
    textAlign: 'center',
  },
  dateRangeSeparator: {
    marginHorizontal: 8,
    fontSize: 14,
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
  calendarContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 16,
    fontWeight: '500',
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
  extrasContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  extraItem: {
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    marginRight: 8,
  },
  extraTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  extraPrice: {
    fontSize: 14,
    fontWeight: '500',
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
}); 