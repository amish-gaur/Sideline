export interface UserSettings {
  favoriteTeam: string;
  refreshRate: number;
  startAtLogin: boolean;
}

export const defaultSettings: UserSettings = {
  favoriteTeam: 'SF 49ers',
  refreshRate: 15000,
  startAtLogin: false,
};

