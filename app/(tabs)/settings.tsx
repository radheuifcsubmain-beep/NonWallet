// Powered by OnSpace.AI
import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Alert, Platform, Modal, TouchableOpacity, Switch, TextInput,
  ActivityIndicator,
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
import { fetchTokenMetadataFromPinata, savePinataCredentials, getPinataCredentials } from '../../services/pinataService';
import { CustomToken } from '../../services/customTokenService';

const NETWORK_ICONS: Record<NetworkId, string> = {
  ethereum: 'Ξ',
  bsc: '⬡',
  polygon: '⬟',
  solana: '◎',
};

const KEYPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

// ── Inline PIN verify component for sensitive actions ─────────────────────────
function PinVerify({
  title,
  subtitle,
  onSuccess,
  onCancel,
}: {
  title: string;
  subtitle: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { unlockWithPIN } = useWallet();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const verifyPin = useCallback(async (entered: string) => {
    setLoading(true);
    setError('');
    try {
      const valid = await unlockWithPIN(entered);
      if (valid) {
        onSuccess();
      } else {
        setError('Incorrect PIN. Try again.');
        setPin('');
      }
    } catch {
      setError('Verification failed.');
      setPin('');
    } finally {
      setLoading(false);
    }
  }, [unlockWithPIN, onSuccess]);

  const handleDigit = useCallback((digit: string) => {
    if (loading) return;
    setError('');
    setPin(prev => {
      if (prev.length >= 6) return prev;
      const next = prev + digit;
      if (next.length === 6) {
        setTimeout(() => verifyPin(next), 50);
      }
      return next;
    });
  }, [loading, verifyPin]);

  const handleDelete = useCallback(() => {
    setError('');
    setPin(p => p.slice(0, -1));
  }, []);

  return (
    <View style={pinStyles.container}>
      <View style={pinStyles.iconBg}>
        <MaterialIcons name="lock" size={32} color={Colors.primary} />
      </View>
      <Text style={pinStyles.title}>{title}</Text>
      <Text style={pinStyles.subtitle}>{subtitle}</Text>

      {/* PIN dots */}
      <View style={pinStyles.dotsRow}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={[pinStyles.dot, i < pin.length && pinStyles.dotFilled]} />
        ))}
      </View>

      {error ? (
        <View style={pinStyles.errorRow}>
          <MaterialIcons name="error-outline" size={13} color={Colors.error} />
          <Text style={pinStyles.errorText}>{error}</Text>
        </View>
      ) : (
        <Text style={pinStyles.hint}>Enter your 6-digit PIN</Text>
      )}

      {/* Keypad */}
      <View style={pinStyles.keypad}>
        {KEYPAD.map((key, idx) => {
          if (key === '') return <View key={idx} style={pinStyles.keyEmpty} />;
          if (key === 'del') {
            return (
              <Pressable
                key={idx}
                onPress={handleDelete}
                style={({ pressed }) => [pinStyles.keyBtn, pressed && pinStyles.keyPressed]}
                disabled={loading}
                hitSlop={6}
              >
                <MaterialIcons name="backspace" size={20} color={Colors.textSecondary} />
              </Pressable>
            );
          }
          return (
            <Pressable
              key={idx}
              onPress={() => handleDigit(key)}
              style={({ pressed }) => [pinStyles.keyBtn, pressed && pinStyles.keyPressed]}
              disabled={loading}
            >
              <Text style={pinStyles.keyText}>{key}</Text>
            </Pressable>
          );
        })}
      </View>

      {loading && (
        <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 8 }} />
      )}

      <Pressable onPress={onCancel} style={pinStyles.cancelBtn}>
        <Text style={pinStyles.cancelText}>Cancel</Text>
      </Pressable>
    </View>
  );
}

