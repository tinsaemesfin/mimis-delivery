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
  Switch,
  ScrollView,
} from 'react-native';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';
import Button from '../../../components/Button';
import { supabase } from '../../../utils/supabase';
import { Ionicons } from '@expo/vector-icons';

interface AdminUser {
  user_id: string;
  is_super_admin: boolean;
  created_at: string;
  email?: string;
  full_name?: string;
}

interface SearchUser {
  id: string;
  email: string;
  full_name?: string;
}

interface SuperAdminTabProps {
  currentUserId: string;
}

export default function SuperAdminTab({ currentUserId }: SuperAdminTabProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);
  
  // Search functionality
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Search for users when email input changes
  useEffect(() => {
    const searchUsers = async () => {
      if (newAdminEmail.length >= 3 && !selectedUser) {
        setSearchLoading(true);
        try {
          console.log('Searching for users with term:', newAdminEmail);
          
          // Try the RPC function first
          const { data, error } = await supabase
            .rpc('search_users_by_email', { search_term: newAdminEmail });

          console.log('Search RPC result:', { data, error });

          if (error) {
            console.error('Search RPC error:', error);
            console.log('RPC functions not working, using manual entry mode');
            
            // If RPC fails, allow manual email entry
            setSearchResults([]);
            setShowSearchResults(false);
          } else {
            console.log('Search results:', data);
            setSearchResults(data || []);
            setShowSearchResults(true);
          }
        } catch (err) {
          console.error('Search error:', err);
          setSearchResults([]);
          setShowSearchResults(false);
        }
        setSearchLoading(false);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [newAdminEmail, selectedUser]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      
      // Get all admins first
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('user_id, is_super_admin, created_at')
        .order('created_at', { ascending: false });

      if (adminError) throw adminError;

      if (!adminData || adminData.length === 0) {
        setAdmins([]);
        return;
      }

      // Get user details for each admin from auth.users
      const adminsWithDetails = await Promise.all(
        adminData.map(async (admin) => {
          try {
            console.log('Fetching user details for admin:', admin.user_id);
            
            // Get user details from auth.users using RPC or direct query
            const { data: userData, error: userError } = await supabase
              .rpc('get_user_by_id', { user_id: admin.user_id });

            console.log('User data result for', admin.user_id, ':', { userData, userError });

            if (userError) {
              console.log(`Could not fetch user details for ${admin.user_id}:`, userError);
              return {
                ...admin,
                email: 'Unknown',
                full_name: `User ${admin.user_id.substring(0, 8)}...`
              };
            }

            const processedUser = {
              ...admin,
              email: userData?.email || 'Unknown',
              full_name: userData?.raw_user_meta_data?.full_name || 
                        userData?.email?.split('@')[0] || 
                        'Unknown User'
            };
            
            console.log('Processed user:', processedUser);
            return processedUser;
          } catch (err) {
            console.log(`Error fetching user ${admin.user_id}:`, err);
            return {
              ...admin,
              email: 'Unknown',
              full_name: `User ${admin.user_id.substring(0, 8)}...`
            };
          }
        })
      );

      setAdmins(adminsWithDetails);
    } catch (error) {
      console.error('Error fetching admins:', error);
      Alert.alert('Error', 'Failed to fetch admin list');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAdmins();
  };

  const toggleSuperAdminStatus = async (userId: string, currentStatus: boolean) => {
    if (userId === currentUserId) {
      Alert.alert('Error', 'You cannot change your own super admin status');
      return;
    }

    try {
      const { error } = await supabase
        .from('admins')
        .update({ is_super_admin: !currentStatus })
        .eq('user_id', userId);

      if (error) throw error;

      setAdmins(prev => prev.map(admin => 
        admin.user_id === userId 
          ? { ...admin, is_super_admin: !currentStatus }
          : admin
      ));

      Alert.alert('Success', `Admin ${!currentStatus ? 'promoted to' : 'demoted from'} super admin`);
    } catch (error) {
      console.error('Error updating super admin status:', error);
      Alert.alert('Error', 'Failed to update admin status');
    }
  };

  const removeAdmin = async (userId: string) => {
    if (userId === currentUserId) {
      Alert.alert('Error', 'You cannot remove yourself from admin list');
      return;
    }

    Alert.alert(
      'Confirm Removal',
      'Are you sure you want to remove this admin?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('admins')
                .delete()
                .eq('user_id', userId);

              if (error) throw error;

              setAdmins(prev => prev.filter(admin => admin.user_id !== userId));
              Alert.alert('Success', 'Admin removed successfully');
            } catch (error) {
              console.error('Error removing admin:', error);
              Alert.alert('Error', 'Failed to remove admin');
            }
          }
        }
      ]
    );
  };

  const selectUser = (user: SearchUser) => {
    setSelectedUser(user);
    setNewAdminEmail(user.email);
    setShowSearchResults(false);
  };

  const clearSelection = () => {
    setSelectedUser(null);
    setNewAdminEmail('');
    setShowSearchResults(false);
  };

  const addNewAdmin = async () => {
    if (!newAdminEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    try {
      setAddingAdmin(true);

      // If we have a selected user, use their ID
      if (selectedUser) {
        const userId = selectedUser.id;

        // Check if already an admin
        const { data: existingAdmin, error: adminCheckError } = await supabase
          .from('admins')
          .select('user_id')
          .eq('user_id', userId)
          .single();

        if (adminCheckError && adminCheckError.code !== 'PGRST116') {
          throw adminCheckError;
        }

        if (existingAdmin) {
          Alert.alert('Error', 'This user is already an admin');
          return;
        }

        // Add as admin
        const { error: insertError } = await supabase
          .from('admins')
          .insert({
            user_id: userId,
            is_super_admin: false
          });

        if (insertError) throw insertError;
      } else {
        // Manual entry mode - ask user to provide the user ID
        Alert.alert(
          'Manual Entry Required',
          'Since user search is not working, please provide the User ID directly. You can find user IDs in your Supabase Dashboard > Authentication > Users.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Enter User ID',
              onPress: () => {
                Alert.prompt(
                  'Enter User ID',
                  'Paste the User ID from Supabase Dashboard:',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Add Admin',
                      onPress: async (userId) => {
                        if (userId && userId.trim()) {
                          try {
                            const { error: insertError } = await supabase
                              .from('admins')
                              .insert({
                                user_id: userId.trim(),
                                is_super_admin: false
                              });

                            if (insertError) throw insertError;
                            
                            fetchAdmins();
                            Alert.alert('Success', 'Admin added successfully');
                          } catch (error) {
                            console.error('Error adding admin:', error);
                            Alert.alert('Error', 'Failed to add admin. Please check the User ID.');
                          }
                        }
                      }
                    }
                  ],
                  'plain-text'
                );
              }
            }
          ]
        );
        setAddingAdmin(false);
        return;
      }

      setNewAdminEmail('');
      setSelectedUser(null);
      setAddModalVisible(false);
      fetchAdmins();
      Alert.alert('Success', 'Admin added successfully');
    } catch (error) {
      console.error('Error adding admin:', error);
      Alert.alert('Error', 'Failed to add admin.');
    } finally {
      setAddingAdmin(false);
    }
  };

  const renderSearchResult = ({ item }: { item: SearchUser }) => (
    <TouchableOpacity
      style={[styles.searchResultItem, { backgroundColor: colors.background }]}
      onPress={() => selectUser(item)}
    >
      <View style={styles.searchResultInfo}>
        <Text style={[styles.searchResultName, { color: colors.text }]}>
          {item.full_name || item.email.split('@')[0]}
        </Text>
        <Text style={[styles.searchResultEmail, { color: colors.lightText }]}>
          {item.email}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.lightText} />
    </TouchableOpacity>
  );

  const renderAdminItem = ({ item }: { item: AdminUser }) => (
    <View style={[styles.adminItem, { backgroundColor: colors.card }]}>
      <View style={styles.adminInfo}>
        <Text style={[styles.adminName, { color: colors.text }]}>
          {item.full_name || 'Unknown User'}
        </Text>
        <Text style={[styles.adminEmail, { color: colors.lightText }]}>
          {item.email}
        </Text>
        <Text style={[styles.adminDate, { color: colors.lightText }]}>
          Added: {new Date(item.created_at).toLocaleDateString()}
        </Text>
        <Text style={[styles.adminStatus, { 
          color: item.is_super_admin ? colors.primary : colors.lightText 
        }]}>
          {item.is_super_admin ? 'Super Admin' : 'Regular Admin'}
        </Text>
        {item.user_id === currentUserId && (
          <Text style={[styles.currentUserLabel, { color: colors.primary }]}>
            (You)
          </Text>
        )}
      </View>
      
      <View style={styles.adminActions}>
        <View style={styles.superAdminToggle}>
          <Text style={[styles.toggleLabel, { color: colors.text }]}>
            Super Admin
          </Text>
          <Switch
            value={item.is_super_admin}
            onValueChange={() => toggleSuperAdminStatus(item.user_id, item.is_super_admin)}
            disabled={item.user_id === currentUserId}
            trackColor={{ false: colors.lightText, true: colors.primary }}
            thumbColor={item.is_super_admin ? colors.card : colors.background}
          />
        </View>
        
        <TouchableOpacity
          style={[
            styles.removeButton, 
            { 
              backgroundColor: item.user_id === currentUserId ? '#ccc' : '#F44336',
              opacity: item.user_id === currentUserId ? 0.5 : 1
            }
          ]}
          onPress={() => removeAdmin(item.user_id)}
          disabled={item.user_id === currentUserId}
        >
          <Ionicons name="trash" size={16} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Admin Management
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setAddModalVisible(true)}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.addButtonText}>Add Admin</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.infoBox, { backgroundColor: colors.card }]}>
        <Ionicons name="information-circle" size={20} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.text }]}>
          Manage admin users and their permissions. Super admins can manage other admins.
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={admins}
          renderItem={renderAdminItem}
          keyExtractor={(item) => item.user_id}
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
              <Ionicons name="people-outline" size={48} color={colors.lightText} />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No admins found
              </Text>
            </View>
          }
        />
      )}

      {/* Add Admin Modal */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setAddModalVisible(false);
          clearSelection();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Add New Admin
            </Text>
            
            <Text style={[styles.modalDescription, { color: colors.lightText }]}>
              Search for a user by typing their email address. If search doesn't work, you can manually add users by clicking "Add Admin" without selecting from results.
            </Text>
            
            <View style={styles.searchContainer}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: selectedUser ? colors.primary : colors.border
                  }]}
                  placeholder="Type email to search users..."
                  placeholderTextColor={colors.lightText}
                  value={newAdminEmail}
                  onChangeText={(text) => {
                    setNewAdminEmail(text);
                    if (selectedUser && text !== selectedUser.email) {
                      setSelectedUser(null);
                    }
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {selectedUser && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={clearSelection}
                  >
                    <Ionicons name="close-circle" size={20} color={colors.lightText} />
                  </TouchableOpacity>
                )}
                {searchLoading && (
                  <ActivityIndicator 
                    size="small" 
                    color={colors.primary} 
                    style={styles.searchLoader}
                  />
                )}
              </View>

              {selectedUser && (
                <View style={[styles.selectedUserCard, { backgroundColor: colors.background }]}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  <View style={styles.selectedUserInfo}>
                    <Text style={[styles.selectedUserName, { color: colors.text }]}>
                      {selectedUser.full_name || selectedUser.email.split('@')[0]}
                    </Text>
                    <Text style={[styles.selectedUserEmail, { color: colors.lightText }]}>
                      {selectedUser.email}
                    </Text>
                  </View>
                </View>
              )}

              {showSearchResults && searchResults.length > 0 && !selectedUser && (
                <View style={[styles.searchResults, { backgroundColor: colors.background }]}>
                  <FlatList
                    data={searchResults}
                    renderItem={renderSearchResult}
                    keyExtractor={(item) => item.id}
                    style={styles.searchResultsList}
                    nestedScrollEnabled={true}
                  />
                </View>
              )}

              {showSearchResults && searchResults.length === 0 && !searchLoading && newAdminEmail.length >= 3 && (
                <View style={[styles.noResults, { backgroundColor: colors.background }]}>
                  <Text style={[styles.noResultsText, { color: colors.lightText }]}>
                    No users found matching "{newAdminEmail}"
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => {
                  setAddModalVisible(false);
                  clearSelection();
                }}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title={addingAdmin ? "Adding..." : "Add Admin"}
                onPress={addNewAdmin}
                disabled={addingAdmin}
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  adminItem: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  adminInfo: {
    flex: 1,
  },
  adminName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  adminEmail: {
    fontSize: 14,
    marginBottom: 4,
  },
  adminDate: {
    fontSize: 12,
    marginBottom: 4,
  },
  adminStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  currentUserLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  adminActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  superAdminToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  toggleLabel: {
    fontSize: 12,
    marginRight: 8,
  },
  removeButton: {
    padding: 8,
    borderRadius: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    padding: 24,
    borderRadius: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  searchContainer: {
    marginBottom: 20,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    paddingRight: 40,
  },
  clearButton: {
    position: 'absolute',
    right: 10,
    top: 12,
  },
  searchLoader: {
    position: 'absolute',
    right: 40,
    top: 12,
  },
  selectedUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  selectedUserInfo: {
    marginLeft: 8,
    flex: 1,
  },
  selectedUserName: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectedUserEmail: {
    fontSize: 14,
  },
  searchResults: {
    borderRadius: 8,
    marginTop: 8,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchResultsList: {
    maxHeight: 200,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
  },
  searchResultEmail: {
    fontSize: 14,
  },
  noResults: {
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
}); 