// Powered by OnSpace.AI
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Alert, Platform, Modal, TouchableOpacity, Switch, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useWallet } from '../../hooks/useWallet';
import { GlassCard } from '../../components/ui/GlassCard';
import { LockScreen } from '../../components/feature/LockScreen';
import { SeedPhraseGrid } from '../../components/feature/SeedPhraseGrid';
import { Colors, Spacing, Radii } from '../../constants/theme';
import { NETWORKS, NetworkId } from '../../constants/config';

const NETWORK_ICONS: Record<NetworkId, string> = {
  ethereum: 'Ξ',
  bsc: '⬡',
  polygon: '⬟',
  solana: '◎',
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    mnemonic, addresses, removeWallet, selectedNetwork,
    biometricEnabled, biometricAvailable, enableBiometric, disableBiometric,
    lockWallet, isLocked,
  } = useWallet();

  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [showSeedConfirm, setShowSeedConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddresses, setShowAddresses] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', onOk: undefined as (() => void) | undefined });

  const showAlert = useCallback((title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
      setAlertConfig({ visible: true, title, message, onOk });
    } else {
      Alert.alert(title, message, onOk
        ? [{ text: 'Cancel', style: 'cancel' }, { text: 'OK', onPress: onOk }]
        : [{ text: 'OK' }]);
    }
  }, []);

  const handleDeleteWallet = useCallback(async () => {
    await removeWallet();
    router.replace('/');
  }, [removeWallet]);

  const handleBiometricToggle = useCallback(async (value: boolean) => {
    if (value) {
      if (!biometricAvailable) {
        showAlert('Not Available', 'Your device does not support biometric authentication or none are enrolled.');
        return;
      }
      setShowPinSetup(true);
    } else {
      await disableBiometric();
    }
  }, [biometricAvailable, disableBiometric]);

  const handleSavePIN = useCallback(async () => {
    if (newPin.length < 6) { setPinError('PIN must be at least 6 digits'); return; }
    if (newPin !== confirmPin) { setPinError('PINs do not match'); return; }
    await enableBiometric(newPin);
    setShowPinSetup(false);
    setNewPin('');
    setConfirmPin('');
    setPinError('');
  }, [newPin, confirmPin, enableBiometric]);

  const currentNetwork = NETWORKS[selectedNetwork];

  if (isLocked) return <LockScreen onUnlocked={() => {}} />; // Lock screen handles unlock via context

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Pressable
          onPress={lockWallet}
          style={({ pressed }) => [styles.lockBtn, pressed && { opacity: 0.7 }]}
          hitSlop={8}
        >
          <MaterialIcons name="lock" size={18} color={Colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
      >
        {/* Wallet info card */}
        <GlassCard style={styles.walletCard}>
          <View style={[styles.walletIconBg, { backgroundColor: currentNetwork.color + '22' }]}>
            <Text style={[styles.walletIcon, { color: currentNetwork.color }]}>
              {NETWORK_ICONS[selectedNetwork]}
            </Text>
          </View>
          <View>
            <Text style={styles.walletTitle}>My Wallet</Text>
            <Text style={styles.walletSubtitle}>Non-Custodial · Multi-Chain</Text>
          </View>
        </GlassCard>

        {/* ── Security ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Security</Text>
          <GlassCard padding={0}>
            {/* Biometric toggle */}
            <View style={styles.settingRow}>
              <View style={[styles.settingIconBg, { backgroundColor: Colors.primary + '22' }]}>
                <MaterialIcons name="fingerprint" size={18} color={Colors.primary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Biometric Lock</Text>
                <Text style={styles.settingSubtitle}>
                  {biometricAvailable ? 'Lock app with fingerprint / Face ID' : 'Not available on this device'}
                </Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                disabled={!biometricAvailable}
                trackColor={{ false: Colors.surfaceBorder, true: Colors.primary + '88' }}
                thumbColor={biometricEnabled ? Colors.primary : Colors.textMuted}
              />
            </View>

            <View style={styles.rowDivider} />

            {/* Lock now */}
            <Pressable
              style={({ pressed }) => [styles.settingRow, pressed && styles.settingRowPressed]}
              onPress={lockWallet}
            >
              <View style={[styles.settingIconBg, { backgroundColor: Colors.warning + '22' }]}>
                <MaterialIcons name="lock" size={18} color={Colors.warning} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Lock Wallet Now</Text>
                <Text style={styles.settingSubtitle}>Require auth to re-open</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
            </Pressable>

            <View style={styles.rowDivider} />

            {/* Non-custodial badge */}
            <View style={styles.settingRow}>
              <View style={[styles.settingIconBg, { backgroundColor: Colors.accent + '22' }]}>
                <MaterialIcons name="security" size={18} color={Colors.accent} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Non-Custodial</Text>
                <Text style={styles.settingSubtitle}>Your keys never leave this device</Text>
              </View>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓</Text>
              </View>
            </View>
          </GlassCard>
        </View>

        {/* ── Wallet ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Wallet</Text>
          <GlassCard padding={0}>
            <Pressable
              style={({ pressed }) => [styles.settingRow, pressed && styles.settingRowPressed]}
              onPress={() => setShowSeedConfirm(true)}
            >
              <View style={[styles.settingIconBg, { backgroundColor: Colors.warning + '22' }]}>
                <MaterialIcons name="security" size={18} color={Colors.warning} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Backup Seed Phrase</Text>
                <Text style={styles.settingSubtitle}>View your 12-word recovery phrase</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
            </Pressable>

            <View style={styles.rowDivider} />

            <Pressable
              style={({ pressed }) => [styles.settingRow, pressed && styles.settingRowPressed]}
              onPress={() => setShowAddresses(!showAddresses)}
            >
              <View style={[styles.settingIconBg, { backgroundColor: Colors.primary + '22' }]}>
                <MaterialIcons name="info-outline" size={18} color={Colors.primary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Wallet Addresses</Text>
                <Text style={styles.settingSubtitle}>View all network addresses</Text>
              </View>
              <MaterialIcons name={showAddresses ? 'expand-less' : 'expand-more'} size={20} color={Colors.textMuted} />
            </Pressable>

            {showAddresses && addresses && (
              <View style={styles.addressesContainer}>
                {(Object.keys(NETWORKS) as NetworkId[]).map((networkId) => (
                  <View key={networkId} style={styles.addressItem}>
                    <View style={[styles.smallBadge, { backgroundColor: NETWORKS[networkId].color + '22' }]}>
                      <Text style={[styles.networkIconText, { color: NETWORKS[networkId].color }]}>
                        {NETWORK_ICONS[networkId]}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.addressNetworkName}>{NETWORKS[networkId].name}</Text>
                      <Text style={styles.addressValue} numberOfLines={1} ellipsizeMode="middle">
                        {addresses[networkId]}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </GlassCard>
        </View>

        {/* ── Networks ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Connected Networks</Text>
          <GlassCard padding={0}>
            {(Object.keys(NETWORKS) as NetworkId[]).map((networkId, idx) => (
              <React.Fragment key={networkId}>
                <View style={styles.settingRow}>
                  <View style={[styles.settingIconBg, { backgroundColor: NETWORKS[networkId].color + '22' }]}>
                    <Text style={[styles.networkIconText, { color: NETWORKS[networkId].color }]}>
                      {NETWORK_ICONS[networkId]}
                    </Text>
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>{NETWORKS[networkId].name}</Text>
                    <Text style={styles.settingSubtitle} numberOfLines={1}>
                      {NETWORKS[networkId].rpcUrl.replace('https://', '').split('/')[0]}
                    </Text>
                  </View>
                  <View style={styles.chainIdBadge}>
                    <Text style={styles.chainIdText}>
                      {NETWORKS[networkId].chainId > 0 ? `Chain ${NETWORKS[networkId].chainId}` : 'Mainnet'}
                    </Text>
                  </View>
                </View>
                {idx < Object.keys(NETWORKS).length - 1 && <View style={styles.rowDivider} />}
              </React.Fragment>
            ))}
          </GlassCard>
        </View>

        {/* ── Danger Zone ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: Colors.error }]}>Danger Zone</Text>
          <GlassCard padding={0}>
            <Pressable
              style={({ pressed }) => [styles.settingRow, pressed && styles.settingRowPressed]}
              onPress={() => setShowDeleteConfirm(true)}
            >
              <View style={[styles.settingIconBg, { backgroundColor: Colors.error + '22' }]}>
                <MaterialIcons name="delete-forever" size={18} color={Colors.error} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: Colors.error }]}>Remove Wallet</Text>
                <Text style={styles.settingSubtitle}>Delete wallet from this device</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
            </Pressable>
          </GlassCard>
        </View>

        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>CryptoVault v1.0.0</Text>
          <Text style={styles.appInfoText}>Non-Custodial · ethers.js · BIP39/44</Text>
        </View>
      </ScrollView>

      {/* ── PIN setup modal ── */}
      {showPinSetup && (
        <View style={styles.modalOverlay}>
          <Pressable style={styles.backdrop} onPress={() => setShowPinSetup(false)} />
          <GlassCard style={styles.pinCard}>
            <MaterialIcons name="fingerprint" size={32} color={Colors.primary} />
            <Text style={styles.confirmTitle}>Set Wallet PIN</Text>
            <Text style={styles.confirmText}>
              Set a PIN as a fallback for biometric authentication.
            </Text>
            <TextInput
              value={newPin}
              onChangeText={setNewPin}
              placeholder="Enter 6-digit PIN"
              placeholderTextColor={Colors.textMuted}
              style={styles.pinInput}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
            />
            <TextInput
              value={confirmPin}
              onChangeText={setConfirmPin}
              placeholder="Confirm PIN"
              placeholderTextColor={Colors.textMuted}
              style={styles.pinInput}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
            />
            {pinError ? <Text style={styles.pinError}>{pinError}</Text> : null}
            <View style={styles.confirmActions}>
              <Pressable style={styles.confirmCancelBtn} onPress={() => setShowPinSetup(false)}>
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.confirmOkBtn} onPress={handleSavePIN}>
                <Text style={styles.confirmOkText}>Enable Lock</Text>
              </Pressable>
            </View>
          </GlassCard>
        </View>
      )}

      {/* ── Seed confirm modal ── */}
      {showSeedConfirm && (
        <View style={styles.modalOverlay}>
          <Pressable style={styles.backdrop} onPress={() => setShowSeedConfirm(false)} />
          <GlassCard style={styles.confirmCard}>
            <MaterialIcons name="warning" size={32} color={Colors.warning} />
            <Text style={styles.confirmTitle}>View Seed Phrase</Text>
            <Text style={styles.confirmText}>Make sure no one can see your screen. Never share your seed phrase.</Text>
            <View style={styles.confirmActions}>
              <Pressable style={styles.confirmCancelBtn} onPress={() => setShowSeedConfirm(false)}>
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.confirmOkBtn} onPress={() => { setShowSeedConfirm(false); setShowSeedPhrase(true); }}>
                <Text style={styles.confirmOkText}>Show Phrase</Text>
              </Pressable>
            </View>
          </GlassCard>
        </View>
      )}

      {/* ── Seed phrase display modal ── */}
      {showSeedPhrase && mnemonic && (
        <View style={styles.modalOverlay}>
          <Pressable style={styles.backdrop} onPress={() => setShowSeedPhrase(false)} />
          <GlassCard style={styles.seedCard}>
            <View style={styles.seedHeader}>
              <Text style={styles.seedTitle}>Your Seed Phrase</Text>
              <Pressable onPress={() => setShowSeedPhrase(false)} hitSlop={8}>
                <MaterialIcons name="close" size={22} color={Colors.textSecondary} />
              </Pressable>
            </View>
            <View style={styles.warningBanner}>
              <MaterialIcons name="warning" size={14} color={Colors.warning} />
              <Text style={styles.warningText}>Never share this with anyone!</Text>
            </View>
            <SeedPhraseGrid mnemonic={mnemonic} />
          </GlassCard>
        </View>
      )}

      {/* ── Delete confirm modal ── */}
      {showDeleteConfirm && (
        <View style={styles.modalOverlay}>
          <Pressable style={styles.backdrop} onPress={() => setShowDeleteConfirm(false)} />
          <GlassCard style={styles.confirmCard}>
            <MaterialIcons name="delete-forever" size={32} color={Colors.error} />
            <Text style={[styles.confirmTitle, { color: Colors.error }]}>Remove Wallet</Text>
            <Text style={styles.confirmText}>
              This permanently deletes your wallet. Make sure you have your seed phrase backed up.
            </Text>
            <View style={styles.confirmActions}>
              <Pressable style={styles.confirmCancelBtn} onPress={() => setShowDeleteConfirm(false)}>
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmOkBtn, { backgroundColor: Colors.error }]}
                onPress={() => { setShowDeleteConfirm(false); handleDeleteWallet(); }}
              >
                <Text style={styles.confirmOkText}>Delete</Text>
              </Pressable>
            </View>
          </GlassCard>
        </View>
      )}

      {/* Web alert */}
      {Platform.OS === 'web' && (
        <Modal visible={alertConfig.visible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.confirmCard, { backgroundColor: Colors.surfaceElevated, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.surfaceBorder }]}>
              <Text style={styles.confirmTitle}>{alertConfig.title}</Text>
              <Text style={styles.confirmText}>{alertConfig.message}</Text>
              <View style={styles.confirmActions}>
                <Pressable style={styles.confirmCancelBtn} onPress={() => setAlertConfig(p => ({ ...p, visible: false }))}>
                  <Text style={styles.confirmCancelText}>Cancel</Text>
                </Pressable>
                <TouchableOpacity
                  style={styles.confirmOkBtn}
                  onPress={() => { alertConfig.onOk?.(); setAlertConfig(p => ({ ...p, visible: false })); }}
                >
                  <Text style={styles.confirmOkText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  lockBtn: {
    width: 40,
    height: 40,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: { gap: Spacing.md, padding: Spacing.md },
  walletCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderColor: Colors.primary + '44' },
  walletIconBg: { width: 52, height: 52, borderRadius: Radii.lg, alignItems: 'center', justifyContent: 'center' },
  walletIcon: { fontSize: 22, fontWeight: '700' },
  walletTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  walletSubtitle: { fontSize: 12, color: Colors.textMuted },
  section: { gap: 8 },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  settingRowPressed: { backgroundColor: Colors.surface },
  settingIconBg: { width: 36, height: 36, borderRadius: Radii.sm, alignItems: 'center', justifyContent: 'center' },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  settingSubtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  rowDivider: { height: 1, backgroundColor: Colors.surfaceBorder, marginLeft: 68 },
  networkIconText: { fontSize: 16, fontWeight: '700' },
  verifiedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedText: { fontSize: 12, color: Colors.accent, fontWeight: '700' },
  chainIdBadge: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radii.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  chainIdText: { fontSize: 10, color: Colors.textMuted, fontWeight: '600' },
  addressesContainer: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm, gap: 8 },
  addressItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  smallBadge: { width: 30, height: 30, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center' },
  addressNetworkName: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary },
  addressValue: { fontSize: 11, color: Colors.textMuted, fontFamily: 'monospace' },
  appInfo: { alignItems: 'center', gap: 4, paddingBottom: 8 },
  appInfoText: { fontSize: 11, color: Colors.textMuted },
  modalOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 100, padding: Spacing.md },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)' },
  confirmCard: { gap: Spacing.md, alignItems: 'center', borderRadius: Radii.xl },
  pinCard: { gap: Spacing.md, alignItems: 'center', borderRadius: Radii.xl, width: '100%' },
  confirmTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  confirmText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  confirmActions: { flexDirection: 'row', gap: Spacing.sm, width: '100%' },
  confirmCancelBtn: {
    flex: 1, height: 46, backgroundColor: Colors.surfaceElevated,
    borderRadius: Radii.md, borderWidth: 1, borderColor: Colors.surfaceBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  confirmCancelText: { fontSize: 15, fontWeight: '500', color: Colors.textSecondary },
  confirmOkBtn: { flex: 1, height: 46, backgroundColor: Colors.primary, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center' },
  confirmOkText: { fontSize: 15, fontWeight: '600', color: Colors.textInverse },
  pinInput: {
    width: '100%',
    height: 48,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: Spacing.md,
    color: Colors.textPrimary,
    fontSize: 18,
    letterSpacing: 8,
    textAlign: 'center',
  },
  pinError: { fontSize: 13, color: Colors.error, textAlign: 'center' },
  seedCard: { gap: Spacing.md, borderRadius: Radii.xl },
  seedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  seedTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  warningBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.warning + '15', borderRadius: Radii.sm, padding: Spacing.xs,
  },
  warningText: { fontSize: 12, color: Colors.warning, fontWeight: '500' },
});
