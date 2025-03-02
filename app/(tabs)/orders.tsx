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
  Pressable
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { createShadow } from '../../utils/styling';
import Button from '../../components/Button';
import { ScrollView } from 'react-native-gesture-handler';

// Example data for orders
const orderHistory = [
  {
    id: '1',
    date: '2023-10-15',
    status: 'Delivered',
    items: 'Lamb - Medium - Standard Cut',
  },
  {
    id: '2',
    date: '2023-10-01',
    status: 'Delivered',
    items: 'Sheep - Large - Premium Cut',
  },
  {
    id: '3',
    date: '2023-09-20',
    status: 'Cancelled',
    items: 'Goat - Medium - Standard Cut',
  },
  {
    id: '4',
    date: '2023-11-05',
    status: 'Processing',
    items: 'Lamb - Small - Custom Cut',
  },
];

export default function OrdersScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  
  const [dateFilterVisible, setDateFilterVisible] = useState(false);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [filteredOrders, setFilteredOrders] = useState(orderHistory);
  const [tempStartDate, setTempStartDate] = useState<string | null>(null);
  const [tempEndDate, setTempEndDate] = useState<string | null>(null);
  
  // Filter orders when date filter changes
  useEffect(() => {
    if (startDate || endDate) {
      const filtered = orderHistory.filter(order => {
        const orderDate = new Date(order.date);
        let includeOrder = true;
        
        if (startDate) {
          const start = new Date(startDate);
          includeOrder = includeOrder && orderDate >= start;
        }
        
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999); // Include the entire end day
          includeOrder = includeOrder && orderDate <= end;
        }
        
        return includeOrder;
      });
      
      setFilteredOrders(filtered);
    } else {
      setFilteredOrders(orderHistory);
    }
  }, [startDate, endDate]);

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

  const renderOrderItem = ({ item }: { item: typeof orderHistory[0] }) => (
    <View style={[
      styles.orderCard, 
      { backgroundColor: colors.card, borderColor: colors.border },
      createShadow(colors.text, { width: 0, height: 2 }, 0.1, 3)
    ]}>
      <View style={styles.orderHeader}>
        <Text style={[styles.orderDate, { color: colors.text }]}>
          Order placed: {new Date(item.date).toLocaleDateString()}
        </Text>
        <View style={[
          styles.statusBadge, 
          { 
            backgroundColor: 
              item.status === 'Delivered' ? '#E1F5E1' : 
              item.status === 'Processing' ? '#FFF9C4' : '#FFEBEE' 
          }
        ]}>
          <Text style={[
            styles.statusText, 
            { 
              color: 
                item.status === 'Delivered' ? '#2E7D32' : 
                item.status === 'Processing' ? '#F57F17' : '#C62828' 
            }
          ]}>
            {item.status}
          </Text>
        </View>
      </View>
      
      <View style={styles.orderContent}>
        <Ionicons 
          name={
            item.status === 'Delivered' ? 'checkmark-circle' : 
            item.status === 'Processing' ? 'time' : 'close-circle'
          } 
          size={28} 
          color={
            item.status === 'Delivered' ? '#4CAF50' : 
            item.status === 'Processing' ? '#FF9800' : '#F44336'
          } 
          style={styles.statusIcon}
        />
        <View style={styles.orderDetails}>
          <Text style={[styles.orderItems, { color: colors.text }]}>{item.items}</Text>
        </View>
      </View>
      
      {/* Action buttons based on status */}
      <View style={styles.actionContainer}>
        {item.status === 'Delivered' && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.primary + '10' }]}
            onPress={() => {/* Handle reorder */}}
          >
            <Ionicons name="repeat" size={16} color={colors.primary} style={styles.actionIcon} />
            <Text style={[styles.actionText, { color: colors.primary }]}>Reorder</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.card }]}
          onPress={() => {/* Handle order details */}}
        >
          <Ionicons name="list" size={16} color={colors.text} style={styles.actionIcon} />
          <Text style={[styles.actionText, { color: colors.text }]}>Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Your Orders</Text>
          <Text style={[styles.subtitle, { color: colors.lightText }]}>
            View your order history
          </Text>
        </View>
      </View>

      {/* Date filter button */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[
            styles.dateFilterButton, 
            { 
              backgroundColor: colors.card,
              borderColor: (startDate || endDate) ? colors.primary : colors.border
            },
            createShadow(colors.text, { width: 0, height: 1 }, 0.05, 2)
          ]}
          onPress={openDateFilter}
        >
          <Ionicons name="calendar-outline" size={20} color={colors.primary} style={styles.filterIcon} />
          <View style={styles.dateRangeTextContainer}>
            <Text style={[styles.dateRangeLabel, { color: colors.lightText }]}>Date Range:</Text>
            <Text style={[styles.dateRangeValue, { color: colors.text }]}>
              {startDate || endDate ? 
                `${formatDateForDisplay(startDate)} - ${formatDateForDisplay(endDate)}` : 
                'All Orders'}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color={colors.lightText} />
        </TouchableOpacity>
        
        {(startDate || endDate) && (
          <TouchableOpacity 
            style={styles.clearFilterButton} 
            onPress={clearDateFilter}
          >
            <Text style={[styles.clearFilterText, { color: colors.primary }]}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {filteredOrders.length > 0 ? (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={56} color={colors.lightText} />
          <Text style={[styles.emptyText, { color: colors.lightText }]}>
            {startDate || endDate ? 'No orders found for this date range' : 'You don\'t have any orders yet'}
          </Text>
          {(startDate || endDate) && (
            <TouchableOpacity 
              style={[styles.clearFilterButton, { marginTop: 16 }]}
              onPress={clearDateFilter}
            >
              <Text style={[styles.clearFilterText, { color: colors.primary }]}>
                Clear filter
              </Text>
            </TouchableOpacity>
          )}
        </View>
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
}); 