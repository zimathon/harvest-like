import React from 'react';
import { Chip } from 'react-native-paper';
import { ClipboardCategory } from '../types';

const CATEGORY_CONFIG: Record<
  ClipboardCategory,
  { label: string; color: string; icon: string }
> = {
  text: { label: 'TEXT', color: '#6B7280', icon: 'text' },
  url: { label: 'URL', color: '#3B82F6', icon: 'link' },
  email: { label: 'EMAIL', color: '#10B981', icon: 'email' },
  phone: { label: 'PHONE', color: '#F59E0B', icon: 'phone' },
  code: { label: 'CODE', color: '#8B5CF6', icon: 'code-tags' },
  other: { label: 'OTHER', color: '#9CA3AF', icon: 'help-circle' },
};

interface CategoryBadgeProps {
  category: ClipboardCategory;
  size?: 'small' | 'medium';
}

export default function CategoryBadge({
  category,
  size = 'small',
}: CategoryBadgeProps) {
  const config = CATEGORY_CONFIG[category];

  return (
    <Chip
      mode="flat"
      icon={config.icon}
      compact={size === 'small'}
      style={{
        backgroundColor: config.color + '20',
        height: size === 'small' ? 24 : 32,
      }}
      textStyle={{
        color: config.color,
        fontSize: size === 'small' ? 10 : 12,
        fontWeight: '600',
      }}
    >
      {config.label}
    </Chip>
  );
}
