// Powered by OnSpace.AI
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  TextInput, Alert, Platform, Modal, TouchableOpacity,
  KeyboardAvoidingView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useWallet } from '../hooks/useWallet';
import { Colors, Spacing, Radii } from '../constants/theme';

export default function ImportWalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { importWallet } = useWallet();

  const [inputMnemonic, setInputMnemonic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '' });

  const showAlert = useCallback((title: string, message: string) => {
    if (Platform.OS === 'web') {
      setAlertConfig({ visible: true, title, message });
    } else {
      Alert.alert(title, message);
    }
  }, []);

  const wordCount = inputMnemonic.trim() ? inputMnemonic.trim().split(/\s+/).length : 0;

  const handleImport = useCallback(async () => {
    if (!inputMnemonic.trim()) {
      setError('Please enter your seed phrase');
      return;
    }
    if (wordCount !== 12 && wordCount !== 24) {
      setError(`Please enter exactly 12 words (currently ${wordCount})`);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const success = await importWallet(inputMnemonic);
      if (success) {
        router.replace('/(tabs)');
      } else {
        setError('Invalid seed phrase. Please check your words and try again.');
      }
    } catch {
      showAlert('Error', 'Failed to import wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [inputMnemonic, wordCount, importWallet]);

  const wordChips = inputMnemonic.trim()
    ? inputMnemonic.trim().split(/\s+/)
    : [];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Import Wallet</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Security notice */}
          <View style={styles.securityBanner}>
            <MaterialIcons name="lock" size={18} color={Colors.accent} />
            <Text style={styles.securityText}>
              Your seed phrase stays on your device. We never have access to it.
            </Text>
          </View>

          <Text style={styles.title}>Enter Seed Phrase</Text>
          <Text style={styles.subtitle}>
            Enter your 12 or 24-word recovery phrase separated by spaces.
          </Text>

          {/* Word count badge */}
          <View style={styles.wordCountRow}>
            <Text style={styles.wordCountLabel}>Words entered:</Text>
            <View style={[
              styles.wordCountBadge,
              wordCount === 12 || wordCount === 24 ? styles.wordCountValid : null,
            ]}>
              <Text style={[
                styles.wordCountNum,
                wordCount === 12 || wordCount === 24 ? { color: Colors.accent } : null,
              ]}>
                {wordCount} / 12
              </Text>
            </View>
          </View>

          {/* Input */}
          <View style={[styles.inputCard, error ? styles.inputCardError : null]}>
            <TextInput
              value={inputMnemonic}
              onChangeText={(t) => { setInputMnemonic(t.toLowerCase()); setError(''); }}
              placeholder="Enter word1 word2 word3..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              style={styles.textInput}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              secureTextEntry={false}
            />
          </View>

          {error ? (
            <View style={styles.errorRow}>
              <MaterialIcons name="error-outline" size={14} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Word chips preview */}
          {wordChips.length > 0 && (
            <View style={styles.chipGrid}>
              {wordChips.map((word, idx) => (
                <View key={idx} style={styles.wordChip}>
                  <Text style={styles.chipNum}>{idx + 1}</Text>
                  <Text style={styles.chipWord}>{word}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Warning */}
          <View style={styles.warningBox}>
            <MaterialIcons name="warning-amber" size={16} color={Colors.warning} />
            <View style={{ flex: 1 }}>
              <Text style={styles.warningTitle}>Security Warnings:</Text>
              <Text style={styles.warningItem}>• Only import on trusted devices</Text>
              <Text style={styles.warningItem}>• Clear clipboard after pasting</Text>
              <Text style={styles.warningItem}>• Never import on public/shared devices</Text>
            </View>
          </View>

          {/* Import button */}
          <Pressable
            onPress={handleImport}
            disabled={loading || wordCount === 0}
            style={({ pressed }) => [
              styles.importBtn,
              pressed && styles.pressed,
              (loading || wordCount === 0) && styles.importBtnDisabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator color={Colors.textInverse} />
            ) : (
              <>
                <MaterialIcons name="file-download" size={20} color={Colors.textInverse} />
                <Text style={styles.importBtnText}>Import Wallet</Text>
              </>
            )}
          </Pressable>
        </ScrollView>

        {/* Web Alert */}
        {Platform.OS === 'web' && (
          <Modal visible={alertConfig.visible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>{alertConfig.title}</Text>
                <Text style={styles.modalMessage}>{alertConfig.message}</Text>
                <TouchableOpacity
                  style={styles.modalBtn}
                  onPress={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
                >
                  <Text style={styles.modalBtnText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  scrollContent: { padding: Spacing.md, gap: Spacing.md },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.accentDim,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.accent + '44',
    padding: Spacing.sm,
  },
  securityText: { flex: 1, fontSize: 12, color: Colors.accent, lineHeight: 18 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  wordCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordCountLabel: { fontSize: 13, color: Colors.textMuted },
  wordCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  wordCountValid: { borderColor: Colors.accent },
  wordCountNum: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  inputCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.sm,
  },
  inputCardError: { borderColor: Colors.error },
  textInput: {
    color: Colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 100,
    textAlignVertical: 'top',
    fontFamily: 'monospace',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorText: { fontSize: 13, color: Colors.error },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  wordChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  chipNum: { fontSize: 10, color: Colors.textMuted, minWidth: 12 },
  chipWord: { fontSize: 12, color: Colors.primary, fontFamily: 'monospace' },
  warningBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Colors.warning + '15',
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.warning + '44',
    padding: Spacing.md,
  },
  warningTitle: { fontSize: 13, fontWeight: '600', color: Colors.warning, marginBottom: 4 },
  warningItem: { fontSize: 12, color: Colors.warning, lineHeight: 18 },
  importBtn: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: Radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  importBtnDisabled: { opacity: 0.5 },
  importBtnText: { fontSize: 16, fontWeight: '600', color: Colors.textInverse },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    width: 300,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  modalMessage: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 16 },
  modalBtn: { backgroundColor: Colors.primary, borderRadius: Radii.md, padding: 12, alignItems: 'center' },
  modalBtnText: { color: Colors.textInverse, fontWeight: '600', fontSize: 15 },
});
