import type { StyleSpecification } from '@maplibre/maplibre-react-native';

/** Free OpenStreetMap raster tiles; no API key required. */
export const OSM_RASTER_STYLE: StyleSpecification = {
  version: 8,
  // Required for symbol/text layers (feature labels on the map).
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};
