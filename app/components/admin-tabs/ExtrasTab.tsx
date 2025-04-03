import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../utils/supabase';
import Button from '../../../components/Button';

interface Extra {
  id: string;
  title: string;
  description: string;
  price: number;
  is_active: boolean;
}

interface ExtrasTabProps {
  extras: Extra[];
  setExtras: React.Dispatch<React.SetStateAction<Extra[]>>;
}

export default function ExtrasTab({ extras, setExtras }: ExtrasTabProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [modalVisible, setModalVisible] = useState(false);
  const [newExtra, setNewExtra] = useState({
    title: '',
    description: '',
    price: ''
  });
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const handleAddExtra = async () => {
    if (newExtra.title.trim() === '') {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (isNaN(Number(newExtra.price)) || Number(newExtra.price) <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('extras')
        .insert([{
          title: newExtra.title.trim(),
          description: newExtra.description.trim(),
          price: Number(newExtra.price)
        }])
        .select()
        .single();

      if (error) throw error;

      setExtras([...extras, data]);
      setNewExtra({ title: '', description: '', price: '' });
      setModalVisible(false);
      Alert.alert('Success', 'Extra added successfully');
    } catch (error) {
      console.error('Error adding extra:', error);
      Alert.alert('Error', 'Failed to add extra. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleExtraStatus = async (id: string) => {
    const extra = extras.find(e => e.id === id);
    if (!extra) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('extras')
        .update({ is_active: !extra.is_active })
        .eq('id', id);

      if (error) throw error;

      setExtras(extras.map(e => 
        e.id === id ? { ...e, is_active: !e.is_active } : e
      ));
    } catch (error) {
      console.error('Error updating extra status:', error);
      Alert.alert('Error', 'Failed to update extra status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const filteredExtras = extras.filter(extra => {
    if (filter === 'all') return true;
    if (filter === 'active') return extra.is_active;
    return !extra.is_active;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Extras</Text>
        <Button
          title="Add Extra"
          onPress={() => setModalVisible(true)}
          variant="primary"
        />
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'all' && { backgroundColor: colors.primary }
          ]}
          onPress={() => setFilter('all')}
        >
          <Text style={[
            styles.filterButtonText,
            filter === 'all' && { color: 'white' }
          ]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'active' && { backgroundColor: colors.primary }
          ]}
          onPress={() => setFilter('active')}
        >
          <Text style={[
            styles.filterButtonText,
            filter === 'active' && { color: 'white' }
          ]}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'inactive' && { backgroundColor: colors.primary }
          ]}
          onPress={() => setFilter('inactive')}
        >
          <Text style={[
            styles.filterButtonText,
            filter === 'inactive' && { color: 'white' }
          ]}>Inactive</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      <FlatList
        data={filteredExtras}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.extraItem, { backgroundColor: colors.card }]}>
            <View style={styles.extraInfo}>
              <Text style={[styles.extraTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.extraDescription, { color: colors.lightText }]}>
                {item.description}
              </Text>
              <Text style={[styles.extraPrice, { color: colors.primary }]}>
                {formatPrice(item.price)}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.statusButton,
                { backgroundColor: item.is_active ? colors.primary : colors.border }
              ]}
              onPress={() => toggleExtraStatus(item.id)}
            >
              <Text style={styles.statusButtonText}>
                {item.is_active ? 'Active' : 'Inactive'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add New Extra</Text>
            
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Title"
              placeholderTextColor={colors.lightText}
              value={newExtra.title}
              onChangeText={(text) => setNewExtra(prev => ({ ...prev, title: text }))}
            />
            
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Description"
              placeholderTextColor={colors.lightText}
              value={newExtra.description}
              onChangeText={(text) => setNewExtra(prev => ({ ...prev, description: text }))}
              multiline
            />
            
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Price"
              placeholderTextColor={colors.lightText}
              value={newExtra.price}
              onChangeText={(text) => setNewExtra(prev => ({ ...prev, price: text }))}
              keyboardType="decimal-pad"
            />
            
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => {
                  setNewExtra({ title: '', description: '', price: '' });
                  setModalVisible(false);
                }}
                variant="outline"
              />
              <Button
                title="Add"
                onPress={handleAddExtra}
                variant="primary"
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  extraItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  extraInfo: {
    flex: 1,
    marginRight: 16,
  },
  extraTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  extraDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  extraPrice: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    alignItems: 'center',
  },
  filterButtonText: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
}); 