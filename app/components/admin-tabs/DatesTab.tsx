import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';
import Button from '../../../components/Button';
import { format, parseISO, isValid } from 'date-fns';
import { Calendar, DateData } from 'react-native-calendars';

interface DeliveryDate {
  id: string;
  date: string;
  slots: number;
  booked: number;
  active: boolean;
}

interface DatesTabProps {
  deliveryDates: DeliveryDate[];
  setDeliveryDates: React.Dispatch<React.SetStateAction<DeliveryDate[]>>;
}

export default function DatesTab({ deliveryDates, setDeliveryDates }: DatesTabProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  
  const [dateModal, setDateModal] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [newDate, setNewDate] = useState<string | null>(null);
  const [newSlots, setNewSlots] = useState('');
  
  // Function to add a new delivery date
  const handleAddDate = () => {
    if (!newDate) {
      Alert.alert('Error', 'Please select a date');
      return;
    }
    
    if (!newSlots || isNaN(Number(newSlots)) || Number(newSlots) <= 0) {
      Alert.alert('Error', 'Please enter a valid number of slots');
      return;
    }
    
    const dateExists = deliveryDates.some(date => date.date === newDate);
    
    if (dateExists) {
      Alert.alert('Error', 'This date already exists in the schedule');
      return;
    }
    
    const newDeliveryDate: DeliveryDate = {
      id: (deliveryDates.length + 1).toString(),
      date: newDate,
      slots: Number(newSlots),
      booked: 0,
      active: true
    };
    
    setDeliveryDates([...deliveryDates, newDeliveryDate]);
    setNewDate(null);
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
  };
  
  // Calculate available slots
  const getAvailableSlots = (date: DeliveryDate) => {
    return date.slots - date.booked;
  };
  
  // Get marked dates for calendar
  const getMarkedDates = () => {
    const markedDates: any = {};
    
    // Mark existing delivery dates
    deliveryDates.forEach(date => {
      markedDates[date.date] = { 
        marked: true, 
        dotColor: date.active ? '#4CAF50' : '#F44336' 
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
  
  return (
    <View style={styles.tabContent}>
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Delivery Schedule</Text>
        <Button 
          title="Add Date" 
          onPress={() => setDateModal(true)}
          style={styles.addButton}
          variant="primary"
        />
      </View>
      
      <FlatList
        data={deliveryDates}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.dateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.dateInfo}>
              <Text style={[styles.dateText, { color: colors.text }]}>{formatDate(item.date)}</Text>
              <View style={styles.slotsInfo}>
                <Text style={[styles.slotsText, { color: colors.lightText }]}>
                  {getAvailableSlots(item)} available / {item.slots} total
                </Text>
                <Text style={[styles.statusText, { color: item.active ? '#4CAF50' : '#F44336' }]}>
                  {item.active ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.toggleButton, { backgroundColor: item.active ? '#F44336' : '#4CAF50' }]}
              onPress={() => toggleDateStatus(item.id)}
            >
              <Text style={styles.toggleButtonText}>
                {item.active ? 'Deactivate' : 'Activate'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyStateContainer}>
            <Text style={[styles.emptyStateText, { color: colors.lightText }]}>
              No delivery dates scheduled
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: colors.lightText }]}>
              Add dates to create a delivery schedule
            </Text>
          </View>
        }
      />
      
      {/* Modal for adding a new delivery date */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={dateModal}
        onRequestClose={() => setDateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Delivery Date</Text>
            
            <TouchableOpacity
              style={[styles.dateSelector, { borderColor: colors.border }]}
              onPress={() => setCalendarVisible(true)}
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
                  setNewDate(null);
                  setNewSlots('');
                }}
                style={styles.modalButton}
                variant="outline"
              />
              <Button 
                title="Add" 
                onPress={handleAddDate}
                style={styles.modalButton}
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
        onRequestClose={() => setCalendarVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.calendarModal, { backgroundColor: colors.card }]}>
            <View style={styles.calendarHeader}>
              <Text style={[styles.calendarTitle, { color: colors.text }]}>Select Delivery Date</Text>
              <TouchableOpacity onPress={() => setCalendarVisible(false)}>
                <Text style={[styles.closeButton, { color: colors.primary }]}>Close</Text>
              </TouchableOpacity>
            </View>
            
            <Calendar
              onDayPress={handleDateSelect}
              markedDates={getMarkedDates()}
              minDate={new Date().toISOString().split('T')[0]}
              theme={{
                calendarBackground: colors.card,
                textSectionTitleColor: colors.text,
                dayTextColor: colors.text,
                todayTextColor: colors.primary,
                selectedDayTextColor: 'white',
                monthTextColor: colors.text,
                textDisabledColor: colors.lightText,
                arrowColor: colors.primary,
              }}
            />
            
            <Button 
              title="Cancel" 
              onPress={() => setCalendarVisible(false)}
              style={styles.calendarButton}
              variant="outline"
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
  },
  listContent: {
    paddingBottom: 20,
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotsText: {
    fontSize: 14,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  toggleButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 10,
  },
  toggleButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
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
  calendarModal: {
    width: '90%',
    borderRadius: 12,
    padding: 20,
    backgroundColor: 'white',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 16,
    fontWeight: '500',
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
  calendarButton: {
    marginTop: 16,
  },
}); 