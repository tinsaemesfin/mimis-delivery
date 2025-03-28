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
  RefreshControl,
  Image,
  Platform,
} from 'react-native';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';
import Button from '../../../components/Button';
import { supabase } from '../../../utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

interface AnimalItem {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  is_active: boolean;
  sizes?: string[];
}

interface AnimalsTabProps {
  animals: AnimalItem[];
  setAnimals: React.Dispatch<React.SetStateAction<AnimalItem[]>>;
}

// Add image upload function
const uploadImage = async (base64Image: string, path: string) => {
  try {
    const { data, error } = await supabase.storage
      .from('mimis-storage')
      .upload(path, decode(base64Image), {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('mimis-storage')
      .getPublicUrl(path);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Add function to get image URL
const getImageUrl = (path: string | null): string | undefined => {
  if (!path) return undefined;
  
  // If the path is already a full URL, return it
  if (path.startsWith('http')) {
    return path;
  }
  
  // Otherwise, generate the public URL
  const { data: { publicUrl } } = supabase.storage
    .from('mimis-storage')
    .getPublicUrl(path);
    
  return publicUrl;
};

export default function AnimalsTab({ animals: initialAnimals, setAnimals: setParentAnimals }: AnimalsTabProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  
  const [animals, setAnimals] = useState<AnimalItem[]>([]);
  const [filteredAnimals, setFilteredAnimals] = useState<AnimalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [sizes, setSizes] = useState<{ id: string; name: string }[]>([]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentAnimal, setCurrentAnimal] = useState<AnimalItem | null>(null);
  const [newAnimalName, setNewAnimalName] = useState('');
  const [newAnimalDescription, setNewAnimalDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Fetch animals from Supabase
  const fetchAnimals = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const { data, error } = await supabase
        .from('animals')
        .select('*')
        .order('title', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      // Transform the data to match our component's expectations
      const transformedData = data.map(animal => ({
        id: animal.id,
        title: animal.title,
        description: animal.description,
        image_url: animal.image_url,
        is_active: animal.is_active
      }));
      
      setAnimals(transformedData);
      setParentAnimals(transformedData);
      applyFilters(transformedData, searchQuery, showActiveOnly);
    } catch (err) {
      console.error('Error fetching animals:', err);
      setError('Failed to load animals');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Apply filters to the animals list
  const applyFilters = (animalsList: AnimalItem[], query: string, activeOnly: boolean) => {
    let filtered = [...animalsList];
    
    // Filter by search query
    if (query.trim() !== '') {
      const searchTerms = query.toLowerCase().trim().split(' ');
      filtered = filtered.filter(animal => 
        searchTerms.every(term => 
          animal.title.toLowerCase().includes(term) ||
          (animal.description && animal.description.toLowerCase().includes(term))
        )
      );
    }
    
    // Filter by active status
    if (activeOnly) {
      filtered = filtered.filter(animal => animal.is_active);
    }
    
    setFilteredAnimals(filtered);
  };
  
  // Add image picker function
  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setSelectedImage(result.assets[0].base64);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };
  
  // Add function to fetch sizes
  const fetchSizes = async () => {
    try {
      console.log('Fetching sizes...');
      const { data, error } = await supabase
        .from('sizes')
        .select('*');

      if (error) throw error;

      if (data) {
        console.log('Fetched sizes:', data);
        setSizes(data.map(size => ({
          id: size.id,
          name: size.name
        })));
      }
    } catch (error) {
      console.error('Error fetching sizes:', error);
    }
  };
  
  // Update useEffect to fetch sizes
  useEffect(() => {
    fetchAnimals();
    fetchSizes();
  }, []);
  
  // Update addAnimal function
  const addAnimal = async () => {
    if (newAnimalName.trim() === '') {
      Alert.alert('Error', 'Please enter an animal name');
      return;
    }

    try {
      setLoading(true);
      let imageUrl = null;

      // Upload image if selected
      if (selectedImage) {
        setUploadingImage(true);
        const path = `${Date.now()}-${newAnimalName.toLowerCase().replace(/\s+/g, '-')}.jpg`;
        imageUrl = await uploadImage(selectedImage, path);
      }

      console.log('Creating new animal...');
      const newAnimal = {
        title: newAnimalName.trim(),
        description: newAnimalDescription.trim(),
        is_active: true,
        image_url: imageUrl,
      };

      // Insert the new animal
      const { data: animalData, error: animalError } = await supabase
        .from('animals')
        .insert([newAnimal])
        .select()
        .single();

      if (animalError) {
        console.error('Error creating animal:', animalError);
        throw animalError;
      }

      console.log('Created animal:', animalData);
      console.log('Current sizes:', sizes);

      // Create animal size options for each size
      if (sizes.length > 0) {
        console.log('Creating animal size options...');
        const animalSizeOptions = sizes.map(size => ({
          animal_id: animalData.id,
          size_id: size.id,
          description: `${size.name} ${newAnimalName.trim()}`,
          is_active: true
        }));

        console.log('Animal size options to create:', animalSizeOptions);

        const { data: optionsData, error: optionsError } = await supabase
          .from('animal_size_options')
          .insert(animalSizeOptions)
          .select();

        if (optionsError) {
          console.error('Error creating animal size options:', optionsError);
          throw optionsError;
        }

        console.log('Created animal size options:', optionsData);
      } else {
        console.warn('No sizes found to create animal size options');
      }

      Alert.alert('Success', 'Animal and size options added successfully');
      setNewAnimalName('');
      setNewAnimalDescription('');
      setSelectedImage(null);
      setModalVisible(false);

      // Refresh the animals list
      fetchAnimals();
    } catch (err) {
      console.error('Error in addAnimal:', err);
      Alert.alert('Error', 'Failed to add animal and size options');
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };
  
  // Update updateAnimal function
  const updateAnimal = async () => {
    if (!currentAnimal) return;

    if (newAnimalName.trim() === '') {
      Alert.alert('Error', 'Please enter an animal name');
      return;
    }

    try {
      setLoading(true);
      let imageUrl = currentAnimal.image_url;

      // Upload new image if selected
      if (selectedImage) {
        setUploadingImage(true);
        const path = `${Date.now()}-${newAnimalName.toLowerCase().replace(/\s+/g, '-')}.jpg`;
        imageUrl = await uploadImage(selectedImage, path);
      }

      const updatedAnimal = {
        title: newAnimalName.trim(),
        description: newAnimalDescription.trim(),
        image_url: imageUrl,
      };

      const { error } = await supabase
        .from('animals')
        .update(updatedAnimal)
        .eq('id', currentAnimal.id);

      if (error) throw error;

      Alert.alert('Success', 'Animal updated successfully');
      setNewAnimalName('');
      setNewAnimalDescription('');
      setSelectedImage(null);
      setModalVisible(false);
      setEditMode(false);
      setCurrentAnimal(null);

      // Refresh the animals list
      fetchAnimals();
    } catch (err) {
      console.error('Error updating animal:', err);
      Alert.alert('Error', 'Failed to update animal');
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };
  
  // Toggle animal active status
  const toggleAnimalStatus = async (animal: AnimalItem) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('animals')
        .update({ is_active: !animal.is_active })
        .eq('id', animal.id);
      
      if (error) {
        throw error;
      }
      
      // Refresh the animals list
      fetchAnimals();
    } catch (err) {
      console.error('Error toggling animal status:', err);
      Alert.alert('Error', 'Failed to update animal status');
    } finally {
      setLoading(false);
    }
  };
  
  // Update openEditModal function
  const openEditModal = (animal: AnimalItem) => {
    setCurrentAnimal(animal);
    setNewAnimalName(animal.title);
    setNewAnimalDescription(animal.description || '');
    setSelectedImage(null); // Reset selected image
    setEditMode(true);
    setModalVisible(true);
  };
  
  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchAnimals();
  };
  
  // Apply filters when search query or active filter changes
  useEffect(() => {
    applyFilters(animals, searchQuery, showActiveOnly);
  }, [searchQuery, showActiveOnly, animals]);
  
  return (
    <View style={styles.tabContent}>
      <View style={styles.searchFilterContainer}>
        <View style={[styles.searchContainer, { borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.lightText} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search animals..."
            placeholderTextColor={colors.lightText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.lightText} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            showActiveOnly && { backgroundColor: colors.primary + '20' }
          ]}
          onPress={() => setShowActiveOnly(!showActiveOnly)}
        >
          <Text style={[
            styles.filterButtonText,
            showActiveOnly && { color: colors.primary }
          ]}>
            {showActiveOnly ? 'Active Only' : 'All Animals'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Manage Animals {filteredAnimals.length > 0 && `(${filteredAnimals.length})`}
        </Text>
        <Button 
          title="Add Animal" 
          onPress={() => {
            setEditMode(false);
            setNewAnimalName('');
            setNewAnimalDescription('');
            setModalVisible(true);
          }}
          style={styles.addButton}
          variant="primary"
        />
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading animals...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <Button title="Retry" onPress={fetchAnimals} style={styles.retryButton} />
        </View>
      ) : (
        <FlatList
          data={filteredAnimals}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity 
                style={styles.itemMainInfo}
                onPress={() => openEditModal(item)}
              >
                <Text style={[styles.itemName, { color: colors.text }]}>{item.title}</Text>
                {item.description && (
                  <Text style={[styles.itemDescription, { color: colors.lightText }]} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
              </TouchableOpacity>
              <View style={styles.itemActions}>
                <Text style={{ color: item.is_active ? '#4CAF50' : '#F44336', marginRight: 8 }}>
                  {item.is_active ? 'Active' : 'Inactive'}
                </Text>
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
                  onPress={() => toggleAnimalStatus(item)}
                >
                  <Ionicons name={item.is_active ? 'close' : 'checkmark'} size={16} color="white" />
                </TouchableOpacity>
              </View>
            </View>
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
              <Ionicons name="alert-circle-outline" size={48} color={colors.lightText} />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No animals found
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.lightText }]}>
                {searchQuery ? 'Try a different search term' : 'Add some animals to get started'}
              </Text>
            </View>
          }
        />
      )}
      
      {/* Modal for adding/editing an animal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setEditMode(false);
          setCurrentAnimal(null);
          setSelectedImage(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editMode ? 'Edit Animal' : 'Add New Animal'}
            </Text>
            
            {/* Image Selection */}
            <TouchableOpacity 
              style={[styles.imageContainer, { borderColor: colors.border }]} 
              onPress={pickImage}
              activeOpacity={0.8}
            >
              {selectedImage ? (
                <Image 
                  source={{ uri: `data:image/jpeg;base64,${selectedImage}` }}
                  style={styles.selectedImage}
                />
              ) : currentAnimal?.image_url ? (
                <Image 
                  source={{ uri: getImageUrl(currentAnimal.image_url) }}
                  style={styles.selectedImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera" size={40} color="#666" />
                  <Text style={styles.imagePlaceholderText}>Tap to add image</Text>
                </View>
              )}
              <View style={[
                styles.imageOverlay,
                (selectedImage || currentAnimal?.image_url) && styles.imageOverlayVisible
              ]}>
                <Text style={styles.imageOverlayText}>
                  {selectedImage || currentAnimal?.image_url ? 'Tap to change' : 'Tap to select'}
                </Text>
              </View>
            </TouchableOpacity>
            
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="Animal Name"
              placeholderTextColor={colors.lightText}
              value={newAnimalName}
              onChangeText={setNewAnimalName}
            />
            
            <TextInput
              style={[styles.textArea, { borderColor: colors.border, color: colors.text }]}
              placeholder="Description (optional)"
              placeholderTextColor={colors.lightText}
              value={newAnimalDescription}
              onChangeText={setNewAnimalDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            <View style={styles.modalButtons}>
              <Button 
                title="Cancel" 
                onPress={() => {
                  setModalVisible(false);
                  setEditMode(false);
                  setCurrentAnimal(null);
                  setSelectedImage(null);
                }}
                style={styles.modalButton}
                variant="outline"
              />
              <Button 
                title={editMode ? "Update" : "Add"} 
                onPress={editMode ? updateAnimal : addAnimal}
                style={styles.modalButton}
                disabled={loading || uploadingImage}
              />
            </View>
            
            {(loading || uploadingImage) && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.text }]}>
                  {uploadingImage ? 'Uploading image...' : 'Processing...'}
                </Text>
              </View>
            )}
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
  searchFilterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  filterButton: {
    marginLeft: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
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
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  itemDescription: {
    fontSize: 14,
  },
  itemActions: {
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
    padding: 20,
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
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  textArea: {
    width: '100%',
    height: 100,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  imageOverlayVisible: {
    opacity: 1,
  },
  imageOverlayText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
}); 