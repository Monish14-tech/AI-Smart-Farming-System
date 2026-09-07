import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  /**
   * Unique app identifier (reverse-domain style).
   * Change this to match your Play Store / App Store bundle ID.
   */
  appId: 'com.agrinova.app',

  /** Display name shown on the home screen */
  appName: 'AgriNova',

  /**
   * WebView source.
   * We use Option B (hosted WebView) — Capacitor opens your deployed
   * Next.js server inside a native WebView instead of bundling static files.
   *
   * For production: replace the server.url with your live domain.
   * For local development: use your machine's LAN IP so the phone can reach it.
   */
  webDir: 'out', // fallback for static export if ever used
  server: {
    /**
     * During development, point to your Next.js dev server.
     * Use your machine's local IP address instead of localhost so an
     * Android/iOS emulator or physical device can reach it.
     *
     * Example: 'http://192.168.1.100:3000'
     * Production: 'https://agrinova.yourdomain.com'
     */
    url: 'http://localhost:3000',
    cleartext: true, // allow HTTP during development
  },
  plugins: {
    /**
     * SplashScreen — shown while the WebView is loading.
     * Add a splash image to android/app/src/main/res/drawable/splash.png
     */
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#061106',
      showSpinner: false,
      androidSplashResourceName: 'splash',
      splashFullScreen: true,
      splashImmersive: true,
    },
    /**
     * StatusBar — matches AgriNova's dark forest theme
     */
    StatusBar: {
      style: 'dark',
      backgroundColor: '#061106',
    },
  },
  android: {
    /** Allow mixed content (HTTP + HTTPS) during development */
    allowMixedContent: true,
    /** Minimum Android SDK version */
    minWebViewVersion: 80,
  },
  ios: {
    /** Allow all HTTP origins during development */
    allowsLinkPreview: false,
  },
};

export default config;
