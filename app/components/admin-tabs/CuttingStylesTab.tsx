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

interface CuttingStyleItem {
  id: string;
  name: string;
  active: boolean;
}

interface CuttingStylesTabProps {
  cuttingStyles: CuttingStyleItem[];
  setCuttingStyles: React.Dispatch<React.SetStateAction<CuttingStyleItem[]>>;
}

export default function CuttingStylesTab({ cuttingStyles, setCuttingStyles }: CuttingStylesTabProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  
  const [cuttingStyleModal, setCuttingStyleModal] = useState(false);
  const [newStyleName, setNewStyleName] = useState('');
  
  // Function to handle adding a new cutting style
  const handleAddCuttingStyle = () => {
    if (newStyleName.trim() === '') {
      Alert.alert('Error', 'Please enter a cutting style name');
      return;
    }
    
    const newStyle = {
      id: (cuttingStyles.length + 1).toString(),
      name: newStyleName,
      active: true
    };
    
    setCuttingStyles([...cuttingStyles, newStyle]);
    setNewStyleName('');
    setCuttingStyleModal(false);
  };
  
  // Function to toggle cutting style active status
  const toggleCuttingStyleStatus = (id: string) => {
    setCuttingStyles(
      cuttingStyles.map(style => 
        style.id === id ? { ...style, active: !style.active } : style
      )
    );
  };
  
  return (
    <View style={styles.tabContent}>
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Manage Cutting Styles</Text>
        <Button 
          title="Add Style" 
          onPress={() => setCuttingStyleModal(true)}
          style={styles.addButton}
          variant="primary"
        />
      </View>
      
      <FlatList
        data={cuttingStyles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
            <View style={styles.itemActions}>
              <Text style={{ color: item.active ? '#4CAF50' : '#F44336', marginRight: 8 }}>
                {item.active ? 'Active' : 'Inactive'}
              </Text>
              <TouchableOpacity 
                style={[styles.toggleButton, { backgroundColor: item.active ? '#F44336' : '#4CAF50' }]}
                onPress={() => toggleCuttingStyleStatus(item.id)}
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
      
      {/* Modal for adding a new cutting style */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={cuttingStyleModal}
        onRequestClose={() => setCuttingStyleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add New Cutting Style</Text>
            
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="Style Name"
              placeholderTextColor={colors.lightText}
              value={newStyleName}
              onChangeText={setNewStyleName}
            />
            
            <View style={styles.modalButtons}>
              <Button 
                title="Cancel" 
                onPress={() => setCuttingStyleModal(false)}
                style={styles.modalButton}
                variant="outline"
              />
              <Button 
                title="Add" 
                onPress={handleAddCuttingStyle}
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
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
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
}); 