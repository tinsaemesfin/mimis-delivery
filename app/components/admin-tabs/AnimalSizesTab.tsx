import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/Button';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { createShadow } from '@/utils/styling';
import { supabase } from '@/utils/supabase';

type Size = {
  id: string;
  name: string;
  description: string;
};

type AnimalSizeOption = {
  id: string;
  animalId: string;
  sizeId: string;
  description: string;
  isActive: boolean;
};

type Animal = {
  id: string;
  name: string;
};

export default function AnimalSizesTab() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [editingOption, setEditingOption] = useState<AnimalSizeOption | null>(null);
  const [localAnimals, setLocalAnimals] = useState<Animal[]>([]);
  const [localSizes, setLocalSizes] = useState<Size[]>([]);
  const [animalSizeOptions, setAnimalSizeOptions] = useState<AnimalSizeOption[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setIsLoading(true);

      // Fetch animals
      const { data: animalsData, error: animalsError } = await supabase
        .from('animals')
        .select('*')
        .eq('is_active', true);

      if (animalsError) throw animalsError;

      if (animalsData) {
        setLocalAnimals(animalsData.map(animal => ({
          id: animal.id,
          name: animal.title
        })));
      }

      // Fetch sizes
      const { data: sizesData, error: sizesError } = await supabase
        .from('sizes')
        .select('*');

      if (sizesError) throw sizesError;

      if (sizesData) {
        setLocalSizes(sizesData.map(size => ({
          id: size.id,
          name: size.name,
          description: size.description || ''
        })));
      }

      // Fetch animal size options
      const { data: optionsData, error: optionsError } = await supabase
        .from('animal_size_options')
        .select('*')
        .order('created_at', { ascending: false });

      if (optionsError) throw optionsError;

      if (optionsData) {
        const formattedData = optionsData.map(item => ({
          id: item.id,
          animalId: item.animal_id,
          sizeId: item.size_id,
          description: item.description,
          isActive: item.is_active
        }));
        setAnimalSizeOptions(formattedData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (option: AnimalSizeOption) => {
    setDescription(option.description);
    setIsActive(option.isActive);
    setEditingOption(option);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!editingOption) return;

    try {
      const { error } = await supabase
        .from('animal_size_options')
        .update({
          description,
          is_active: isActive,
        })
        .eq('id', editingOption.id);

      if (error) throw error;

      // Refresh the data
      await fetchAllData();
      setModalVisible(false);
    } catch (error) {
      console.error('Error saving animal size option:', error);
      Alert.alert('Error', 'Failed to save animal size option');
    }
  };

  const getAnimalName = (animalId: string) => {
    return localAnimals.find((animal) => animal.id === animalId)?.name || 'Unknown Animal';
  };

  const getSizeName = (sizeId: string) => {
    return localSizes.find((size) => size.id === sizeId)?.name || 'Unknown Size';
  };

  const renderItem = ({ item }: { item: AnimalSizeOption }) => (
    <View style={[styles.item, { backgroundColor: colors.card }]}>
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, { color: colors.text }]}>
          {getAnimalName(item.animalId)} - {getSizeName(item.sizeId)}
        </Text>
        <Text style={[styles.itemDescription, { color: colors.text }]}>
          {item.description}
        </Text>
        <View style={styles.itemStatus}>
          <Text style={[styles.statusText, { color: item.isActive ? 'green' : 'red' }]}>
            {item.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}>
          <Ionicons name="pencil" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={animalSizeOptions}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Edit Animal Size
            </Text>

            <View style={styles.readOnlyInfo}>
              <Text style={[styles.label, { color: colors.text }]}>Animal</Text>
              <Text style={[styles.readOnlyText, { color: colors.text }]}>
                {editingOption && getAnimalName(editingOption.animalId)}
              </Text>

              <Text style={[styles.label, { color: colors.text }]}>Size</Text>
              <Text style={[styles.readOnlyText, { color: colors.text }]}>
                {editingOption && getSizeName(editingOption.sizeId)}
              </Text>
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Description</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter description"
              placeholderTextColor={colors.text + '80'}
              multiline
            />

            <View style={styles.switchContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Active</Text>
              <Switch value={isActive} onValueChange={setIsActive} />
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setModalVisible(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Save"
                onPress={handleSave}
                style={styles.modalButton}
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
  },
  header: {
    padding: 16,
  },
  list: {
    padding: 16,
  },
  item: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    ...createShadow(),
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  itemStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  form: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  selectOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  selectedOption: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  selectOptionText: {
    fontSize: 14,
  },
  selectedOptionText: {
    color: 'white',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  readOnlyInfo: {
    marginBottom: 16,
  },
  readOnlyText: {
    fontSize: 16,
    marginBottom: 16,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
}); 