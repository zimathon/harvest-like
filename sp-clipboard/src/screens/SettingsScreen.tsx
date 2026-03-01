import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { List, Switch, Divider, Text, Button, SegmentedButtons } from 'react-native-paper';
import { useSettingsStore } from '../stores/settingsStore';
import { useClipboardStore } from '../stores/clipboardStore';
import * as storageService from '../services/storageService';

const HISTORY_LIMITS = [
  { value: '100', label: '100' },
  { value: '500', label: '500' },
  { value: '1000', label: '1000' },
];

export default function SettingsScreen() {
  const { settings, loadSettings, updateSetting } = useSettingsStore();
  const { loadItems } = useClipboardStore();
  const [itemCount, setItemCount] = React.useState(0);

  useEffect(() => {
    loadSettings();
    loadItemCount();
  }, []);

  const loadItemCount = async () => {
    const count = await storageService.getItemCount();
    setItemCount(count);
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to delete all clipboard history? Pinned items will be kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await storageService.deleteOldestItems(0);
            await loadItems();
            await loadItemCount();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <List.Section>
        <List.Subheader>Clipboard</List.Subheader>
        <List.Item
          title="Auto-detect category"
          description="Automatically classify copied content"
          left={(props) => <List.Icon {...props} icon="auto-fix" />}
          right={() => (
            <Switch
              value={settings.autoDetectCategory}
              onValueChange={(v) => updateSetting('autoDetectCategory', v)}
            />
          )}
        />
        <List.Item
          title="Duplicate detection"
          description="Skip saving duplicate content"
          left={(props) => <List.Icon {...props} icon="content-duplicate" />}
          right={() => (
            <Switch
              value={settings.duplicateDetection}
              onValueChange={(v) => updateSetting('duplicateDetection', v)}
            />
          )}
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>History limit</List.Subheader>
        <View style={styles.segmentContainer}>
          <SegmentedButtons
            value={String(settings.maxHistoryItems)}
            onValueChange={(v) => updateSetting('maxHistoryItems', Number(v))}
            buttons={HISTORY_LIMITS}
          />
        </View>
        <Text variant="bodySmall" style={styles.helperText}>
          Maximum number of items to keep ({itemCount} items stored)
        </Text>
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>Appearance</List.Subheader>
        <View style={styles.segmentContainer}>
          <SegmentedButtons
            value={settings.theme}
            onValueChange={(v) =>
              updateSetting('theme', v as 'light' | 'dark' | 'system')
            }
            buttons={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ]}
          />
        </View>
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>Cloud Sync</List.Subheader>
        <List.Item
          title="Cloud sync"
          description="Sync clipboard history across devices"
          left={(props) => <List.Icon {...props} icon="cloud-sync" />}
          right={() => (
            <Switch
              value={settings.cloudSyncEnabled}
              onValueChange={(v) => updateSetting('cloudSyncEnabled', v)}
              disabled
            />
          )}
        />
        <Text variant="bodySmall" style={styles.helperText}>
          Coming soon - requires login
        </Text>
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>Data</List.Subheader>
        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            icon="delete-sweep"
            onPress={handleClearHistory}
            textColor="#EF4444"
            style={styles.clearButton}
          >
            Clear All History
          </Button>
        </View>
      </List.Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  segmentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  helperText: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    color: '#9CA3AF',
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  clearButton: {
    borderColor: '#EF4444',
  },
});
