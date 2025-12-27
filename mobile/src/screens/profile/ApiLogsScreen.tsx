import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { Text, Surface, Chip, Switch, Searchbar, IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from '@react-navigation/native';
import { useLogStore, ApiLog, HttpMethod, LogStatus } from '../../stores/logStore';
import { useThemeStore } from '../../stores/themeStore';
import { lightColors, darkColors, spacing, fontSize, lumeraColors } from '../../theme';

type FilterMethod = HttpMethod | 'ALL';
type FilterStatus = LogStatus | 'ALL';

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: '#4caf50',
  POST: '#2196f3',
  PUT: '#ff9800',
  DELETE: '#f44336',
  PATCH: '#9c27b0',
};

const STATUS_COLORS: Record<LogStatus, string> = {
  pending: '#ff9800',
  success: '#4caf50',
  error: '#f44336',
};

interface LogItemProps {
  log: ApiLog;
  onPress: () => void;
  isDark: boolean;
}

const LogItem: React.FC<LogItemProps> = ({ log, onPress, isDark }) => {
  const colors = isDark ? darkColors : lightColors;
  const methodColor = METHOD_COLORS[log.method];
  const statusColor = STATUS_COLORS[log.status];

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getEndpoint = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname;
    } catch {
      return url;
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Surface style={[styles.logItem, { backgroundColor: colors.surface }]}>
        <View style={styles.logHeader}>
          <View style={[styles.methodBadge, { backgroundColor: methodColor + '20' }]}>
            <Text style={[styles.methodText, { color: methodColor }]}>{log.method}</Text>
          </View>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.logTime, { color: colors.textSecondary }]}>
            {formatTime(log.timestamp)}
          </Text>
          {log.duration && (
            <Text style={[styles.logDuration, { color: colors.textMuted }]}>
              {log.duration}ms
            </Text>
          )}
        </View>
        <Text style={[styles.logUrl, { color: colors.text }]} numberOfLines={1}>
          {getEndpoint(log.url)}
        </Text>
        {log.responseStatus && (
          <Text
            style={[
              styles.logStatus,
              { color: log.responseStatus >= 400 ? '#f44336' : '#4caf50' },
            ]}
          >
            Status: {log.responseStatus}
          </Text>
        )}
        {log.error && (
          <Text style={styles.logError} numberOfLines={1}>
            {log.error}
          </Text>
        )}
      </Surface>
    </TouchableOpacity>
  );
};

interface LogDetailModalProps {
  log: ApiLog | null;
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
}

