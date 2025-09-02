// 优化的数据加载器 - 用于缓存和延迟加载JSON数据
let brokerDataCache: any = null;
let weeklyDataCache: any = null;
let monthlyDataCache: any = null;
let dailyCostDataCache: any = null;

export async function getBrokerData() {
  if (brokerDataCache) {
    return brokerDataCache;
  }
  
  try {
    const response = await fetch('/broker_data.json');
    const data = await response.json();
    brokerDataCache = data;
    return data;
  } catch (error) {
    console.error('Error loading broker data:', error);
    return [];
  }
}

export async function getWeeklyData() {
  if (weeklyDataCache) {
    return weeklyDataCache;
  }
  
  try {
    const response = await fetch('/weekly_data.json');
    const data = await response.json();
    weeklyDataCache = data;
    return data;
  } catch (error) {
    console.error('Error loading weekly data:', error);
    return [];
  }
}

export async function getMonthlyData() {
  if (monthlyDataCache) {
    return monthlyDataCache;
  }
  
  try {
    const response = await fetch('/monthly_data.json');
    const data = await response.json();
    monthlyDataCache = data;
    return data;
  } catch (error) {
    console.error('Error loading monthly data:', error);
    return [];
  }
}

export async function getDailyCostData() {
  if (dailyCostDataCache) {
    return dailyCostDataCache;
  }
  
  try {
    const response = await fetch('/daily_cost_data.json');
    const data = await response.json();
    dailyCostDataCache = data;
    return data;
  } catch (error) {
    console.error('Error loading daily cost data:', error);
    return [];
  }
}

// 清除缓存函数（用于数据更新后）
export function clearDataCache() {
  brokerDataCache = null;
  weeklyDataCache = null;
  monthlyDataCache = null;
  dailyCostDataCache = null;
}

// 兼容性函数
export interface ClientData {
  日期: string;
  date: string;
  Broker: string;
  [key: string]: any;
}

export interface WeeklyLeadsCostData {
  week: string;
  cost: number;
  leads: number;
}

export function isDateInRange(date: string, startDate: string, endDate: string): boolean {
  if (!date || !startDate || !endDate) return true;
  
  const dateObj = new Date(date);
  const startObj = new Date(startDate);
  const endObj = new Date(endDate);
  
  return dateObj >= startObj && dateObj <= endObj;
}