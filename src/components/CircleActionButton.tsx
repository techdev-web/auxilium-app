import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

type Props = {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'secondary';
};

export default function CircleActionButton({
  label,
  onPress,
  tone = 'secondary',
}: Props) {
  return (
    <Pressable
      style={styles.row}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <View
        style={[
          styles.circle,
          tone === 'primary' ? styles.circlePrimary : styles.circleSecondary,
        ]}>
        <Text style={styles.chevron}>›</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create(theme => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: theme.gap(2),
  },
  label: {
    flexShrink: 0,
    fontSize: 28,
    fontWeight: '600',
    color: theme.colors.text,
  },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  circlePrimary: {
    backgroundColor: theme.colors.primary,
  },
  circleSecondary: {
    backgroundColor: theme.colors.secondary,
  },
  chevron: {
    color: theme.colors.white,
    fontSize: 36,
    fontWeight: '300',
    lineHeight: 40,
    marginTop: -2,
  },
}));