const LogDetailModal: React.FC<LogDetailModalProps> = ({ log, visible, onClose, isDark }) => {
  const colors = isDark ? darkColors : lightColors;
  const insets = useSafeAreaInsets();

  const copyToClipboard = async (data: any, label: string) => {
    try {
      const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      await Clipboard.setStringAsync(text);
      Alert.alert('Copiado!', `${label} copiado para a área de transferência`);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível copiar');
    }
  };

  const copyAllData = async () => {
    if (!log) return;
    const allData = {
      timestamp: log.timestamp,
      method: log.method,
      url: log.url,
      duration: log.duration,
      status: log.status,
      requestHeaders: log.requestHeaders,
      requestBody: log.requestBody,
      responseStatus: log.responseStatus,
      responseHeaders: log.responseHeaders,
      responseBody: log.responseBody,
      error: log.error,
    };
    await copyToClipboard(allData, 'Dados completos');
  };

  if (!log) return null;

  const formatJson = (data: any) => {
    if (!data) return 'null';
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  const methodColor = METHOD_COLORS[log.method];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Detalhes do Log</Text>
          <TouchableOpacity onPress={copyAllData} style={styles.copyAllButton}>
            <MaterialCommunityIcons name="content-copy" size={20} color={lumeraColors.roxoLumera} />
            <Text style={[styles.copyAllText, { color: lumeraColors.roxoLumera }]}>Copiar Tudo</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Request Info */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Requisição</Text>
            <Surface style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
              <View style={styles.infoRow}>
                <View style={[styles.methodBadgeLarge, { backgroundColor: methodColor + '20' }]}>
                  <Text style={[styles.methodTextLarge, { color: methodColor }]}>{log.method}</Text>
                </View>
                <Text style={[styles.urlText, { color: colors.text }]} selectable>
                  {log.url}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Horário:</Text>
                <Text style={[styles.value, { color: colors.text }]}>
                  {new Date(log.timestamp).toLocaleString('pt-BR')}
                </Text>
              </View>

              {log.duration && (
                <View style={styles.infoRow}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Duração:</Text>
                  <Text style={[styles.value, { color: colors.text }]}>{log.duration}ms</Text>
                </View>
              )}

              {log.responseStatus && (
                <View style={styles.infoRow}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Status HTTP:</Text>
                  <Text
                    style={[
                      styles.value,
                      { color: log.responseStatus >= 400 ? '#f44336' : '#4caf50' },
                    ]}
                  >
                    {log.responseStatus}
                  </Text>
                </View>
              )}
            </Surface>
          </View>

          {/* Request Headers */}
          {log.requestHeaders && Object.keys(log.requestHeaders).length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  Request Headers
                </Text>
                <TouchableOpacity
                  onPress={() => copyToClipboard(log.requestHeaders, 'Request Headers')}
                >
                  <MaterialCommunityIcons name="content-copy" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <Surface style={[styles.codeBlock, { backgroundColor: isDark ? '#1e1e1e' : '#f5f5f5' }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Text style={[styles.codeText, { color: colors.text }]} selectable>
                    {formatJson(log.requestHeaders)}
                  </Text>
                </ScrollView>
              </Surface>
            </View>
          )}

          {/* Request Body */}
          {log.requestBody && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  Request Body
                </Text>
                <TouchableOpacity
                  onPress={() => copyToClipboard(log.requestBody, 'Request Body')}
                >
                  <MaterialCommunityIcons name="content-copy" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <Surface style={[styles.codeBlock, { backgroundColor: isDark ? '#1e1e1e' : '#f5f5f5' }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Text style={[styles.codeText, { color: colors.text }]} selectable>
                    {formatJson(log.requestBody)}
                  </Text>
                </ScrollView>
              </Surface>
            </View>
          )}

          {/* Response Headers */}
          {log.responseHeaders && Object.keys(log.responseHeaders).length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  Response Headers
                </Text>
                <TouchableOpacity
                  onPress={() => copyToClipboard(log.responseHeaders, 'Response Headers')}
                >
                  <MaterialCommunityIcons name="content-copy" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <Surface style={[styles.codeBlock, { backgroundColor: isDark ? '#1e1e1e' : '#f5f5f5' }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Text style={[styles.codeText, { color: colors.text }]} selectable>
                    {formatJson(log.responseHeaders)}
                  </Text>
                </ScrollView>
              </Surface>
            </View>
          )}

          {/* Response Body */}
          {log.responseBody !== undefined && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  Response Body
                </Text>
                <TouchableOpacity
                  onPress={() => copyToClipboard(log.responseBody, 'Response Body')}
                >
                  <MaterialCommunityIcons name="content-copy" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <Surface style={[styles.codeBlock, { backgroundColor: isDark ? '#1e1e1e' : '#f5f5f5' }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Text style={[styles.codeText, { color: colors.text }]} selectable>
                    {formatJson(log.responseBody)}
                  </Text>
                </ScrollView>
              </Surface>
            </View>
          )}

          {/* Error */}
          {log.error && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: '#f44336' }]}>Erro</Text>
                <TouchableOpacity onPress={() => copyToClipboard(log.error, 'Erro')}>
                  <MaterialCommunityIcons name="content-copy" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <Surface style={[styles.codeBlock, { backgroundColor: '#ffebee' }]}>
                <Text style={[styles.codeText, { color: '#c62828' }]} selectable>
                  {log.error}
                </Text>
              </Surface>
            </View>
          )}

          <View style={{ height: insets.bottom + spacing.xxl }} />
        </ScrollView>
      </View>
    </Modal>
  );
};

