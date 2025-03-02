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
} from 'react-native';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';
import Button from '../../../components/Button';
import { Calendar, DateData } from 'react-native-calendars';
import { format, isWithinInterval, parseISO } from 'date-fns';

interface Order {
  id: string;
  customerName: string;
  date: string;
  status: string;
  total: number;
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
      case 'Pending': return '#FFA000';
      case 'Processing': return '#2196F3';
      case 'Shipped': return '#4CAF50';
      case 'Delivered': return '#4CAF50';
      case 'Cancelled': return '#F44336';
      default: return '#757575';
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
            
            {['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((status) => (
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
                  {status}
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
            onPress={() => {
              setSelectedOrder(item);
              openStatusModal(item);
            }}
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
    backgroundColor: '#D50000', // Primary color
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
}); 