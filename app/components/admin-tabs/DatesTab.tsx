import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';
import Button from '../../../components/Button';
import { format, parseISO, isValid, startOfDay, isFuture, isPast, isToday } from 'date-fns';
import { Calendar, DateData } from 'react-native-calendars';
import { supabase } from '../../../utils/supabase';
import { Ionicons } from '@expo/vector-icons';

interface DeliveryDate {
  id: string;
  date: string;
  available_slots: number;
  is_active: boolean;
  created_at?: string;
  booked_count?: number;
}

interface DatesTabProps {
  deliveryDates: DeliveryDate[];
  setDeliveryDates: React.Dispatch<React.SetStateAction<DeliveryDate[]>>;
}

export default function DatesTab({ deliveryDates: initialDates, setDeliveryDates: setParentDates }: DatesTabProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  
  const [deliveryDates, setDeliveryDates] = useState<DeliveryDate[]>([]);
  const [filteredDates, setFilteredDates] = useState<DeliveryDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [dateFilter, setDateFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  
  const [dateModal, setDateModal] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [newDate, setNewDate] = useState<string | null>(null);
  const [newSlots, setNewSlots] = useState('');
  
  const [editMode, setEditMode] = useState(false);
  const [currentDate, setCurrentDate] = useState<DeliveryDate | null>(null);
  
  // Fetch delivery dates from Supabase
  const fetchDeliveryDates = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const { data, error } = await supabase
        .from('delivery_dates')
        .select(`
          id,
          date,
          available_slots,
          is_active,
          created_at,
          booked_count:orders(count)
        `)
        .order('date', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      // Transform the data to match our component's expectations
      const transformedData = (data || []).map(date => ({
        id: date.id,
        date: date.date,
        available_slots: date.available_slots,
        is_active: date.is_active,
        created_at: date.created_at,
        booked_count: date.booked_count?.[0]?.count || 0
      }));
      
      setDeliveryDates(transformedData);
      setParentDates(transformedData);
      applyFilters(transformedData, dateFilter);
    } catch (err) {
      console.error('Error fetching delivery dates:', err);
      setError('Failed to load delivery dates');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Apply filters to the dates list
  const applyFilters = (datesList: DeliveryDate[], filter: 'all' | 'upcoming' | 'past') => {
    let filtered = [...datesList];
    
    // Apply date filter
    if (filter === 'upcoming') {
      filtered = filtered.filter(date => {
        const dateObj = parseISO(date.date);
        return isToday(dateObj) || isFuture(dateObj);
      });
    } else if (filter === 'past') {
      filtered = filtered.filter(date => {
        const dateObj = parseISO(date.date);
        return isPast(dateObj) && !isToday(dateObj);
      });
    }
    
    setFilteredDates(filtered);
  };
  
  // Add a new delivery date
  const addDeliveryDate = async () => {
    if (!newDate) {
      Alert.alert('Error', 'Please select a date');
      return;
    }
    
    if (!newSlots || isNaN(Number(newSlots)) || Number(newSlots) <= 0) {
      Alert.alert('Error', 'Please enter a valid number of slots');
      return;
    }
    
    // Check if date already exists
    const dateExists = deliveryDates.some(date => date.date === newDate);
    if (dateExists) {
      Alert.alert('Error', 'This date already exists in the schedule');
      return;
    }
    
    try {
      setLoading(true);
      
      const newDeliveryDate = {
        date: newDate,
        available_slots: Number(newSlots),
        is_active: true
      };
      
      const { data, error } = await supabase
        .from('delivery_dates')
        .insert([newDeliveryDate])
        .select();
      
      if (error) {
        throw error;
      }
      
      Alert.alert('Success', 'Delivery date added successfully');
      setNewDate(null);
      setNewSlots('');
      setDateModal(false);
      
      // Refresh the dates list
      fetchDeliveryDates();
    } catch (err) {
      console.error('Error adding delivery date:', err);
      Alert.alert('Error', 'Failed to add delivery date');
    } finally {
      setLoading(false);
    }
  };
  
  // Update an existing delivery date
  const updateDeliveryDate = async () => {
    if (!currentDate) return;
    
    if (!newDate) {
      Alert.alert('Error', 'Please select a date');
      return;
    }
    
    if (!newSlots || isNaN(Number(newSlots)) || Number(newSlots) <= 0) {
      Alert.alert('Error', 'Please enter a valid number of slots');
      return;
    }
    
    // Check if date already exists (except for the current one)
    const dateExists = deliveryDates.some(date => 
      date.date === newDate && date.id !== currentDate.id
    );
    
    if (dateExists) {
      Alert.alert('Error', 'This date already exists in the schedule');
      return;
    }
    
    try {
      setLoading(true);
      
      const updatedDate = {
        date: newDate,
        available_slots: Number(newSlots)
      };
      
      const { error } = await supabase
        .from('delivery_dates')
        .update(updatedDate)
        .eq('id', currentDate.id);
      
      if (error) {
        throw error;
      }
      
      Alert.alert('Success', 'Delivery date updated successfully');
      setNewDate(null);
      setNewSlots('');
      setDateModal(false);
      setEditMode(false);
      setCurrentDate(null);
      
      // Refresh the dates list
      fetchDeliveryDates();
    } catch (err) {
      console.error('Error updating delivery date:', err);
      Alert.alert('Error', 'Failed to update delivery date');
    } finally {
      setLoading(false);
    }
  };
  
  // Toggle delivery date active status
  const toggleDateStatus = async (date: DeliveryDate) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('delivery_dates')
        .update({ is_active: !date.is_active })
        .eq('id', date.id);
      
      if (error) {
        throw error;
      }
      
      // Refresh the dates list
      fetchDeliveryDates();
    } catch (err) {
      console.error('Error toggling delivery date status:', err);
      Alert.alert('Error', 'Failed to update delivery date status');
    } finally {
      setLoading(false);
    }
  };
  
  // Open edit modal
  const openEditModal = (date: DeliveryDate) => {
    setCurrentDate(date);
    setNewDate(date.date);
    setNewSlots(date.available_slots.toString());
    setEditMode(true);
    setDateModal(true);
  };
  
  // Format a date string for display
  const formatDate = (dateString: string) => {
    try {
      if (!dateString || !isValid(parseISO(dateString))) return 'Invalid date';
      return format(parseISO(dateString), 'EEEE, MMMM d, yyyy');
    } catch (e) {
      console.warn('Error formatting date:', e);
      return 'Invalid date format';
    }
  };
  
  // Calendar date selection handler
  const handleDateSelect = (day: DateData) => {
    setNewDate(day.dateString);
    setCalendarVisible(false);
    // Reopen the date modal after a short delay
    setTimeout(() => {
      setDateModal(true);
    }, 100);
  };
  
  // Get available slots (subtracting booked orders)
  const getAvailableSlots = (date: DeliveryDate) => {
    return date.available_slots;
  };
  
  // Get booked slots count
  const getBookedSlots = (date: DeliveryDate) => {
    return date.booked_count || 0;
  };
  
  // Get marked dates for calendar
  const getMarkedDates = () => {
    const markedDates: any = {};
    
    // Mark existing delivery dates
    deliveryDates.forEach(date => {
      markedDates[date.date] = { 
        marked: true, 
        dotColor: date.is_active ? '#4CAF50' : '#F44336' 
      };
    });
    
    // Mark the selected date
    if (newDate) {
      markedDates[newDate] = { 
        ...markedDates[newDate],
        selected: true,
        selectedColor: colors.primary 
      };
    }
    
    return markedDates;
  };
  
  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchDeliveryDates();
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchDeliveryDates();
  }, []);
  
  // Apply filters when filter changes
  useEffect(() => {
    applyFilters(deliveryDates, dateFilter);
  }, [dateFilter, deliveryDates]);
  
  return (
    <View style={styles.tabContent}>
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            dateFilter === 'all' && { backgroundColor: colors.primary + '20' }
          ]}
          onPress={() => setDateFilter('all')}
        >
          <Text style={[
            styles.filterButtonText,
            dateFilter === 'all' && { color: colors.primary }
          ]}>
            All Dates
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            dateFilter === 'upcoming' && { backgroundColor: colors.primary + '20' }
          ]}
          onPress={() => setDateFilter('upcoming')}
        >
          <Text style={[
            styles.filterButtonText,
            dateFilter === 'upcoming' && { color: colors.primary }
          ]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            dateFilter === 'past' && { backgroundColor: colors.primary + '20' }
          ]}
          onPress={() => setDateFilter('past')}
        >
          <Text style={[
            styles.filterButtonText,
            dateFilter === 'past' && { color: colors.primary }
          ]}>
            Past
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Delivery Schedule {filteredDates.length > 0 && `(${filteredDates.length})`}
        </Text>
        <Button 
          title="Add Date" 
          onPress={() => {
            setEditMode(false);
            setNewDate(null);
            setNewSlots('');
            setDateModal(true);
          }}
          style={styles.addButton}
          variant="primary"
        />
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading delivery dates...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <Button title="Retry" onPress={fetchDeliveryDates} style={styles.retryButton} />
        </View>
      ) : (
        <FlatList
          data={filteredDates}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.dateCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => openEditModal(item)}
              activeOpacity={0.7}
            >
              <View style={styles.dateInfo}>
                <Text style={[styles.dateText, { color: colors.text }]}>{formatDate(item.date)}</Text>
                <View style={styles.slotsInfo}>
                  <Text style={[styles.slotsText, { color: colors.lightText }]}>
                    {getAvailableSlots(item)} available / {getBookedSlots(item)} booked
                  </Text>
                  <Text style={[styles.statusText, { color: item.is_active ? '#4CAF50' : '#F44336' }]}>
                    {item.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
                  onPress={() => openEditModal(item)}
                >
                  <Ionicons name="pencil" size={16} color="white" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, { 
                    backgroundColor: item.is_active ? '#F44336' : '#4CAF50',
                    marginLeft: 8
                  }]}
                  onPress={() => toggleDateStatus(item)}
                >
                  <Ionicons name={item.is_active ? 'close' : 'checkmark'} size={16} color="white" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color={colors.lightText} />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No delivery dates found
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.lightText }]}>
                {dateFilter !== 'all' 
                  ? `No ${dateFilter} dates found. Try another filter.` 
                  : 'Add dates to create a delivery schedule'}
              </Text>
            </View>
          }
        />
      )}
      
      {/* Modal for adding/editing a delivery date */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={dateModal}
        onRequestClose={() => {
          setDateModal(false);
          setEditMode(false);
          setCurrentDate(null);
          setNewDate(null);
          setNewSlots('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editMode ? 'Edit Delivery Date' : 'Add Delivery Date'}
            </Text>
            
            <TouchableOpacity
              style={[styles.dateSelector, { borderColor: colors.border }]}
              onPress={() => {
                setDateModal(false);
                setTimeout(() => {
                  setCalendarVisible(true);
                }, 100);
              }}
            >
              <Text style={[styles.dateSelectorText, { color: newDate ? colors.text : colors.lightText }]}>
                {newDate ? formatDate(newDate) : 'Select a date'}
              </Text>
            </TouchableOpacity>
            
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="Number of delivery slots"
              placeholderTextColor={colors.lightText}
              keyboardType="number-pad"
              value={newSlots}
              onChangeText={setNewSlots}
            />
            
            <View style={styles.modalButtons}>
              <Button 
                title="Cancel" 
                onPress={() => {
                  setDateModal(false);
                  setEditMode(false);
                  setCurrentDate(null);
                  setNewDate(null);
                  setNewSlots('');
                }}
                style={styles.modalButton}
                variant="outline"
              />
              <Button 
                title={editMode ? "Update" : "Add"} 
                onPress={editMode ? updateDeliveryDate : addDeliveryDate}
                style={styles.modalButton}
                disabled={loading}
              />
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Calendar Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={calendarVisible}
        onRequestClose={() => {
          setCalendarVisible(false);
          // Reopen the date modal
          setTimeout(() => {
            setDateModal(true);
          }, 100);
        }}
        presentationStyle="overFullScreen"
      >
        <View style={styles.calendarModalOverlay}>
          <View style={[styles.calendarContainer, { backgroundColor: colors.card }]}>
            <View style={styles.calendarHeader}>
              <Text style={[styles.calendarTitle, { color: colors.text }]}>Select Delivery Date</Text>
              <TouchableOpacity onPress={() => {
                setCalendarVisible(false);
                // Reopen the date modal
                setTimeout(() => {
                  setDateModal(true);
                }, 100);
              }}>
                <Text style={[styles.closeButton, { color: colors.primary }]}>Close</Text>
              </TouchableOpacity>
            </View>
            
            <Calendar
              onDayPress={handleDateSelect}
              markedDates={getMarkedDates()}
              minDate={!editMode ? new Date().toISOString().split('T')[0] : undefined}
              enableSwipeMonths={true}
              hideArrows={false}
              disableMonthChange={false}
              monthFormat={'MMMM yyyy'}
              theme={{
                calendarBackground: colors.card,
                textSectionTitleColor: colors.text,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: '#ffffff',
                todayTextColor: colors.primary,
                dayTextColor: colors.text,
                textDisabledColor: colors.lightText,
                dotColor: colors.primary,
                arrowColor: colors.primary,
                monthTextColor: colors.text,
                disabledArrowColor: colors.lightText,
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
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  filterButtonText: {
    fontWeight: '500',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  addButton: {
    height: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  dateCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  dateInfo: {
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  slotsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slotsText: {
    fontSize: 14,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 16,
  },
  modalContent: {
    width: '90%',
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
  dateSelector: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  dateSelectorText: {
    fontSize: 16,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  calendarModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 16,
  },
  calendarContainer: {
    width: '100%',
    maxWidth: 450,
    borderRadius: 12,
    padding: 10,
    backgroundColor: 'white',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
}); 