export default function ApiLogsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeStore();
  const colors = isDark ? darkColors : lightColors;
  const { logs, isEnabled, toggleEnabled, clearLogs } = useLogStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState<FilterMethod>('ALL');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [selectedLog, setSelectedLog] = useState<ApiLog | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Filter by method
      if (filterMethod !== 'ALL' && log.method !== filterMethod) {
        return false;
      }

      // Filter by status
      if (filterStatus !== 'ALL' && log.status !== filterStatus) {
        return false;
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          log.url.toLowerCase().includes(query) ||
          log.method.toLowerCase().includes(query) ||
          (log.error && log.error.toLowerCase().includes(query)) ||
          (log.responseStatus && log.responseStatus.toString().includes(query))
        );
      }

      return true;
    });
  }, [logs, filterMethod, filterStatus, searchQuery]);

  const handleLogPress = useCallback((log: ApiLog) => {
    setSelectedLog(log);
    setModalVisible(true);
  }, []);

  const handleClearLogs = () => {
    Alert.alert(
      'Limpar Logs',
      'Tem certeza que deseja limpar todos os logs?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: clearLogs,
        },
      ]
    );
  };

  const renderLogItem = useCallback(
    ({ item }: { item: ApiLog }) => (
      <LogItem log={item} onPress={() => handleLogPress(item)} isDark={isDark} />
    ),
    [handleLogPress, isDark]
  );

  const methods: FilterMethod[] = ['ALL', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  const statuses: FilterStatus[] = ['ALL', 'pending', 'success', 'error'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Logs de API</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleClearLogs} style={styles.headerButton}>
            <MaterialCommunityIcons name="delete-outline" size={22} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Enable/Disable Toggle */}
      <View style={[styles.toggleContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.toggleInfo}>
          <MaterialCommunityIcons
            name="record-circle"
            size={20}
            color={isEnabled ? '#4caf50' : colors.textMuted}
          />
          <Text style={[styles.toggleText, { color: colors.text }]}>
            {isEnabled ? 'Gravando requisições' : 'Gravação desativada'}
          </Text>
        </View>
        <Switch value={isEnabled} onValueChange={toggleEnabled} color={lumeraColors.roxoLumera} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Buscar por URL, método, status..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchbar, { backgroundColor: colors.surface }]}
          inputStyle={{ color: colors.text }}
          iconColor={colors.textSecondary}
          placeholderTextColor={colors.textMuted}
        />
      </View>

      {/* Method Filters */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {methods.map((method) => (
            <Chip
              key={method}
              selected={filterMethod === method}
              onPress={() => setFilterMethod(method)}
              style={[
                styles.filterChip,
                filterMethod === method && {
                  backgroundColor: method === 'ALL' ? lumeraColors.roxoLumera : METHOD_COLORS[method as HttpMethod],
                },
              ]}
              textStyle={{
                color: filterMethod === method ? '#fff' : colors.text,
                fontSize: 12,
              }}
            >
              {method}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* Status Filters */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {statuses.map((status) => (
            <Chip
              key={status}
              selected={filterStatus === status}
              onPress={() => setFilterStatus(status)}
              style={[
                styles.filterChip,
                filterStatus === status && {
                  backgroundColor: status === 'ALL' ? lumeraColors.roxoLumera : STATUS_COLORS[status as LogStatus],
                },
              ]}
              textStyle={{
                color: filterStatus === status ? '#fff' : colors.text,
                fontSize: 12,
              }}
            >
              {status === 'ALL' ? 'Todos' : status.charAt(0).toUpperCase() + status.slice(1)}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* Stats */}
      <View style={[styles.statsContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>{logs.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#4caf50' }]}>
            {logs.filter((l) => l.status === 'success').length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Sucesso</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#f44336' }]}>
            {logs.filter((l) => l.status === 'error').length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Erros</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#ff9800' }]}>
            {logs.filter((l) => l.status === 'pending').length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pendente</Text>
        </View>
      </View>

      {/* Logs List */}
      <FlatList
        data={filteredLogs}
        keyExtractor={(item) => item.id}
        renderItem={renderLogItem}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + spacing.xxl }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="api" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery || filterMethod !== 'ALL' || filterStatus !== 'ALL'
                ? 'Nenhum log encontrado com os filtros aplicados'
                : 'Nenhum log registrado ainda'}
            </Text>
            {!isEnabled && (
              <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
                Ative a gravação para capturar requisições
              </Text>
            )}
          </View>
        }
      />

      {/* Detail Modal */}
      <LogDetailModal
        log={selectedLog}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        isDark={isDark}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: spacing.xs,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  toggleText: {
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  searchbar: {
    borderRadius: 12,
    elevation: 0,
  },
  filterContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  filterChip: {
    marginRight: spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    marginVertical: 4,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  logItem: {
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    elevation: 1,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  methodBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  methodText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: spacing.sm,
  },
  logTime: {
    fontSize: fontSize.xs,
    marginLeft: spacing.sm,
  },
  logDuration: {
    fontSize: fontSize.xs,
    marginLeft: 'auto',
  },
  logUrl: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  logStatus: {
    fontSize: fontSize.xs,
    marginTop: 4,
  },
  logError: {
    fontSize: fontSize.xs,
    color: '#f44336',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: fontSize.md,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: spacing.xs,
  },
  modalTitle: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  copyAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: spacing.xs,
  },
  copyAllText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    padding: spacing.md,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  methodBadgeLarge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  methodTextLarge: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  urlText: {
    flex: 1,
    fontSize: fontSize.sm,
  },
  label: {
    fontSize: fontSize.sm,
    marginRight: spacing.sm,
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  codeBlock: {
    padding: spacing.md,
    borderRadius: 8,
    maxHeight: 200,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
});
