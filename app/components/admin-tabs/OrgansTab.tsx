import React, { useState, useEffect } from 'react';
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

interface Organ {
  id: string;
  name: string;
  is_active: boolean;
}

interface OrgansTabProps {
  organs: Organ[];
  setOrgans: React.Dispatch<React.SetStateAction<Organ[]>>;
}

export default function OrgansTab({ organs, setOrgans }: OrgansTabProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [modalVisible, setModalVisible] = useState(false);
  const [newOrganName, setNewOrganName] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch organs when component mounts
  useEffect(() => {
    fetchOrgans();
  }, []);

  const fetchOrgans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('organs')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      if (data) {
        setOrgans(data);
      }
    } catch (error) {
      console.error('Error fetching organs:', error);
      Alert.alert('Error', 'Failed to fetch organs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrgan = async () => {
    if (newOrganName.trim() === '') {
      Alert.alert('Error', 'Please enter an organ name');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('organs')
        .insert([{
          name: newOrganName.trim(),
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setOrgans(current => [...current, data]);
        setNewOrganName('');
        setModalVisible(false);
        Alert.alert('Success', 'Organ added successfully');
      }
    } catch (error) {
      console.error('Error adding organ:', error);
      Alert.alert('Error', 'Failed to add organ. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleOrganStatus = async (id: string) => {
    const organ = organs.find(o => o.id === id);
    if (!organ) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('organs')
        .update({ is_active: !organ.is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setOrgans(current =>
          current.map(o => (o.id === id ? data : o))
        );
      }
    } catch (error) {
      console.error('Error updating organ status:', error);
      Alert.alert('Error', 'Failed to update organ status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Organ }) => (
    <View style={[styles.organItem, { backgroundColor: colors.card }]}>
      <Text style={[styles.organName, { color: colors.text }]}>{item.name}</Text>
      <TouchableOpacity
        style={[
          styles.statusButton,
          { backgroundColor: item.is_active ? colors.primary : colors.border }
        ]}
        onPress={() => toggleOrganStatus(item.id)}
      >
        <Text style={styles.statusButtonText}>
          {item.is_active ? 'Active' : 'Inactive'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Organs</Text>
        <Button
          title="Add Organ"
          onPress={() => setModalVisible(true)}
          variant="primary"
        />
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      <FlatList
        data={organs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshing={loading}
        onRefresh={fetchOrgans}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add New Organ</Text>
            
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Organ Name"
              placeholderTextColor={colors.lightText}
              value={newOrganName}
              onChangeText={setNewOrganName}
            />
            
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => {
                  setNewOrganName('');
                  setModalVisible(false);
                }}
                variant="outline"
              />
              <Button
                title="Add"
                onPress={handleAddOrgan}
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
  organItem: {
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
  organName: {
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
}); 