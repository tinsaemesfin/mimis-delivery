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
} from 'react-native';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';
import Button from '../../../components/Button';
import { Calendar, DateData } from 'react-native-calendars';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../utils/supabase';

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
    name: string;
    price: number;
  };
}

interface OrdersTabProps {
  orders: Order[];
  setSelectedOrder: React.Dispatch<React.SetStateAction<Order | null>>;
  openStatusModal: (order: Order) => void;
  onExport?: () => void;
}

export default function OrdersTab({ orders, setSelectedOrder, openStatusModal, onExport }: OrdersTabProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState(false);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [selectingStartDate, setSelectingStartDate] = useState(true);
  const [filteredOrders, setFilteredOrders] = useState(orders);
  const [orderDetailsVisible, setOrderDetailsVisible] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [statusDropdownVisible, setStatusDropdownVisible] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Update filtered orders whenever filters change
  useEffect(() => {
    let results = [...orders];
    
    // Apply status filter
    if (statusFilter) {
      results = results.filter(order => order.status === statusFilter);
    }
    
    // Apply date filter
    if (dateFilter && startDate && endDate) {
      try {
        const start = parseISO(startDate);
        const end = parseISO(endDate);
        
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
  }, [orders, statusFilter, dateFilter, startDate, endDate]);

  // Handle date selection in calendar
  const handleDateSelect = (day: DateData) => {
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
      setDateFilter(true);
    }
  };

  // Clear date filter
  const clearDateFilter = () => {
    setStartDate(null);
    setEndDate(null);
    setDateFilter(false);
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
    setSelectedOrder(order);
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
      const updatedOrders = orders.map(o => 
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

  // Prepare marked dates for calendar
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

  return (
    <View style={styles.tabContent}>
      <View style={styles.filterSection}>
        <View style={styles.headerRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Order History</Text>
          {onExport && (
            <Button 
              title="Export to Excel" 
              onPress={onExport}
              style={styles.exportButton}
              variant="primary"
            />
          )}
        </View>
        
        <View style={styles.filterRow}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>Filter by Status:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusFilterScroll}>
            <TouchableOpacity
              style={[
                styles.statusFilterButton,
                statusFilter === null && styles.activeFilter,
                { borderColor: colors.border }
              ]}
              onPress={() => setStatusFilter(null)}
            >
              <Text style={[
                styles.statusFilterText,
                statusFilter === null && styles.activeFilterText,
                { color: statusFilter === null ? 'white' : colors.text }
              ]}>
                All
              </Text>
            </TouchableOpacity>
            
            {['pending', 'confirmed', 'processing', 'ready', 'delivered', 'cancelled'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusFilterButton,
                  statusFilter === status && styles.activeFilter,
                  { borderColor: colors.border }
                ]}
                onPress={() => setStatusFilter(status)}
              >
                <Text style={[
                  styles.statusFilterText,
                  statusFilter === status && styles.activeFilterText,
                  { color: statusFilter === status ? 'white' : colors.text }
                ]}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        <View style={styles.filterRow}>
          <Text style={[styles.filterLabel, { color: colors.text }]}>Filter by Date:</Text>
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
            
            {dateFilter && (
              <TouchableOpacity
                style={[styles.clearFilterButton, { backgroundColor: colors.card }]}
                onPress={clearDateFilter}
              >
                <Text style={[styles.clearFilterText, { color: colors.primary }]}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
      
      <FlatList
        data={filteredOrders}
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
              <TouchableOpacity 
                style={[styles.modalCloseButton, { backgroundColor: colors.card }]}
                onPress={() => setOrderDetailsVisible(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
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
    fontSize: 12,
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
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  calendarContainer: {
    width: '90%',
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
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
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
    borderRadius: 8,
    marginLeft: 8,
  } as ViewStyle,
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
}); 