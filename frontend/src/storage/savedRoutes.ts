import { personalData, usePersonalData } from './personalData';
import { personalEntryId, type SavedRoute } from './personalDataTypes';

export type { SavedRoute } from './personalDataTypes';

export const savedRoutes = {
  add: (input: Omit<SavedRoute, 'id' | 'createdAt'>) => {
    const createdAt = Date.now();
    const route = { ...input, id: personalEntryId(createdAt), createdAt };
    void personalData.set('savedRoutes', [route, ...personalData.get().savedRoutes]);
  },
  remove: (id: string) => {
    void personalData.set('savedRoutes', personalData.get().savedRoutes.filter((r) => r.id !== id));
  },
};

export function useSavedRoutes(): readonly SavedRoute[] {
  return usePersonalData('savedRoutes');
}
