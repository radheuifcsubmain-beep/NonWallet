// OnSpace Wallet — Discover Browser
import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput,
  ActivityIndicator, Platform, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radii } from '../../constants/theme';

const DEFAULT_URL = 'https://www.google.com';
const SEARCH_ENGINE = 'https://www.google.com/search?q=';

const QUICK_LINKS = [
  { label: 'CoinGecko', url: 'https://www.coingecko.com', icon: '🦎' },
  { label: 'Etherscan', url: 'https://etherscan.io', icon: '🔍' },
  { label: 'Uniswap', url: 'https://app.uniswap.org', icon: '🦄' },
  { label: 'BscScan', url: 'https://bscscan.com', icon: '🔗' },
  { label: 'OpenSea', url: 'https://opensea.io', icon: '🌊' },
  { label: 'DeFi Pulse', url: 'https://defillama.com', icon: '📊' },
];

function isValidUrl(text: string): boolean {
  return (
    text.startsWith('http://') ||
    text.startsWith('https://') ||
    (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text) && !text.includes(' '))
  );
}

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (isValidUrl(trimmed)) return `https://${trimmed}`;
  return `${SEARCH_ENGINE}${encodeURIComponent(trimmed)}`;
}

// ── Web iframe browser ────────────────────────────────────────────────────────

