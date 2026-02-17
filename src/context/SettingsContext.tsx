import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { UserSettings } from '@/types/settings';
import { defaultSettings } from '@/types/settings';

interface SettingsContextValue {
  settings: UserSettings;
  isLoaded: boolean;
  updateSettings: (partial: Partial<UserSettings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined,
);

interface SettingsProviderProps {
  children: React.ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({
  children,
}) => {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        if (window.electronAPI?.getSettings) {
          const loaded = await window.electronAPI.getSettings();
          if (isMounted && loaded) {
            setSettings(loaded);
          }
        } else {
          const raw = window.localStorage.getItem('sideline:settings');
          if (raw) {
            const parsed = JSON.parse(raw) as UserSettings;
            if (isMounted) {
              setSettings(parsed);
            }
          }
        }
      } catch {
        if (isMounted) {
          setSettings(defaultSettings);
        }
      } finally {
        if (isMounted) {
          setIsLoaded(true);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateSettings = useCallback(
    async (partial: Partial<UserSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...partial };

        if (window.electronAPI?.setSettings) {
          window.electronAPI
            .setSettings(next)
            .catch(() => {});
        } else {
          window.localStorage.setItem(
            'sideline:settings',
            JSON.stringify(next),
          );
        }

        return next;
      });
    },
    [],
  );

  const value: SettingsContextValue = {
    settings,
    isLoaded,
    updateSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return ctx;
}

