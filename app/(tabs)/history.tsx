// Powered by OnSpace.AI
import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useWallet } from '../../hooks/useWallet';
import { NetworkSelector } from '../../components/feature/NetworkSelector';
import { GlassCard } from '../../components/ui/GlassCard';
import { Colors, Spacing, Radii } from '../../constants/theme';
import { NETWORKS, NetworkId } from '../../constants/config';
import { getMockTransactions, Transaction } from '../../services/blockchainService';

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - timestamp;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}

function shortenAddress(addr: string): string {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

interface TxRowProps {
  tx: Transaction;
  onPress: (tx: Transaction) => void;
}

const TxRow = React.memo(({ tx, onPress }: TxRowProps) => {
  const isSend = tx.type === 'send';
  const network = NETWORKS[tx.network];

  return (
    <Pressable
      onPress={() => onPress(tx)}
      style={({ pressed }) => [styles.txRow, pressed && styles.txRowPressed]}
    >
      <View style={[styles.txIcon, { backgroundColor: isSend ? Colors.error + '22' : Colors.accent + '22' }]}>
        <MaterialIcons
          name={isSend ? 'arrow-upward' : 'arrow-downward'}
          size={20}
          color={isSend ? Colors.error : Colors.accent}
        />
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txType}>{isSend ? 'Sent' : 'Received'}</Text>
        <Text style={styles.txAddr} numberOfLines={1}>
          {isSend ? `To: ${shortenAddress(tx.to)}` : `From: ${shortenAddress(tx.from)}`}
        </Text>
        <View style={styles.txMeta}>
          <View style={[styles.networkDot, { backgroundColor: network.color }]} />
          <Text style={styles.txTime}>{formatDate(tx.timestamp)}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: tx.status === 'confirmed' ? Colors.success + '22' : Colors.warning + '22' }
          ]}>
            <Text style={[
              styles.statusText,
              { color: tx.status === 'confirmed' ? Colors.success : Colors.warning }
            ]}>
              {tx.status}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.txRight}>
        <Text style={[styles.txAmount, { color: isSend ? Colors.error : Colors.accent }]}>
          {isSend ? '-' : '+'}{tx.value}
        </Text>
        <Text style={styles.txSymbol}>{tx.symbol}</Text>
      </View>
    </Pressable>
  );
});

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { selectedNetwork, getCurrentAddress } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    const address = getCurrentAddress();
    if (address) {
      const txs = getMockTransactions(address, selectedNetwork);
      setTransactions(txs);
    }
  }, [selectedNetwork, getCurrentAddress]);

  const handleTxPress = useCallback((tx: Transaction) => {
    setSelectedTx(tx);
  }, []);

  const handleOpenExplorer = useCallback((tx: Transaction) => {
    const network = NETWORKS[tx.network];
    const url = `${network.explorerUrl}/tx/${tx.hash}`;
    Linking.openURL(url).catch(() => {});
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Activity</Text>
        <View style={[styles.networkBadge, { backgroundColor: NETWORKS[selectedNetwork].color + '22' }]}>
          <Text style={[styles.networkBadgeText, { color: NETWORKS[selectedNetwork].color }]}>
            {NETWORKS[selectedNetwork].name}
          </Text>
        </View>
      </View>

      <NetworkSelector />

      {transactions.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="history" size={60} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No Transactions</Text>
          <Text style={styles.emptySubtitle}>
            Your {NETWORKS[selectedNetwork].name} transactions will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.hash}
          renderItem={({ item }) => (
            <TxRow tx={item} onPress={handleTxPress} />
          )}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.listHeader}>
              {transactions.length} Recent Transactions
            </Text>
          }
        />
      )}

      {/* Transaction detail modal */}
      {selectedTx ? (
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedTx(null)} />
          <GlassCard style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>Transaction Details</Text>
              <Pressable onPress={() => setSelectedTx(null)} hitSlop={8}>
                <MaterialIcons name="close" size={22} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <View style={[
              styles.detailIcon,
              { backgroundColor: selectedTx.type === 'send' ? Colors.error + '22' : Colors.accent + '22' }
            ]}>
              <MaterialIcons
                name={selectedTx.type === 'send' ? 'arrow-upward' : 'arrow-downward'}
                size={28}
                color={selectedTx.type === 'send' ? Colors.error : Colors.accent}
              />
            </View>

            <Text style={styles.detailAmount}>
              {selectedTx.type === 'send' ? '-' : '+'}{selectedTx.value} {selectedTx.symbol}
            </Text>

            <View style={styles.detailRows}>
              {[
                { label: 'Status', value: selectedTx.status, color: Colors.success },
                { label: 'Network', value: NETWORKS[selectedTx.network].name },
                { label: 'From', value: shortenAddress(selectedTx.from) },
                { label: 'To', value: shortenAddress(selectedTx.to) },
                { label: 'Date', value: new Date(selectedTx.timestamp).toLocaleString() },
                ...(selectedTx.gasUsed ? [{ label: 'Gas Used', value: `${selectedTx.gasUsed} ${selectedTx.symbol}` }] : []),
              ].map(({ label, value, color }) => (
                <View key={label} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{label}</Text>
                  <Text style={[styles.detailValue, color ? { color } : null]}>{value}</Text>
                </View>
              ))}
            </View>

            <Pressable
              onPress={() => handleOpenExplorer(selectedTx)}
              style={({ pressed }) => [styles.explorerBtn, pressed && { opacity: 0.7 }]}
            >
              <MaterialIcons name="open-in-new" size={16} color={Colors.primary} />
              <Text style={styles.explorerBtnText}>View on Explorer</Text>
            </Pressable>
          </GlassCard>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  networkBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  networkBadgeText: { fontSize: 12, fontWeight: '600' },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: Colors.textSecondary },
  emptySubtitle: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  listContent: { padding: Spacing.md, gap: 0 },
  listHeader: { fontSize: 13, color: Colors.textMuted, marginBottom: Spacing.sm },
  separator: { height: 1, backgroundColor: Colors.surfaceBorder },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  txRowPressed: { backgroundColor: Colors.surfaceElevated, borderRadius: Radii.sm },
  txIcon: {
    width: 42,
    height: 42,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: { flex: 1, gap: 2 },
  txType: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  txAddr: { fontSize: 12, color: Colors.textMuted, fontFamily: 'monospace' },
  txMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  networkDot: { width: 6, height: 6, borderRadius: 3 },
  txTime: { fontSize: 11, color: Colors.textMuted },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: { fontSize: 10, fontWeight: '600' },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 15, fontWeight: '700' },
  txSymbol: { fontSize: 11, color: Colors.textMuted },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  detailCard: {
    margin: Spacing.md,
    borderRadius: Radii.xl,
    gap: Spacing.md,
    borderColor: Colors.surfaceBorder,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  detailIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  detailAmount: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  detailRows: { gap: 8 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: 13, color: Colors.textMuted },
  detailValue: { fontSize: 13, fontWeight: '500', color: Colors.textPrimary },
  explorerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: Colors.primaryDim,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.primary + '44',
  },
  explorerBtnText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
});