function WebBrowser({ url, onLoadStart, onLoadEnd }: {
  url: string;
  onLoadStart: () => void;
  onLoadEnd: () => void;
}) {
  const iframeRef = useRef<any>(null);

  React.useEffect(() => {
    onLoadStart();
    const timer = setTimeout(onLoadEnd, 1500);
    return () => clearTimeout(timer);
  }, [url]);

  if (Platform.OS === 'web') {
    return (
      <iframe
        ref={iframeRef}
        src={url}
        style={{ flex: 1, border: 'none', width: '100%', height: '100%' }}
        title="OnSpace Browser"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        onLoad={onLoadEnd}
      />
    );
  }

  // Native: use WebView
  const WebView = require('react-native-webview').WebView;
  return (
    <WebView
      source={{ uri: url }}
      style={{ flex: 1 }}
      onLoadStart={onLoadStart}
      onLoadEnd={onLoadEnd}
      javaScriptEnabled
      domStorageEnabled
      sharedCookiesEnabled
      userAgent="Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
    />
  );
}

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const [currentUrl, setCurrentUrl] = useState(DEFAULT_URL);
  const [addressBarText, setAddressBarText] = useState(DEFAULT_URL);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showHome, setShowHome] = useState(true);
  const inputRef = useRef<TextInput>(null);

  const navigate = useCallback((target: string) => {
    const normalized = normalizeUrl(target);
    setCurrentUrl(normalized);
    setAddressBarText(normalized);
    setIsEditing(false);
    setShowHome(false);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!addressBarText.trim()) return;
    navigate(addressBarText);
  }, [addressBarText, navigate]);

  const handleQuickLink = useCallback((url: string) => {
    navigate(url);
  }, [navigate]);

  const handleHome = useCallback(() => {
    setShowHome(true);
    setCurrentUrl(DEFAULT_URL);
    setAddressBarText(DEFAULT_URL);
    setIsLoading(false);
  }, []);

  const handleAddressBarFocus = useCallback(() => {
    setIsEditing(true);
    inputRef.current?.setNativeProps?.({ selectTextOnFocus: true });
  }, []);

  const displayUrl = isEditing ? addressBarText : (() => {
    try {
      const u = new URL(currentUrl);
      return u.hostname + (u.pathname !== '/' ? u.pathname : '');
    } catch {
      return currentUrl;
    }
  })();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Address Bar ─────────────────────────────────────────────────── */}
      <View style={styles.toolbar}>
        <Pressable onPress={handleHome} style={styles.toolbarBtn} hitSlop={8}>
          <MaterialIcons name="home" size={22} color={Colors.textSecondary} />
        </Pressable>

        <Pressable
          style={styles.addressBar}
          onPress={() => {
            setIsEditing(true);
            setAddressBarText(currentUrl);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
        >
          <MaterialIcons name="lock" size={13} color={Colors.accent} style={styles.lockIcon} />
          {isEditing ? (
            <TextInput
              ref={inputRef}
              value={addressBarText}
              onChangeText={setAddressBarText}
              onSubmitEditing={handleSubmit}
              onBlur={() => {
                setIsEditing(false);
                setAddressBarText(currentUrl);
              }}
              returnKeyType="go"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.addressInput}
              placeholderTextColor={Colors.textMuted}
              placeholder="Search or enter URL..."
              selectTextOnFocus
            />
          ) : (
            <Text style={styles.addressText} numberOfLines={1}>
              {displayUrl}
            </Text>
          )}
          {isLoading && <ActivityIndicator size="small" color={Colors.primary} />}
        </Pressable>

        <Pressable
          onPress={handleSubmit}
          style={styles.toolbarBtn}
          hitSlop={8}
        >
          <MaterialIcons name="search" size={22} color={Colors.primary} />
        </Pressable>
      </View>

      {/* ── Loading bar ─────────────────────────────────────────────────── */}
      {isLoading && (
        <View style={styles.loadingBar}>
          <View style={styles.loadingFill} />
        </View>
      )}

      {/* ── Home / Quick Links ───────────────────────────────────────────── */}
      {showHome ? (
        <ScrollView
          contentContainerStyle={[styles.homeContent, { paddingBottom: insets.bottom + 90 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Search bar */}
          <View style={styles.googleBranding}>
            <Text style={styles.googleG}>G</Text>
            <Text style={[styles.googleG, { color: '#EA4335' }]}>o</Text>
            <Text style={[styles.googleG, { color: '#FBBC05' }]}>o</Text>
            <Text style={[styles.googleG, { color: '#34A853' }]}>g</Text>
            <Text style={[styles.googleG, { color: '#EA4335' }]}>l</Text>
            <Text style={[styles.googleG, { color: '#4285F4' }]}>e</Text>
          </View>

          <View style={styles.homeSearchBar}>
            <MaterialIcons name="search" size={20} color={Colors.textMuted} />
            <TextInput
              value={addressBarText === DEFAULT_URL ? '' : addressBarText}
              onChangeText={setAddressBarText}
              onSubmitEditing={handleSubmit}
              onFocus={() => {
                if (addressBarText === DEFAULT_URL) setAddressBarText('');
              }}
              placeholder="Search Google or enter a URL"
              placeholderTextColor={Colors.textMuted}
              style={styles.homeSearchInput}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
            />
            <Pressable onPress={handleSubmit} hitSlop={8}>
              <MaterialIcons name="arrow-forward" size={20} color={Colors.primary} />
            </Pressable>
          </View>

          {/* Quick links */}
          <Text style={styles.quickLinksLabel}>Quick Access</Text>
          <View style={styles.quickLinksGrid}>
            {QUICK_LINKS.map((link) => (
              <Pressable
                key={link.url}
                onPress={() => handleQuickLink(link.url)}
                style={({ pressed }) => [styles.quickCard, pressed && styles.quickCardPressed]}
              >
                <Text style={styles.quickEmoji}>{link.icon}</Text>
                <Text style={styles.quickLabel}>{link.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* DeFi section */}
          <View style={styles.defiInfo}>
            <MaterialIcons name="info-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.defiInfoText}>
              Powered by Google Chrome Engine · dApp compatible browser
            </Text>
          </View>
        </ScrollView>
      ) : (
        /* ── WebView / iframe ─────────────────────────────────────────── */
        <View style={styles.browserContainer}>
          <WebBrowser
            url={currentUrl}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
  },
  toolbarBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  addressBar: {
    flex: 1,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: 12,
    gap: 6,
  },
  lockIcon: { marginRight: 2 },
  addressInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 13,
    height: '100%',
  },
  addressText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 13,
  },

  loadingBar: {
    height: 2,
    backgroundColor: Colors.surfaceBorder,
  },
  loadingFill: {
    height: '100%',
    width: '70%',
    backgroundColor: Colors.primary,
  },

  browserContainer: { flex: 1 },

  // Home styles
  homeContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    alignItems: 'center',
  },
  googleBranding: {
    flexDirection: 'row',
    marginTop: Spacing.xl,
    marginBottom: 4,
  },
  googleG: {
    fontSize: 52,
    fontWeight: '700',
    color: '#4285F4',
  },
  homeSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: Spacing.md,
    height: 50,
    width: '100%',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  homeSearchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
  },

  quickLinksLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    alignSelf: 'flex-start',
  },
  quickLinksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'flex-start',
    width: '100%',
  },
  quickCard: {
    width: '30%',
    aspectRatio: 1.1,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  quickCardPressed: {
    backgroundColor: Colors.primaryDim,
    borderColor: Colors.primary + '55',
  },
  quickEmoji: { fontSize: 28 },
  quickLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },

  defiInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
  },
  defiInfoText: { fontSize: 11, color: Colors.textMuted, textAlign: 'center', flex: 1 },
});
