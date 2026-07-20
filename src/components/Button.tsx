import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import type { LucideIcon } from 'lucide-react-native';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger';

export type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonBaseProps = {
  onPress?: PressableProps['onPress'];
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
};

type TextOnlyProps = ButtonBaseProps & {
  title: string;
  icon?: never;
  children?: never;
};

type IconOnlyProps = ButtonBaseProps & {
  icon: LucideIcon;
  title?: never;
  children?: never;
};

type TextWithIconProps = ButtonBaseProps & {
  title: string;
  icon: LucideIcon;
  iconPosition?: 'left' | 'right';
  children?: never;
};

type CustomProps = ButtonBaseProps & {
  children: React.ReactNode;
  title?: never;
  icon?: never;
};

export type ButtonProps =
  | TextOnlyProps
  | IconOnlyProps
  | TextWithIconProps
  | CustomProps;

function isCustom(props: ButtonProps): props is CustomProps {
  return 'children' in props && props.children != null;
}

function hasTitle(props: ButtonProps): props is TextOnlyProps | TextWithIconProps {
  return 'title' in props && typeof props.title === 'string';
}

function hasIcon(props: ButtonProps): props is IconOnlyProps | TextWithIconProps {
  return 'icon' in props && props.icon != null;
}

export default function Button(props: ButtonProps) {
  const {
    onPress,
    disabled = false,
    loading = false,
    variant = 'primary',
    size = 'md',
    style,
    textStyle,
    accessibilityLabel,
  } = props;
  const { theme } = useUnistyles();
  const isDisabled = disabled || loading;
  const iconOnly = hasIcon(props) && !hasTitle(props) && !isCustom(props);
  const iconPosition =
    hasTitle(props) && hasIcon(props)
      ? ('iconPosition' in props ? props.iconPosition : undefined) ?? 'left'
      : 'left';

  const iconColor =
    variant === 'outline' || variant === 'ghost'
      ? theme.colors.primary
      : theme.colors.onPrimary;

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 22 : 18;

  const content = (() => {
    if (loading) {
      return <ActivityIndicator color={iconColor} />;
    }

    if (isCustom(props)) {
      return props.children;
    }

    const Icon = hasIcon(props) ? props.icon : null;
    const title = hasTitle(props) ? props.title : null;

    if (Icon && !title) {
      return <Icon color={iconColor} size={iconSize} />;
    }

    if (Icon && title) {
      return (
        <>
          {iconPosition === 'left' ? (
            <Icon color={iconColor} size={iconSize} />
          ) : null}
          <Text
            style={[
              styles.label,
              styles[`label_${variant}`],
              styles[`labelSize_${size}`],
              textStyle,
            ]}>
            {title}
          </Text>
          {iconPosition === 'right' ? (
            <Icon color={iconColor} size={iconSize} />
          ) : null}
        </>
      );
    }

    return (
      <Text
        style={[
          styles.label,
          styles[`label_${variant}`],
          styles[`labelSize_${size}`],
          textStyle,
        ]}>
        {title}
      </Text>
    );
  })();

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={
        accessibilityLabel ?? (hasTitle(props) ? props.title : undefined)
      }
      style={({ pressed }) => [
        styles.base,
        styles[`variant_${variant}`],
        styles[`size_${size}`],
        iconOnly && styles[`iconOnly_${size}`],
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create(theme => ({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.gap(1),
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },

  variant_primary: {
    backgroundColor: theme.colors.primary,
  },
  variant_secondary: {
    backgroundColor: theme.colors.secondary,
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  variant_ghost: {
    backgroundColor: 'transparent',
  },
  variant_danger: {
    backgroundColor: '#C62828',
  },

  size_sm: {
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  size_md: {
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },
  size_lg: {
    minHeight: 56,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 12,
  },

  iconOnly_sm: {
    width: 36,
    paddingHorizontal: 0,
  },
  iconOnly_md: {
    width: 48,
    paddingHorizontal: 0,
  },
  iconOnly_lg: {
    width: 56,
    paddingHorizontal: 0,
  },

  label: {
    fontWeight: '700',
  },
  label_primary: {
    color: theme.colors.onPrimary,
  },
  label_secondary: {
    color: theme.colors.onSecondary,
  },
  label_outline: {
    color: theme.colors.primary,
  },
  label_ghost: {
    color: theme.colors.primary,
  },
  label_danger: {
    color: theme.colors.white,
  },
  labelSize_sm: {
    fontSize: 13,
  },
  labelSize_md: {
    fontSize: 15,
  },
  labelSize_lg: {
    fontSize: 17,
  },
}));
