// Powered by OnSpace.AI
// ERC-20 / BEP-20 token list for the selected EVM network
import React, { memo } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radii } from '../../constants/theme';
import { useWallet } from '../../hooks/useWallet';
import { TokenBalance } from '../../services/tokenService';

interface TokenRowProps {
  item: TokenBalance;
}

const TokenRow = memo(({ item }: TokenRowProps) => {
  const hasBalance = parseFloat(item.balance) > 0;
  return (
    <View style={styles.row}>
      <View style={[styles.iconBg, { backgroundColor: item.token.color + '22' }]}>
        <Text style={[styles.iconText, { color: item.token.color }]}>
          {item.token.symbol[0]}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.symbol}>{item.token.symbol}</Text>
        <Text style={styles.name}>{item.token.name}</Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.balance, !hasBalance && styles.zeroBalance]}>
          {parseFloat(item.balance).toFixed(4)}
        </Text>
        <Text style={styles.usd}>
          ${parseFloat(item.usdValue) > 0 ? item.usdValue : '0.00'}
        </Text>
      </View>
    </View>
  );
});

export const TokenList = memo(() => {
  const { tokenBalances, isLoadingTokens, selectedNetwork, refreshTokenBalances } = useWallet();

  if (selectedNetwork === 'solana') {
    return (
      <View style={styles.unsupportedNote}>
        <MaterialIcons name="info-outline" size={14} color={Colors.textMuted} />
        <Text style={styles.unsupportedText}>SPL token support coming soon</Text>
      </View>
    );
  }

  if (isLoadingTokens) {
    return (
      <View style={styles.loadingRow}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.loadingText}>Fetching token balances...</Text>
      </View>
    );
  }

  if (tokenBalances.length === 0) {
    return (
      <View style={styles.emptyRow}>
        <Text style={styles.emptyText}>No tokens found on this network</Text>
        <Pressable onPress={refreshTokenBalances} hitSlop={8}>
          <MaterialIcons name="refresh" size={18} color={Colors.textMuted} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tokens</Text>
        <Pressable onPress={refreshTokenBalances} hitSlop={8}>
          <MaterialIcons name="refresh" size={16} color={Colors.textMuted} />
        </Pressable>
      </View>
      {tokenBalances.map((item, idx) => (
        <React.Fragment key={item.token.symbol + item.networkId}>
          <TokenRow item={item} />
          {idx < tokenBalances.length - 1 && <View style={styles.divider} />}
        </React.Fragment>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { gap: 0 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: 4,
  },
  headerTitle: { fontSize: 13, fontWeight: '600', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  iconBg: {
    width: 38,
    height: 38,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 16, fontWeight: '700' },
  info: { flex: 1 },
  symbol: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  name: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  right: { alignItems: 'flex-end' },
  balance: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  zeroBalance: { color: Colors.textMuted },
  usd: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.surfaceBorder, marginHorizontal: Spacing.md },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  loadingText: { fontSize: 13, color: Colors.textMuted },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  emptyText: { fontSize: 13, color: Colors.textMuted },
  unsupportedNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  unsupportedText: { fontSize: 12, color: Colors.textMuted },
});
