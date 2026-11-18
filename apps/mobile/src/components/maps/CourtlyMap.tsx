import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type {
  CameraRef,
  MapRef,
  PressEvent,
  PressEventWithFeatures,
  ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native';
import type { NativeSyntheticEvent } from 'react-native';
import { AlertCircle, MapPin, RefreshCw } from 'lucide-react-native';
import { getMapLibreModule } from '../../services/maps/maplibre-loader';
import { MAP_CONFIG } from '../../services/maps/map-config';
import {
  lngLatBoundsToApiBounds,
  mapProvider,
} from '../../services/maps/map-provider';
import {
  MapBounds,
  VenueMapMarkerItem,
} from '../../features/discovery/types/discovery.types';
import { VenueMapMarkers } from './VenueMapMarkers';
import { MapControls } from './MapControls';
import { colors, radius, spacing, typography } from '../../theme';

export interface CourtlyMapHandle {
  flyTo: (longitude: number, latitude: number, zoom?: number) => void;
}

export interface CourtlyMapProps {
  venues?: VenueMapMarkerItem[];
  selectedVenueId?: string | null;
  initialCenter?: { latitude: number; longitude: number };
  initialZoom?: number;
  userLocation?: { latitude: number; longitude: number } | null;
  pinCoordinate?: { latitude: number; longitude: number } | null;
  interactive?: boolean;
  showControls?: boolean;
  enableClustering?: boolean;
  isLocating?: boolean;
  onSelectVenue?: (venueId: string) => void;
  onMapBackgroundPress?: (lngLat: [number, number]) => void;
  onRegionDidChangeBounds?: (bounds: MapBounds, zoom: number) => void;
  onLocateMe?: () => void;
}

export const CourtlyMap = React.forwardRef<CourtlyMapHandle, CourtlyMapProps>(
  (
    {
      venues = [],
      selectedVenueId = null,
      initialCenter,
      initialZoom,
      userLocation = null,
      pinCoordinate = null,
      interactive = true,
      showControls = true,
      enableClustering = true,
      isLocating = false,
      onSelectVenue,
      onMapBackgroundPress,
      onRegionDidChangeBounds,
      onLocateMe,
    },
    ref,
  ) => {
    const mapLibre = getMapLibreModule();
    const mapRef = useRef<MapRef>(null);
    const cameraRef = useRef<CameraRef>(null);

    const [styleUrl, setStyleUrl] = useState<string>(
      mapProvider.getPrimaryStyleUrl(),
    );
    const [usedFallbackStyle, setUsedFallbackStyle] = useState(false);
    const [mapLoading, setMapLoading] = useState(true);
    const [mapError, setMapError] = useState<string | null>(null);
    const currentZoomRef = useRef<number>(
      initialZoom ??
        (initialCenter ? MAP_CONFIG.cityFocusZoom : MAP_CONFIG.defaultZoom),
    );

    const centerLngLat: [number, number] = initialCenter
      ? [initialCenter.longitude, initialCenter.latitude]
      : [MAP_CONFIG.defaultCenter.longitude, MAP_CONFIG.defaultCenter.latitude];

    useImperativeHandle(ref, () => ({
      flyTo: (longitude: number, latitude: number, zoom = 14) => {
        currentZoomRef.current = zoom;
        cameraRef.current?.flyTo({
          center: [longitude, latitude],
          zoom,
          duration: 650,
        });
      },
    }));

    useEffect(() => {
      if (userLocation) {
        currentZoomRef.current = MAP_CONFIG.cityFocusZoom;
        cameraRef.current?.flyTo({
          center: [userLocation.longitude, userLocation.latitude],
          zoom: MAP_CONFIG.cityFocusZoom,
          duration: 600,
        });
      }
    }, [userLocation?.latitude, userLocation?.longitude]);

    if (!mapLibre) {
      return (
        <View style={styles.nativeUnavailableBox} testID="map-native-build-required">
          <MapPin size={28} color={colors.primary} />
          <Text style={styles.nativeUnavailableTitle}>
            Android Development Build Required
          </Text>
          <Text style={styles.nativeUnavailableDesc}>
            MapLibre React Native uses native OpenGL/Vulkan vector rendering and
            is not bundled inside Expo Go. Build an Android development client
            (`eas build --profile development --platform android` or `npx expo
            run:android`) to render live OpenFreeMap maps. All list discovery,
            filters, and venue details work fully here.
          </Text>
        </View>
      );
    }

    const { Camera, GeoJSONSource, Layer, Map } = mapLibre;

    const handleZoomDelta = (delta: number) => {
      const nextZoom = Math.max(
        2,
        Math.min(19, currentZoomRef.current + delta),
      );
      currentZoomRef.current = nextZoom;
      cameraRef.current?.zoomTo(nextZoom, { duration: 220 });
    };

    const handleMapFail = () => {
      if (!usedFallbackStyle) {
        setUsedFallbackStyle(true);
        setStyleUrl(mapProvider.getFallbackStyleUrl());
        setMapError(null);
      } else {
        setMapLoading(false);
        setMapError(
          'Unable to load OpenFreeMap vector tiles. Check your internet connection and retry.',
        );
      }
    };

    const handleRetryStyle = () => {
      setMapError(null);
      setMapLoading(true);
      setUsedFallbackStyle(false);
      setStyleUrl(mapProvider.getPrimaryStyleUrl());
    };

    const handleRegionDidChange = (
      event: NativeSyntheticEvent<ViewStateChangeEvent>,
    ) => {
      const viewState = event.nativeEvent;
      if (!viewState) return;
      if (typeof viewState.zoom === 'number') {
        currentZoomRef.current = viewState.zoom;
      }
      if (
        Array.isArray(viewState.bounds) &&
        viewState.bounds.length === 4 &&
        onRegionDidChangeBounds
      ) {
        const apiBounds = lngLatBoundsToApiBounds(
          viewState.bounds as [number, number, number, number],
        );
        onRegionDidChangeBounds(apiBounds, currentZoomRef.current);
      }
    };

    const handleMapPress = (
      event:
        | NativeSyntheticEvent<PressEvent>
        | NativeSyntheticEvent<PressEventWithFeatures>,
    ) => {
      const lngLat = event.nativeEvent?.lngLat;
      if (lngLat && Array.isArray(lngLat) && lngLat.length === 2) {
        onMapBackgroundPress?.([lngLat[0], lngLat[1]]);
      }
    };

    const userLocationGeoJson = userLocation
      ? {
          type: 'FeatureCollection' as const,
          features: [
            {
              type: 'Feature' as const,
              id: 'courtly-user-loc',
              geometry: {
                type: 'Point' as const,
                coordinates: [userLocation.longitude, userLocation.latitude],
              },
              properties: {},
            },
          ],
        }
      : null;

    const ownerPinGeoJson = pinCoordinate
      ? {
          type: 'FeatureCollection' as const,
          features: [
            {
              type: 'Feature' as const,
              id: 'courtly-owner-pin',
              geometry: {
                type: 'Point' as const,
                coordinates: [pinCoordinate.longitude, pinCoordinate.latitude],
              },
              properties: {},
            },
          ],
        }
      : null;

    return (
      <View style={styles.wrapper} testID="courtly-maplibre-container">
        <Map
          ref={mapRef}
          style={styles.map}
          mapStyle={styleUrl}
          dragPan={interactive}
          touchZoom={interactive}
          doubleTapZoom={interactive}
          touchRotate={false}
          touchPitch={false}
          attribution={true}
          logo={false}
          compass={false}
          onWillStartLoadingMap={() => setMapLoading(true)}
          onDidFinishLoadingStyle={() => {
            setMapLoading(false);
            setMapError(null);
          }}
          onDidFinishLoadingMap={() => {
            setMapLoading(false);
            setMapError(null);
          }}
          onDidFailLoadingMap={handleMapFail}
          onRegionDidChange={handleRegionDidChange}
          onPress={handleMapPress}
        >
          <Camera
            ref={cameraRef}
            initialViewState={{
              center: centerLngLat,
              zoom: currentZoomRef.current,
            }}
            minZoom={2}
            maxZoom={19}
          />

          {/* Optional User Current Location Indicator */}
          {userLocationGeoJson && (
            <GeoJSONSource
              id="courtly-user-location-source"
              data={userLocationGeoJson as unknown as GeoJSON.GeoJSON}
            >
              <Layer
                id="courtly-user-location-halo"
                type="circle"
                paint={{
                  'circle-color': colors.info,
                  'circle-radius': 16,
                  'circle-opacity': 0.25,
                }}
              />
              <Layer
                id="courtly-user-location-dot"
                type="circle"
                paint={{
                  'circle-color': colors.info,
                  'circle-radius': 7,
                  'circle-stroke-width': 2.5,
                  'circle-stroke-color': colors.textPrimary,
                }}
              />
            </GeoJSONSource>
          )}

          {/* Venue Discovery Markers (GeoJSONSource + Clustering + Layer) */}
          {venues.length > 0 && onSelectVenue && (
            <VenueMapMarkers
              venues={venues}
              selectedVenueId={selectedVenueId}
              enableClustering={enableClustering}
              onSelectVenue={onSelectVenue}
              onExpandCluster={(coords, zoom) => {
                currentZoomRef.current = zoom;
                cameraRef.current?.flyTo({
                  center: coords,
                  zoom,
                  duration: 450,
                });
              }}
            />
          )}

          {/* Owner Pin Marker */}
          {ownerPinGeoJson && (
            <GeoJSONSource
              id="courtly-owner-pin-source"
              data={ownerPinGeoJson as unknown as GeoJSON.GeoJSON}
            >
              <Layer
                id="courtly-owner-pin-outer"
                type="circle"
                paint={{
                  'circle-color': colors.primary,
                  'circle-radius': 18,
                  'circle-opacity': 0.25,
                }}
              />
              <Layer
                id="courtly-owner-pin-dot"
                type="circle"
                paint={{
                  'circle-color': colors.primary,
                  'circle-radius': 10,
                  'circle-stroke-width': 3,
                  'circle-stroke-color': colors.background,
                }}
              />
            </GeoJSONSource>
          )}
        </Map>

        {showControls && interactive && (
          <View style={styles.controlsOverlay} pointerEvents="box-none">
            <MapControls
              onZoomIn={() => handleZoomDelta(1.5)}
              onZoomOut={() => handleZoomDelta(-1.5)}
              onLocateMe={onLocateMe}
              isLocating={isLocating}
              hasUserLocation={Boolean(userLocation)}
            />
          </View>
        )}

        {mapLoading && !mapError && (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Loading map tiles...</Text>
          </View>
        )}

        {mapError && (
          <View style={styles.errorOverlay} testID="map-error-state">
            <AlertCircle size={26} color={colors.error} />
            <Text style={styles.errorText}>{mapError}</Text>
            <Pressable onPress={handleRetryStyle} style={styles.retryBtn}>
              <RefreshCw size={14} color={colors.textInverse} />
              <Text style={styles.retryText}>Retry Map</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.attributionPill} testID="map-attribution">
          <Text style={styles.attributionText}>
            {mapProvider.getAttributionText()}
          </Text>
        </View>
      </View>
    );
  },
);

CourtlyMap.displayName = 'CourtlyMap';

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    position: 'relative',
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  nativeUnavailableBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    margin: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  nativeUnavailableTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  nativeUnavailableDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  controlsOverlay: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.xl + 28,
    zIndex: 5,
  },
  loadingOverlay: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(11, 17, 16, 0.88)',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadingText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  errorOverlay: {
    position: 'absolute',
    top: '35%',
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: 'rgba(21, 29, 26, 0.96)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.error,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    zIndex: 10,
  },
  errorText: {
    ...typography.caption,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  retryText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: '800',
  },
  attributionPill: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.xs + 2,
    backgroundColor: 'rgba(11, 17, 16, 0.82)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 4,
  },
  attributionText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 9,
  },
});
