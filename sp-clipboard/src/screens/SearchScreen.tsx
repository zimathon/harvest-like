import React, { useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, Snackbar } from 'react-native-paper';
import { useClipboardStore } from '../stores/clipboardStore';
import ClipboardItemCard from '../components/ClipboardItemCard';
import SearchBarComponent from '../components/SearchBar';
import { ClipboardItem } from '../types';

export default function SearchScreen() {
  const {
    items,
    isLoading,
    filter,
    setFilter,
    deleteItem,
    togglePin,
    toggleFavorite,
    copyItem,
    searchItems,
  } = useClipboardStore();
  const [snackVisible, setSnackVisible] = React.useState(false);

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

  const filteredItems = React.useMemo(() => {
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
      <Text variant="bodyLarge" style={styles.emptyText}>
        Search your clipboard history
      </Text>
      <Text variant="bodyMedium" style={styles.emptySubtext}>
        Type to search or select a filter
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <SearchBarComponent
        onSearch={handleSearch}
        onFilterChange={setFilter}
        currentFilter={filter}
        showFilters={true}
      />
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={renderEmpty}
        refreshing={isLoading}
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
  },
  emptyText: {
    color: '#6B7280',
    marginBottom: 4,
  },
  emptySubtext: {
    color: '#9CA3AF',
  },
});
