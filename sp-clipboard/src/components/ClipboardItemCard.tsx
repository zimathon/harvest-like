import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Card, Text, IconButton, TouchableRipple } from 'react-native-paper';
import { ClipboardItem } from '../types';
import CategoryBadge from './CategoryBadge';

interface ClipboardItemCardProps {
  item: ClipboardItem;
  onCopy: (id: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

export default function ClipboardItemCard({
  item,
  onCopy,
  onDelete,
  onTogglePin,
  onToggleFavorite,
}: ClipboardItemCardProps) {
  const handleDelete = () => {
    Alert.alert('Delete', 'Are you sure you want to delete this item?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(item.id) },
    ]);
  };

  return (
    <Card style={[styles.card, item.isPinned && styles.pinnedCard]} mode="elevated">
      <TouchableRipple onPress={() => onCopy(item.id)} borderless>
        <View style={styles.content}>
          <View style={styles.header}>
            <CategoryBadge category={item.category} />
            <Text variant="bodySmall" style={styles.time}>
              {formatRelativeTime(item.createdAt)}
            </Text>
          </View>

          <Text
            variant="bodyMedium"
            numberOfLines={3}
            style={styles.preview}
          >
            {item.preview}
          </Text>

          <View style={styles.actions}>
            <IconButton
              icon={item.isPinned ? 'pin' : 'pin-outline'}
              size={18}
              onPress={() => onTogglePin(item.id)}
              iconColor={item.isPinned ? '#3B82F6' : '#9CA3AF'}
            />
            <IconButton
              icon={item.isFavorite ? 'heart' : 'heart-outline'}
              size={18}
              onPress={() => onToggleFavorite(item.id)}
              iconColor={item.isFavorite ? '#EF4444' : '#9CA3AF'}
            />
            <IconButton
              icon="content-copy"
              size={18}
              onPress={() => onCopy(item.id)}
              iconColor="#9CA3AF"
            />
            <View style={styles.spacer} />
            <IconButton
              icon="delete-outline"
              size={18}
              onPress={handleDelete}
              iconColor="#9CA3AF"
            />
          </View>
        </View>
      </TouchableRipple>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 4,
  },
  pinnedCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  content: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  time: {
    color: '#9CA3AF',
  },
  preview: {
    color: '#374151',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginLeft: -8,
  },
  spacer: {
    flex: 1,
  },
});
