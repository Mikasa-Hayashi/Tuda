import { AiRouteAccessory } from '@/src/components/AiRouteAccessory';
import { useTheme } from '@/src/theme/ThemeContext';
import { useNavigation, usePathname } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

/** URL paths of the tab roots; any other path means a screen is pushed above the tabs. */
const TAB_PATHS = new Set(['/', '/overview', '/scan', '/routes', '/profile']);

/** Tab root path -> i18n key of its label. */
const TAB_TITLE_KEYS: Record<string, string> = {
  '/': 'tabs.map',
  '/overview': 'tabs.home',
  '/scan': 'tabs.scan',
  '/routes': 'tabs.routes',
  '/profile': 'tabs.profile',
};

export default function TabsLayout() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const pathname = usePathname();
  // The AI-route capsule above the tab bar belongs to the Routes tab only.
  // Pushing a screen above the tabs (e.g. /route-info) changes the pathname but doesn't change the
  // selected tab, so in that case keep the previous value. Unmounting the accessory there made it
  // re-appear with a ~1s delay after swiping back.
  const [showAiAccessory, setShowAiAccessory] = useState(false);
  const nextShowAi = pathname === '/routes' ? true : TAB_PATHS.has(pathname) ? false : showAiAccessory;
  if (nextShowAi !== showAiAccessory) setShowAiAccessory(nextShowAi);

  // The root stack lists this screen in the back button's long-press history. Name it after the
  // active tab (not always "Home"); while a screen is pushed above the tabs keep the last tab.
  const navigation = useNavigation();
  const [tabTitleKey, setTabTitleKey] = useState('tabs.home');
  const nextTitleKey = TAB_TITLE_KEYS[pathname] ?? tabTitleKey;
  if (nextTitleKey !== tabTitleKey) setTabTitleKey(nextTitleKey);
  useEffect(() => {
    navigation.setOptions({ title: t(tabTitleKey) });
  }, [navigation, t, tabTitleKey]);

  return (
    <NativeTabs tintColor={colors.primary}>
      {showAiAccessory && (
        <NativeTabs.BottomAccessory>
          <AiRouteAccessory label={t('routesScreen.aiPromoTitle')} />
        </NativeTabs.BottomAccessory>
      )}
      <NativeTabs.Trigger name="overview">
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <NativeTabs.Trigger.Label>{t('tabs.home')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf={{ default: 'map', selected: 'map.fill' }} />
        <NativeTabs.Trigger.Label>{t('tabs.map')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="scan">
        <NativeTabs.Trigger.Icon sf={{ default: 'camera', selected: 'camera.fill' }} />
        <NativeTabs.Trigger.Label>{t('tabs.scan')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="routes">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'signpost.right', selected: 'signpost.right.fill' }}
        />
        <NativeTabs.Trigger.Label>{t('tabs.routes')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }}
        />
        <NativeTabs.Trigger.Label>{t('tabs.profile')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
