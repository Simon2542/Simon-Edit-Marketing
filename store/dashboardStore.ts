import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface DashboardStore {
  brokerData: any[];
  weeklyData: any[];
  monthlyData: any[];
  dailyCostData: any[];

  // 小王测试数据
  xiaowangTestData: any | null;
  xiaowangTestNotesData: any[];

  // LifeCar数据
  lifeCarData: any[];
  lifeCarMonthlyData: any[];
  lifeCarNotesData: any[];

  setBrokerData: (data: any[]) => void;
  setWeeklyData: (data: any[]) => void;
  setMonthlyData: (data: any[]) => void;
  setDailyCostData: (data: any[]) => void;

  // 小王测试数据设置方法
  setXiaowangTestData: (data: any | null) => void;
  setXiaowangTestNotesData: (data: any[]) => void;

  // LifeCar数据设置方法
  setLifeCarData: (data: any[]) => void;
  setLifeCarMonthlyData: (data: any[]) => void;
  setLifeCarNotesData: (data: any[]) => void;

  updateAllData: (data: {
    broker_data?: any[];
    weekly_data?: any[];
    monthly_data?: any[];
    daily_cost_data?: any[];
  }) => void;

  clearAllData: () => void;
}

const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      brokerData: [],
      weeklyData: [],
      monthlyData: [],
      dailyCostData: [],
      xiaowangTestData: null,
      xiaowangTestNotesData: [],
      lifeCarData: [],
      lifeCarMonthlyData: [],
      lifeCarNotesData: [],

      setBrokerData: (data) => set({ brokerData: data }),
      setWeeklyData: (data) => set({ weeklyData: data }),
      setMonthlyData: (data) => set({ monthlyData: data }),
      setDailyCostData: (data) => set({ dailyCostData: data }),

      setXiaowangTestData: (data) => set({ xiaowangTestData: data }),
      setXiaowangTestNotesData: (data) => set({ xiaowangTestNotesData: data }),

      setLifeCarData: (data) => set({ lifeCarData: data }),
      setLifeCarMonthlyData: (data) => set({ lifeCarMonthlyData: data }),
      setLifeCarNotesData: (data) => set({ lifeCarNotesData: data }),

      updateAllData: (data) => set((state) => {
        const newState = {
          brokerData: data.broker_data || state.brokerData,
          weeklyData: data.weekly_data || state.weeklyData,
          monthlyData: data.monthly_data || state.monthlyData,
          dailyCostData: data.daily_cost_data || state.dailyCostData,
        };
        console.log('Updating dashboard store with:', {
          broker_data: newState.brokerData?.length || 0,
          weekly_data: newState.weeklyData?.length || 0,
          monthly_data: newState.monthlyData?.length || 0,
          daily_cost_data: newState.dailyCostData?.length || 0
        });
        return newState;
      }),

      clearAllData: () => set({
        brokerData: [],
        weeklyData: [],
        monthlyData: [],
        dailyCostData: [],
        xiaowangTestData: null,
        xiaowangTestNotesData: [],
        lifeCarData: [],
        lifeCarMonthlyData: [],
        lifeCarNotesData: [],
      }),
    }),
    {
      name: 'dashboard-storage',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? sessionStorage : undefined as any
      ),
      partialize: (state) => ({
        brokerData: state.brokerData,
        weeklyData: state.weeklyData,
        monthlyData: state.monthlyData,
        dailyCostData: state.dailyCostData,
        xiaowangTestData: state.xiaowangTestData,
        xiaowangTestNotesData: state.xiaowangTestNotesData,
        lifeCarData: state.lifeCarData,
        lifeCarMonthlyData: state.lifeCarMonthlyData,
        lifeCarNotesData: state.lifeCarNotesData,
      }),
    }
  )
);

export default useDashboardStore;