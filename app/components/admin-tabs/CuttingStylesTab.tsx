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
} from 'react-native';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';
import Button from '../../../components/Button';
import { supabase } from '../../../utils/supabase';
import { Ionicons } from '@expo/vector-icons';

interface CuttingStyleItem {
  id: string;
  title: string;
  description?: string;
  is_active: boolean;
}

interface CuttingStylesTabProps {
  cuttingStyles: CuttingStyleItem[];
  setCuttingStyles: React.Dispatch<React.SetStateAction<CuttingStyleItem[]>>;
}

export default function CuttingStylesTab({ cuttingStyles: initialStyles, setCuttingStyles: setParentStyles }: CuttingStylesTabProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  
  const [cuttingStyles, setCuttingStyles] = useState<CuttingStyleItem[]>([]);
  const [filteredStyles, setFilteredStyles] = useState<CuttingStyleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentStyle, setCurrentStyle] = useState<CuttingStyleItem | null>(null);
  const [newStyleName, setNewStyleName] = useState('');
  const [newStyleDescription, setNewStyleDescription] = useState('');
  
  // Fetch cutting styles from Supabase
  const fetchCuttingStyles = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const { data, error } = await supabase
        .from('cutting_styles')
        .select('*')
        .order('title', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      // Transform the data to match our component's expectations
      const transformedData = data.map(style => ({
        id: style.id,
        title: style.title,
        description: style.description,
        is_active: style.is_active
      }));
      
      setCuttingStyles(transformedData);
      setParentStyles(transformedData);
      applyFilters(transformedData, searchQuery, showActiveOnly);
    } catch (err) {
      console.error('Error fetching cutting styles:', err);
      setError('Failed to load cutting styles');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Apply filters to the cutting styles list
  const applyFilters = (stylesList: CuttingStyleItem[], query: string, activeOnly: boolean) => {
    let filtered = [...stylesList];
    
    // Filter by search query
    if (query.trim() !== '') {
      const searchTerms = query.toLowerCase().trim().split(' ');
      filtered = filtered.filter(style => 
        searchTerms.every(term => 
          style.title.toLowerCase().includes(term) ||
          (style.description && style.description.toLowerCase().includes(term))
        )
      );
    }
    
    // Filter by active status
    if (activeOnly) {
      filtered = filtered.filter(style => style.is_active);
    }
    
    setFilteredStyles(filtered);
  };
  
  // Add a new cutting style
  const addCuttingStyle = async () => {
    if (newStyleName.trim() === '') {
      Alert.alert('Error', 'Please enter a cutting style name');
      return;
    }
    
    try {
      setLoading(true);
      
      const newStyle = {
        title: newStyleName.trim(),
        description: newStyleDescription.trim() || null,
        is_active: true
      };
      
      const { data, error } = await supabase
        .from('cutting_styles')
        .insert([newStyle])
        .select();
      
      if (error) {
        throw error;
      }
      
      Alert.alert('Success', 'Cutting style added successfully');
      setNewStyleName('');
      setNewStyleDescription('');
      setModalVisible(false);
      
      // Refresh the cutting styles list
      fetchCuttingStyles();
    } catch (err) {
      console.error('Error adding cutting style:', err);
      Alert.alert('Error', 'Failed to add cutting style');
    } finally {
      setLoading(false);
    }
  };
  
  // Update an existing cutting style
  const updateCuttingStyle = async () => {
    if (!currentStyle) return;
    
    if (newStyleName.trim() === '') {
      Alert.alert('Error', 'Please enter a cutting style name');
      return;
    }
    
    try {
      setLoading(true);
      
      const updatedStyle = {
        title: newStyleName.trim(),
        description: newStyleDescription.trim() || null
      };
      
      const { error } = await supabase
        .from('cutting_styles')
        .update(updatedStyle)
        .eq('id', currentStyle.id);
      
      if (error) {
        throw error;
      }
      
      Alert.alert('Success', 'Cutting style updated successfully');
      setNewStyleName('');
      setNewStyleDescription('');
      setModalVisible(false);
      setEditMode(false);
      setCurrentStyle(null);
      
      // Refresh the cutting styles list
      fetchCuttingStyles();
    } catch (err) {
      console.error('Error updating cutting style:', err);
      Alert.alert('Error', 'Failed to update cutting style');
    } finally {
      setLoading(false);
    }
  };
  
  // Toggle cutting style active status
  const toggleCuttingStyleStatus = async (style: CuttingStyleItem) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('cutting_styles')
        .update({ is_active: !style.is_active })
        .eq('id', style.id);
      
      if (error) {
        throw error;
      }
      
      // Refresh the cutting styles list
      fetchCuttingStyles();
    } catch (err) {
      console.error('Error toggling cutting style status:', err);
      Alert.alert('Error', 'Failed to update cutting style status');
    } finally {
      setLoading(false);
    }
  };
  
  // Open edit modal
  const openEditModal = (style: CuttingStyleItem) => {
    setCurrentStyle(style);
    setNewStyleName(style.title);
    setNewStyleDescription(style.description || '');
    setEditMode(true);
    setModalVisible(true);
  };
  
  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchCuttingStyles();
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchCuttingStyles();
  }, []);
  
  // Apply filters when search query or active filter changes
  useEffect(() => {
    applyFilters(cuttingStyles, searchQuery, showActiveOnly);
  }, [searchQuery, showActiveOnly, cuttingStyles]);
  
  return (
    <View style={styles.tabContent}>
      <View style={styles.searchFilterContainer}>
        <View style={[styles.searchContainer, { borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.lightText} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search cutting styles..."
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
            {showActiveOnly ? 'Active Only' : 'All Styles'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Manage Cutting Styles {filteredStyles.length > 0 && `(${filteredStyles.length})`}
        </Text>
        <Button 
          title="Add Style" 
          onPress={() => {
            setEditMode(false);
            setNewStyleName('');
            setNewStyleDescription('');
            setModalVisible(true);
          }}
          style={styles.addButton}
          variant="primary"
        />
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading cutting styles...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <Button title="Retry" onPress={fetchCuttingStyles} style={styles.retryButton} />
        </View>
      ) : (
        <FlatList
          data={filteredStyles}
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
                  onPress={() => toggleCuttingStyleStatus(item)}
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
                No cutting styles found
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.lightText }]}>
                {searchQuery ? 'Try a different search term' : 'Add some cutting styles to get started'}
              </Text>
            </View>
          }
        />
      )}
      
      {/* Modal for adding/editing a cutting style */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setEditMode(false);
          setCurrentStyle(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editMode ? 'Edit Cutting Style' : 'Add New Cutting Style'}
            </Text>
            
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="Style Name"
              placeholderTextColor={colors.lightText}
              value={newStyleName}
              onChangeText={setNewStyleName}
            />
            
            <TextInput
              style={[styles.textArea, { borderColor: colors.border, color: colors.text }]}
              placeholder="Description (optional)"
              placeholderTextColor={colors.lightText}
              value={newStyleDescription}
              onChangeText={setNewStyleDescription}
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
                  setCurrentStyle(null);
                }}
                style={styles.modalButton}
                variant="outline"
              />
              <Button 
                title={editMode ? "Update" : "Add"} 
                onPress={editMode ? updateCuttingStyle : addCuttingStyle}
                style={styles.modalButton}
                disabled={loading}
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
    fontSize: 14,
    paddingVertical: 8,
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
}); 