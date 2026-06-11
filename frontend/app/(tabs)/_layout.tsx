import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { useTheme } from '@/src/theme/ThemeContext';

export default function TabsLayout() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryDeep,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: colors.tabBar,
            borderTopColor: colors.separator,
          },
        ],
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="overview"
        options={{
          title: t('tabs.home'),
          tabBarLabel: t('tabs.home'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.map'),
          tabBarLabel: t('tabs.map'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="routes"
        options={{
          title: t('tabs.routes'),
          tabBarLabel: t('tabs.routes'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trail-sign-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarLabel: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 78,
    paddingTop: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 6,
  },
});
