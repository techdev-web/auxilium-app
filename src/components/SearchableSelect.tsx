import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { ChevronDown } from 'lucide-react-native';
import { UniTextInput } from './UniTextInput';

export type SelectOption = {
  id: number;
  label: string;
};

type Props = {
  label: string;
  placeholder?: string;
  value: SelectOption | null;
  options: SelectOption[];
  onSelect: (option: SelectOption) => void;
  disabled?: boolean;
  loading?: boolean;
  searchable?: boolean;
  /** When set, query changes are reported for remote filtering. */
  onQueryChange?: (query: string) => void;
  /** If true, skip local filtering and show `options` as provided. */
  remoteFilter?: boolean;
};

export default function SearchableSelect({
  label,
  placeholder = 'Select…',
  value,
  options,
  onSelect,
  disabled = false,
  loading = false,
  searchable = true,
  onQueryChange,
  remoteFilter = false,
}: Props) {
  const { theme } = useUnistyles();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open || !onQueryChange) {
      return;
    }
    const handle = setTimeout(() => onQueryChange(query.trim()), 300);
    return () => clearTimeout(handle);
  }, [query, open, onQueryChange]);

  const filtered = useMemo(() => {
    if (remoteFilter) {
      return options;
    }
    const q = query.trim().toLowerCase();
    if (!q) {
      return options;
    }
    return options.filter(option => option.label.toLowerCase().includes(q));
  }, [options, query, remoteFilter]);

  const handleToggle = () => {
    if (disabled || loading) {
      return;
    }
    setOpen(prev => !prev);
    if (open) {
      setQuery('');
      onQueryChange?.('');
    }
  };

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={handleToggle}
        disabled={disabled || loading}
        style={[
          styles.trigger,
          disabled && styles.triggerDisabled,
          open && styles.triggerOpen,
        ]}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading, expanded: open }}>
        <Text
          style={[styles.triggerText, !value && styles.placeholder]}
          numberOfLines={1}>
          {value?.label ?? placeholder}
        </Text>
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <ChevronDown
            size={18}
            color={theme.colors.textMuted}
            style={open ? styles.chevronOpen : undefined}
          />
        )}
      </Pressable>

      {open ? (
        <View style={styles.dropdown}>
          {searchable ? (
            <UniTextInput
              style={styles.search}
              value={query}
              onChangeText={setQuery}
              placeholder="Search…"
              autoCorrect={false}
              autoCapitalize="none"
            />
          ) : null}
          <ScrollView
            style={styles.list}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled">
            {filtered.length === 0 ? (
              <Text style={styles.empty}>No matches found</Text>
            ) : (
              filtered.map(item => {
                const selected = value?.id === item.id;
                return (
                  <Pressable
                    key={item.id}
                    style={[styles.option, selected && styles.optionSelected]}
                    onPress={() => {
                      onSelect(item);
                      setOpen(false);
                      setQuery('');
                    }}>
                    <Text
                      style={[
                        styles.optionText,
                        selected && styles.optionTextSelected,
                      ]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  field: {
    gap: theme.gap(1),
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  trigger: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.input,
    paddingHorizontal: theme.gap(2),
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.gap(1),
  },
  triggerOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  triggerDisabled: {
    opacity: 0.5,
  },
  triggerText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.inputText,
  },
  placeholder: {
    color: theme.colors.placeholder,
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  dropdown: {
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: theme.radii.input,
    borderBottomRightRadius: theme.radii.input,
    paddingBottom: theme.gap(1),
    marginTop: -2,
  },
  search: {
    marginHorizontal: theme.gap(1.5),
    marginBottom: theme.gap(1),
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    paddingHorizontal: theme.gap(1.5),
    paddingVertical: 10,
    fontSize: 15,
    color: theme.colors.inputText,
  },
  list: {
    maxHeight: 160,
  },
  option: {
    paddingHorizontal: theme.gap(2),
    paddingVertical: 12,
  },
  optionSelected: {
    backgroundColor: 'rgba(0, 116, 217, 0.1)',
  },
  optionText: {
    fontSize: 15,
    color: theme.colors.inputText,
  },
  optionTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  empty: {
    paddingHorizontal: theme.gap(2),
    paddingVertical: 12,
    fontSize: 14,
    color: theme.colors.textMuted,
  },
}));
