import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.roofer21.alayasoad',
  appName: "Alaya & Soad's Gift",
  webDir: 'dist',
  server: {
    // Allow loading from localhost during development
    androidScheme: 'https',
    iosScheme: 'https'
  },
  ios: {
    // iOS-specific configuration
    contentInset: 'automatic',
    backgroundColor: '#1e293b',
    preferredContentMode: 'mobile',
    // Allow audio playback in background
    allowsLinkPreview: true,
    scrollEnabled: true
  },
  android: {
    backgroundColor: '#1e293b',
    allowMixedContent: false
  },
  plugins: {
    // Status bar configuration
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1e293b'
    },
    // Keyboard configuration
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    },
    // Local notifications configuration
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#881337',
      sound: 'beep.wav'
    }
  }
};

export default config;
