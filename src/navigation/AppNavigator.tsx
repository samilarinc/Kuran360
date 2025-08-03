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

  const navigateToRoute = useCallback((route: NavigationHistoryItem, updateHistory: boolean = true) => {
    console.log('Navigating to route:', route.screen, 'updateHistory:', updateHistory);
    
    if (updateHistory) {
      setNavigationHistory(prev => {
        const newHistory = prev.slice(0, currentIndex + 1);
        newHistory.push(route);
        return newHistory;
      });
      setCurrentIndex(prev => prev + 1);
    } else {
      // For URL navigation, replace current route
      setNavigationHistory(prev => {
        const newHistory = [...prev];
        newHistory[currentIndex] = route;
        return newHistory;
      });
    }
  }, [currentIndex]);

  // Update URL when navigation changes (Web only)
  useEffect(() => {
    if (Platform.OS === 'web') {
      const currentRoute = navigationHistory[currentIndex];
      const url = buildUrl(currentRoute);
      
      // Use history API if available
      const windowObj = getWindow();
      if (windowObj && windowObj.history) {
        windowObj.history.pushState(null, '', url);
      }
    }
  }, [navigationHistory, currentIndex, buildUrl]);

  // Handle browser back/forward buttons and initial URL (Web only)
  useEffect(() => {
    if (Platform.OS === 'web') {
      const windowObj = getWindow();
      if (windowObj) {
        const handlePopState = () => {
          const urlPath = windowObj.location.pathname;
          const route = parseUrl(urlPath);
          if (route) {
            navigateToRoute(route, false);
          }
        };

        windowObj.addEventListener('popstate', handlePopState);
        
        // Parse initial URL on web
        const initialRoute = parseUrl(windowObj.location.pathname);
        if (initialRoute && initialRoute.screen !== 'Home') {
          navigateToRoute(initialRoute, false);
        }

        return () => {
          windowObj.removeEventListener('popstate', handlePopState);
        };
      }
    }
  }, [parseUrl, navigateToRoute]);

  const navigation = {
    navigate: (screen: 'Home' | 'SurahDetail' | 'Settings', params?: { surah: Surah }) => {
      console.log(`Navigating to ${screen}`, params);
      const route: NavigationHistoryItem = { screen, params };
      navigateToRoute(route);
    },
    goBack: () => {
      console.log('Going back. Current index:', currentIndex, 'History length:', navigationHistory.length);
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      } else {
        // Fallback to Home if no history
        console.log('No history to go back to, navigating to Home');
        navigateToRoute({ screen: 'Home' });
      }
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
