import React, { useState, useEffect, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Platform } from 'react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { SurahDetailScreen } from '../screens/SurahDetailScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { Surah } from '../types';
import { quranData } from '../data/quranData';

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
  Home: undefined;
  SurahDetail: { surah: Surah };
  Settings: undefined;
};

type NavigationHistoryItem = {
  screen: 'Home' | 'SurahDetail' | 'Settings';
  params?: { surah: Surah };
};

export const AppNavigator: React.FC = () => {
  const [navigationHistory, setNavigationHistory] = useState<NavigationHistoryItem[]>([
    { screen: 'Home' }
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const buildUrl = useCallback((route: NavigationHistoryItem): string => {
    switch (route.screen) {
      case 'Settings':
        return '/settings';
      case 'SurahDetail':
        return route.params ? `/surah/${route.params.surah.number}` : '/';
      default:
        return '/';
    }
  }, []);

  const parseUrl = useCallback((pathname: string): NavigationHistoryItem | null => {
    if (pathname === '/settings') {
      return { screen: 'Settings' };
    }

    const surahMatch = pathname.match(/^\/surah\/(\d+)$/);
    if (surahMatch) {
      const surahNumber = parseInt(surahMatch[1], 10);
      // Find the actual surah from our data
      const surah = quranData.surahs.find(s => s.number === surahNumber);
      if (surah) {
        return {
          screen: 'SurahDetail',
          params: { surah }
        };
      }
    }

    return pathname === '/' || pathname === '' ? { screen: 'Home' } : null;
  }, []);

  const updateUrl = useCallback((route: NavigationHistoryItem) => {
    if (Platform.OS === 'web') {
      const url = buildUrl(route);
      const windowObj = getWindow();
      if (windowObj && windowObj.history) {
        windowObj.history.pushState(null, '', url);
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
        const handlePopState = () => {
          const urlPath = windowObj.location.pathname;
          const route = parseUrl(urlPath);
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
        };

        windowObj.addEventListener('popstate', handlePopState);

        // Parse initial URL on web - only do this once
        const initialRoute = parseUrl(windowObj.location.pathname);
        if (initialRoute && initialRoute.screen !== 'Home') {
          // Build proper history for direct URL access
          const homeRoute: NavigationHistoryItem = { screen: 'Home' };
          setNavigationHistory([homeRoute, initialRoute]);
          setCurrentIndex(1);
          updateUrl(initialRoute);
        }

        return () => {
          windowObj.removeEventListener('popstate', handlePopState);
        };
      }
    }
  }, []); // Remove dependencies to prevent infinite loop

  const navigation = {
    navigate: (screen: 'Home' | 'SurahDetail' | 'Settings', params?: { surah: Surah }) => {
      const route: NavigationHistoryItem = { screen, params };
      navigateToRoute(route, true);
    },
    goBack: () => {
      // Always go back to Home - simple and reliable
      const homeRoute: NavigationHistoryItem = { screen: 'Home' };
      setNavigationHistory([homeRoute]);
      setCurrentIndex(0);
      updateUrl(homeRoute);
    }
  };

  const handleSurahSelect = (surah: Surah) => {
    navigation.navigate('SurahDetail', { surah });
  };

  const currentRoute = navigationHistory[currentIndex];

  return (
    <NavigationContainer>
      {currentRoute.screen === 'Home' ? (
        <HomeScreen navigation={navigation} onSurahSelect={handleSurahSelect} />
      ) : currentRoute.screen === 'Settings' ? (
        <SettingsScreen navigation={navigation} />
      ) : currentRoute.screen === 'SurahDetail' && currentRoute.params ? (
        <SurahDetailScreen
          navigation={navigation}
          route={{ params: { surah: currentRoute.params.surah } }}
        />
      ) : (
        <HomeScreen navigation={navigation} onSurahSelect={handleSurahSelect} />
      )}
    </NavigationContainer>
  );
};
