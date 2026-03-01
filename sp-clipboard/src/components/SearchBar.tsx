import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Searchbar, Chip } from 'react-native-paper';
import { ScrollView } from 'react-native';
import { FilterType, ClipboardCategory } from '../types';

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pinned', label: 'Pinned' },
  { key: 'favorite', label: 'Favorites' },
  { key: 'url', label: 'URL' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'code', label: 'Code' },
  { key: 'text', label: 'Text' },
];

interface SearchBarProps {
  onSearch: (query: string) => void;
  onFilterChange: (filter: FilterType) => void;
  currentFilter: FilterType;
  showFilters?: boolean;
}

export default function SearchBarComponent({
  onSearch,
  onFilterChange,
  currentFilter,
  showFilters = true,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChangeText = useCallback(
    (text: string) => {
      setQuery(text);
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        onSearch(text);
      }, 300);
    },
    [onSearch]
  );

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search clipboard history..."
        onChangeText={handleChangeText}
        value={query}
        style={styles.searchbar}
      />
      {showFilters && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {FILTER_OPTIONS.map((option) => (
            <Chip
              key={option.key}
              selected={currentFilter === option.key}
              onPress={() => onFilterChange(option.key)}
              style={styles.filterChip}
              compact
            >
              {option.label}
            </Chip>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  searchbar: {
    elevation: 1,
  },
  filterContainer: {
    marginTop: 8,
    maxHeight: 40,
  },
  filterContent: {
    gap: 8,
    paddingRight: 16,
  },
  filterChip: {
    height: 32,
  },
});
