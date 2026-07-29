import React, { useEffect, type ReactNode, type RefObject } from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ViewAnnotationRef } from '@maplibre/maplibre-react-native';

type Props = {
  width: number;
  height: number;
  annotationRef?: RefObject<ViewAnnotationRef | null>;
  /** Re-snapshot the Android bitmap when these change (icon size, color, etc.). */
  refreshKey?: string | number | boolean | null;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/**
 * Fixed-size wrapper for MapLibre ViewAnnotation children.
 *
 * On Android, annotations are rasterized into a bitmap from the view's layout
 * bounds. Lucide/SVG icons often measure late or paint outside their box, which
 * produces the intermittent "cropped marker" look. Explicit size + a deferred
 * refresh after layout keeps the snapshot in sync without interrupting drags.
 */
export default function AnnotationContent({
  width,
  height,
  annotationRef,
  refreshKey,
  style,
  children,
}: Props) {
  const refresh = () => {
    if (Platform.OS !== 'android') {
      return;
    }
    // Defer so we don't fight an in-progress drag gesture / layout pass.
    // A second tick covers cases where the first snapshot is still stale.
    requestAnimationFrame(() => {
      annotationRef?.current?.refresh();
      setTimeout(() => {
        annotationRef?.current?.refresh();
      }, 48);
    });
  };

  useEffect(() => {
    refresh();
    // refresh when visual inputs change only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, width, height]);

  return (
    <View
      collapsable={false}
      onLayout={refresh}
      pointerEvents="none"
      style={[
        {
          width,
          height,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible',
        },
        style,
      ]}>
      {children}
    </View>
  );
}