const pinStyles = StyleSheet.create({
  container: { alignItems: 'center', gap: 12, width: '100%', paddingVertical: 8 },
  iconBg: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.primaryDim, borderWidth: 1, borderColor: Colors.primary + '44',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
  dotsRow: { flexDirection: 'row', gap: 12, marginVertical: 4 },
  dot: { width: 13, height: 13, borderRadius: 7, borderWidth: 2, borderColor: Colors.surfaceBorder, backgroundColor: 'transparent' },
  dotFilled: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  hint: { fontSize: 12, color: Colors.textMuted },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  errorText: { fontSize: 12, color: Colors.error },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: 260, gap: 10 },
  keyBtn: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.surfaceBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  keyEmpty: { width: 70, height: 70 },
  keyPressed: { backgroundColor: Colors.primaryDim, borderColor: Colors.primary },
  keyText: { fontSize: 22, fontWeight: '600', color: Colors.textPrimary },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 20 },
  cancelText: { fontSize: 14, color: Colors.textMuted, fontWeight: '500' },
});

// ── Main Settings Screen ──────────────────────────────────────────────────────

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    mnemonic, addresses, removeWallet, selectedNetwork,
    biometricEnabled, biometricAvailable, enableBiometric, disableBiometric,
    lockWallet, isLocked, customTokens, importCustomToken, deleteCustomToken,
    refreshCustomTokens,
  } = useWallet();

  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [showPinForSeed, setShowPinForSeed] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddresses, setShowAddresses] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', onOk: undefined as (() => void) | undefined });

  // Pinata state
  const [showPinataSetup, setShowPinataSetup] = useState(false);
  const [showTokenImport, setShowTokenImport] = useState(false);
  const [pinataKey, setPinataKey] = useState('');
  const [pinataSecret, setPinataSecret] = useState('');
  const [pinataConfigured, setPinataConfigured] = useState(false);
  const [tokenCid, setTokenCid] = useState('');
  const [tokenImporting, setTokenImporting] = useState(false);
  const [tokenImportError, setTokenImportError] = useState('');
  const [tokenImportSuccess, setTokenImportSuccess] = useState('');
  const [showCustomTokens, setShowCustomTokens] = useState(false);

  useEffect(() => {
    getPinataCredentials().then(c => setPinataConfigured(!!c));
    refreshCustomTokens();
  }, []);

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

  const handleSavePinata = useCallback(async () => {
    if (!pinataKey.trim() || !pinataSecret.trim()) return;
    await savePinataCredentials(pinataKey.trim(), pinataSecret.trim());
    setPinataConfigured(true);
    setShowPinataSetup(false);
    setPinataKey('');
    setPinataSecret('');
  }, [pinataKey, pinataSecret]);

  const handleImportToken = useCallback(async () => {
    if (!tokenCid.trim()) return;
    setTokenImporting(true);
    setTokenImportError('');
    setTokenImportSuccess('');
    try {
      const metadata = await fetchTokenMetadataFromPinata(tokenCid.trim());
      await importCustomToken(metadata);
      setTokenImportSuccess(`✓ ${metadata.name} (${metadata.symbol}) imported successfully!`);
      setTokenCid('');
    } catch (e: any) {
      setTokenImportError(e?.message ?? 'Failed to import token. Check the CID or URL.');
    } finally {
      setTokenImporting(false);
    }
  }, [tokenCid, importCustomToken]);

  const currentNetwork = NETWORKS[selectedNetwork];

  if (isLocked) return <LockScreen onUnlocked={() => {}} />;

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
          <View style={{ flex: 1 }}>
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
                <Text style={styles.settingSubtitle}>Require PIN to re-open</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
            </Pressable>

            <View style={styles.rowDivider} />

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
            {/* Backup seed — requires PIN */}
            <Pressable
              style={({ pressed }) => [styles.settingRow, pressed && styles.settingRowPressed]}
              onPress={() => setShowPinForSeed(true)}
            >
              <View style={[styles.settingIconBg, { backgroundColor: Colors.warning + '22' }]}>
                <MaterialIcons name="security" size={18} color={Colors.warning} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Backup Seed Phrase</Text>
                <Text style={styles.settingSubtitle}>PIN required to view recovery phrase</Text>
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

        {/* ── Token Management ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Token Management</Text>
          <GlassCard padding={0}>
            {/* Pinata config */}
            <Pressable
              style={({ pressed }) => [styles.settingRow, pressed && styles.settingRowPressed]}
              onPress={() => setShowPinataSetup(true)}
            >
              <View style={[styles.settingIconBg, { backgroundColor: '#E8431B22' }]}>
                <MaterialIcons name="cloud" size={18} color="#E8431B" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Pinata IPFS Config</Text>
                <Text style={styles.settingSubtitle}>
                  {pinataConfigured ? '✓ API credentials saved' : 'Configure Pinata API keys'}
                </Text>
              </View>
              <View style={[styles.configBadge, { backgroundColor: pinataConfigured ? Colors.accentDim : Colors.surfaceElevated }]}>
                <Text style={[styles.configBadgeText, { color: pinataConfigured ? Colors.accent : Colors.textMuted }]}>
                  {pinataConfigured ? 'Done' : 'Setup'}
                </Text>
              </View>
            </Pressable>

            <View style={styles.rowDivider} />

            {/* Import token */}
            <Pressable
              style={({ pressed }) => [styles.settingRow, pressed && styles.settingRowPressed]}
              onPress={() => setShowTokenImport(!showTokenImport)}
            >
              <View style={[styles.settingIconBg, { backgroundColor: Colors.primary + '22' }]}>
                <MaterialIcons name="add-circle-outline" size={18} color={Colors.primary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Import Token from Pinata</Text>
                <Text style={styles.settingSubtitle}>Add a custom token via IPFS CID or URL</Text>
              </View>
              <MaterialIcons name={showTokenImport ? 'expand-less' : 'expand-more'} size={20} color={Colors.textMuted} />
            </Pressable>

            {showTokenImport && (
              <View style={styles.importTokenSection}>
                <Text style={styles.importHint}>
                  Paste the Pinata CID or full gateway URL for the token metadata JSON.
                </Text>
                <View style={styles.cidInputRow}>
                  <TextInput
                    value={tokenCid}
                    onChangeText={(t) => { setTokenCid(t); setTokenImportError(''); setTokenImportSuccess(''); }}
                    placeholder="QmXxx... or https://gateway.pinata.cloud/ipfs/..."
                    placeholderTextColor={Colors.textMuted}
                    style={styles.cidInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                    multiline
                  />
                </View>
                {tokenImportError ? (
                  <View style={styles.importFeedback}>
                    <MaterialIcons name="error-outline" size={13} color={Colors.error} />
                    <Text style={styles.importErrorText}>{tokenImportError}</Text>
                  </View>
                ) : null}
                {tokenImportSuccess ? (
                  <View style={styles.importFeedback}>
                    <MaterialIcons name="check-circle" size={13} color={Colors.accent} />
                    <Text style={styles.importSuccessText}>{tokenImportSuccess}</Text>
                  </View>
                ) : null}
                <Pressable
                  onPress={handleImportToken}
                  disabled={tokenImporting || !tokenCid.trim()}
                  style={({ pressed }) => [
                    styles.importBtn,
                    pressed && { opacity: 0.8 },
                    (tokenImporting || !tokenCid.trim()) && styles.importBtnDisabled,
                  ]}
                >
                  {tokenImporting ? (
                    <ActivityIndicator size="small" color={Colors.textInverse} />
                  ) : (
                    <>
                      <MaterialIcons name="file-download" size={16} color={Colors.textInverse} />
                      <Text style={styles.importBtnText}>Import Token</Text>
                    </>
                  )}
                </Pressable>
              </View>
            )}

            <View style={styles.rowDivider} />

            {/* Custom tokens list */}
            <Pressable
              style={({ pressed }) => [styles.settingRow, pressed && styles.settingRowPressed]}
              onPress={() => setShowCustomTokens(!showCustomTokens)}
            >
              <View style={[styles.settingIconBg, { backgroundColor: Colors.secondary + '22' }]}>
                <MaterialIcons name="token" size={18} color={Colors.secondary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>My Custom Tokens</Text>
                <Text style={styles.settingSubtitle}>{customTokens.length} token{customTokens.length !== 1 ? 's' : ''} imported</Text>
              </View>
              <MaterialIcons name={showCustomTokens ? 'expand-less' : 'expand-more'} size={20} color={Colors.textMuted} />
            </Pressable>

            {showCustomTokens && (
              <View style={styles.customTokensContainer}>
                {customTokens.length === 0 ? (
                  <Text style={styles.noTokensText}>No custom tokens imported yet</Text>
                ) : (
                  customTokens.map((token: CustomToken) => (
                    <View key={token.id} style={styles.customTokenItem}>
                      <View style={[styles.tokenIconBg, { backgroundColor: token.color + '33' }]}>
                        <Text style={[styles.tokenIconText, { color: token.color }]}>
                          {token.symbol[0]}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.tokenNameRow}>
                          <Text style={styles.tokenName}>{token.symbol}</Text>
                          {token.isOwnToken && (
                            <View style={styles.ownBadge}>
                              <Text style={styles.ownBadgeText}>My Token</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.tokenNetwork}>{token.name} · {NETWORKS[token.network]?.name ?? token.network}</Text>
                        <Text style={styles.tokenAddr} numberOfLines={1} ellipsizeMode="middle">
                          {token.contractAddress}
                        </Text>
                      </View>
                      <Pressable onPress={() => deleteCustomToken(token.id)} hitSlop={8}>
                        <MaterialIcons name="delete-outline" size={18} color={Colors.error} />
                      </Pressable>
                    </View>
                  ))
                )}
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
          <Text style={styles.appInfoText}>OnSpace Wallet v1.0.0</Text>
          <Text style={styles.appInfoText}>Non-Custodial · ethers.js · BIP39/44 · Pinata IPFS</Text>
        </View>
      </ScrollView>

      {/* ── PIN verification before seed phrase ── */}
      {showPinForSeed && (
        <View style={styles.modalOverlay}>
          <Pressable style={styles.backdrop} onPress={() => setShowPinForSeed(false)} />
          <GlassCard style={styles.pinModalCard}>
            <PinVerify
              title="Verify Identity"
              subtitle="Enter your PIN to view your seed phrase"
              onSuccess={() => {
                setShowPinForSeed(false);
                setShowSeedPhrase(true);
              }}
              onCancel={() => setShowPinForSeed(false)}
            />
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

      {/* ── PIN setup modal (biometric) ── */}
      {showPinSetup && (
        <View style={styles.modalOverlay}>
          <Pressable style={styles.backdrop} onPress={() => setShowPinSetup(false)} />
          <GlassCard style={styles.confirmCard}>
            <MaterialIcons name="fingerprint" size={32} color={Colors.primary} />
            <Text style={styles.confirmTitle}>Set Wallet PIN</Text>
            <Text style={styles.confirmText}>Set a PIN as a fallback for biometric authentication.</Text>
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

      {/* ── Pinata Setup Modal ── */}
      {showPinataSetup && (
        <View style={styles.modalOverlay}>
          <Pressable style={styles.backdrop} onPress={() => setShowPinataSetup(false)} />
          <GlassCard style={styles.confirmCard}>
            <MaterialIcons name="cloud" size={32} color="#E8431B" />
            <Text style={styles.confirmTitle}>Pinata IPFS Setup</Text>
            <Text style={styles.confirmText}>
              Enter your Pinata API credentials to import token metadata from IPFS.
            </Text>
            <TextInput
              value={pinataKey}
              onChangeText={setPinataKey}
              placeholder="Pinata API Key"
              placeholderTextColor={Colors.textMuted}
              style={styles.pinInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              value={pinataSecret}
              onChangeText={setPinataSecret}
              placeholder="Pinata Secret API Key"
              placeholderTextColor={Colors.textMuted}
              style={styles.pinInput}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />
            <View style={styles.confirmActions}>
              <Pressable style={styles.confirmCancelBtn} onPress={() => setShowPinataSetup(false)}>
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.confirmOkBtn} onPress={handleSavePinata}>
                <Text style={styles.confirmOkText}>Save</Text>
              </Pressable>
            </View>
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
    width: 40, height: 40, borderRadius: Radii.full,
    backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.surfaceBorder,
    alignItems: 'center', justifyContent: 'center',
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
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.md, paddingVertical: 14,
  },
  settingRowPressed: { backgroundColor: Colors.surface },
  settingIconBg: { width: 36, height: 36, borderRadius: Radii.sm, alignItems: 'center', justifyContent: 'center' },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  settingSubtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  rowDivider: { height: 1, backgroundColor: Colors.surfaceBorder, marginLeft: 68 },
  networkIconText: { fontSize: 16, fontWeight: '700' },
  verifiedBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.accentDim, alignItems: 'center', justifyContent: 'center' },
  verifiedText: { fontSize: 12, color: Colors.accent, fontWeight: '700' },
  chainIdBadge: {
    backgroundColor: Colors.surfaceElevated, borderRadius: Radii.full,
    paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  chainIdText: { fontSize: 10, color: Colors.textMuted, fontWeight: '600' },
  addressesContainer: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm, gap: 8 },
  addressItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  smallBadge: { width: 30, height: 30, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center' },
  addressNetworkName: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary },
  addressValue: { fontSize: 11, color: Colors.textMuted, fontFamily: 'monospace' },

  // Token import
  configBadge: {
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radii.full,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  configBadgeText: { fontSize: 11, fontWeight: '600' },
  importTokenSection: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, gap: 10 },
  importHint: { fontSize: 12, color: Colors.textMuted, lineHeight: 18 },
  cidInputRow: {
    backgroundColor: Colors.surfaceElevated, borderRadius: Radii.md,
    borderWidth: 1, borderColor: Colors.surfaceBorder, padding: Spacing.sm,
  },
  cidInput: { color: Colors.textPrimary, fontSize: 13, minHeight: 60, fontFamily: 'monospace' },
  importFeedback: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  importErrorText: { flex: 1, fontSize: 12, color: Colors.error, lineHeight: 18 },
  importSuccessText: { flex: 1, fontSize: 12, color: Colors.accent, lineHeight: 18 },
  importBtn: {
    height: 44, backgroundColor: Colors.primary, borderRadius: Radii.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  importBtnDisabled: { opacity: 0.5 },
  importBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textInverse },

  customTokensContainer: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm, gap: 10 },
  noTokensText: { fontSize: 13, color: Colors.textMuted, paddingVertical: 8, textAlign: 'center' },
  customTokenItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 6 },
  tokenIconBg: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tokenIconText: { fontSize: 16, fontWeight: '700' },
  tokenNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tokenName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  ownBadge: {
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radii.full,
    backgroundColor: Colors.primaryDim, borderWidth: 1, borderColor: Colors.primary + '44',
  },
  ownBadgeText: { fontSize: 9, fontWeight: '700', color: Colors.primary },
  tokenNetwork: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  tokenAddr: { fontSize: 10, color: Colors.textMuted, fontFamily: 'monospace', marginTop: 1 },

  appInfo: { alignItems: 'center', gap: 4, paddingBottom: 8 },
  appInfoText: { fontSize: 11, color: Colors.textMuted },
  modalOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 100, padding: Spacing.md },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)' },
  pinModalCard: { gap: 0, borderRadius: Radii.xl, paddingVertical: Spacing.md },
  confirmCard: { gap: Spacing.md, alignItems: 'center', borderRadius: Radii.xl },
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
    width: '100%', height: 48, backgroundColor: Colors.surfaceElevated,
    borderRadius: Radii.md, borderWidth: 1, borderColor: Colors.surfaceBorder,
    paddingHorizontal: Spacing.md, color: Colors.textPrimary,
    fontSize: 18, letterSpacing: 8, textAlign: 'center',
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
