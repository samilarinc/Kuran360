import React, { useState, useEffect, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Platform, View, ActivityIndicator } from 'react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { MainScreen } from '../screens/MainScreen';
import { SurahDetailScreen } from '../screens/SurahDetailScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useGlobalAudio } from '../contexts/AudioContext';
import { useDebouncedSettings } from '../hooks/useDebouncedSettings';
import { Surah } from '../types';
import { quranData, loadSurah } from '../data/quranData';
import { NavigationProvider } from '../contexts/NavigationContext';

// Safe window access for web platform
const getWindow = (): any => {
  if (Platform.OS === 'web') {
    // Use globalThis which is available in modern React Native Web
    return typeof globalThis !== 'undefined' && (globalThis as any).window
      ? (globalThis as any).window
      : null;
  }
  return null;
};

export type RootStackParamList = {
  Main: undefined;
  Home: undefined;
  SurahDetail: { surah: Surah };
  Settings: undefined;
  Search: undefined;
};

type NavigationHistoryItem = {
  screen: 'Main' | 'Home' | 'SurahDetail' | 'Settings' | 'Search';
  params?: {
    surah?: Surah;
    verseIndex?: number;
    lastSelectedSurah?: Surah;
  };
};

export const AppNavigator: React.FC<{ isDataAvailable: boolean }> = ({ isDataAvailable }) => {
  const [navigationHistory, setNavigationHistory] = useState<NavigationHistoryItem[]>([
    { screen: 'Main' }
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const { audioState } = useGlobalAudio();
  const { settings, updateSettings } = useDebouncedSettings(200);

  // Auto-disable audio tracking when navigating away from SurahDetail
  useEffect(() => {
    const currentRoute = navigationHistory[currentIndex];
    if (settings.audioTrackingEnabled && audioState.currentVerse &&
      currentRoute.screen !== 'SurahDetail') {
      updateSettings({ audioTrackingEnabled: false });
    }
  }, [currentIndex, navigationHistory, settings.audioTrackingEnabled, audioState.currentVerse, updateSettings]);

  const buildUrl = useCallback((route: NavigationHistoryItem): string => {
    switch (route.screen) {
      case 'Main':
        return '/';
      case 'Settings':
        return '/settings';
      case 'Search':
        return '/search';
      case 'SurahDetail':
        if (route.params?.surah) {
          const baseUrl = `/surah/${route.params.surah.number}`;
          return route.params.verseIndex !== undefined ? `${baseUrl}/verse/${route.params.verseIndex + 1}` : baseUrl;
        }
        return '/';
      case 'Home':
        return '/surahs';
      default:
        return '/';
    }
  }, []);

  const parseUrl = useCallback(async (pathname: string): Promise<NavigationHistoryItem | null> => {
    if (pathname === '/settings') {
      return { screen: 'Settings' };
    }

    if (pathname === '/search') {
      return { screen: 'Search' };
    }

    if (pathname === '/surahs') {
      return { screen: 'Home' };
    }    // Check for verse-specific URLs: /surah/1/verse/3
    const verseMatch = pathname.match(/^\/surah\/(\d+)\/verse\/(\d+)$/);
    if (verseMatch) {
      const surahNumber = parseInt(verseMatch[1], 10);
      const verseNumber = parseInt(verseMatch[2], 10);

      const surah = await loadSurah(surahNumber);

      if (surah && verseNumber >= 1 && verseNumber <= surah.verses.length) {
        return {
          screen: 'SurahDetail',
          params: { surah, verseIndex: verseNumber - 1 } // Convert to 0-based index
        };
      }
    }

    // Check for surah-only URLs: /surah/1
    const surahMatch = pathname.match(/^\/surah\/(\d+)$/);
    if (surahMatch) {
      const surahNumber = parseInt(surahMatch[1], 10);

      const surah = await loadSurah(surahNumber);

      if (surah) {
        return {
          screen: 'SurahDetail',
          params: { surah }
        };
      }
    }

    return pathname === '/' || pathname === '' ? { screen: 'Main' } : null;
  }, []);

  const updateUrl = useCallback((route: NavigationHistoryItem) => {
    if (Platform.OS === 'web') {
      const url = buildUrl(route);
      const windowObj = getWindow();
      if (windowObj && windowObj.history) {
        try {
          const doc = (globalThis as any).document;
          if (doc) doc.title = 'Kuran360';
        } catch { }
        windowObj.history.pushState(null, 'Kuran360', url);
      }
    }
  }, [buildUrl]);

  const navigateToRoute = useCallback((route: NavigationHistoryItem, addToHistory: boolean = true) => {

    if (addToHistory) {
      // Add new route to history - use functional updates to avoid stale closures
      setNavigationHistory(prev => {
        const newHistory = [...prev];
        setCurrentIndex(currentIndex => {
          const newIndex = currentIndex + 1;
          // Remove any forward history beyond current index
          newHistory.splice(newIndex);
          // Add new route
          newHistory.push(route);
          return newIndex;
        });
        return newHistory;
      });
    } else {
      setNavigationHistory(prev => {
        const newHistory = [...prev];
        setCurrentIndex(currentIndex => {
          newHistory[currentIndex] = route;
          return currentIndex;
        });
        return newHistory;
      });
    }

    // Update URL
    updateUrl(route);
  }, [updateUrl]);

  // Handle browser back/forward buttons and initial URL (Web only)
  useEffect(() => {
    if (Platform.OS === 'web') {
      const windowObj = getWindow();
      if (windowObj) {
        const handlePopState = async () => {
          const urlPath = windowObj.location.pathname;
          setIsLoadingRoute(true);
          try {
            const route = await parseUrl(urlPath);
            if (route) {
              // For popstate events, just replace the current route
              setNavigationHistory(prev => {
                const newHistory = [...prev];
                setCurrentIndex(currentIndex => {
                  newHistory[currentIndex] = route;
                  return currentIndex;
                });
                return newHistory;
              });
              updateUrl(route);
            }
          } catch (error) {
            console.error('Error parsing URL:', error);
          } finally {
            setIsLoadingRoute(false);
          }
        };

        windowObj.addEventListener('popstate', handlePopState);

        // Parse initial URL on web - only do this once
        const initializeRoute = async () => {
          setIsLoadingRoute(true);
          try {
            const initialRoute = await parseUrl(windowObj.location.pathname);
            if (initialRoute && initialRoute.screen !== 'Home') {
              // Build proper history for direct URL access
              const homeRoute: NavigationHistoryItem = { screen: 'Home' };
              setNavigationHistory([homeRoute, initialRoute]);
              setCurrentIndex(1);
              updateUrl(initialRoute);
            }
          } catch (error) {
            console.error('Error parsing initial URL:', error);
          } finally {
            setIsLoadingRoute(false);
          }
        };

        initializeRoute();

        return () => {
          windowObj.removeEventListener('popstate', handlePopState);
        };
      }
    }
  }, []); // Remove dependencies to prevent infinite loop

  const navigation = {
    navigate: (screen: 'Main' | 'Home' | 'SurahDetail' | 'Settings' | 'Search', params?: { surah: Surah }) => {
      const route: NavigationHistoryItem = { screen, params };
      navigateToRoute(route, true);
    },
    goBack: () => {
      if (currentIndex > 0) {
        // Go back to the previous route in history
        const newIndex = currentIndex - 1;
        setCurrentIndex(newIndex);
        updateUrl(navigationHistory[newIndex]);
      } else {
        // If we're at the beginning, go to Home but preserve the last selected surah
        const currentRoute = navigationHistory[currentIndex];
        const lastSelectedSurah = currentRoute.screen === 'SurahDetail' ? currentRoute.params?.surah : undefined;

        const homeRoute: NavigationHistoryItem = {
          screen: 'Home',
          params: lastSelectedSurah ? { lastSelectedSurah } : undefined
        };
        setNavigationHistory([homeRoute]);
        setCurrentIndex(0);
        updateUrl(homeRoute);
      }
    }
  };

  // Function to update the URL with verse information without creating a new navigation entry
  const updateVerseUrl = useCallback((surah: Surah, verseIndex?: number) => {
    if (Platform.OS === 'web') {
      const route: NavigationHistoryItem = {
        screen: 'SurahDetail',
        params: { surah, verseIndex }
      };
      const url = buildUrl(route);
      const windowObj = getWindow();
      if (windowObj && windowObj.history) {
        try {
          const doc = (globalThis as any).document;
          if (doc) doc.title = 'Kuran360';
        } catch { }
        windowObj.history.replaceState(null, 'Kuran360', url);
      }
    }
  }, [buildUrl]);

  const handleSurahSelect = (surah: Surah) => {
    // Update the current Home route to remember the selected surah
    setNavigationHistory(prev => {
      const newHistory = [...prev];
      if (newHistory[currentIndex].screen === 'Home') {
        newHistory[currentIndex] = {
          screen: 'Home',
          params: { lastSelectedSurah: surah }
        };
      }
      return newHistory;
    });

    // Navigate to the surah detail
    navigation.navigate('SurahDetail', { surah });
  };

  const currentRoute = navigationHistory[currentIndex];

  // Ensure the web document title is always 'Kuran360'
  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        const doc = (globalThis as any).document;
        if (doc && doc.title !== 'Kuran360') {
          doc.title = 'Kuran360';
        }
      } catch {
        // no-op
      }
    }
  }, [currentIndex, navigationHistory]);

  if (isLoadingRoute) {
    return (
      <NavigationContainer>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      </NavigationContainer>
    );
  }

  // Expose navigation helpers for global components like GlobalAudioBar
  const navHelpers = {
    goToSurah: async (surahNumber: number) => {
      const surah = await loadSurah(surahNumber);
      if (surah) {
        const route: NavigationHistoryItem = { screen: 'SurahDetail', params: { surah } };
        navigateToRoute(route, true);
      }
    },
    goToSurahVerse: async (surahNumber: number, verseIndex: number) => {
      const surah = await loadSurah(surahNumber);
      if (surah) {
        const route: NavigationHistoryItem = { screen: 'SurahDetail', params: { surah, verseIndex } };
        navigateToRoute(route, true);
      }
    }
  };

  return (
    <NavigationContainer
      documentTitle={{
        formatter: () => 'Kuran360',
      }}
    >
      <NavigationProvider value={navHelpers}>
        <ScreenWrapper>
          {currentRoute.screen === 'Main' ? (
            <MainScreen
              onNavigate={(screen) => {
                navigation.navigate(screen);
              }}
            />
          ) : currentRoute.screen === 'Home' ? (
            <HomeScreen
              navigation={navigation}
              onSurahSelect={handleSurahSelect}
              lastSelectedSurah={currentRoute.params?.lastSelectedSurah}
              isDataAvailable={isDataAvailable}
            />
          ) : currentRoute.screen === 'Settings' ? (
            <SettingsScreen navigation={navigation} />
          ) : currentRoute.screen === 'Search' ? (
            <SearchScreen navigation={navigation} />
          ) : currentRoute.screen === 'SurahDetail' && currentRoute.params?.surah ? (
            <SurahDetailScreen
              navigation={navigation}
              route={{ params: { surah: currentRoute.params.surah, verseIndex: currentRoute.params.verseIndex } }}
              updateVerseUrl={updateVerseUrl}
            />
          ) : (
            <MainScreen
              onNavigate={(screen) => {
                navigation.navigate(screen);
              }}
            />
          )}
        </ScreenWrapper>
      </NavigationProvider>
    </NavigationContainer>
  );
};
