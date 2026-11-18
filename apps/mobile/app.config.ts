import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Courtly',
  slug: 'courtly',
  owner: 'acode42',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'courtly',
  userInterfaceStyle: 'dark',
  backgroundColor: '#0B1110',
  icon: './assets/images/icon.png',
  android: {
    package: 'com.courtly.app',
    adaptiveIcon: {
      backgroundColor: '#0B1110',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: true,
  },
  plugins: [
    'expo-router',
    'expo-dev-client',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#0B1110',
        image: './assets/images/splash-icon.png',
        imageWidth: 120,
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'Courtly needs access to your photo library so venue owners can upload venue photographs.',
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Courtly uses your location only while you are discovering nearby sports venues.',
        isAndroidBackgroundLocationEnabled: false,
      },
    ],
    '@maplibre/maplibre-react-native',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: 'aae791c9-d355-4154-8e07-370c17fcd26d',
    },
  },
});
