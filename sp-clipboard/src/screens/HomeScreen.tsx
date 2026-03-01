import React, { useEffect, useCallback, useMemo } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, FAB, Snackbar } from 'react-native-paper';
import { useClipboardStore } from '../stores/clipboardStore';
import { useSettingsStore } from '../stores/settingsStore';
import * as clipboardService from '../services/clipboardService';
import ClipboardItemCard from '../components/ClipboardItemCard';
import SearchBarComponent from '../components/SearchBar';
import { ClipboardItem, FilterType } from '../types';

export default function HomeScreen() {
  const {
    items,
    isLoading,
    filter,
    setFilter,
    loadItems,
    deleteItem,
    togglePin,
    toggleFavorite,
    copyItem,
    searchItems,
  } = useClipboardStore();
  const { settings, loadSettings } = useSettingsStore();
  const [snackVisible, setSnackVisible] = React.useState(false);

  useEffect(() => {
    loadSettings();
    loadItems();
  }, []);

  // Start clipboard monitoring
  useEffect(() => {
    clipboardService.startMonitoring(settings.duplicateDetection);
    const removeListener = clipboardService.addListener(() => {
      loadItems();
    });

    return () => {
      removeListener();
      clipboardService.stopMonitoring();
    };
  }, [settings.duplicateDetection]);

  const handleCopy = useCallback(
    async (id: string) => {
      await copyItem(id);
      setSnackVisible(true);
    },
    [copyItem]
  );

  const handleSearch = useCallback(
    (query: string) => {
      searchItems(query);
    },
    [searchItems]
  );

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    if (filter === 'pinned') return items.filter((i) => i.isPinned);
    if (filter === 'favorite') return items.filter((i) => i.isFavorite);
    return items.filter((i) => i.category === filter);
  }, [items, filter]);

  const renderItem = useCallback(
    ({ item }: { item: ClipboardItem }) => (
      <ClipboardItemCard
        item={item}
        onCopy={handleCopy}
        onDelete={deleteItem}
        onTogglePin={togglePin}
        onToggleFavorite={toggleFavorite}
      />
    ),
    [handleCopy, deleteItem, togglePin, toggleFavorite]
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text variant="headlineSmall" style={styles.emptyTitle}>
        No clipboard history
      </Text>
      <Text variant="bodyMedium" style={styles.emptySubtitle}>
        Copy something and come back here to see your history
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <SearchBarComponent
        onSearch={handleSearch}
        onFilterChange={setFilter}
        currentFilter={filter}
      />
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={renderEmpty}
        refreshing={isLoading}
        onRefresh={loadItems}
      />
      <FAB
        icon="clipboard-text"
        style={styles.fab}
        onPress={() => clipboardService.captureClipboard(settings.duplicateDetection).then(() => loadItems())}
        label="Capture"
      />
      <Snackbar
        visible={snackVisible}
        onDismiss={() => setSnackVisible(false)}
        duration={1500}
      >
        Copied to clipboard
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  list: {
    paddingVertical: 8,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#9CA3AF',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
