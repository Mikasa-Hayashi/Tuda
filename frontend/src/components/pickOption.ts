import { ActionSheetIOS, Alert, Platform } from 'react-native';

export type PickOption = { id: string; label: string };

/** Native iOS action sheet (Alert with buttons on other platforms). */
export function pickOption({
  title,
  options,
  cancelLabel,
  onSelect,
}: {
  title: string;
  options: PickOption[];
  cancelLabel: string;
  onSelect: (id: string) => void;
}) {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        options: [...options.map((o) => o.label), cancelLabel],
        cancelButtonIndex: options.length,
      },
      (index) => {
        if (index < options.length) onSelect(options[index].id);
      },
    );
    return;
  }
  Alert.alert(title, undefined, [
    ...options.map((o) => ({ text: o.label, onPress: () => onSelect(o.id) })),
    { text: cancelLabel, style: 'cancel' as const },
  ]);
}
