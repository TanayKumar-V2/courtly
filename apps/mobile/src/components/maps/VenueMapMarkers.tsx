import React, { useMemo, useRef } from 'react';
import type {
  GeoJSONSourceRef,
  PressEventWithFeatures,
} from '@maplibre/maplibre-react-native';
import type { NativeSyntheticEvent } from 'react-native';
import { getMapLibreModule } from '../../services/maps/maplibre-loader';
import { MAP_CONFIG } from '../../services/maps/map-config';
import { venuesToGeoJson } from '../../services/maps/map-provider';
import { VenueMapMarkerItem } from '../../features/discovery/types/discovery.types';
import { colors } from '../../theme';

export interface VenueMapMarkersProps {
  venues: VenueMapMarkerItem[];
  selectedVenueId: string | null;
  enableClustering?: boolean;
  onSelectVenue: (venueId: string) => void;
  onExpandCluster?: (coordinates: [number, number], expansionZoom: number) => void;
}

export const VenueMapMarkers: React.FC<VenueMapMarkersProps> = ({
  venues,
  selectedVenueId,
  enableClustering = true,
  onSelectVenue,
  onExpandCluster,
}) => {
  const sourceRef = useRef<GeoJSONSourceRef>(null);
  const mapLibre = getMapLibreModule();

  const featureCollection = useMemo(
    () => venuesToGeoJson(venues, selectedVenueId),
    [venues, selectedVenueId],
  );

  if (!mapLibre) {
    return null;
  }

  const { GeoJSONSource, Layer } = mapLibre;

  const handleSourcePress = async (
    event: NativeSyntheticEvent<PressEventWithFeatures>,
  ) => {
    event.stopPropagation();
    const pressedFeature = event.nativeEvent?.features?.[0];
    if (!pressedFeature) return;

    const props = (pressedFeature.properties || {}) as Record<string, any>;

    // Handle cluster expansion tap
    if (props.cluster && props.cluster_id !== undefined) {
      const coords =
        pressedFeature.geometry?.type === 'Point'
          ? (pressedFeature.geometry.coordinates as [number, number])
          : undefined;
      if (coords && onExpandCluster) {
        try {
          const zoom =
            (await sourceRef.current?.getClusterExpansionZoom(
              Number(props.cluster_id),
            )) ?? 14;
          onExpandCluster(coords, Math.min(18, zoom + 0.5));
        } catch {
          onExpandCluster(coords, 14);
        }
      }
      return;
    }

    // Handle individual venue marker tap
    const venueId = props.id
      ? String(props.id)
      : pressedFeature.id
        ? String(pressedFeature.id)
        : null;
    if (venueId) {
      onSelectVenue(venueId);
    }
  };

  return (
    <GeoJSONSource
      ref={sourceRef}
      id="courtly-venues-source"
      data={featureCollection as unknown as GeoJSON.GeoJSON}
      cluster={enableClustering}
      clusterRadius={MAP_CONFIG.clusterRadius}
      clusterMaxZoom={MAP_CONFIG.clusterMaxZoom}
      onPress={handleSourcePress}
    >
      {/* Cluster Circle */}
      {enableClustering && (
        <Layer
          id="courtly-venue-clusters"
          type="circle"
          filter={['has', 'point_count']}
          paint={{
            'circle-color': colors.primary,
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              18,
              10,
              22,
              30,
              26,
            ],
            'circle-stroke-width': 2.5,
            'circle-stroke-color': colors.background,
            'circle-opacity': 0.95,
          }}
        />
      )}

      {/* Cluster Count Label */}
      {enableClustering && (
        <Layer
          id="courtly-venue-cluster-count"
          type="symbol"
          filter={['has', 'point_count']}
          layout={{
            'text-field': ['get', 'point_count_abbreviated'],
            'text-size': 12,
            'text-allow-overlap': true,
          }}
          paint={{
            'text-color': colors.textInverse,
          }}
        />
      )}

      {/* Individual Venue Marker Circle */}
      <Layer
        id="courtly-venue-points"
        type="circle"
        filter={['!', ['has', 'point_count']]}
        paint={{
          'circle-color': [
            'case',
            ['boolean', ['get', 'isSelected'], false],
            colors.primary,
            colors.surface,
          ],
          'circle-radius': [
            'case',
            ['boolean', ['get', 'isSelected'], false],
            14,
            10,
          ],
          'circle-stroke-width': [
            'case',
            ['boolean', ['get', 'isSelected'], false],
            3,
            2,
          ],
          'circle-stroke-color': [
            'case',
            ['boolean', ['get', 'isSelected'], false],
            colors.textPrimary,
            colors.primary,
          ],
        }}
      />

      {/* Individual Venue Price / Name Label */}
      <Layer
        id="courtly-venue-labels"
        type="symbol"
        filter={['!', ['has', 'point_count']]}
        layout={{
          'text-field': ['get', 'priceLabel'],
          'text-size': 11,
          'text-offset': [0, 1.8],
          'text-anchor': 'top',
          'text-allow-overlap': false,
        }}
        paint={{
          'text-color': colors.textPrimary,
          'text-halo-color': colors.background,
          'text-halo-width': 1.5,
        }}
      />
    </GeoJSONSource>
  );
};
