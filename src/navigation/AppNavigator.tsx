import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { HomeScreen } from '../screens/HomeScreen';
import { SurahDetailScreen } from '../screens/SurahDetailScreen';
import { Surah } from '../types';

export type RootStackParamList = {
  Home: undefined;
  SurahDetail: { surah: Surah };
};

export const AppNavigator: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<'Home' | 'SurahDetail'>('Home');
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);

  const navigation = {
    navigate: (screen: 'Home' | 'SurahDetail', params?: { surah: Surah }) => {
      if (screen === 'SurahDetail' && params) {
        setSelectedSurah(params.surah);
        setCurrentScreen('SurahDetail');
      } else {
        setCurrentScreen('Home');
      }
    },
    goBack: () => {
      setCurrentScreen('Home');
      setSelectedSurah(null);
    }
  };

  const handleSurahSelect = (surah: Surah) => {
    navigation.navigate('SurahDetail', { surah });
  };

  return (
    <NavigationContainer>
      {currentScreen === 'Home' ? (
        <HomeScreen navigation={navigation} onSurahSelect={handleSurahSelect} />
      ) : selectedSurah ? (
        <SurahDetailScreen
          navigation={navigation}
          route={{ params: { surah: selectedSurah } }}
        />
      ) : (
        <HomeScreen navigation={navigation} onSurahSelect={handleSurahSelect} />
      )}
    </NavigationContainer>
  );
};
