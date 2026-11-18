// Setup file for Jest in Expo
jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return {
    Image: (props) => <View testID="expo-image" {...props} />,
  };
});

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  Link: ({ children }) => children,
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({
    granted: true,
    status: 'granted',
  }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [
      {
        uri: 'file:///mock-photo.jpg',
        fileName: 'mock-photo.jpg',
        mimeType: 'image/jpeg',
      },
    ],
  }),
}));

jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 3 },
  hasServicesEnabledAsync: jest.fn().mockResolvedValue(true),
  getForegroundPermissionsAsync: jest.fn().mockResolvedValue({
    status: 'granted',
    granted: true,
    canAskAgain: true,
  }),
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({
    status: 'granted',
    granted: true,
    canAskAgain: true,
  }),
  getLastKnownPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: 28.4595, longitude: 77.0266, accuracy: 20 },
  }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: 28.4595, longitude: 77.0266, accuracy: 20 },
  }),
}));

jest.mock('@maplibre/maplibre-react-native', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');

  const Map = React.forwardRef((props, _ref) => (
    <View
      testID="maplibre-map"
      accessibilityHint={typeof props.mapStyle === 'string' ? props.mapStyle : ''}
      style={props.style}
    >
      {props.children}
      {props.onRegionDidChange && (
        <Pressable
          testID="simulate-region-change"
          onPress={() =>
            props.onRegionDidChange({
              nativeEvent: {
                center: [77.0266, 28.4595],
                zoom: 12,
                bearing: 0,
                pitch: 0,
                bounds: [76.95, 28.4, 77.15, 28.6],
                animated: false,
                userInteraction: true,
              },
            })
          }
        />
      )}
      {props.onDidFailLoadingMap && (
        <Pressable
          testID="simulate-map-fail"
          onPress={() => props.onDidFailLoadingMap({ nativeEvent: null })}
        />
      )}
    </View>
  ));

  const Camera = React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      flyTo: jest.fn(),
      easeTo: jest.fn(),
      jumpTo: jest.fn(),
      zoomTo: jest.fn(),
      fitBounds: jest.fn(),
      setStop: jest.fn(),
    }));
    return <View testID="maplibre-camera" />;
  });

  const GeoJSONSource = React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      getClusterExpansionZoom: jest.fn().mockResolvedValue(15),
    }));
    const features = props.data?.features || [];
    return (
      <View testID={`geojson-source-${props.id || 'default'}`}>
        {features.map((f) => (
          <Pressable
            key={f.id || f.properties?.id}
            testID={`geojson-feature-${f.id || f.properties?.id}`}
            onPress={() =>
              props.onPress &&
              props.onPress({
                stopPropagation: jest.fn(),
                nativeEvent: {
                  features: [f],
                  lngLat: f.geometry?.coordinates || [0, 0],
                  point: [0, 0],
                },
              })
            }
          >
            <Text>{f.properties?.name || f.id}</Text>
          </Pressable>
        ))}
        {props.children}
      </View>
    );
  });

  const Layer = (props) => <View testID={`maplibre-layer-${props.id}`} />;
  const UserLocation = () => <View testID="maplibre-user-location" />;

  return {
    Map,
    Camera,
    GeoJSONSource,
    Layer,
    UserLocation,
  };
});
