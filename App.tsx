import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import './src/i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider as MsarincThemeProvider } from '@msarinc/ui';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SettingsProvider } from './src/contexts/SettingsContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { UserDataProvider } from './src/contexts/UserDataContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AudioProvider } from './src/contexts/AudioContext';
import { StatusBarManager } from './src/components/StatusBarManager';
import { ThemeSyncBridge } from './src/components/ThemeSyncBridge';
import { COLORS } from './src/constants';
import { isDataCached, hasAnyData } from './src/data/quranData';
import { Platform } from 'react-native';

const queryClient = new QueryClient();

const App: React.FC = () => {
  const [isAppReady, setIsAppReady] = useState(false);
  const [isDataAvailable, setIsDataAvailable] = useState(false);

  useEffect(() => {
    const checkDataAvailability = async () => {
      try {
        const available = await hasAnyData();
        setIsDataAvailable(available);
        setIsAppReady(true);
      } catch (error) {
        console.error('Error checking data availability:', error);
        setIsDataAvailable(false);
        setIsAppReady(true);
      }
    };

    checkDataAvailability();
  }, []);

  // Web-only: keep document title pinned to 'Kuran360'
  useEffect(() => {
    if (Platform.OS === 'web') {
      const win: any = (globalThis as any).window;
      const doc: any = (globalThis as any).document;
      try {
        if (doc) doc.title = 'Kuran360';
        // Ensure favicon is set to public/favicon.png (dev/runtime safeguard)
        if (doc) {
          const ensureFavicon = () => {
            try {
              const linkId = 'app-favicon';
              let link: any = doc.querySelector("link[rel='icon']") || doc.getElementById(linkId);
              const href = '/favicon.png'; // served from public/
              if (!link) {
                link = doc.createElement('link');
                link.rel = 'icon';
                link.id = linkId;
                link.type = 'image/png';
                doc.head && doc.head.appendChild(link);
              }
              if (link && link.href !== href) {
                link.href = href;
              }
            } catch { }
          };
          ensureFavicon();

          // Inject Arabic-capable fonts for better shaping on Linux Chrome
          try {
            const fontLinkId = 'arabic-fonts';
            if (!doc.getElementById(fontLinkId)) {
              const linkEl = doc.createElement('link');
              linkEl.id = fontLinkId;
              linkEl.rel = 'stylesheet';
              linkEl.href = 'https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;500;600;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap';
              doc.head && doc.head.appendChild(linkEl);
            }
          } catch { }

          // Global CSS override: react-native-web doesn't correctly pass
          // comma-separated fontFamily to the DOM, so Arabic fonts never get
          // applied. This forces the correct font on all RTL text elements,
          // ensuring Quranic marks like U+06EA (medli esre) render properly.
          try {
            const arabicStyleId = 'arabic-font-override';
            if (!doc.getElementById(arabicStyleId)) {
              const styleEl = doc.createElement('style');
              styleEl.id = arabicStyleId;
              styleEl.textContent = `
                [dir="rtl"],
                [style*="direction: rtl"],
                [style*="direction:rtl"] {
                  font-family: "Scheherazade New", "Noto Naskh Arabic", "Amiri", "Traditional Arabic", "Arabic Typesetting", serif !important;
                }
              `;
              doc.head && doc.head.appendChild(styleEl);
            }
          } catch { }

          // Add PWA manifest
          try {
            const manifestLinkId = 'pwa-manifest';
            if (!doc.getElementById(manifestLinkId)) {
              const manifestLink = doc.createElement('link');
              manifestLink.id = manifestLinkId;
              manifestLink.rel = 'manifest';
              manifestLink.href = '/manifest.json';
              doc.head && doc.head.appendChild(manifestLink);

              // Add theme-color meta tag
              const themeColorMeta = doc.createElement('meta');
              themeColorMeta.name = 'theme-color';
              themeColorMeta.content = '#2E7D32';
              doc.head && doc.head.appendChild(themeColorMeta);

              // Add apple-mobile-web-app-capable
              const appleMeta = doc.createElement('meta');
              appleMeta.name = 'apple-mobile-web-app-capable';
              appleMeta.content = 'yes';
              doc.head && doc.head.appendChild(appleMeta);
            }
          } catch { }

          // Register Service Worker for PWA
          try {
            const nav = (win as any).navigator;
            if (nav && 'serviceWorker' in nav) {
              (win as any).addEventListener('load', () => {
                nav.serviceWorker
                  .register('/service-worker.js')
                  .then((registration: any) => {
                    console.log('SW registered:', registration);
                    
                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                      const newWorker = registration.installing;
                      newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && nav.serviceWorker.controller) {
                          console.log('New content available; please refresh.');
                          if ((win as any).confirm('Yeni sürüm mevcut! Güncellemek için Tamam\'a tıklayın.')) {
                            newWorker.postMessage({ type: 'SKIP_WAITING' });
                            (win as any).location.reload();
                          }
                        }
                      });
                    });
                  })
                  .catch((error: any) => {
                    console.log('SW registration failed:', error);
                  });

                // Reload page when new service worker takes control
                let refreshing = false;
                nav.serviceWorker.addEventListener('controllerchange', () => {
                  if (refreshing) return;
                  refreshing = true;
                  (win as any).location.reload();
                });
              });
            }
          } catch { }

          // Add Google Analytics
          try {
            if (!doc.querySelector('script[src*="gtag/js"]')) {
              // Add gtag script
              const gtagScript = doc.createElement('script');
              gtagScript.async = true;
              gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-T2MCJ8GGYZ';
              doc.head && doc.head.appendChild(gtagScript);

              // Add gtag configuration
              const configScript = doc.createElement('script');
              configScript.innerHTML = `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-T2MCJ8GGYZ');
              `;
              doc.head && doc.head.appendChild(configScript);
            }
          } catch { }
        }
        if (win) {
          const handler = () => { try { if (doc) doc.title = 'Kuran360'; } catch { } };
          win.addEventListener('popstate', handler);
          return () => win.removeEventListener('popstate', handler);
        }
      } catch { }
    }
  }, []);

  if (!isAppReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UserDataProvider>
          <SettingsProvider>
            <MsarincThemeProvider>
              <ThemeSyncBridge />
              <ThemeProvider>
                <AudioProvider>
                  <StatusBarManager />
                  <AppNavigator isDataAvailable={isDataAvailable} />
                </AudioProvider>
              </ThemeProvider>
            </MsarincThemeProvider>
          </SettingsProvider>
        </UserDataProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
