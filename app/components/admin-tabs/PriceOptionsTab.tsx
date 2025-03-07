import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  SafeAreaView,
  ScrollView,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';

interface PriceOption {
  id: string;
  animalId: string;
  animalSize: string;
  name: string;
  price: number;
  description: string;
  isActive: boolean;
}

interface Animal {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
  sizes: string[];
}

interface PriceOptionsTabProps {
  animals: Animal[];
  priceOptions: PriceOption[];
  setPriceOptions: React.Dispatch<React.SetStateAction<PriceOption[]>>;
}

export default function PriceOptionsTab({ animals, priceOptions, setPriceOptions }: PriceOptionsTabProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPriceOption, setEditingPriceOption] = useState<PriceOption | null>(null);
  
  // Form state
  const [selectedAnimal, setSelectedAnimal] = useState<string>("");
  const [selectedAnimalSize, setSelectedAnimalSize] = useState<string>("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  
  // Filter states
  const [animalFilter, setAnimalFilter] = useState<string | null>(null);
  const [sizeFilter, setSizeFilter] = useState<string | null>(null);
  
  const resetForm = () => {
    setSelectedAnimal("");
    setSelectedAnimalSize("");
    setName("");
    setPrice("");
    setDescription("");
    setEditingPriceOption(null);
  };
  
  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };
  
  const openEditModal = (priceOption: PriceOption) => {
    setEditingPriceOption(priceOption);
    setSelectedAnimal(priceOption.animalId);
    setSelectedAnimalSize(priceOption.animalSize);
    setName(priceOption.name);
    setPrice(priceOption.price.toString());
    setDescription(priceOption.description);
    setModalVisible(true);
  };
  
  const handleSave = () => {
    if (!selectedAnimal || !selectedAnimalSize || !name || !price) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }
    
    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) {
      Alert.alert("Error", "Please enter a valid price.");
      return;
    }
    
    if (editingPriceOption) {
      // Update existing price option
      setPriceOptions(prevOptions => 
        prevOptions.map(option => 
          option.id === editingPriceOption.id 
            ? {
                ...option,
                animalId: selectedAnimal,
                animalSize: selectedAnimalSize,
                name,
                price: priceValue,
                description
              } 
            : option
        )
      );
    } else {
      // Add new price option
      const newPriceOption: PriceOption = {
        id: Date.now().toString(),
        animalId: selectedAnimal,
        animalSize: selectedAnimalSize,
        name,
        price: priceValue,
        description,
        isActive: true
      };
      
      setPriceOptions(prevOptions => [...prevOptions, newPriceOption]);
    }
    
    setModalVisible(false);
    resetForm();
  };
  
  const togglePriceOptionStatus = (id: string) => {
    setPriceOptions(prevOptions => 
      prevOptions.map(option => 
        option.id === id ? { ...option, isActive: !option.isActive } : option
      )
    );
  };
  
  const deletePriceOption = (id: string) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this price option?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            setPriceOptions(prevOptions => prevOptions.filter(option => option.id !== id));
          }
        }
      ]
    );
  };
  
  const getAnimalName = (animalId: string) => {
    const animal = animals.find(a => a.id === animalId);
    return animal ? animal.title : "Unknown";
  };
  
  const filterPriceOptions = () => {
    let filtered = [...priceOptions];
    
    if (animalFilter) {
      filtered = filtered.filter(option => option.animalId === animalFilter);
    }
    
    if (sizeFilter) {
      filtered = filtered.filter(option => option.animalSize === sizeFilter);
    }
    
    return filtered;
  };
  
  const renderPriceOptionItem = ({ item }: { item: PriceOption }) => {
    return (
      <View style={[styles.optionCard, { backgroundColor: colors.card }]}>
        <View style={styles.optionHeader}>
          <View>
            <Text style={[styles.optionName, { color: colors.text }]}>{item.name}</Text>
            <Text style={[styles.optionSubtitle, { color: colors.lightText }]}>
              {getAnimalName(item.animalId)} - {item.animalSize.charAt(0).toUpperCase() + item.animalSize.slice(1)}
            </Text>
          </View>
          
          <Text style={[styles.optionPrice, { color: colors.primary }]}>
            ${item.price}
          </Text>
        </View>
        
        {item.description && (
          <Text style={[styles.optionDescription, { color: colors.lightText }]}>
            {item.description}
          </Text>
        )}
        
        <View style={styles.optionActions}>
          <View style={styles.statusContainer}>
            <Text style={[styles.statusLabel, { color: colors.lightText }]}>
              {item.isActive ? "Active" : "Inactive"}
            </Text>
            <Switch
              value={item.isActive}
              onValueChange={() => togglePriceOptionStatus(item.id)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.card }]}
              onPress={() => openEditModal(item)}
            >
              <Ionicons name="pencil" size={16} color={colors.text} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.card }]}
              onPress={() => deletePriceOption(item.id)}
            >
              <Ionicons name="trash" size={16} color="red" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };
  
  const renderAnimalFilterItem = ({ item }: { item: Animal }) => (
    <TouchableOpacity
      style={[
        styles.filterItem, 
        animalFilter === item.id && styles.activeFilterItem,
        { 
          backgroundColor: animalFilter === item.id ? colors.primary : colors.card,
          borderColor: colors.border 
        }
      ]}
      onPress={() => {
        setAnimalFilter(animalFilter === item.id ? null : item.id);
        setSizeFilter(null);
      }}
    >
      <Text 
        style={[
          styles.filterText, 
          { color: animalFilter === item.id ? 'white' : colors.text }
        ]}
      >
        {item.title}
      </Text>
    </TouchableOpacity>
  );
  
  const renderSizeFilterItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.filterItem, 
        sizeFilter === item && styles.activeFilterItem,
        { 
          backgroundColor: sizeFilter === item ? colors.primary : colors.card,
          borderColor: colors.border 
        }
      ]}
      onPress={() => setSizeFilter(sizeFilter === item ? null : item)}
    >
      <Text 
        style={[
          styles.filterText, 
          { color: sizeFilter === item ? 'white' : colors.text }
        ]}
      >
        {item.charAt(0).toUpperCase() + item.slice(1)}
      </Text>
    </TouchableOpacity>
  );
  
  // Get unique sizes from all animals
  const getUniqueSizes = () => {
    const sizes = new Set<string>();
    animals.forEach(animal => {
      animal.sizes.forEach(size => sizes.add(size));
    });
    return Array.from(sizes);
  };
  
  // Get sizes for selected animal in modal
  const getSelectedAnimalSizes = () => {
    if (!selectedAnimal) return [];
    const animal = animals.find(a => a.id === selectedAnimal);
    return animal ? animal.sizes : [];
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Price Options</Text>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={openAddModal}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.filterSection}>
        <Text style={[styles.filterTitle, { color: colors.text }]}>Filter by Animal:</Text>
        <FlatList
          data={animals.filter(animal => animal.isActive)}
          renderItem={renderAnimalFilterItem}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterList}
        />
      </View>
      
      {animalFilter && (
        <View style={styles.filterSection}>
          <Text style={[styles.filterTitle, { color: colors.text }]}>Filter by Size:</Text>
          <FlatList
            data={animals.find(a => a.id === animalFilter)?.sizes || []}
            renderItem={renderSizeFilterItem}
            keyExtractor={item => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterList}
          />
        </View>
      )}
      
      <FlatList
        data={filterPriceOptions()}
        renderItem={renderPriceOptionItem}
        keyExtractor={item => item.id}
        style={styles.optionsList}
        contentContainerStyle={styles.optionsListContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.lightText }]}>
              No price options found. Add your first price option!
            </Text>
          </View>
        }
      />
      
      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingPriceOption ? 'Edit Price Option' : 'Add Price Option'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.formContainer}>
              <Text style={[styles.inputLabel, { color: colors.lightText }]}>Animal Type *</Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <FlatList
                  data={animals.filter(animal => animal.isActive)}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.pickerItem,
                        selectedAnimal === item.id && styles.selectedPickerItem,
                        { 
                          backgroundColor: selectedAnimal === item.id ? colors.primary : 'transparent',
                        }
                      ]}
                      onPress={() => {
                        setSelectedAnimal(item.id);
                        setSelectedAnimalSize("");
                      }}
                    >
                      <Text 
                        style={[
                          styles.pickerText,
                          { color: selectedAnimal === item.id ? 'white' : colors.text }
                        ]}
                      >
                        {item.title}
                      </Text>
                    </TouchableOpacity>
                  )}
                  keyExtractor={item => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                />
              </View>
              
              {selectedAnimal && (
                <>
                  <Text style={[styles.inputLabel, { color: colors.lightText }]}>Size *</Text>
                  <View style={[styles.pickerContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <FlatList
                      data={getSelectedAnimalSizes()}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={[
                            styles.pickerItem,
                            selectedAnimalSize === item && styles.selectedPickerItem,
                            { 
                              backgroundColor: selectedAnimalSize === item ? colors.primary : 'transparent',
                            }
                          ]}
                          onPress={() => setSelectedAnimalSize(item)}
                        >
                          <Text 
                            style={[
                              styles.pickerText,
                              { color: selectedAnimalSize === item ? 'white' : colors.text }
                            ]}
                          >
                            {item.charAt(0).toUpperCase() + item.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      )}
                      keyExtractor={item => item}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    />
                  </View>
                </>
              )}
              
              <Text style={[styles.inputLabel, { color: colors.lightText }]}>Package Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Premium Package"
                placeholderTextColor={colors.lightText}
              />
              
              <Text style={[styles.inputLabel, { color: colors.lightText }]}>Price ($) *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                value={price}
                onChangeText={setPrice}
                placeholder="0.00"
                placeholderTextColor={colors.lightText}
                keyboardType="decimal-pad"
              />
              
              <Text style={[styles.inputLabel, { color: colors.lightText }]}>Description</Text>
              <TextInput
                style={[
                  styles.input, 
                  styles.textArea, 
                  { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }
                ]}
                value={description}
                onChangeText={setDescription}
                placeholder="Description of what's included in this package"
                placeholderTextColor={colors.lightText}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterSection: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  filterList: {
    flexGrow: 0,
  },
  filterItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  activeFilterItem: {
    borderWidth: 0,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  optionsList: {
    flex: 1,
  },
  optionsListContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  optionCard: {
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  optionPrice: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  optionDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  optionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  formContainer: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  saveButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  pickerContainer: {
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 8,
    marginBottom: 16,
  },
  pickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  selectedPickerItem: {},
  pickerText: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 