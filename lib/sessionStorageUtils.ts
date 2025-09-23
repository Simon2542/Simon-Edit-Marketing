const STORAGE_KEY = 'dashboard-data';

export interface StorageData {
  brokerData: any[];
  weeklyData: any[];
  monthlyData: any[];
  dailyCostData: any[];
  xiaowangTestData: any | null;
  xiaowangTestNotesData: any[];
  lifeCarData: any[];
  lifeCarMonthlyData: any[];
  lifeCarNotesData: any[];
}

const defaultData: StorageData = {
  brokerData: [],
  weeklyData: [],
  monthlyData: [],
  dailyCostData: [],
  xiaowangTestData: null,
  xiaowangTestNotesData: [],
  lifeCarData: [],
  lifeCarMonthlyData: [],
  lifeCarNotesData: [],
};

export const sessionStorageUtils = {
  getData: (): StorageData => {
    if (typeof window === 'undefined') return defaultData;

    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error reading from sessionStorage:', error);
    }
    return defaultData;
  },

  setData: (data: Partial<StorageData>) => {
    if (typeof window === 'undefined') return;

    try {
      const current = sessionStorageUtils.getData();
      const updated = { ...current, ...data };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error writing to sessionStorage:', error);
    }
  },

  updateData: (updates: {
    broker_data?: any[];
    weekly_data?: any[];
    monthly_data?: any[];
    daily_cost_data?: any[];
  }) => {
    const data = sessionStorageUtils.getData();
    const updated: Partial<StorageData> = {};

    if (updates.broker_data) updated.brokerData = updates.broker_data;
    if (updates.weekly_data) updated.weeklyData = updates.weekly_data;
    if (updates.monthly_data) updated.monthlyData = updates.monthly_data;
    if (updates.daily_cost_data) updated.dailyCostData = updates.daily_cost_data;

    sessionStorageUtils.setData(updated);
  },

  clearAll: () => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(STORAGE_KEY);
  }
};