import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  SafeAreaView,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../utils/supabase';
import { format, parseISO } from 'date-fns';

interface OrderLog {
  id: string;
  order_id: string;
  order_ticket: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  performed_by: string;
  performed_at: string;
  order_data: any;
  changes: any;
  performer_email: string;
}

interface LogsTabProps {
  currentUserId: string;
}

const LOGS_PER_PAGE = 20;

export default function LogsTab({ currentUserId }: LogsTabProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  
  const [logs, setLogs] = useState<OrderLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreLogs, setHasMoreLogs] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  
  // Modal states
  const [selectedLog, setSelectedLog] = useState<OrderLog | null>(null);
  const [logDetailsVisible, setLogDetailsVisible] = useState(false);
  
  // Filter states
  const [filterVisible, setFilterVisible] = useState(false);
  const [actionFilter, setActionFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLogs, setFilteredLogs] = useState<OrderLog[]>([]);

  useEffect(() => {
    fetchLogs(true);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, actionFilter, searchQuery]);

  const fetchLogs = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setCurrentPage(0);
      } else {
        setLoadingMore(true);
      }

      const offset = reset ? 0 : currentPage * LOGS_PER_PAGE;
      
      const { data, error } = await supabase
        .rpc('get_order_logs', {
          order_id_param: null,
          limit_param: LOGS_PER_PAGE,
          offset_param: offset
        });

      if (error) throw error;

      const newLogs = data || [];
      
      if (reset) {
        setLogs(newLogs);
      } else {
        setLogs(prev => [...prev, ...newLogs]);
      }
      
      setHasMoreLogs(newLogs.length === LOGS_PER_PAGE);
      setCurrentPage(prev => reset ? 1 : prev + 1);
      
    } catch (error) {
      console.error('Error fetching logs:', error);
      Alert.alert('Error', 'Failed to fetch logs. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];
    
    // Apply action filter
    if (actionFilter) {
      filtered = filtered.filter(log => log.action === actionFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        log.order_ticket?.toLowerCase().includes(query) ||
        log.performer_email?.toLowerCase().includes(query) ||
        log.order_data?.customer_name?.toLowerCase().includes(query)
      );
    }
    
    setFilteredLogs(filtered);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLogs(true);
  }, []);

  const loadMoreLogs = () => {
    if (!loadingMore && hasMoreLogs) {
      fetchLogs(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return '#4CAF50';
      case 'UPDATE': return '#2196F3';
      case 'DELETE': return '#F44336';
      default: return colors.lightText;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return 'add-circle';
      case 'UPDATE': return 'create';
      case 'DELETE': return 'trash';
      default: return 'document';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy HH:mm:ss');
    } catch (e) {
      return dateString;
    }
  };

  const showLogDetails = (log: OrderLog) => {
    setSelectedLog(log);
    setLogDetailsVisible(true);
  };

  const renderLogItem = ({ item }: { item: OrderLog }) => (
    <TouchableOpacity
      style={[styles.logItem, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => showLogDetails(item)}
    >
      <View style={styles.logHeader}>
        <View style={styles.logActionContainer}>
          <View style={[styles.actionIcon, { backgroundColor: getActionColor(item.action) + '20' }]}>
            <Ionicons 
              name={getActionIcon(item.action) as any} 
              size={20} 
              color={getActionColor(item.action)} 
            />
          </View>
          <View style={styles.logMainInfo}>
            <Text style={[styles.logAction, { color: getActionColor(item.action) }]}>
              {item.action}
            </Text>
            <Text style={[styles.orderTicket, { color: colors.text }]}>
              Order #{item.order_ticket || item.order_id.substring(0, 8)}
            </Text>
          </View>
        </View>
        <Text style={[styles.logDate, { color: colors.lightText }]}>
          {formatDate(item.performed_at)}
        </Text>
      </View>
      
      <View style={styles.logDetails}>
        <View style={styles.performerInfo}>
          <Ionicons name="person" size={16} color={colors.primary} />
          <Text style={[styles.performerEmail, { color: colors.text }]}>
            {item.performer_email || 'Unknown User'}
          </Text>
        </View>
        
        {item.order_data?.customer_name && (
          <View style={styles.customerInfo}>
            <Ionicons name="person-outline" size={16} color={colors.lightText} />
            <Text style={[styles.customerName, { color: colors.lightText }]}>
              Customer: {item.order_data.customer_name}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.logFooter}>
        <View style={styles.logMetadata}>
          {item.action === 'UPDATE' && item.changes && (
            <View style={[styles.changesIndicator, { backgroundColor: colors.primary + '10' }]}>
              <Ionicons name="swap-horizontal" size={14} color={colors.primary} />
              <Text style={[styles.changesText, { color: colors.primary }]}>
                Changes Made
              </Text>
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.lightText} />
      </View>
    </TouchableOpacity>
  );

  const renderFilterButton = (action: string, label: string) => (
    <TouchableOpacity
      key={action}
      style={[
        styles.filterButton,
        { 
          backgroundColor: actionFilter === action ? getActionColor(action) + '20' : colors.card,
          borderColor: actionFilter === action ? getActionColor(action) : colors.border
        }
      ]}
      onPress={() => setActionFilter(actionFilter === action ? null : action)}
    >
      <Ionicons 
        name={getActionIcon(action) as any} 
        size={16} 
        color={actionFilter === action ? getActionColor(action) : colors.text} 
      />
      <Text style={[
        styles.filterButtonText,
        { color: actionFilter === action ? getActionColor(action) : colors.text }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderChangesComparison = () => {
    if (!selectedLog?.changes) return null;

    const { old: oldData, new: newData } = selectedLog.changes;
    
    const getChangedFields = () => {
      const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];
      
      if (oldData && newData) {
        Object.keys(newData).forEach(key => {
          if (oldData[key] !== newData[key]) {
            changes.push({
              field: key,
              oldValue: oldData[key],
              newValue: newData[key]
            });
          }
        });
      }
      
      return changes;
    };

    const changes = getChangedFields();

    return (
      <View style={styles.changesSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Changes Made</Text>
        {changes.length > 0 ? (
          changes.map((change, index) => (
            <View key={index} style={[styles.changeItem, { backgroundColor: colors.background }]}>
              <Text style={[styles.fieldName, { color: colors.text }]}>
                {change.field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
              <View style={styles.changeComparison}>
                <View style={styles.changeValue}>
                  <Text style={[styles.changeLabel, { color: '#F44336' }]}>Before:</Text>
                  <Text style={[styles.changeText, { color: colors.text }]}>
                    {String(change.oldValue || 'N/A')}
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color={colors.lightText} />
                <View style={styles.changeValue}>
                  <Text style={[styles.changeLabel, { color: '#4CAF50' }]}>After:</Text>
                  <Text style={[styles.changeText, { color: colors.text }]}>
                    {String(change.newValue || 'N/A')}
                  </Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={[styles.noChangesText, { color: colors.lightText }]}>
            No specific field changes detected
          </Text>
        )}
      </View>
    );
  };

  const renderOrderData = () => {
    if (!selectedLog?.order_data) return null;

    const orderData = selectedLog.order_data;
    
    return (
      <View style={styles.orderDataSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Information</Text>
        <View style={[styles.orderDataContainer, { backgroundColor: colors.background }]}>
          {Object.entries(orderData).map(([key, value]) => (
            <View key={key} style={styles.dataRow}>
              <Text style={[styles.dataLabel, { color: colors.lightText }]}>
                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
              </Text>
              <Text style={[styles.dataValue, { color: colors.text }]}>
                {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value || 'N/A')}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading more logs...</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Order Activity Logs</Text>
        <TouchableOpacity
          style={[styles.filterToggle, { backgroundColor: colors.primary }]}
          onPress={() => setFilterVisible(!filterVisible)}
        >
          <Ionicons name="filter" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {filterVisible && (
        <View style={[styles.filtersContainer, { backgroundColor: colors.card }]}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.lightText} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search by order, customer, or user..."
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
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionFilters}>
            {renderFilterButton('CREATE', 'Created')}
            {renderFilterButton('UPDATE', 'Updated')}
            {renderFilterButton('DELETE', 'Deleted')}
          </ScrollView>
        </View>
      )}

      {/* Stats */}
      <View style={[styles.statsContainer, { backgroundColor: colors.card }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>
            {filteredLogs.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.lightText }]}>Total Logs</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#4CAF50' }]}>
            {filteredLogs.filter(log => log.action === 'CREATE').length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.lightText }]}>Created</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#2196F3' }]}>
            {filteredLogs.filter(log => log.action === 'UPDATE').length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.lightText }]}>Updated</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#F44336' }]}>
            {filteredLogs.filter(log => log.action === 'DELETE').length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.lightText }]}>Deleted</Text>
        </View>
      </View>

      {/* Logs List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading logs...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredLogs}
          renderItem={renderLogItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          onEndReached={loadMoreLogs}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color={colors.lightText} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Logs Found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.lightText }]}>
                {actionFilter || searchQuery ? 'Try adjusting your filters' : 'Order activity will appear here'}
              </Text>
            </View>
          }
        />
      )}

      {/* Log Details Modal */}
      <Modal
        visible={logDetailsVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setLogDetailsVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <View style={[styles.modalActionIcon, { backgroundColor: getActionColor(selectedLog?.action || '') + '20' }]}>
                  <Ionicons 
                    name={getActionIcon(selectedLog?.action || '') as any} 
                    size={24} 
                    color={getActionColor(selectedLog?.action || '')} 
                  />
                </View>
                <View>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {selectedLog?.action} Log Details
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: colors.lightText }]}>
                    Order #{selectedLog?.order_ticket || selectedLog?.order_id?.substring(0, 8)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.modalCloseButton, { backgroundColor: colors.card }]}
                onPress={() => setLogDetailsVisible(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Log Metadata */}
              <View style={[styles.metadataSection, { backgroundColor: colors.card }]}>
                <View style={styles.metadataRow}>
                  <Ionicons name="time" size={20} color={colors.primary} />
                  <View style={styles.metadataContent}>
                    <Text style={[styles.metadataLabel, { color: colors.lightText }]}>Performed At</Text>
                    <Text style={[styles.metadataValue, { color: colors.text }]}>
                      {selectedLog ? formatDate(selectedLog.performed_at) : ''}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.metadataRow}>
                  <Ionicons name="person" size={20} color={colors.primary} />
                  <View style={styles.metadataContent}>
                    <Text style={[styles.metadataLabel, { color: colors.lightText }]}>Performed By</Text>
                    <Text style={[styles.metadataValue, { color: colors.text }]}>
                      {selectedLog?.performer_email || 'Unknown User'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Changes Comparison (for UPDATE actions) */}
              {selectedLog?.action === 'UPDATE' && renderChangesComparison()}

              {/* Order Data */}
              {renderOrderData()}
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
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  filterToggle: {
    padding: 12,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  filtersContainer: {
    padding: 16,
    borderRadius: 12,
    margin: 16,
    marginTop: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  actionFilters: {
    flexDirection: 'row',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    gap: 6,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  logItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  logActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  logMainInfo: {
    flex: 1,
  },
  logAction: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  orderTicket: {
    fontSize: 14,
    fontWeight: '500',
  },
  logDate: {
    fontSize: 12,
    textAlign: 'right',
  },
  logDetails: {
    gap: 8,
    marginBottom: 12,
  },
  performerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  performerEmail: {
    fontSize: 14,
    fontWeight: '500',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customerName: {
    fontSize: 14,
  },
  logFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changesIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  changesText: {
    fontSize: 12,
    fontWeight: '500',
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    flex: 1,
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalActionIcon: {
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  modalCloseButton: {
    padding: 8,
    borderRadius: 8,
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  metadataSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  metadataContent: {
    marginLeft: 12,
    flex: 1,
  },
  metadataLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  metadataValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  changesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  changeItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  fieldName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  changeComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  changeValue: {
    flex: 1,
  },
  changeLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  changeText: {
    fontSize: 14,
  },
  noChangesText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  orderDataSection: {
    marginBottom: 20,
  },
  orderDataContainer: {
    padding: 12,
    borderRadius: 8,
  },
  dataRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  dataLabel: {
    fontSize: 14,
    fontWeight: '500',
    width: 120,
    marginRight: 12,
  },
  dataValue: {
    fontSize: 14,
    flex: 1,
  },
}); 