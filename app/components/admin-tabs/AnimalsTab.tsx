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
} from 'react-native';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';
import Button from '../../../components/Button';

interface AnimalItem {
  id: string;
  name: string;
  sizes: string[];
  active: boolean;
}

interface AnimalsTabProps {
  animals: AnimalItem[];
  setAnimals: React.Dispatch<React.SetStateAction<AnimalItem[]>>;
}

export default function AnimalsTab({ animals, setAnimals }: AnimalsTabProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  
  const [modalVisible, setModalVisible] = useState(false);
  const [newAnimalName, setNewAnimalName] = useState('');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  
  // Function to handle adding a new animal
  const handleAddAnimal = () => {
    if (newAnimalName.trim() === '') {
      Alert.alert('Error', 'Please enter an animal name');
      return;
    }
    
    if (selectedSizes.length === 0) {
      Alert.alert('Error', 'Please select at least one size');
      return;
    }
    
    const newAnimal = {
      id: (animals.length + 1).toString(),
      name: newAnimalName,
      sizes: selectedSizes,
      active: true
    };
    
    setAnimals([...animals, newAnimal]);
    setNewAnimalName('');
    setSelectedSizes([]);
    setModalVisible(false);
  };
  
  // Function to toggle animal active status
  const toggleAnimalStatus = (id: string) => {
    setAnimals(
      animals.map(animal => 
        animal.id === id ? { ...animal, active: !animal.active } : animal
      )
    );
  };
  
  return (
    <View style={styles.tabContent}>
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Manage Animals</Text>
        <Button 
          title="Add Animal" 
          onPress={() => setModalVisible(true)}
          style={styles.addButton}
          variant="primary"
        />
      </View>
      
      <FlatList
        data={animals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.itemMainInfo}>
              <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
              <View style={styles.sizesContainer}>
                {item.sizes.map((size, index) => (
                  <View key={index} style={[styles.sizeTag, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.sizeText, { color: colors.primary }]}>{size}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.itemActions}>
              <Text style={{ color: item.active ? '#4CAF50' : '#F44336', marginRight: 8 }}>
                {item.active ? 'Active' : 'Inactive'}
              </Text>
              <TouchableOpacity 
                style={[styles.toggleButton, { backgroundColor: item.active ? '#F44336' : '#4CAF50' }]}
                onPress={() => toggleAnimalStatus(item.id)}
              >
                <Text style={styles.toggleButtonText}>
                  {item.active ? 'Deactivate' : 'Activate'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />
      
      {/* Modal for adding a new animal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add New Animal</Text>
            
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="Animal Name"
              placeholderTextColor={colors.lightText}
              value={newAnimalName}
              onChangeText={setNewAnimalName}
            />
            
            <Text style={[styles.modalLabel, { color: colors.text }]}>Available Sizes:</Text>
            
            <View style={styles.sizesSelectionContainer}>
              {['Small', 'Medium', 'Large'].map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.sizeSelectButton,
                    { 
                      backgroundColor: selectedSizes.includes(size) ? colors.primary : 'transparent',
                      borderColor: colors.primary
                    }
                  ]}
                  onPress={() => {
                    if (selectedSizes.includes(size)) {
                      setSelectedSizes(selectedSizes.filter(s => s !== size));
                    } else {
                      setSelectedSizes([...selectedSizes, size]);
                    }
                  }}
                >
                  <Text 
                    style={[
                      styles.sizeSelectText, 
                      { color: selectedSizes.includes(size) ? 'white' : colors.primary }
                    ]}
                  >
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.modalButtons}>
              <Button 
                title="Cancel" 
                onPress={() => setModalVisible(false)}
                style={styles.modalButton}
                variant="outline"
              />
              <Button 
                title="Add" 
                onPress={handleAddAnimal}
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
  itemCard: {
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
  itemMainInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  sizesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sizeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginTop: 4,
  },
  sizeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '500',
    alignSelf: 'flex-start',
    marginBottom: 10,
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
  sizesSelectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  sizeSelectButton: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
  },
  sizeSelectText: {
    fontSize: 14,
    fontWeight: '500',
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
}); 