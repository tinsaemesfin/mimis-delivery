import React, { useState, useEffect } from 'react';
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
  Switch,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { supabase } from '../../../utils/supabase';

interface PriceOption {
  id: string;
  animal_size_id: string;
  name: string;
  price: number;
  description: string;
  is_active: boolean;
  created_at?: string;
  animal_size_option?: {
    animal: {
      id: string;
      title: string;
    };
    size: {
      id: string;
      name: string;
    };
  };
}

interface Animal {
  id: string;
  title: string;
  description: string;
  is_active: boolean;
  sizes: string[];
}

interface PriceOptionsTabProps {
  animals: Animal[];
  priceOptions: PriceOption[];
  setPriceOptions: React.Dispatch<React.SetStateAction<PriceOption[]>>;
}

export default function PriceOptionsTab({ animals, priceOptions: initialOptions, setPriceOptions: setParentOptions }: PriceOptionsTabProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  
  const [priceOptions, setPriceOptions] = useState<PriceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
  const [nameFilter, setNameFilter] = useState<string | null>(null);
  
  // Fetch price options from Supabase with related data
  const fetchPriceOptions = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const { data, error } = await supabase
        .from('price_options')
        .select(`
          *,
          animal_size_option:animal_size_options(
            animal:animals(id, title),
            size:sizes(id, name)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setPriceOptions(data || []);
      setParentOptions(data || []);
    } catch (err) {
      console.error('Error fetching price options:', err);
      setError('Failed to load price options');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
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
    setSelectedAnimal(priceOption.animal_size_option?.animal?.id || "");
    setSelectedAnimalSize(priceOption.animal_size_option?.size?.id || "");
    setName(priceOption.name);
    setPrice(priceOption.price.toString());
    setDescription(priceOption.description || "");
    setModalVisible(true);
  };
  
  const getSelectedAnimalSizes = () => {
    if (!selectedAnimal) return [];
    
    // Create a map to store unique sizes with their IDs
    const sizeMap = new Map<string, { id: string; name: string }>();
    
    // Get sizes from price options for the selected animal
    priceOptions.forEach(option => {
      if (
        option.animal_size_option?.animal?.id === selectedAnimal &&
        option.animal_size_option?.size?.id &&
        option.animal_size_option?.size?.name
      ) {
        sizeMap.set(option.animal_size_option.size.id, {
          id: option.animal_size_option.size.id,
          name: option.animal_size_option.size.name
        });
      }
    });

    // Get sizes from the animals prop
    const animal = animals.find(a => a.id === selectedAnimal);
    if (animal?.sizes) {
      animal.sizes.forEach((size: string) => {
        if (size) {
          sizeMap.set(size, { id: size, name: size });
        }
      });
    }

    // Convert map to array and sort by name
    return Array.from(sizeMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  };
  
  const checkExistingPriceOption = () => {
    if (!selectedAnimal || !selectedAnimalSize || !name) return false;

    const existingOption = priceOptions.find(option => 
      option.animal_size_option?.animal?.id === selectedAnimal &&
      option.animal_size_option?.size?.id === selectedAnimalSize &&
      option.name.toLowerCase() === name.toLowerCase() &&
      (!editingPriceOption || option.id !== editingPriceOption.id)
    );

    if (existingOption) {
      const status = existingOption.is_active ? "active" : "inactive";
      Alert.alert(
        "Duplicate Price Option",
        `A price option for this animal, size, and package name combination already exists (${status}). Each combination must be unique regardless of active status.\n\nExisting price: $${existingOption.price}`,
        [{ text: "OK" }]
      );
      return true;
    }

    return false;
  };
  
  const handleNameChange = (newName: string) => {
    setName(newName);
    if (selectedAnimal && selectedAnimalSize) {
      const existingOption = priceOptions.find(option => 
        option.animal_size_option?.animal?.id === selectedAnimal &&
        option.animal_size_option?.size?.id === selectedAnimalSize &&
        option.name.toLowerCase() === newName.toLowerCase() &&
        (!editingPriceOption || option.id !== editingPriceOption.id)
      );

      if (existingOption) {
        const status = existingOption.is_active ? "active" : "inactive";
        Alert.alert(
          "Warning",
          `A ${status} price option already exists for this animal and size with the name "${newName}".\n\nExisting price: $${existingOption.price}\n\nPlease either:\n- Choose a different package name\n- Edit the existing price option`,
          [{ text: "OK" }]
        );
      }
    }
  };
  
  const getSuggestedPackageNames = () => {
    const names = new Set<string>();
    priceOptions.forEach(option => {
      if (option.name) {
        names.add(option.name);
      }
    });
    return Array.from(names).sort();
  };
  
  const handleSave = async () => {
    if (!selectedAnimal || !selectedAnimalSize || !name || !price) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }
    
    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) {
      Alert.alert("Error", "Please enter a valid price.");
      return;
    }

    // Check for existing price option with same combination
    const existingOption = priceOptions.find(option => 
      option.animal_size_option?.animal?.id === selectedAnimal &&
      option.animal_size_option?.size?.id === selectedAnimalSize &&
      option.name.toLowerCase() === name.toLowerCase() &&
      (!editingPriceOption || option.id !== editingPriceOption.id)
    );

    if (existingOption) {
      const status = existingOption.is_active ? "active" : "inactive";
      Alert.alert(
        "Error",
        `Cannot save. A ${status} price option already exists for this combination:\n\n` +
        `Animal: ${existingOption.animal_size_option?.animal?.title}\n` +
        `Size: ${existingOption.animal_size_option?.size?.name}\n` +
        `Package: ${existingOption.name}\n` +
        `Price: $${existingOption.price}\n\n` +
        `Please either:\n` +
        `- Choose a different combination\n` +
        `- Edit the existing price option`,
        [{ text: "OK" }]
      );
      return;
    }
    
    try {
      setLoading(true);
      
      // First, get or create the animal_size_option
      const { data: animalSizeOption, error: animalSizeError } = await supabase
        .from('animal_size_options')
        .select('id')
        .eq('animal_id', selectedAnimal)
        .eq('size_id', selectedAnimalSize)
        .single();
      
      if (animalSizeError && animalSizeError.code !== 'PGRST116') {
        throw animalSizeError;
      }
      
      let animalSizeId = animalSizeOption?.id;
      
      if (!animalSizeId) {
        const { data: newAnimalSize, error: insertError } = await supabase
          .from('animal_size_options')
          .insert([{
            animal_id: selectedAnimal,
            size_id: selectedAnimalSize,
            is_active: true
          }])
          .select('id')
          .single();
        
        if (insertError) throw insertError;
        animalSizeId = newAnimalSize.id;
      }
      
      const priceOptionData = {
        animal_size_id: animalSizeId,
        name,
        price: priceValue,
        description,
        is_active: true
      };
      
      if (editingPriceOption) {
        // Update existing price option
        const { error } = await supabase
          .from('price_options')
          .update(priceOptionData)
          .eq('id', editingPriceOption.id);
        
        if (error) throw error;
        Alert.alert('Success', 'Price option updated successfully');
      } else {
        // Add new price option
        const { error } = await supabase
          .from('price_options')
          .insert([priceOptionData]);
        
        if (error) throw error;
        Alert.alert('Success', 'Price option added successfully');
      }
      
      setModalVisible(false);
      resetForm();
      fetchPriceOptions();
    } catch (err) {
      console.error('Error saving price option:', err);
      Alert.alert('Error', 'Failed to save price option');
    } finally {
      setLoading(false);
    }
  };
  
  const togglePriceOptionStatus = async (id: string, currentStatus: boolean) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('price_options')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      fetchPriceOptions();
    } catch (err) {
      console.error('Error toggling price option status:', err);
      Alert.alert('Error', 'Failed to update price option status');
    } finally {
      setLoading(false);
    }
  };
  
  const deletePriceOption = async (id: string) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this price option?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              
              const { error } = await supabase
                .from('price_options')
                .delete()
                .eq('id', id);
              
              if (error) throw error;
              Alert.alert('Success', 'Price option deleted successfully');
              fetchPriceOptions();
            } catch (err) {
              console.error('Error deleting price option:', err);
              Alert.alert('Error', 'Failed to delete price option');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };
  
  const getAnimalName = (priceOption: PriceOption) => {
    return priceOption.animal_size_option?.animal?.title || "Unknown";
  };
  
  const getSizeName = (priceOption: PriceOption) => {
    return priceOption.animal_size_option?.size?.name || "Unknown";
  };
  
  // Get unique option names from price options
  const getUniqueOptionNames = () => {
    const names = new Set<string>();
    priceOptions.forEach(option => {
      if (option.name) {
        names.add(option.name);
      }
    });
    return Array.from(names).sort();
  };
  
  const filterPriceOptions = () => {
    let filtered = [...priceOptions];
    
    if (animalFilter) {
      filtered = filtered.filter(option => 
        option.animal_size_option?.animal?.id === animalFilter
      );
    }
    
    if (sizeFilter) {
      filtered = filtered.filter(option => 
        option.animal_size_option?.size?.id === sizeFilter
      );
    }
    
    if (nameFilter) {
      filtered = filtered.filter(option => 
        option.name.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }
    
    return filtered;
  };
  
  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchPriceOptions();
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchPriceOptions();
  }, []);
  
  const renderPriceOptionItem = ({ item }: { item: PriceOption }) => {
    return (
      <View style={[styles.optionCard, { backgroundColor: colors.card }]}>
        <View style={styles.optionHeader}>
          <View>
            <Text style={[styles.optionName, { color: colors.text }]}>{item.name}</Text>
            <Text style={[styles.optionSubtitle, { color: colors.lightText }]}>
              {getAnimalName(item)} - {getSizeName(item)}
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
              {item.is_active ? "Active" : "Inactive"}
            </Text>
            <Switch
              value={item.is_active}
              onValueChange={() => togglePriceOptionStatus(item.id, item.is_active)}
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
  
  const renderSizeFilterItem = ({ item }: { item: { id: string; name: string } }) => (
    <TouchableOpacity
      style={[
        styles.filterItem, 
        sizeFilter === item.id && styles.activeFilterItem,
        { 
          backgroundColor: sizeFilter === item.id ? colors.primary : colors.card,
          borderColor: colors.border 
        }
      ]}
      onPress={() => setSizeFilter(sizeFilter === item.id ? null : item.id)}
    >
      <Text 
        style={[
          styles.filterText, 
          { color: sizeFilter === item.id ? 'white' : colors.text }
        ]}
      >
        {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
      </Text>
    </TouchableOpacity>
  );
  
  // Get unique sizes from all animals
  const getUniqueSizes = () => {
    if (!animalFilter) return [];
    
    // Create a map to store unique sizes with their IDs
    const sizeMap = new Map<string, { id: string; name: string }>();
    
    // Get sizes from price options for the selected animal
    priceOptions.forEach(option => {
      if (
        option.animal_size_option?.animal?.id === animalFilter &&
        option.animal_size_option?.size?.id &&
        option.animal_size_option?.size?.name
      ) {
        sizeMap.set(option.animal_size_option.size.id, {
          id: option.animal_size_option.size.id,
          name: option.animal_size_option.size.name
        });
      }
    });

    // If no sizes found in price options, get them from the animals prop
    if (sizeMap.size === 0) {
      const selectedAnimal = animals.find(a => a.id === animalFilter);
      if (selectedAnimal?.sizes) {
        selectedAnimal.sizes.forEach(size => {
          if (size) {
            sizeMap.set(size, { id: size, name: size });
          }
        });
      }
    }

    // Convert map to array and sort by name
    return Array.from(sizeMap.values()).sort((a, b) => a.name.localeCompare(b.name));
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
          data={animals.filter(animal => animal.is_active)}
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
            data={getUniqueSizes()}
            renderItem={renderSizeFilterItem}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterList}
          />
        </View>
      )}
      
      <View style={styles.filterSection}>
        <Text style={[styles.filterTitle, { color: colors.text }]}>Filter by Package Name:</Text>
        <FlatList
          data={getUniqueOptionNames()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterItem, 
                nameFilter === item && styles.activeFilterItem,
                { 
                  backgroundColor: nameFilter === item ? colors.primary : colors.card,
                  borderColor: colors.border 
                }
              ]}
              onPress={() => setNameFilter(nameFilter === item ? null : item)}
            >
              <Text 
                style={[
                  styles.filterText, 
                  { color: nameFilter === item ? 'white' : colors.text }
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={item => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterList}
        />
      </View>
      
      <FlatList
        data={filterPriceOptions()}
        renderItem={renderPriceOptionItem}
        keyExtractor={item => item.id}
        style={styles.optionsList}
        contentContainerStyle={styles.optionsListContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.lightText }]}>
              {loading ? 'Loading price options...' : 'No price options found. Add your first price option!'}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
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
                  data={animals.filter(animal => animal.is_active)}
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
                <View>
                  <Text style={[styles.inputLabel, { color: colors.lightText }]}>Size *</Text>
                  <View style={[styles.pickerContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <FlatList
                      data={getSelectedAnimalSizes()}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={[
                            styles.pickerItem,
                            selectedAnimalSize === item.id && styles.selectedPickerItem,
                            { 
                              backgroundColor: selectedAnimalSize === item.id ? colors.primary : 'transparent',
                            }
                          ]}
                          onPress={() => setSelectedAnimalSize(item.id)}
                        >
                          <Text 
                            style={[
                              styles.pickerText,
                              { color: selectedAnimalSize === item.id ? 'white' : colors.text }
                            ]}
                          >
                            {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      )}
                      keyExtractor={item => item.id}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    />
                  </View>
                </View>
              )}
              
              <Text style={[styles.inputLabel, { color: colors.lightText }]}>Package Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                value={name}
                onChangeText={handleNameChange}
                placeholder="e.g. Premium Package"
                placeholderTextColor={colors.lightText}
              />

              {/* Package Name Suggestions */}
              {name.length > 0 && (
                <View style={[styles.suggestionsContainer, { backgroundColor: colors.card }]}>
                  <FlatList
                    data={getSuggestedPackageNames().filter(n => 
                      n.toLowerCase().includes(name.toLowerCase()) &&
                      n.toLowerCase() !== name.toLowerCase()
                    )}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.suggestionItem}
                        onPress={() => handleNameChange(item)}
                      >
                        <Text style={[styles.suggestionText, { color: colors.text }]}>{item}</Text>
                      </TouchableOpacity>
                    )}
                    keyExtractor={item => item}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                  />
                </View>
              )}
              
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
  suggestionsContainer: {
    marginTop: -12,
    marginBottom: 16,
    padding: 8,
    borderRadius: 8,
  },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  suggestionText: {
    fontSize: 14,
  },
}); 