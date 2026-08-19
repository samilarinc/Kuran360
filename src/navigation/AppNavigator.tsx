import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Platform, View, ActivityIndicator, BackHandler } from 'react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { MainScreen } from '../screens/MainScreen';
import { SurahDetailScreen } from '../screens/SurahDetailScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { AboutScreen } from '../screens/AboutScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ForumScreen } from '../screens/ForumScreen';
import { ForumThreadScreen } from '../screens/ForumThreadScreen';
import { RandomVerseScreen } from '../screens/RandomVerseScreen';
import { AllTranslationsScreen } from '../screens/AllTranslationsScreen';
import { HatimScreen } from '../screens/HatimScreen';
import { HatimDetailScreen } from '../screens/HatimDetailScreen';
import { PrayerTimesScreen } from '../screens/PrayerTimesScreen';
import { HutbeScreen } from '../screens/HutbeScreen';
import { UmrahProgressScreen } from '../screens/UmrahProgressScreen';
import { DuaListScreen } from '../screens/DuaListScreen';
import { UmrahDuasScreen } from '../screens/UmrahDuasScreen';
import { UmrahMenuScreen } from '../screens/UmrahMenuScreen';
import { UmrahChecklistScreen } from '../screens/UmrahChecklistScreen';
import { DuaRequestScreen } from '../screens/DuaRequestScreen';
import { HijriCalendarScreen } from '../screens/HijriCalendarScreen';
import { ForumProvider } from '../contexts/ForumContext';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useGlobalAudio } from '../contexts/AudioContext';
import { useDebouncedSettings } from '../hooks/useDebouncedSettings';
import { useAuth } from '../contexts/AuthContext';
import { Surah } from '../types';
import { quranData, loadSurah } from '../data/quranData';
import { NavigationProvider } from '../contexts/NavigationContext';
import { useTheme } from '../contexts/ThemeContext';
import { createStyles } from './AppNavigator.styles';

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
  About: undefined;
  Profile: undefined;
  Forum: undefined;
  ForumThread: { threadId: string };
  RandomVerse: undefined;
  AllTranslations: { verse: any };
  Hatim: undefined;
  HatimDetail: { hatimId: string };
  PrayerTimes: undefined;
  Hutbe: undefined;
  UmrahMenu: undefined;
  UmrahProgress: undefined;
  DuaList: undefined;
  UmrahDuas: undefined;
  UmrahChecklist: undefined;
  DuaRequest: { userId: string };
  HijriCalendar: undefined;
};

type NavigationHistoryItem = {
  screen: 'Main' | 'Home' | 'SurahDetail' | 'Settings' | 'Search' | 'About' | 'Profile' | 'Forum' | 'ForumThread' | 'RandomVerse' | 'AllTranslations' | 'Hatim' | 'HatimDetail' | 'PrayerTimes' | 'Hutbe' | 'UmrahMenu' | 'UmrahProgress' | 'DuaList' | 'UmrahDuas' | 'UmrahChecklist' | 'DuaRequest' | 'HijriCalendar';
  params?: {
    surah?: Surah;
    verseIndex?: number;
    threadId?: string;
    hatimId?: string;
    userId?: string;
    lastSelectedSurah?: Surah;
    verse?: any;
  };
};

export const AppNavigator: React.FC<{ isDataAvailable: boolean }> = ({ isDataAvailable }) => {
  const [navigationHistory, setNavigationHistory] = useState<NavigationHistoryItem[]>([
    { screen: 'Main' }
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(0);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState<NavigationHistoryItem | null>(null);
  const { user, loading: authLoading } = useAuth();
  const { audioState } = useGlobalAudio();
  const { settings, updateSettings } = useDebouncedSettings(200);
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

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
      case 'About':
        return '/about';
      case 'Profile':
        return '/profile';
      case 'Forum':
        return '/forum';
      case 'ForumThread':
        return route.params?.threadId ? `/forum/${route.params.threadId}` : '/forum';
      case 'RandomVerse':
        return '/random-verse';
      case 'Hatim':
        return '/hatim';
      case 'HatimDetail':
        return route.params?.hatimId ? `/hatim/${route.params.hatimId}` : '/hatim';
      case 'PrayerTimes':
        return '/prayer-times';
      case 'Hutbe':
        return '/hutbe';
      case 'UmrahMenu':
        return '/umrah';
      case 'UmrahProgress':
        return '/umrah-progress';
      case 'DuaList':
        return '/dua-list';
      case 'UmrahDuas':
        return '/umrah-duas';
      case 'UmrahChecklist':
        return '/umrah-checklist';
      case 'DuaRequest':
        return route.params?.userId ? `/dua-request/${route.params.userId}` : '/dua-list';
      case 'HijriCalendar':
        return '/hijri-calendar';
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
    }

    if (pathname === '/about') {
      return { screen: 'About' };
    }

    if (pathname === '/profile') {
      return { screen: 'Profile' };
    }

    if (pathname === '/forum') {
      return { screen: 'Forum' };
    }

    if (pathname === '/umrah') {
      return { screen: 'UmrahMenu' };
    }

    if (pathname === '/umrah-progress') {
      return { screen: 'UmrahProgress' };
    }

    if (pathname === '/dua-list') {
      return { screen: 'DuaList' };
    }

    if (pathname === '/umrah-duas') {
      return { screen: 'UmrahDuas' };
    }

    if (pathname === '/umrah-checklist') {
      return { screen: 'UmrahChecklist' };
    }

    if (pathname === '/random-verse') {
      return { screen: 'RandomVerse' };
    }

    const threadMatch = pathname.match(/^\/forum\/(.+)$/);
    if (threadMatch) {
      return { screen: 'ForumThread', params: { threadId: threadMatch[1] } };
    }

    if (pathname === '/hatim') {
      return { screen: 'Hatim' };
    }

    const hatimMatch = pathname.match(/^\/hatim\/(.+)$/);
    if (hatimMatch) {
      return { screen: 'HatimDetail', params: { hatimId: hatimMatch[1] } };
    }

    if (pathname === '/prayer-times') {
      return { screen: 'PrayerTimes' };
    }

    const duaRequestMatch = pathname.match(/^\/dua-request\/(.+)$/);
    if (duaRequestMatch) {
      return { screen: 'DuaRequest', params: { userId: duaRequestMatch[1] } };
    }


    if (pathname === '/hutbe') {
      return { screen: 'Hutbe' };
    }

    if (pathname === '/hijri-calendar') {
      return { screen: 'HijriCalendar' };
    }

    // Check for verse-specific URLs: /surah/1/verse/3
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

  const updateUrl = useCallback((route: NavigationHistoryItem, navIndex: number) => {
    if (Platform.OS === 'web') {
      const url = buildUrl(route);
      const windowObj = getWindow();
      if (windowObj && windowObj.history) {
        try {
          const doc = (globalThis as any).document;
          if (doc) doc.title = 'Kuran360';
        } catch { }
        windowObj.history.pushState({ navIndex }, 'Kuran360', url);
      }
    }
  }, [buildUrl]);

  const navigateToRoute = useCallback((route: NavigationHistoryItem, addToHistory: boolean = true) => {
    if (addToHistory) {
      const newIndex = currentIndexRef.current + 1;
      currentIndexRef.current = newIndex;
      setCurrentIndex(newIndex);
      setNavigationHistory(prev => [...prev.slice(0, newIndex), route]);
      updateUrl(route, newIndex);
    } else {
      const idx = currentIndexRef.current;
      setNavigationHistory(prev => {
        const newHistory = [...prev];
        newHistory[idx] = route;
        return newHistory;
      });
    }
  }, [updateUrl]);

  // Handle browser back/forward buttons and initial URL (Web only)
  useEffect(() => {
    if (Platform.OS === 'web') {
      const windowObj = getWindow();
      if (windowObj) {
        const handlePopState = (event: any) => {
          const targetIndex = event?.state?.navIndex;
          if (typeof targetIndex === 'number' && targetIndex >= 0) {
            currentIndexRef.current = targetIndex;
            setCurrentIndex(targetIndex);
          }
        };

        windowObj.addEventListener('popstate', handlePopState);

        // Parse initial URL on web - only do this once
        const initializeRoute = async () => {
          setIsLoadingRoute(true);
          try {
            const initialRoute = await parseUrl(windowObj.location.pathname);
            if (initialRoute && initialRoute.screen !== 'Main') {
              const mainRoute: NavigationHistoryItem = { screen: 'Main' };
              setNavigationHistory([mainRoute, initialRoute]);
              setCurrentIndex(1);
              currentIndexRef.current = 1;
              // Inject Main into browser history, then push the deep-linked route
              windowObj.history.replaceState({ navIndex: 0 }, 'Kuran360', '/');
              windowObj.history.pushState({ navIndex: 1 }, 'Kuran360', windowObj.location.pathname);
            } else {
              windowObj.history.replaceState({ navIndex: 0 }, 'Kuran360', windowObj.location.pathname);
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

  // Handle pending redirection after login
  useEffect(() => {
    if (user && pendingRedirect) {
      const route = pendingRedirect;
      setPendingRedirect(null);
      navigateToRoute(route, true);
    }
  }, [user, pendingRedirect, navigateToRoute]);

  const navigation = {
    navigate: (screen: 'Main' | 'Home' | 'SurahDetail' | 'Settings' | 'Search' | 'About' | 'Profile' | 'Forum' | 'ForumThread' | 'RandomVerse' | 'AllTranslations' | 'Hatim' | 'HatimDetail' | 'PrayerTimes' | 'Hutbe' | 'UmrahMenu' | 'UmrahProgress' | 'DuaList' | 'UmrahDuas' | 'UmrahChecklist' | 'DuaRequest' | 'HijriCalendar', params?: any) => {
      const route: NavigationHistoryItem = { screen, params };

      // Auth protection for Hatim screens
      if (screen === 'Hatim' || screen === 'HatimDetail') {
        if (!user) {
          setPendingRedirect(route);
          const profileRoute: NavigationHistoryItem = { screen: 'Profile' };
          navigateToRoute(profileRoute, true);
          return;
        }
      }

      navigateToRoute(route, true);
    },
    goBack: () => {
      if (Platform.OS === 'web') {
        if (currentIndex > 0) {
          getWindow()?.history.back(); // triggers popstate → setCurrentIndex
        }
        return;
      }
      if (currentIndex > 0) {
        const newIndex = currentIndex - 1;
        currentIndexRef.current = newIndex;
        setCurrentIndex(newIndex);
      } else {
        const mainRoute: NavigationHistoryItem = { screen: 'Main' };
        setNavigationHistory([mainRoute]);
        currentIndexRef.current = 0;
        setCurrentIndex(0);
      }
    }
  };

  // Handle Android hardware back button
  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (currentIndex > 0) {
          // Navigate back in history
          navigation.goBack();
          return true; // Prevent default behavior (exit app)
        }
        // If at the first screen (Main), allow default behavior (exit app)
        return false;
      });

      return () => backHandler.remove();
    }
  }, [currentIndex, navigation]);

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
        windowObj.history.replaceState({ navIndex: currentIndexRef.current }, 'Kuran360', url);
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
        <View style={styles.loadingContainer}>
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
        <ForumProvider>
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
              <SearchScreen navigation={navigation} isDataAvailable={isDataAvailable} />
            ) : currentRoute.screen === 'About' ? (
              <AboutScreen navigation={navigation} />
            ) : currentRoute.screen === 'Profile' ? (
              <ProfileScreen navigation={navigation} />
            ) : currentRoute.screen === 'Forum' ? (
              <ForumScreen navigation={navigation} />
            ) : currentRoute.screen === 'ForumThread' && currentRoute.params?.threadId ? (
              <ForumThreadScreen navigation={navigation} route={{ params: { threadId: currentRoute.params.threadId } }} />
            ) : currentRoute.screen === 'RandomVerse' ? (
              <RandomVerseScreen navigation={navigation} isDataAvailable={isDataAvailable} />
            ) : currentRoute.screen === 'AllTranslations' && currentRoute.params?.verse ? (
              <AllTranslationsScreen navigation={navigation} route={{ params: { verse: currentRoute.params.verse } }} />
            ) : currentRoute.screen === 'SurahDetail' && currentRoute.params?.surah ? (
              <SurahDetailScreen
                navigation={navigation}
                route={{ params: { surah: currentRoute.params.surah, verseIndex: currentRoute.params.verseIndex } }}
                updateVerseUrl={updateVerseUrl}
              />
            ) : currentRoute.screen === 'Hatim' ? (
              <HatimScreen navigation={navigation} />
            ) : currentRoute.screen === 'HatimDetail' && currentRoute.params?.hatimId ? (
              <HatimDetailScreen navigation={navigation} route={{ params: { hatimId: currentRoute.params.hatimId } }} />
            ) : currentRoute.screen === 'PrayerTimes' ? (
              <PrayerTimesScreen navigation={navigation} />
            ) : currentRoute.screen === 'Hutbe' ? (
              <HutbeScreen navigation={navigation} />
            ) : currentRoute.screen === 'UmrahMenu' ? (
              <UmrahMenuScreen navigation={navigation} />
            ) : currentRoute.screen === 'UmrahProgress' ? (
              <UmrahProgressScreen onNavigate={() => navigation.goBack()} navigation={navigation} />
            ) : currentRoute.screen === 'DuaList' ? (
              <DuaListScreen onNavigate={() => navigation.goBack()} />
            ) : currentRoute.screen === 'UmrahDuas' ? (
              <UmrahDuasScreen onNavigate={() => navigation.goBack()} />
            ) : currentRoute.screen === 'UmrahChecklist' ? (
              <UmrahChecklistScreen onNavigate={() => navigation.goBack()} navigation={navigation} />
            ) : currentRoute.screen === 'DuaRequest' && currentRoute.params?.userId ? (
              <DuaRequestScreen navigation={navigation} userId={currentRoute.params.userId} />
            ) : currentRoute.screen === 'HijriCalendar' ? (
              <HijriCalendarScreen navigation={navigation} />
            ) : (
              <MainScreen
                onNavigate={(screen) => {
                  navigation.navigate(screen);
                }}
              />
            )}
          </ScreenWrapper>
        </ForumProvider>
      </NavigationProvider>
    </NavigationContainer>
  );
};
