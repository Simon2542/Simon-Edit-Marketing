
"use client"

import React, { useState, useMemo, useEffect } from "react"
import useDashboardStore from "@/store/dashboardStore"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { WeeklyLeadsCost } from "@/components/weekly-leads-cost"
import { WeeklyCostLeads } from "@/components/weekly-cost-leads"
import { MonthlyLeadsCost } from "@/components/monthly-leads-cost"
import { MonthlyPerLeadsCost } from "@/components/monthly-per-leads-cost"
import { DailyLeadsChart } from "@/components/daily-leads-chart"
import { PieChartWithFilter } from "@/components/pie-chart-with-filter"
import { BrokerWeeklyDonutChart } from "@/components/broker-weekly-donut-chart"
import { BrokerActivityHeatmap } from "@/components/broker-activity-heatmap"
import { MonthlyPatternChart } from "@/components/monthly-pattern-chart"
import { AcquisitionTimeAnalysis } from "@/components/acquisition-time-analysis"
import { WeeklyAnalysis, WeeklyOverallAverage } from "@/components/weekly-analysis"
import { ExcelUpload } from "@/components/excel-upload"
import { AccountSwitcher } from "@/components/ui/platform-switcher"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff } from "lucide-react"
import { LifeCarDailyTrends } from "@/components/lifecar-daily-trends"
import { LifeCarMonthlySummary } from "@/components/lifecar-monthly-summary"
import { LifeCarOverviewStats } from "@/components/lifecar-overview-stats"
import { ViewsCostDailyChart } from "@/components/views-cost-daily-chart"
import { CostPerFollowerDailyChart } from "@/components/cost-per-follower-daily-chart"
import { LifeCarWeeklyAnalysis } from "@/components/lifecar-weekly-analysis"
import { MonthlyViewsCostChart } from "@/components/monthly-views-cost-chart"
import { MonthlyCostPerMetricChart } from "@/components/monthly-cost-per-metric-chart"
import { parseLifeCarData, aggregateByMonth, filterByDateRange, type LifeCarDailyData, type LifeCarMonthlyData } from "@/lib/lifecar-data-processor"
import { LifeCarNotesModal } from "@/components/lifecar-notes-modal"
import { XiaoWangTestNotesModal } from "@/components/xiaowang-test-notes-modal"
import { XiaowangUpload } from "@/components/xiaowang-upload"
import { XiaowangDualUpload } from "@/components/xiaowang-dual-upload"
import { XiaowangTestCostAnalysis } from "@/components/xiaowang-test-cost-analysis"
import { XiaowangTestCostPerMetric } from "@/components/xiaowang-test-cost-per-metric"
import { XiaowangTestWeeklyCostAnalysis } from "@/components/xiaowang-test-weekly-cost-analysis"
import { XiaowangTestWeeklyCostPerMetric } from "@/components/xiaowang-test-weekly-cost-per-metric"
import { XiaowangTestWeeklyAnalysis } from "@/components/xiaowang-test-weekly-analysis"
import { XiaowangTestWeeklyOverallAverage, XiaowangTestWeeklyAnalysis as XiaowangTestWeeklyAnalysisAdapted } from "@/components/xiaowang-test-weekly-analysis-adapted"
import { XiaowangTestMonthlyCostAnalysis } from "@/components/xiaowang-test-monthly-cost-analysis"
import { XiaowangTestMonthlyCostPerMetric } from "@/components/xiaowang-test-monthly-cost-per-metric"
import { XiaowangTestCampaignOverview } from "@/components/xiaowang-test-campaign-overview"
import { XiaowangTestOverviewStats } from "@/components/xiaowang-test-overview-stats"
// 移除静态导入，改为动态API调用

// 小王测试数据类型定义
interface XiaowangTestData {
  adData: any[];
  rawData: any[]; // 组件期望的字段
  brokerData: any[];
  dailyData?: any[];
  summary: {
    totalCost: number;
    totalImpressions: number;
    totalClicks: number;
    totalInteractions: number;
    totalConversions: number;
    totalBrokerClients: number;
    avgClickRate: number;
    avgConversionCost: number;
  };
}

// 处理日期格式 - 将各种日期格式转换为标准格式
function parseDate(dateInput: string | number): Date | null {
  if (!dateInput && dateInput !== 0) return null
  
  try {
    // 处理 Excel 序列号格式（数字）
    if (typeof dateInput === 'number' || !isNaN(Number(dateInput))) {
      const excelDate = Number(dateInput)
      // Excel 日期从 1900/1/1 开始，序列号为 1
      // JavaScript 日期从 1970/1/1 开始
      // Excel 错误地将 1900 年当作闰年，所以要减去 2 天
      const date = new Date((excelDate - 25569) * 86400 * 1000)
      return isNaN(date.getTime()) ? null : date
    }
    
    // 处理字符串格式
    const dateStr = String(dateInput)
    
    // 处理 "9/20/24" 格式
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/')
      if (parts.length === 3) {
        const month = parseInt(parts[0])
        const day = parseInt(parts[1])
        let year = parseInt(parts[2])
        
        // 处理两位数年份
        if (year < 100) {
          year = year > 50 ? 1900 + year : 2000 + year
        }
        
        return new Date(year, month - 1, day)
      }
    }
    
    // 尝试直接解析
    const date = new Date(dateStr)
    return isNaN(date.getTime()) ? null : date
  } catch {
    return null
  }
}

// 处理饼图数据 - 使用真实Excel数据中的 Broker 列，不受时间筛选影响
function processBrokerData(brokerDataJson: any[]) {
  try {
    let clientsData = brokerDataJson || []
    
    // 统计每个 Broker 的客户数量
    const brokerCounts = clientsData.reduce((acc: any, client: any) => {
      let broker = client.broker || '未知'
      
      // Normalize broker names
      if (broker.toLowerCase() === 'yuki') {
        broker = 'Yuki'
      } else if (broker === 'Linudo') {
        broker = 'Linduo'
      } else if (broker.toLowerCase() === 'ziv') {
        broker = 'Ziv'
      }
      
      acc[broker] = (acc[broker] || 0) + 1
      return acc
    }, {})

    const total = clientsData.length
    return Object.entries(brokerCounts)
      .map(([broker, count]: [string, any]) => ({
        broker,
        count,
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0.0'
      }))
      .sort((a, b) => b.count - a.count) // 按数量降序排列
  } catch (error) {
    console.error('处理饼图数据失败:', error)
    return []
  }
}

// 将周次转换为日期范围
function parseWeekToDateRange(weekStr: string): { start: Date, end: Date } | null {
  const match = weekStr.match(/(\d{4})\/wk(\d+)/)
  if (!match) return null
  
  const year = parseInt(match[1])
  const weekNum = parseInt(match[2])
  
  // 计算该年第一天
  const firstDay = new Date(year, 0, 1)
  const dayOfWeek = firstDay.getDay()
  
  // 计算第一周的开始（周一）
  const firstMonday = new Date(firstDay)
  firstMonday.setDate(firstDay.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1))
  
  // 计算目标周的开始
  const weekStart = new Date(firstMonday)
  weekStart.setDate(firstMonday.getDate() + (weekNum - 1) * 7)
  
  // 计算目标周的结束
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  
  return { start: weekStart, end: weekEnd }
}

// 处理折线图数据 - 使用真实Excel数据中的Week和Leads单价（aud）
function processWeeklyData(weeklyDataJson: any[]) {
  try {
    let weeklyData = weeklyDataJson || []
    
    // 排序：从2024/wk44开始，按年份和周次排序
    return weeklyData
      .filter((item: any) => item.week && item.leadsPrice && item.leadsPrice > 0)
      .sort((a: any, b: any) => {
        // 按年份和周次排序
        const parseWeek = (week: string) => {
          const match = week.match(/(\d{4})\/wk(\d+)/)
          if (match) {
            const year = parseInt(match[1])
            const weekNum = parseInt(match[2])
            return year * 100 + weekNum
          }
          return 0
        }
        return parseWeek(a.week) - parseWeek(b.week)
      })
  } catch (error) {
    console.error('处理折线图数据失败:', error)
    return []
  }
}

// 处理月度数据 - 使用真实Excel数据
function processMonthlyData(monthlyDataJson: any[]) {
  try {
    let monthlyData = monthlyDataJson || []
    
    // 按月份排序
    return monthlyData.sort((a: any, b: any) => {
      return a.month.localeCompare(b.month)
    })
  } catch (error) {
    console.error('处理月度数据失败:', error)
    return []
  }
}

// 处理WeeklyCostLeads数据 - 使用totalCost和leadsTotal
function processWeeklyCostLeadsData(weeklyDataJson: any[]) {
  try {
    let weeklyData = weeklyDataJson || []
    
    // 排序：从2024/wk44开始，按年份和周次排序
    return weeklyData
      .filter((item: any) => item.week && (item.totalCost > 0 || item.leadsTotal > 0))
      .sort((a: any, b: any) => {
        // 按年份和周次排序
        const parseWeek = (week: string) => {
          const match = week.match(/(\d{4})\/wk(\d+)/)
          if (match) {
            const year = parseInt(match[1])
            const weekNum = parseInt(match[2])
            return year * 100 + weekNum
          }
          return 0
        }
        return parseWeek(a.week) - parseWeek(b.week)
      })
  } catch (error) {
    console.error('处理WeeklyCostLeads数据失败:', error)
    return []
  }
}

// 处理Weekday数据 - 使用broker数据按星期几统计
function processBrokerDataForWeekday(brokerDataJson: any[]) {
  try {
    let brokerData = brokerDataJson || []
    return brokerData
  } catch (error) {
    console.error('处理Weekday数据失败:', error)
    return []
  }
}

export default function Home() {
  // 模块导航状态
  const [activeModule, setActiveModule] = useState('broker');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadAccountType, setUploadAccountType] = useState<'lifecar' | 'xiaowang'>('xiaowang');
  const [showXiaowangTestUpload, setShowXiaowangTestUpload] = useState(false);
  const [dataRefreshKey, setDataRefreshKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hiddenModules, setHiddenModules] = useState<{[account: string]: string[]}>({
    'xiaowang-test': ['activity-heatmap'] // Template is hidden by default for xiaowang-test
  });
  
  // 账号筛选状态
  const [selectedAccount, setSelectedAccount] = useState('xiaowang');

  // 小王测试组件间共享的指标选择状态
  const [xiaowangSelectedMetric, setXiaowangSelectedMetric] = useState<'views' | 'likes' | 'followers' | 'leads'>('views');

  // 小王咨询Weekly Performance时间段筛选状态
  const [weeklyTimePeriod, setWeeklyTimePeriod] = useState<number>(12); // Default 12 weeks

  // 计算Weekly Performance的时间范围
  const getWeeklyTimePeriodRange = () => {
    const endDate = new Date();
    const startDate = new Date();

    // Calculate start date based on number of weeks
    startDate.setDate(endDate.getDate() - (weeklyTimePeriod * 7));

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };
  
  // 日期范围状态（替代之前的dateRange）
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  // LifeCar图表同步状态 - Day of Week Analysis的两个图表按钮同步
  const [lifecarChartMetric, setLifecarChartMetric] = useState<'views' | 'likes' | 'followers'>('views');
  const [lifecarChartFiltered, setLifecarChartFiltered] = useState(true);

  // LifeCar Monthly Analysis图表同步状态
  const [monthlyChartMetric, setMonthlyChartMetric] = useState<'views' | 'likes' | 'followers'>('views');

  // 小王测试图表同步状态 - Day of Week Analysis的两个图表按钮同步
  const [xiaowangChartFiltered, setXiaowangChartFiltered] = useState(true);


  // 账号切换处理函数
  const handleAccountChange = (account: string) => {
    setSelectedAccount(account);
    
    // 当切换到LifeCar账号时，重置Day of Week Analysis的按钮状态为默认值
    if (account === 'lifecar') {
      setLifecarChartMetric('views');
      setLifecarChartFiltered(true);
      setMonthlyChartMetric('views');
    }

    // 当切换到小王测试账号时，重置按钮状态为默认值
    if (account === 'xiaowang-test') {
      setXiaowangChartFiltered(true);
    }
    
    // 小王测试账号不自动加载数据，只使用上传的数据
    // if (account === 'xiaowang-test') {
    //   loadXiaowangTestData();
    // }
  };

  // 模块切换处理函数
  const handleModuleChange = (moduleId: string) => {
    setActiveModule(moduleId);
    
    // 当在LifeCar账号中切换页面时，重置相应的按钮状态
    if (selectedAccount === 'lifecar') {
      // 切换到Day of Week Analysis时，重置按钮状态为View
      if (moduleId === 'cost-interaction') {
        setLifecarChartMetric('views');
        setLifecarChartFiltered(true);
      }
      // 切换到Monthly Analysis时，重置按钮状态为View
      else if (moduleId === 'activity-heatmap') {
        setMonthlyChartMetric('views');
      }
    }

    // 当在小王测试账号中切换页面时，重置相应的按钮状态
    if (selectedAccount === 'xiaowang-test') {
      // 切换到Day of Week Analysis时，重置按钮状态
      if (moduleId === 'cost') {
        setXiaowangChartFiltered(true);
      }
    }
  };

  // 时间筛选器处理函数
  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
    setError('');
  };

  const handleLastWeek = () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
    const dayOfWeek = today.getDay();
    
    // Calculate how many days to go back to get to last Monday
    // getDay() returns: 0 = Sunday, 1 = Monday, 2 = Tuesday, etc.
    // If today is Sunday (0), we need to go back 6 days to get to Monday of this week
    // If today is Monday (1), we need to go back 0 days to get to Monday of this week
    // Then subtract 7 more days to get to last Monday
    const daysToThisMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const daysToLastMonday = daysToThisMonday + 7;
    
    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(today.getDate() - daysToLastMonday); // Last Monday
    
    const lastWeekEnd = new Date(lastWeekStart);
    lastWeekEnd.setDate(lastWeekStart.getDate() + 6); // Last Sunday (Monday + 6 days)
    
    // Format dates in local timezone
    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    setStartDate(formatLocalDate(lastWeekStart));
    setEndDate(formatLocalDate(lastWeekEnd));
    setError('');
  };

  // 检查当前日期范围是否是上周
  const isLastWeekSelected = () => {
    if (!startDate || !endDate) return false;
    
    const today = new Date();
    today.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
    const dayOfWeek = today.getDay();
    
    // Same logic as handleLastWeek
    const daysToThisMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const daysToLastMonday = daysToThisMonday + 7;
    
    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(today.getDate() - daysToLastMonday); // Last Monday
    
    const lastWeekEnd = new Date(lastWeekStart);
    lastWeekEnd.setDate(lastWeekStart.getDate() + 6); // Last Sunday
    
    // Format dates in local timezone
    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const lastWeekStartStr = formatLocalDate(lastWeekStart);
    const lastWeekEndStr = formatLocalDate(lastWeekEnd);
    
    return startDate === lastWeekStartStr && endDate === lastWeekEndStr;
  };

  // 导航到前一个时间段
  const handlePreviousPeriod = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      // 向前移动相同的天数
      start.setDate(start.getDate() - daysDiff);
      end.setDate(end.getDate() - daysDiff);
      
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
      setError('');
    }
  };

  // 导航到后一个时间段
  const handleNextPeriod = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      // 向后移动相同的天数
      start.setDate(start.getDate() + daysDiff);
      end.setDate(end.getDate() + daysDiff);
      
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
      setError('');
    }
  };
  
  // API数据状态 - 使用全局store
  const {
    brokerData: brokerDataJson,
    weeklyData: weeklyDataJson,
    monthlyData: monthlyDataJson,
    dailyCostData: dailyCostDataJson,
    xiaowangTestData,
    xiaowangTestNotesData,
    lifeCarData,
    lifeCarMonthlyData,
    lifeCarNotesData,
    setBrokerData: setBrokerDataJson,
    setWeeklyData: setWeeklyDataJson,
    setMonthlyData: setMonthlyDataJson,
    setDailyCostData: setDailyCostDataJson,
    setXiaowangTestData,
    setXiaowangTestNotesData,
    setLifeCarData,
    setLifeCarMonthlyData,
    setLifeCarNotesData,
    updateAllData,
    clearAllData
  } = useDashboardStore();
  const [isLoading, setIsLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // LifeCAR加载状态
  const [lifeCarLoading, setLifeCarLoading] = useState(false);
  const [lifeCarCsvContent, setLifeCarCsvContent] = useState<string>(''); // Store CSV content for child components

  // 小王测试加载状态
  const [xiaowangTestLoading, setXiaowangTestLoading] = useState(false);

  // LifeCar 笔记浮窗状态
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedNoteDates, setSelectedNoteDates] = useState<string[]>([]);

  // XiaoWang Test 笔记浮窗状态
  const [showXiaowangNotesModal, setShowXiaowangNotesModal] = useState(false);
  const [selectedXiaowangNoteDates, setSelectedXiaowangNoteDates] = useState<string[]>([]);

  // XiaoWang Test Notes按星期几的统计
  const [xiaowangNotesWeekdayCount, setXiaowangNotesWeekdayCount] = useState<{[key: string]: number}>({});

  // XiaoWang Test Notes按周的统计
  const [xiaowangNotesWeeklyCount, setXiaowangNotesWeeklyCount] = useState<{[key: string]: number}>({});

  // XiaoWang Test Notes按月的统计
  const [xiaowangNotesMonthlyCount, setXiaowangNotesMonthlyCount] = useState<{[key: string]: number}>({});

  // 检查是否选择了一周时间范围
  const isOneWeekSelected = useMemo(() => {
    if (!startDate || !endDate) return false;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 6; // 7天范围实际相差6天
  }, [startDate, endDate]);

  // Notes数据中在当前时间范围内的日期
  const [notesInDateRange, setNotesInDateRange] = useState<string[]>([]);

  // 加载LifeCar Notes数据
  const fetchNotesData = async () => {
    try {
      console.log('Fetching notes data...');
      const response = await fetch('/api/lifecar-notes');
      const result = await response.json();
      if (result.success) {
        console.log('Loaded notes data:', result.data.length, 'notes');
        setLifeCarNotesData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch notes data:', error);
    }
  };

  // 页面初始加载时不自动获取Notes数据，要求用户上传

  // 当Notes Modal关闭时保持数据（只在浏览器会话期间保留）
  const handleNotesModalClose = () => {
    setShowNotesModal(false);
    // 不清空数据，保持在浏览器会话期间可用
  };

  // 当XiaoWang Test Notes Modal关闭时保持数据（只在浏览器会话期间保留）
  const handleXiaowangNotesModalClose = () => {
    setShowXiaowangNotesModal(false);
    // 不清空数据，保持在浏览器会话期间可用
  };

  // 计算Notes按星期几的统计（基于前端数据）
  const calculateNotesWeekdayCount = (notesData: any[]) => {
    if (!lifeCarData.length || !notesData.length) {
      setNotesWeekdayCount({});
      return;
    }

    const weekdayCount: {[key: string]: number} = {
      'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0
    };

    // 获取投放数据的日期范围
    const campaignDates = lifeCarData.map(d => d.date);
    const minDate = Math.min(...campaignDates.map(d => new Date(d).getTime()));
    const maxDate = Math.max(...campaignDates.map(d => new Date(d).getTime()));

    notesData.forEach((note: any) => {
      const dateStr = note.发布时间?.split(' ')[0];
      if (dateStr) {
        const noteTime = new Date(dateStr).getTime();
        if (noteTime >= minDate && noteTime <= maxDate) {
          const date = new Date(dateStr);
          const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
          weekdayCount[dayOfWeek] = (weekdayCount[dayOfWeek] || 0) + 1;
        }
      }
    });

    setNotesWeekdayCount(weekdayCount);
  };

  // 计算XiaoWang Test Notes按星期几的统计（基于小王测试数据日期范围）
  const calculateXiaowangNotesWeekdayCount = (notesData: any[]) => {
    if (!xiaowangTestData?.rawData?.length || !notesData.length) {
      setXiaowangNotesWeekdayCount({});
      return;
    }

    const weekdayCount: {[key: string]: number} = {
      'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0
    };

    // 获取小王测试数据的日期范围
    const campaignDates = xiaowangTestData.rawData.map((d: any) => d.date);
    const minDate = Math.min(...campaignDates.map((d: string) => new Date(d).getTime()));
    const maxDate = Math.max(...campaignDates.map((d: string) => new Date(d).getTime()));

    notesData.forEach((note: any) => {
      const dateStr = note.发布时间?.split(' ')[0];
      if (dateStr) {
        const noteTime = new Date(dateStr).getTime();
        if (noteTime >= minDate && noteTime <= maxDate) {
          const date = new Date(dateStr);
          const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
          weekdayCount[dayOfWeek] = (weekdayCount[dayOfWeek] || 0) + 1;
        }
      }
    });

    setXiaowangNotesWeekdayCount(weekdayCount);
  };

  // 计算XiaoWang Test Notes按周的统计（基于小王测试数据日期范围）
  const calculateXiaowangNotesWeeklyCount = (notesData: any[]) => {
    if (!xiaowangTestData?.rawData?.length || !notesData.length) {
      setXiaowangNotesWeeklyCount({});
      return;
    }

    // 使用与Weekly组件完全相同的数据处理逻辑
    // 首先创建weeklyMap，就像Weekly组件一样
    const weeklyMap: Record<string, any> = {};

    // 处理每个笔记，使用与processXiaowangTestWeeklyData相同的逻辑
    notesData.forEach((note: any) => {
      const dateStr = note.发布时间?.split(' ')[0];
      if (!dateStr) return;

      // 检查日期是否在小王测试数据范围内
      const campaignDates = xiaowangTestData.rawData.map((d: any) => d.date);
      const minDate = Math.min(...campaignDates.map((d: string) => new Date(d).getTime()));
      const maxDate = Math.max(...campaignDates.map((d: string) => new Date(d).getTime()));

      const noteTime = new Date(dateStr).getTime();
      if (noteTime < minDate || noteTime > maxDate) return;

      // 使用与Weekly组件完全相同的周计算逻辑
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return;

      // Get the start of the week (Monday) - 完全复制Weekly组件的逻辑
      const dayOfWeek = date.getDay();
      const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, so we need to go back 6 days
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - mondayOffset);
      weekStart.setHours(0, 0, 0, 0);

      // Get the end of the week (Sunday)
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const weekKey = weekStart.toISOString().split('T')[0]; // 使用ISO格式作为key，就像Weekly组件

      if (!weeklyMap[weekKey]) {
        weeklyMap[weekKey] = {
          weekStart: weekStart.toISOString().split('T')[0],
          weekEnd: weekEnd.toISOString().split('T')[0],
          notesCount: 0
        };
      }

      weeklyMap[weekKey].notesCount += 1;
    });

    // 转换为最终格式，使用与Weekly组件相同的格式化逻辑
    const weeklyCount: {[key: string]: number} = {};
    Object.entries(weeklyMap).forEach(([weekKey, data]) => {
      // 使用与Weekly组件line 129完全相同的格式化
      const formattedWeekKey = `${new Date(data.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(data.weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      weeklyCount[formattedWeekKey] = data.notesCount;
    });

    console.log('Final weekly count result (NEW LOGIC):', {
      weeklyCount,
      weekKeys: Object.keys(weeklyCount),
      totalWeeks: Object.keys(weeklyCount).length
    });

    setXiaowangNotesWeeklyCount(weeklyCount);
  };

  // 计算XiaoWang Test Notes按月的统计（基于小王测试数据日期范围）
  const calculateXiaowangNotesMonthlyCount = (notesData: any[]) => {
    if (!xiaowangTestData?.rawData?.length || !notesData.length) {
      setXiaowangNotesMonthlyCount({});
      return;
    }

    const monthlyCount: {[key: string]: number} = {};

    // 获取小王测试数据的日期范围
    const campaignDates = xiaowangTestData.rawData.map((d: any) => d.date);
    const minDate = Math.min(...campaignDates.map((d: string) => new Date(d).getTime()));
    const maxDate = Math.max(...campaignDates.map((d: string) => new Date(d).getTime()));

    notesData.forEach((note: any) => {
      const dateStr = note.发布时间?.split(' ')[0];
      if (dateStr) {
        const noteTime = new Date(dateStr).getTime();
        if (noteTime >= minDate && noteTime <= maxDate) {
          const date = new Date(dateStr);
          // 使用与Monthly组件相同的格式：year: 'numeric', month: 'short'
          const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
          monthlyCount[monthKey] = (monthlyCount[monthKey] || 0) + 1;
        }
      }
    });

    setXiaowangNotesMonthlyCount(monthlyCount);
  };

  // 计算Notes按月份的统计（基于前端数据）
  const calculateNotesMonthlyCount = (notesData: any[]) => {
    if (!lifeCarData.length || !notesData.length) {
      setNotesMonthlyCount({});
      return;
    }

    const monthlyCount: {[key: string]: number} = {};

    // 获取投放数据的日期范围
    const campaignDates = lifeCarData.map(d => d.date);
    const minDate = Math.min(...campaignDates.map(d => new Date(d).getTime()));
    const maxDate = Math.max(...campaignDates.map(d => new Date(d).getTime()));

    notesData.forEach((note: any) => {
      const dateStr = note.发布时间?.split(' ')[0];
      if (dateStr) {
        const noteTime = new Date(dateStr).getTime();
        if (noteTime >= minDate && noteTime <= maxDate) {
          const date = new Date(dateStr);
          const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
          monthlyCount[monthKey] = (monthlyCount[monthKey] || 0) + 1;
        }
      }
    });

    setNotesMonthlyCount(monthlyCount);
  };

  // Notes按星期几的统计
  const [notesWeekdayCount, setNotesWeekdayCount] = useState<{[key: string]: number}>({});

  // 当Notes数据或投放数据更新时，重新计算统计
  useEffect(() => {
    if (lifeCarNotesData.length > 0 && lifeCarData.length > 0) {
      calculateNotesWeekdayCount(lifeCarNotesData);
      calculateNotesMonthlyCount(lifeCarNotesData);
    } else {
      setNotesWeekdayCount({});
      setNotesMonthlyCount({});
    }
  }, [lifeCarNotesData, lifeCarData]);

  // 当XiaoWang Test Notes数据或投放数据更新时，重新计算统计
  useEffect(() => {
    console.log('XiaowangTestNotes useEffect triggered:', {
      xiaowangTestNotesDataLength: xiaowangTestNotesData.length,
      hasXiaowangRawData: !!xiaowangTestData?.rawData?.length,
      xiaowangRawDataLength: xiaowangTestData?.rawData?.length || 0
    });

    if (xiaowangTestNotesData.length > 0 && xiaowangTestData?.rawData?.length > 0) {
      console.log('Calling calculation functions...');
      calculateXiaowangNotesWeekdayCount(xiaowangTestNotesData);
      calculateXiaowangNotesWeeklyCount(xiaowangTestNotesData);
      calculateXiaowangNotesMonthlyCount(xiaowangTestNotesData);
    } else {
      console.log('Clearing counts due to missing data');
      setXiaowangNotesWeekdayCount({});
      setXiaowangNotesWeeklyCount({});
      setXiaowangNotesMonthlyCount({});
    }
  }, [xiaowangTestNotesData, xiaowangTestData]);

  // Notes按月份的统计
  const [notesMonthlyCount, setNotesMonthlyCount] = useState<{[key: string]: number}>({});

  // 获取Notes数据中在时间范围内的日期（基于前端数据）
  useEffect(() => {
    if (!isOneWeekSelected || !startDate || !endDate || !lifeCarNotesData.length) {
      setNotesInDateRange([]);
      return;
    }

    const datesInRange = lifeCarNotesData
      .map((note: any) => note.发布时间?.split(' ')[0]) // Extract date part
      .filter((date: string) => date && date >= startDate && date <= endDate)
      .filter((date: string, index: number, array: string[]) => array.indexOf(date) === index); // Remove duplicates

    setNotesInDateRange(datesInRange);
  }, [isOneWeekSelected, startDate, endDate, lifeCarNotesData]);


  // 加载数据函数
  const loadData = async () => {
    try {
      setIsLoading(true);
      setDataError(null);
      
      const response = await fetch('/api/excel-data');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.data) {
        updateAllData({
          broker_data: result.data.broker_data || [],
          weekly_data: result.data.weekly_data || [],
          monthly_data: result.data.monthly_data || [],
          daily_cost_data: result.data.daily_cost_data || []
        });
      } else {
        throw new Error('Invalid data structure received');
      }
    } catch (error: any) {
      console.error('Failed to load data:', error);
      setDataError(error.message || 'Failed to load data');
      // 设置空数据以防止组件崩溃
      clearAllData();
    } finally {
      setIsLoading(false);
    }
  };

  // 加载LifeCAR数据函数
  const loadLifeCarData = async () => {
    try {
      setLifeCarLoading(true);
      const response = await fetch('/database_lifecar/lifecar-data.csv');
      if (!response.ok) {
        throw new Error(`Failed to load LifeCAR data: ${response.statusText}`);
      }
      const csvText = await response.text();
      const parsedData = parseLifeCarData(csvText);
      const monthlyData = aggregateByMonth(parsedData);
      
      setLifeCarData(parsedData);
      setLifeCarMonthlyData(monthlyData);
    } catch (error) {
      console.error('Failed to load LifeCAR data:', error);
      setLifeCarData([]);
      setLifeCarMonthlyData([]);
    } finally {
      setLifeCarLoading(false);
    }
  };

  // 移除预加载数据函数 - 小王测试只使用上传的数据
  // const loadXiaowangTestData = async () => {
  //   try {
  //     setXiaowangTestLoading(true);
  //     const response = await fetch('/api/xiaowang-test');
  //     if (!response.ok) {
  //       throw new Error(`Failed to load xiaowang test data: ${response.statusText}`);
  //     }
  //     const result = await response.json();
  //     setXiaowangTestData(result.data);
  //   } catch (error) {
  //     console.error('Failed to load xiaowang test data:', error);
  //     setXiaowangTestData(null);
  //   } finally {
  //     setXiaowangTestLoading(false);
  //   }
  // };

  // 页面加载时不自动获取数据，只有在用户上传数据后才显示图表
  // useEffect(() => {
  //   loadData();
  //   loadLifeCarData();
  // }, []);

  // 监听dataRefreshKey变化，重新加载数据
  useEffect(() => {
    if (dataRefreshKey > 0) {
      console.log('Data refresh triggered, reloading data...');
      loadData();
    }
  }, [dataRefreshKey]);

  // Handle successful upload - use uploaded data directly
  const handleUploadSuccess = async (uploadedData?: any) => {
    try {
      setShowUpload(false);
      
      if (uploadedData) {
        // 直接使用上传返回的数据，不需要重新调用API
        updateAllData({
          broker_data: uploadedData.broker_data || [],
          weekly_data: uploadedData.weekly_data || [],
          monthly_data: uploadedData.monthly_data || [],
          daily_cost_data: uploadedData.daily_cost_data || []
        });
        console.log('Data updated from upload:', {
          broker_data: uploadedData.broker_data?.length || 0,
          weekly_data: uploadedData.weekly_data?.length || 0,
          monthly_data: uploadedData.monthly_data?.length || 0,
          daily_cost_data: uploadedData.daily_cost_data?.length || 0
        });
      } else {
        // 如果没有数据，回退到重新加载
        await loadData();
      }
      
      setDataRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error refreshing data:', error);
      // 如果出错，尝试重新加载数据
      await loadData();
    }
  };


  // 全屏处理函数
  const handleFullscreen = () => {
    if (!isFullscreen) {
      // 进入全屏
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if ((document.documentElement as any).webkitRequestFullscreen) {
        (document.documentElement as any).webkitRequestFullscreen();
      } else if ((document.documentElement as any).msRequestFullscreen) {
        (document.documentElement as any).msRequestFullscreen();
      }
    } else {
      // 退出全屏
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  };

  // 监听全屏状态变化和键盘快捷键
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // F11 键切换全屏
      if (event.key === 'F11') {
        event.preventDefault();
        handleFullscreen();
      }
      // Esc键退出全屏 - 直接检查document.fullscreenElement而不依赖state
      if (event.key === 'Escape' && document.fullscreenElement) {
        handleFullscreen();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // 移除依赖数组中的isFullscreen
  
  // 模块配置 - 根据不同账号显示不同的模块
  const getModulesForAccount = (account: string) => {
    if (account === 'lifecar') {
      return [
        { id: 'broker', name: 'Campaign Overview', icon: '🚗', desc: 'Overall campaign performance' },
        { id: 'cost', name: 'Trend Overview', icon: '💰', desc: 'Spend and efficiency metrics' },
        { id: 'cost-interaction', name: 'Day of Week Analyse', icon: '🎯', desc: 'Day of week performance analysis' },
        { id: 'weekly-analysis', name: 'Weekly Analysis', icon: '📈', desc: 'Weekly performance metrics' },
        { id: 'activity-heatmap', name: 'Monthly Analysis', icon: '🔥', desc: 'Time-based performance patterns' }
      ];
    } else if (account === 'xiaowang-test') {
      return [
        { id: 'campaign-overview', name: 'Campaign Overview', icon: '📈', desc: 'Daily performance metrics' },
        { id: 'broker', name: 'Broker Distribution', icon: '📊', desc: 'Broker performance analysis' },
        { id: 'cost', name: 'Cost Analysis', icon: '💰', desc: 'Cost comparison analysis' },
        { id: 'weekly-analysis', name: 'Weekly Analysis', icon: '📈', desc: 'Weekly performance insights' },
        { id: 'activity-heatmap', name: 'Template', icon: '🔥', desc: 'Broker activity patterns' }
      ];
    } else {
      return [
        { id: 'broker', name: 'Broker Distribution', icon: '📊', desc: 'Broker performance analysis' },
        { id: 'cost', name: 'Cost & Leads', icon: '💰', desc: 'Cost comparison analysis' },
        { id: 'time-analysis', name: 'Time Analysis', icon: '⏰', desc: 'Acquisition time distribution' },
        { id: 'weekly-analysis', name: 'Weekly Analysis', icon: '📈', desc: 'Weekly performance insights' },
        { id: 'activity-heatmap', name: 'Activity Heatmap', icon: '🔥', desc: 'Broker activity patterns' }
      ];
    }
  };

  const allModules = getModulesForAccount(selectedAccount);
  const accountHiddenModules = hiddenModules[selectedAccount] || [];
  const modules = allModules.filter(module => !accountHiddenModules.includes(module.id));
  
  // 切换模块隐藏状态
  const toggleModuleVisibility = (moduleId: string) => {
    const currentAccountHidden = hiddenModules[selectedAccount] || [];
    
    setHiddenModules(prev => ({
      ...prev,
      [selectedAccount]: currentAccountHidden.includes(moduleId)
        ? currentAccountHidden.filter(id => id !== moduleId)
        : [...currentAccountHidden, moduleId]
    }));
    
    // 如果隐藏的是当前激活模块，切换到第一个可见模块
    if (moduleId === activeModule && !currentAccountHidden.includes(moduleId)) {
      const newHiddenModules = [...currentAccountHidden, moduleId];
      const remainingModules = allModules.filter(m => !newHiddenModules.includes(m.id));
      if (remainingModules.length > 0) {
        setActiveModule(remainingModules[0].id);
      }
    }
    
    // 如果取消隐藏，且当前没有激活模块（或激活模块被隐藏），切换到这个模块
    if (currentAccountHidden.includes(moduleId)) {
      const visibleModules = allModules.filter(m => !currentAccountHidden.includes(m.id) || m.id === moduleId);
      if (visibleModules.length === 1 || !visibleModules.find(m => m.id === activeModule)) {
        setActiveModule(moduleId);
      }
    }
  };
  
  // 获取数据（受全局时间筛选器影响）
  const processedBrokerData = useMemo(() => {
    if (isLoading || !brokerDataJson.length) return [];
    const data = processBrokerData(brokerDataJson);
    console.log('Broker data:', data);
    return data;
  }, [brokerDataJson, isLoading]);

  const weeklyData = useMemo(() => {
    if (isLoading || !weeklyDataJson.length) return [];
    const data = processWeeklyData(weeklyDataJson);
    console.log('Weekly data:', data);
    return data;
  }, [weeklyDataJson, isLoading]);

  const monthlyData = useMemo(() => {
    if (isLoading || !monthlyDataJson.length) return [];
    const data = processMonthlyData(monthlyDataJson);
    console.log('Monthly data:', data);
    return data;
  }, [monthlyDataJson, isLoading]);

  const weeklyCostLeadsData = useMemo(() => {
    if (isLoading || !weeklyDataJson.length) return [];
    const data = processWeeklyCostLeadsData(weeklyDataJson);
    console.log('Weekly Cost & Leads data:', data);
    return data;
  }, [weeklyDataJson, isLoading]);

  // 计算总体统计信息 - 基于唯一的 no. 值 (不受时间筛选影响)
  const totalClients = useMemo(() => {
    if (isLoading || !brokerDataJson) return 0;
    
    // 始终返回所有唯一客户数量，不受时间筛选影响
    const uniqueNos = new Set(brokerDataJson.map((client: any) => client.no).filter(no => no !== null && no !== undefined));
    return uniqueNos.size;
  }, [brokerDataJson, isLoading]);

  const activeBrokers = useMemo(() => {
    if (isLoading || !brokerDataJson || brokerDataJson.length === 0) return 0;
    
    // 首先，根据唯一的 no. 值去重
    const uniqueClients = Array.from(
      new Map(
        brokerDataJson
          .filter((client: any) => client.no !== null && client.no !== undefined)
          .map((client: any) => [client.no, client])
      ).values()
    );
    
    // 始终返回所有唯一的broker数量，不受时间筛选影响
    // 排除Zoey，合并Yuki和Ruofan
    const uniqueBrokers = new Set(uniqueClients.map((client: any) => {
      let broker = client.broker || '未知';
      // Normalize broker names - 合并Yuki和Ruofan，排除Zoey
      if (broker.toLowerCase() === 'yuki') broker = 'Yuki/Ruofan';
      else if (broker.toLowerCase() === 'ruofan') broker = 'Yuki/Ruofan';
      else if (broker === 'Linudo') broker = 'Linduo';
      else if (broker.toLowerCase() === 'ziv') broker = 'Ziv';
      else if (broker.toLowerCase() === 'zoey') return null; // 排除Zoey
      return broker;
    }).filter(broker => broker !== null)); // 过滤掉null值
    
    return uniqueBrokers.size;
  }, [brokerDataJson, isLoading]);

  // 处理LifeCAR数据（受时间筛选器影响）
  const filteredLifeCarData = useMemo(() => {
    if (lifeCarLoading || !lifeCarData.length) return [];
    return filterByDateRange(lifeCarData, startDate, endDate);
  }, [lifeCarData, startDate, endDate, lifeCarLoading]);

  const filteredLifeCarMonthlyData = useMemo(() => {
    if (lifeCarLoading || !filteredLifeCarData.length) return [];
    return aggregateByMonth(filteredLifeCarData);
  }, [filteredLifeCarData, lifeCarLoading]);

  // 处理小王测试数据（受时间筛选器影响）
  const filteredXiaowangTestData = useMemo(() => {
    if (xiaowangTestLoading || !xiaowangTestData) return null;

    // 如果没有选择日期范围，返回全部数据
    if (!startDate || !endDate) return xiaowangTestData;

    // 过滤日数据
    const filteredDailyData = xiaowangTestData.dailyData?.filter((item: any) => {
      const itemDate = item.date;
      return itemDate >= startDate && itemDate <= endDate;
    }) || [];

    // 过滤原始数据
    const filteredRawData = xiaowangTestData.rawData?.filter((item: any) => {
      const itemDate = item.date;
      return itemDate >= startDate && itemDate <= endDate;
    }) || [];

    // 重新计算汇总数据
    const filteredSummary = {
      totalCost: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalInteractions: 0,
      totalConversions: 0,
      totalFollowers: 0,
      totalSaves: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      avgClickRate: 0,
      avgConversionCost: 0,
    };

    filteredRawData.forEach((item: any) => {
      filteredSummary.totalCost += item.cost || 0;
      filteredSummary.totalImpressions += item.impressions || 0;
      filteredSummary.totalClicks += item.clicks || 0;
      filteredSummary.totalInteractions += item.interactions || 0;
      filteredSummary.totalConversions += item.conversions || 0;
      filteredSummary.totalFollowers += item.followers || 0;
      filteredSummary.totalSaves += item.saves || 0;
      filteredSummary.totalLikes += item.likes || 0;
      filteredSummary.totalComments += item.comments || 0;
      filteredSummary.totalShares += item.shares || 0;
    });

    // 计算平均值
    if (filteredRawData.length > 0) {
      filteredSummary.avgClickRate = filteredSummary.totalImpressions > 0
        ? (filteredSummary.totalClicks / filteredSummary.totalImpressions) * 100
        : 0;
      filteredSummary.avgConversionCost = filteredSummary.totalConversions > 0
        ? filteredSummary.totalCost / filteredSummary.totalConversions
        : 0;
    }

    return {
      ...xiaowangTestData,
      summary: filteredSummary,
      dailyData: filteredDailyData,
      rawData: filteredRawData,
      totalRows: filteredRawData.length
    };
  }, [xiaowangTestData, startDate, endDate, xiaowangTestLoading]);

  // 如果正在加载，显示加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-purple-600 font-medium">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // 如果有错误，显示错误信息
  if (dataError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-center bg-white/95 backdrop-blur-xl rounded-lg shadow-xl p-8 max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Failed to Load Data</h2>
          <p className="text-gray-600 mb-4">{dataError}</p>
          <button
            onClick={loadData}
            className="bg-gradient-to-r from-[#751FAE] to-[#EF3C99] text-white px-4 py-2 rounded hover:from-[#6919A6] hover:to-[#E73691] transition-all duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100 to-pink-100">
      {/* 导航栏 */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-purple-200/30 sticky top-0 z-[100] shadow-lg shadow-purple-500/10">
        {/* Sticky Time Filter Bar - Only show when dates are selected */}
        {(startDate || endDate) && (
        <div className="absolute top-full left-0 right-0 bg-white/[0.73] backdrop-blur-3xl border-b border-purple-200/40 shadow-lg z-[99] transition-all duration-300 animate-in fade-in slide-in-from-top-2">
          <div className="w-full px-8 py-2">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-wrap items-center gap-2 justify-center">
                {/* Compact date inputs */}
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={selectedAccount === 'lifecar' ? "2025-05-01" : "2024-09-01"}
                    max="2025-12-31"
                    className="text-xs border border-gray-300 rounded px-2 py-1 bg-white/90 backdrop-blur-sm focus:border-purple-400 focus:outline-none h-7"
                    placeholder="Start"
                  />
                  <span className="text-xs text-gray-500">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={selectedAccount === 'lifecar' ? "2025-05-01" : "2024-09-01"}
                    max="2025-12-31"
                    className="text-xs border border-gray-300 rounded px-2 py-1 bg-white/90 backdrop-blur-sm focus:border-purple-400 focus:outline-none h-7"
                    placeholder="End"
                  />
                </div>

                {/* Quick action buttons */}
                <Button 
                  onClick={handleLastWeek} 
                  variant="secondary"
                  size="sm"
                  className={`${
                    isLastWeekSelected() 
                      ? 'bg-purple-400/90 text-white hover:bg-purple-500/90' 
                      : 'bg-purple-100/80 text-purple-700 hover:bg-purple-200/80'
                  } transition-all duration-200 font-medium h-7 px-2 text-xs backdrop-blur-sm`}
                >
                  Last Week
                </Button>
                
                <Button 
                  onClick={handleClearFilter} 
                  variant="outline"
                  size="sm"
                  className="bg-white/80 border-gray-300 text-gray-700 hover:bg-gray-100/80 hover:border-gray-400 transition-all duration-200 h-7 px-2 text-xs backdrop-blur-sm"
                >
                  Clear
                </Button>

                {/* Navigation buttons */}
                {startDate && endDate && (
                  <>
                    <Button
                      onClick={handlePreviousPeriod}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 bg-white/80 border-gray-300 text-gray-700 hover:bg-purple-50/80 hover:border-purple-400 hover:text-purple-700 transition-all duration-200 h-7 px-2 text-xs backdrop-blur-sm"
                    >
                      <ChevronLeft className="h-3 w-3" />
                      <span className="hidden sm:inline">Prev</span>
                    </Button>
                    
                    <div className="text-xs text-gray-500 font-medium flex items-center px-1">
                      {(() => {
                        const start = new Date(startDate);
                        const end = new Date(endDate);
                        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                        return `${days}d`;
                      })()}
                    </div>
                    
                    <Button
                      onClick={handleNextPeriod}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 bg-white/80 border-gray-300 text-gray-700 hover:bg-purple-50/80 hover:border-purple-400 hover:text-purple-700 transition-all duration-200 h-7 px-2 text-xs backdrop-blur-sm"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </>
                )}

              </div>
            </div>
          </div>
        </div>
        )}
        <div className="w-full px-8">
          <div className="relative flex items-center h-24 py-4">
            <div className="flex items-center space-x-4 z-50 relative">
              <img 
                src="/LifeX_logo.png" 
                alt="LifeX Logo" 
                className="h-12 w-auto"
              />
              
              {/* 上传按钮组 - 放在logo右侧 */}
              <div className="flex items-center space-x-2 border-l border-gray-300 pl-4 z-[200] relative">
                {/* 澳洲Broker小王咨询上传按钮 */}
                <button
                  type="button"
                  onClick={() => {
                    console.log('XiaoWang button clicked');
                    setUploadAccountType('xiaowang');
                    setShowUpload(true);
                  }}
                  className="flex items-center gap-1 px-3 py-2 text-xs text-gray-600 hover:text-gray-600 hover:bg-gray-50 transition-all duration-200 rounded-md border border-transparent hover:border-gray-200"
                  title="Upload Australia Broker XiaoWang Consultation Data"
                  style={{ pointerEvents: 'auto' }}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="font-medium">小王咨询</span>
                </button>
                
                {/* LifeCar澳洲Broker上传按钮 */}
                <button
                  type="button"
                  onClick={() => {
                    console.log('LifeCar button clicked');
                    setUploadAccountType('lifecar');
                    setShowUpload(true);
                  }}
                  className="flex items-center gap-1 px-3 py-2 text-xs text-gray-600 hover:text-gray-600 hover:bg-gray-50 transition-all duration-200 rounded-md border border-transparent hover:border-gray-200"
                  title="Upload LifeCar Australia Broker Data"
                  style={{ pointerEvents: 'auto' }}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="font-medium">LifeCar</span>
                </button>

                {/* 小王测试数据上传按钮 */}
                <button
                  type="button"
                  onClick={() => {
                    console.log('XiaoWang Test button clicked');
                    setShowXiaowangTestUpload(true);
                  }}
                  className="flex items-center gap-1 px-3 py-2 text-xs text-gray-600 hover:text-gray-600 hover:bg-gray-50 transition-all duration-200 rounded-md border border-transparent hover:border-gray-200"
                  title="Upload XiaoWang Test Data"
                  style={{ pointerEvents: 'auto' }}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="font-medium">小王测试</span>
                </button>
              </div>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <h1 className="text-4xl font-black bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">Marketing Dashboard</h1>
              <p className="text-base text-purple-600 mt-1 font-montserrat font-light">Real-time analytics & insights</p>
            </div>
            <div className="ml-auto flex items-center space-x-3 z-50 relative">
              <AccountSwitcher
                onAccountChange={handleAccountChange}
                defaultAccount={selectedAccount}
              />
              <button
                onClick={() => window.location.href = '/information-hub'}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#751FAE] to-[#EF3C99] rounded-lg hover:from-[#6919A6] hover:to-[#E73691] transition-all duration-200 shadow-md"
                title="Information Hub"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Information Hub
              </button>
              <button
                onClick={handleFullscreen}
                className="flex items-center justify-center w-8 h-8 text-gray-700 bg-white/90 backdrop-blur-sm border border-purple-200 rounded hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 shadow-sm cursor-pointer z-50 relative"
                title="Toggle Fullscreen"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* 主内容区域 */}
      <div className="w-full px-8 py-4 pt-16">
        
        {/* LifeCAR账号的数据面板 */}
        {selectedAccount === 'lifecar' && (
          <>
            {/* 时间筛选器 - 独立卡片设计 */}
            <div className="max-w-7xl mx-auto mb-6">
              <div className="bg-white/95 backdrop-blur-xl rounded-lg shadow-xl shadow-purple-500/10 ring-1 ring-purple-500/20 p-6">
                {/* 主体标签 */}
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                  <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
                    <CalendarIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 font-montserrat">Time Filters</h3>
                </div>
                
                {/* 单行布局 */}
                <div className="flex flex-wrap items-end gap-3">
                  {/* Start Date */}
                  <div className="flex-1 min-w-[150px]">
                    <label className="text-xs font-bold text-gray-700 flex items-center gap-1 font-montserrat mb-1">
                      <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                      Start Date
                    </label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min="2025-05-01"
                      max="2025-12-31"
                      className="w-full justify-start text-left font-normal bg-white border-gray-300 text-gray-800 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200 hover:bg-gray-50 h-9 text-sm"
                    />
                  </div>
                  
                  {/* End Date */}
                  <div className="flex-1 min-w-[150px]">
                    <label className="text-xs font-bold text-gray-700 flex items-center gap-1 font-montserrat mb-1">
                      <div className="w-1.5 h-1.5 bg-pink-600 rounded-full"></div>
                      End Date
                    </label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min="2025-05-01"
                      max="2025-12-31"
                      className="w-full justify-start text-left font-normal bg-white border-gray-300 text-gray-800 focus:border-pink-500 focus:ring-pink-500/20 transition-all duration-200 hover:bg-gray-50 h-9 text-sm"
                    />
                  </div>

                  {/* Quick actions */}
                  <Button 
                    onClick={handleLastWeek} 
                    variant="secondary"
                    size="sm"
                    className={`${
                      isLastWeekSelected() 
                        ? 'bg-purple-400 text-white hover:bg-purple-500' 
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    } transition-all duration-200 font-semibold h-9 px-3`}
                  >
                    Last Week
                  </Button>
                  
                  <Button 
                    onClick={handleClearFilter} 
                    variant="outline"
                    size="sm"
                    className="bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 h-9 px-3"
                  >
                    Clear
                  </Button>

                  {/* Navigation buttons - only show when dates are selected */}
                  {startDate && endDate && (
                    <>
                      <Button
                        onClick={handlePreviousPeriod}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 bg-white border-gray-300 text-gray-700 hover:bg-purple-50 hover:border-purple-400 hover:text-purple-700 transition-all duration-200 h-9 px-3"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Previous</span>
                      </Button>
                      
                      <div className="text-xs text-gray-500 font-medium flex items-center px-2">
                        {(() => {
                          const start = new Date(startDate);
                          const end = new Date(endDate);
                          const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                          return `${days} day${days !== 1 ? 's' : ''}`;
                        })()}
                      </div>
                      
                      <Button
                        onClick={handleNextPeriod}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 bg-white border-gray-300 text-gray-700 hover:bg-purple-50 hover:border-purple-400 hover:text-purple-700 transition-all duration-200 h-9 px-3"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
                
                {error && (
                  <div className="mt-4 text-red-600 text-sm font-medium font-montserrat">{error}</div>
                )}
                
                {startDate && endDate && (
                  <div className="mt-4 text-sm text-purple-600 font-medium font-montserrat">
                    Filtering data from {startDate} to {endDate}
                  </div>
                )}
              </div>
            </div>

            {/* LifeCAR数据加载状态 */}
            {lifeCarLoading && (
              <div className="max-w-7xl mx-auto mb-6 flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-purple-600 font-medium">Loading LifeCAR data...</p>
                </div>
              </div>
            )}

            {/* LifeCAR概览统计 */}
            {!lifeCarLoading && filteredLifeCarData.length > 0 && (
              <div className="max-w-7xl mx-auto">
                <LifeCarOverviewStats data={filteredLifeCarData} allTimeData={lifeCarData} />
              </div>
            )}

            {/* 浮动笔记按钮 - 只在LifeCar账号且有数据时显示 */}
            {selectedAccount === 'lifecar' && !lifeCarLoading && filteredLifeCarData.length > 0 && (
              <div className="fixed top-1/2 right-6 transform -translate-y-1/2 z-40 space-y-2">
                <Button
                  onClick={() => setShowNotesModal(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 rounded-full px-4 py-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-medium">Posts</span>
                </Button>
                {selectedNoteDates.length > 0 && (
                  <Button
                    onClick={() => setSelectedNoteDates([])}
                    variant="outline"
                    size="sm"
                    className="w-full text-xs text-gray-500 border-gray-300 hover:bg-gray-50"
                  >
                    Clear
                  </Button>
                )}
                {selectedNoteDates.length > 0 && (
                  <div className="text-xs text-gray-600 bg-white px-2 py-1 rounded shadow max-h-32 overflow-y-auto">
                    {[...selectedNoteDates].sort().map((date, index) => (
                      <div key={index} className="text-gray-500">{date}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* LifeCAR模块导航 */}
            <div className="max-w-7xl mx-auto mb-6">
              <div className="bg-white/95 backdrop-blur-xl rounded-lg shadow-lg border border-gray-200/50 p-1">
                <div className="flex">
                  {allModules.map((module, index) => {
                    const isHidden = accountHiddenModules.includes(module.id);
                    const isActive = activeModule === module.id;
                    return (
                      <div key={module.id} className={`flex-1 relative ${
                        isHidden ? 'opacity-50' : ''
                      }`}>
                        <button
                          onClick={() => !isHidden && handleModuleChange(module.id)}
                          disabled={isHidden}
                          className={`w-full px-4 py-3 text-sm font-medium transition-all duration-200 ${
                            isActive && !isHidden
                              ? 'bg-gradient-to-r from-[#751FAE] to-[#EF3C99] text-white shadow-md'
                              : isHidden
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-transparent hover:bg-gray-50 text-gray-700'
                          } ${
                            index === 0 ? 'rounded-l-lg' : index === allModules.length - 1 ? 'rounded-r-lg' : ''
                          }`}
                        >
                          {module.name}
                        </button>
                        <button
                          onClick={() => toggleModuleVisibility(module.id)}
                          className="absolute top-1 right-1 p-1 rounded-full hover:bg-black/10 transition-colors duration-200"
                          title={isHidden ? 'Show module' : 'Hide module'}
                        >
                          {isHidden ? (
                            <EyeOff className="w-3 h-3 text-gray-400" />
                          ) : (
                            <Eye className="w-3 h-3 text-gray-500 hover:text-gray-700" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* LifeCAR动态内容区域 */}
            {!lifeCarLoading && filteredLifeCarData.length > 0 && (
              <>
                {activeModule === 'broker' && (
                  <div className="max-w-7xl mx-auto mb-4 space-y-6">
                    <h2 className="text-xl font-semibold mb-3 bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat flex items-center gap-2">
                      <div className="w-4 h-4 bg-[#751FAE]"></div>
                      LifeCAR Performance Overview
                    </h2>
                    
                    <LifeCarDailyTrends data={filteredLifeCarData} title="Daily Marketing Performance" />
                  </div>
                )}

                {activeModule === 'cost' && (
                  <div className="max-w-7xl mx-auto mb-4 space-y-6">
                    <h2 className="text-xl font-semibold mb-3 bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat flex items-center gap-2">
                      <div className="w-4 h-4 bg-[#751FAE]"></div>
                      Trend Overview
                    </h2>
                    
                    <LifeCarMonthlySummary
                      data={lifeCarMonthlyData}
                      dailyData={lifeCarData}
                      unfilteredDailyData={lifeCarData}
                      title="Monthly Cost Analysis"
                      selectedDates={selectedNoteDates}
                      notesData={lifeCarNotesData}
                    />
                  </div>
                )}

                {activeModule === 'cost-interaction' && (
                  <div className="max-w-7xl mx-auto mb-4 space-y-6">
                    <h2 className="text-xl font-semibold mb-3 bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat flex items-center gap-2">
                      <div className="w-4 h-4 bg-[#751FAE]"></div>
                      Day of Week Analysis
                    </h2>
                    
                    {/* Daily Views & Cost Chart - affected by time filter */}
                    {filteredLifeCarData && filteredLifeCarData.length > 0 && (
                      <ViewsCostDailyChart
                        data={filteredLifeCarData}
                        title="Daily Views & Cost Trend"
                        startDate={startDate}
                        endDate={endDate}
                        allData={lifeCarData}
                        selectedMetric={lifecarChartMetric}
                        onMetricChange={setLifecarChartMetric}
                        isFiltered={lifecarChartFiltered}
                        onFilterChange={setLifecarChartFiltered}
                        selectedDates={notesInDateRange}
                        notesWeekdayCount={notesWeekdayCount}
                        notesData={lifeCarNotesData}
                      />
                    )}
                    
                    {/* Daily Cost Per Follower Chart - affected by time filter */}
                    {filteredLifeCarData && filteredLifeCarData.length > 0 && (
                      <CostPerFollowerDailyChart
                        data={filteredLifeCarData}
                        title="Daily Cost Per Follower Trend"
                        startDate={startDate}
                        endDate={endDate}
                        allData={lifeCarData}
                        selectedMetric={lifecarChartMetric}
                        onMetricChange={setLifecarChartMetric}
                        isFiltered={lifecarChartFiltered}
                        onFilterChange={setLifecarChartFiltered}
                        selectedDates={notesInDateRange}
                        notesWeekdayCount={notesWeekdayCount}
                        notesData={lifeCarNotesData}
                      />
                    )}
                    
                  </div>
                )}

                {activeModule === 'activity-heatmap' && (
                  <div className="max-w-7xl mx-auto mb-4 space-y-6">
                    <h2 className="text-xl font-semibold mb-3 bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat flex items-center gap-2">
                      <div className="w-4 h-4 bg-[#751FAE]"></div>
                      Monthly Analysis
                    </h2>
                    
                    {/* Monthly Views & Cost Chart - always uses all data */}
                    {lifeCarData && lifeCarData.length > 0 && (
                      <MonthlyViewsCostChart 
                        data={lifeCarData} 
                        title="Monthly Metrics & Cost Analysis"
                        selectedMetric={monthlyChartMetric}
                        onMetricChange={setMonthlyChartMetric}
                        notesMonthlyCount={notesMonthlyCount}
                      />
                    )}
                    
                    {/* Monthly Cost Per Metric Chart - always uses all data */}
                    {lifeCarData && lifeCarData.length > 0 && (
                      <MonthlyCostPerMetricChart 
                        data={lifeCarData} 
                        title="Monthly Cost Analysis"
                        selectedMetric={monthlyChartMetric}
                        onMetricChange={setMonthlyChartMetric}
                        notesMonthlyCount={notesMonthlyCount}
                      />
                    )}
                    
                    
                    
                  </div>
                )}

                {activeModule === 'weekly-analysis' && (
                  <div className="max-w-7xl mx-auto mb-4">
                    <h2 className="text-xl font-semibold mb-3 bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat flex items-center gap-2">
                      <div className="w-4 h-4 bg-[#751FAE]"></div>
                      Weekly Analysis
                    </h2>
                    <LifeCarWeeklyAnalysis 
                      data={lifeCarData} 
                      title="Weekly Performance Metrics"
                    />
                  </div>
                )}

              </>
            )}

            {/* 无数据状态 */}
            {!lifeCarLoading && filteredLifeCarData.length === 0 && (
              <div className="max-w-7xl mx-auto flex items-center justify-center py-12">
                <div className="text-center bg-white/95 backdrop-blur-xl rounded-lg shadow-xl shadow-purple-500/10 ring-1 ring-purple-500/20 p-12">
                  <div className="text-6xl mb-6">📊</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-4">No Data Available</h3>
                  <p className="text-gray-500">No data found for the selected date range. Please adjust your filters.</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* 澳洲小王Broker咨询的数据面板 */}
        {selectedAccount === 'xiaowang' && (
          <>
        
        
        
        {/* 时间筛选器 - 独立卡片设计 */}
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-white/95 backdrop-blur-xl rounded-lg shadow-xl shadow-purple-500/10 ring-1 ring-purple-500/20 p-6">
            {/* 主体标签 */}
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
              <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
                <CalendarIcon className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 font-montserrat">Time Filters</h3>
            </div>
            
            {/* 单行布局 */}
            <div className="flex flex-wrap items-end gap-3">
              {/* Start Date */}
              <div className="flex-1 min-w-[150px]">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1 font-montserrat mb-1">
                  <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                  Start Date
                </label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min="2024-09-01"
                  max="2025-12-31"
                  className="w-full justify-start text-left font-normal bg-white border-gray-300 text-gray-800 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200 hover:bg-gray-50 h-9 text-sm"
                />
              </div>
              
              {/* End Date */}
              <div className="flex-1 min-w-[150px]">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1 font-montserrat mb-1">
                  <div className="w-1.5 h-1.5 bg-pink-600 rounded-full"></div>
                  End Date
                </label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min="2024-09-01"
                  max="2025-12-31"
                  className="w-full justify-start text-left font-normal bg-white border-gray-300 text-gray-800 focus:border-pink-500 focus:ring-pink-500/20 transition-all duration-200 hover:bg-gray-50 h-9 text-sm"
                />
              </div>

              {/* Quick actions */}
              <Button 
                onClick={handleLastWeek} 
                variant="secondary"
                size="sm"
                className={`${
                  isLastWeekSelected() 
                    ? 'bg-purple-400 text-white hover:bg-purple-500' 
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                } transition-all duration-200 font-semibold h-9 px-3`}
              >
                Last Week
              </Button>
              
              <Button 
                onClick={handleClearFilter} 
                variant="outline"
                size="sm"
                className="bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 h-9 px-3"
              >
                Clear
              </Button>

              {/* Navigation buttons - only show when dates are selected */}
              {startDate && endDate && (
                <>
                  <Button
                    onClick={handlePreviousPeriod}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 bg-white border-gray-300 text-gray-700 hover:bg-purple-50 hover:border-purple-400 hover:text-purple-700 transition-all duration-200 h-9 px-3"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>
                  
                  <div className="text-xs text-gray-500 font-medium flex items-center px-2">
                    {(() => {
                      const start = new Date(startDate);
                      const end = new Date(endDate);
                      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                      return `${days} day${days !== 1 ? 's' : ''}`;
                    })()}
                  </div>
                  
                  <Button
                    onClick={handleNextPeriod}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 bg-white border-gray-300 text-gray-700 hover:bg-purple-50 hover:border-purple-400 hover:text-purple-700 transition-all duration-200 h-9 px-3"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
            
            {error && (
              <div className="mt-4 text-red-600 text-sm font-medium font-montserrat">{error}</div>
            )}
            
            {startDate && endDate && (
              <div className="mt-4 text-sm text-purple-600 font-medium font-montserrat">
                Filtering data from {startDate} to {endDate}
              </div>
            )}
          </div>
        </div>
        
        
        {/* 概览统计卡片 - 只在有数据时显示 */}
        {brokerDataJson.length > 0 && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white/95 backdrop-blur-xl rounded-lg shadow-lg border border-gray-200/50 p-6 glass-card-hover relative text-center">
            <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-[#751FAE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="text-sm font-bold text-gray-700 mb-2">Total Clients</div>
            <div className="text-4xl font-black bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">{totalClients}</div>
            <div className="text-xs font-semibold text-gray-600">
              All registered clients
            </div>
          </div>
          <div className="bg-white/95 backdrop-blur-xl rounded-lg shadow-lg border border-gray-200/50 p-6 glass-card-hover relative text-center">
            <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-[#751FAE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="text-sm font-bold text-gray-700 mb-2">Active Brokers</div>
            <div className="text-4xl font-black bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">{activeBrokers}</div>
            <div className="text-xs font-semibold text-gray-600">
              Currently active brokers
            </div>
          </div>
          <div className="bg-white/95 backdrop-blur-xl rounded-lg shadow-lg border border-gray-200/50 p-6 glass-card-hover relative text-center">
            <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-[#751FAE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-sm font-bold text-gray-700 mb-2">Data Weeks</div>
            <div className="text-4xl font-black bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">{isLoading ? '...' : weeklyDataJson.length}</div>
            <div className="text-xs font-semibold text-gray-600">Total weeks of data</div>
          </div>
          <div className="bg-white/95 backdrop-blur-xl rounded-lg shadow-lg border border-gray-200/50 p-6 glass-card-hover relative text-center">
            <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-[#751FAE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-sm font-bold text-gray-700 mb-2">Avg Cost per Lead</div>
            <div className="text-4xl font-black bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">
              {isLoading ? '...' : 
                (() => {
                  // 始终使用所有数据，不受时间筛选影响
                  const allTimeClients = brokerDataJson.length > 0 ? 
                    new Set(brokerDataJson.map((client: any) => client.no).filter(no => no !== null && no !== undefined)).size : 0;
                  
                  return weeklyDataJson.length > 0 && allTimeClients > 0 ? 
                    `$${(weeklyDataJson.reduce((sum, item) => sum + item.totalCost, 0) / allTimeClients).toFixed(1)}` : 
                    '$0.0';
                })()
              }
            </div>
            <div className="text-xs font-semibold text-gray-600">Cost per client (AUD)</div>
          </div>
        </div>
        )}
        
        {/* 模块导航 - 只在有数据时显示 */}
        {brokerDataJson.length > 0 && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-white/95 backdrop-blur-xl rounded-lg shadow-lg border border-gray-200/50 p-1">
            <div className="flex">
              {allModules.map((module, index) => {
                const isHidden = accountHiddenModules.includes(module.id);
                const isActive = activeModule === module.id;
                return (
                  <div key={module.id} className={`flex-1 relative ${
                    isHidden ? 'opacity-50' : ''
                  }`}>
                    <button
                      onClick={() => !isHidden && setActiveModule(module.id)}
                      disabled={isHidden}
                      className={`w-full px-4 py-3 text-sm font-medium transition-all duration-200 ${
                        isActive && !isHidden
                          ? 'bg-gradient-to-r from-[#751FAE] to-[#EF3C99] text-white shadow-md'
                          : isHidden
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-transparent hover:bg-gray-50 text-gray-700'
                      } ${
                        index === 0 ? 'rounded-l-lg' : index === allModules.length - 1 ? 'rounded-r-lg' : ''
                      }`}
                    >
                      {module.name}
                    </button>
                    <button
                      onClick={() => toggleModuleVisibility(module.id)}
                      className="absolute top-1 right-1 p-1 rounded-full hover:bg-black/10 transition-colors duration-200"
                      title={isHidden ? 'Show module' : 'Hide module'}
                    >
                      {isHidden ? (
                        <EyeOff className="w-3 h-3 text-gray-400" />
                      ) : (
                        <Eye className="w-3 h-3 text-gray-500 hover:text-gray-700" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        )}
        
        {/* 动态内容区域 - 只在有数据时显示，如果没有数据显示欢迎界面 */}
        {brokerDataJson.length === 0 ? (
          <div className="max-w-7xl mx-auto">
            <div className="text-center bg-white/95 backdrop-blur-xl rounded-lg shadow-xl shadow-purple-500/10 ring-1 ring-purple-500/20 p-16">
              <div className="text-8xl mb-8">🚀</div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome to Marketing Dashboard</h1>
              <p className="text-lg text-gray-600 mb-6">Get started by uploading your marketing data to unlock powerful insights and analytics.</p>
              <div className="space-y-4">
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => {
                      setUploadAccountType('xiaowang');
                      setShowUpload(true);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#751FAE] to-[#EF3C99] text-white rounded-lg hover:from-[#6919A6] hover:to-[#E73691] transition-all duration-200 font-semibold shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload 小王咨询 Data
                  </button>
                  <button
                    onClick={() => {
                      setUploadAccountType('lifecar');
                      setShowUpload(true);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload LifeCar Data
                  </button>
                </div>
                <p className="text-sm text-gray-400 mt-4">
                  Choose your data source to begin analyzing marketing performance, broker activities, and campaign effectiveness.
                </p>
              </div>
            </div>
          </div>
        ) : (
        <>
        {/* 动态内容区域 */}
        {activeModule === 'broker' && (
          <div className="max-w-7xl mx-auto mb-4 space-y-3">
            <h2 className="text-xl font-semibold mb-3 bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">📊 Broker Distribution Analysis</h2>
            
            {/* 检查是否有数据 */}
            {brokerDataJson.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 左侧：现有饼图 */}
                <div className="glass-card rounded-lg overflow-hidden">
                  <PieChartWithFilter startDate={startDate} endDate={endDate} brokerData={brokerDataJson} />
                </div>
                
                {/* 右侧：双环饼图 */}
                <div className="glass-card rounded-lg overflow-hidden">
                  <BrokerWeeklyDonutChart startDate={startDate} endDate={endDate} brokerData={brokerDataJson} weeklyData={weeklyDataJson} leftChartLegendData={processedBrokerData} />
                </div>
              </div>
            ) : (
              <div className="text-center bg-white/95 backdrop-blur-xl rounded-lg shadow-xl shadow-purple-500/10 ring-1 ring-purple-500/20 p-12">
                <div className="text-6xl mb-6">📊</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-4">No Data Available</h3>
                <p className="text-gray-500 mb-4">Please upload your Excel data first to view the broker distribution analysis.</p>
                <p className="text-sm text-gray-400">Click on the "小王咨询" upload button in the top navigation to get started.</p>
              </div>
            )}

          </div>
        )}

        {activeModule === 'cost' && (
          <div className="max-w-7xl mx-auto mb-4">
            <h2 className="text-xl font-semibold mb-3 bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">💰 Cost & Leads Comparison</h2>
            
            {/* 检查是否有数据 */}
            {brokerDataJson.length > 0 && weeklyDataJson.length > 0 && monthlyDataJson.length > 0 ? (
              <div className="space-y-3">
                <div className="glass-card p-3 rounded-md glass-card-hover">
                  <MonthlyLeadsCost 
                    data={monthlyData} 
                    title={`Monthly Cost & Leads`}
                  />
                </div>
                <div className="glass-card p-3 rounded-md glass-card-hover">
                  <MonthlyPerLeadsCost 
                    data={monthlyData} 
                    title={`Monthly Per Leads Cost`}
                  />
                </div>
                <div className="glass-card p-3 rounded-md glass-card-hover">
                  <WeeklyLeadsCost 
                    data={weeklyData.map(item => ({ ...item, originalWeek: item.week }))} 
                    title={`Weekly Cost per Lead`}
                  />
                </div>
                <div className="glass-card p-3 rounded-md glass-card-hover">
                  <WeeklyCostLeads 
                    data={weeklyCostLeadsData} 
                    title={`Weekly Cost & Leads`}
                  />
                </div>
                <div className="glass-card p-3 rounded-md glass-card-hover">
                  <DailyLeadsChart 
                    data={weeklyCostLeadsData} 
                    title={`Daily Leads`}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center bg-white/95 backdrop-blur-xl rounded-lg shadow-xl shadow-purple-500/10 ring-1 ring-purple-500/20 p-12">
                <div className="text-6xl mb-6">💰</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-4">No Data Available</h3>
                <p className="text-gray-500 mb-4">Please upload your Excel data first to view cost and leads analysis.</p>
                <p className="text-sm text-gray-400">Click on the "小王咨询" upload button in the top navigation to get started.</p>
              </div>
            )}
          </div>
        )}




        {/* 新增模块 - Broker活跃度热力图 */}
        {activeModule === 'activity-heatmap' && (
          <div className="max-w-7xl mx-auto mb-4">
            <h2 className="text-xl font-semibold mb-3 bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">🔥 Broker Activity Heatmap</h2>
            
            {/* 检查是否有数据 */}
            {brokerDataJson.length > 0 ? (
              <div className="glass-card rounded-lg overflow-hidden">
                <BrokerActivityHeatmap brokerData={brokerDataJson} />
              </div>
            ) : (
              <div className="text-center bg-white/95 backdrop-blur-xl rounded-lg shadow-xl shadow-purple-500/10 ring-1 ring-purple-500/20 p-12">
                <div className="text-6xl mb-6">🔥</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-4">No Data Available</h3>
                <p className="text-gray-500 mb-4">Please upload your Excel data first to view broker activity patterns.</p>
                <p className="text-sm text-gray-400">Click on the "小王咨询" upload button in the top navigation to get started.</p>
              </div>
            )}
          </div>
        )}

        {/* 新增模块 - 客户获取时间分析 */}
        {activeModule === 'time-analysis' && (
          <div className="max-w-7xl mx-auto mb-4">
            <h2 className="text-xl font-semibold mb-3 bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">⏰ Customer Acquisition Time Analysis</h2>
            
            {/* 检查是否有数据 */}
            {brokerDataJson.length > 0 && monthlyDataJson.length > 0 && dailyCostDataJson.length > 0 ? (
              <div className="glass-card rounded-lg overflow-hidden">
                <AcquisitionTimeAnalysis 
                  brokerData={brokerDataJson} 
                  monthlyData={monthlyDataJson} 
                  dailyCostData={dailyCostDataJson}
                  startDate={startDate}
                  endDate={endDate}
                />
              </div>
            ) : (
              <div className="text-center bg-white/95 backdrop-blur-xl rounded-lg shadow-xl shadow-purple-500/10 ring-1 ring-purple-500/20 p-12">
                <div className="text-6xl mb-6">⏰</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-4">No Data Available</h3>
                <p className="text-gray-500 mb-4">Please upload your Excel data first to view customer acquisition time analysis.</p>
                <p className="text-sm text-gray-400">Click on the "小王咨询" upload button in the top navigation to get started.</p>
              </div>
            )}
          </div>
        )}

        {/* 新增模块 - Weekly Analysis */}
        {activeModule === 'weekly-analysis' && (
          <div className="max-w-7xl mx-auto mb-4 space-y-6">
            <h2 className="text-xl font-semibold mb-3 bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">📈 Weekly Analysis</h2>
            
            {/* 检查是否有数据 */}
            {brokerDataJson.length > 0 && weeklyDataJson.length > 0 ? (
              <>
                {/* Overall Weekly Average - 独立模块 */}
                <WeeklyOverallAverage weeklyData={weeklyDataJson} brokerData={brokerDataJson} />

                {/* Weekly Performance Details */}
                <WeeklyAnalysis weeklyData={weeklyDataJson} brokerData={brokerDataJson} />
              </>
            ) : (
              <div className="text-center bg-white/95 backdrop-blur-xl rounded-lg shadow-xl shadow-purple-500/10 ring-1 ring-purple-500/20 p-12">
                <div className="text-6xl mb-6">📈</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-4">No Data Available</h3>
                <p className="text-gray-500 mb-4">Please upload your Excel data first to view weekly performance analysis.</p>
                <p className="text-sm text-gray-400">Click on the "小王咨询" upload button in the top navigation to get started.</p>
              </div>
            )}
          </div>
        )}

          </>
        )}

        </>
        )}

        {/* 小王测试的数据面板 */}
        {selectedAccount === 'xiaowang-test' && (
          <>
            {/* 小王测试数据加载状态 */}
            {xiaowangTestLoading && (
              <div className="max-w-7xl mx-auto mb-6 flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-purple-600 font-medium">Loading 小王测试 data...</p>
                </div>
              </div>
            )}

            {/* 时间筛选器 - 独立卡片设计 */}
            {!xiaowangTestLoading && filteredXiaowangTestData && (
              <div className="max-w-7xl mx-auto mb-6">
                <div className="bg-white/95 backdrop-blur-xl rounded-lg shadow-xl shadow-purple-500/10 ring-1 ring-purple-500/20 p-6">
                  {/* 主体标签 */}
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                    <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
                      <CalendarIcon className="h-5 w-5 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 font-montserrat">Time Filters</h3>
                  </div>

                  {/* 单行布局 */}
                  <div className="flex flex-wrap items-end gap-3">
                    {/* Start Date */}
                    <div className="flex-1 min-w-[150px]">
                      <label className="text-xs font-bold text-gray-700 flex items-center gap-1 font-montserrat mb-1">
                        <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                        Start Date
                      </label>
                      <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        min="2024-09-01"
                        max="2025-12-31"
                        className="w-full justify-start text-left font-normal bg-white border-gray-300 text-gray-800 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200 hover:bg-gray-50 h-9 text-sm"
                      />
                    </div>

                    {/* End Date */}
                    <div className="flex-1 min-w-[150px]">
                      <label className="text-xs font-bold text-gray-700 flex items-center gap-1 font-montserrat mb-1">
                        <div className="w-1.5 h-1.5 bg-pink-600 rounded-full"></div>
                        End Date
                      </label>
                      <Input
                        id="end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min="2024-09-01"
                        max="2025-12-31"
                        className="w-full justify-start text-left font-normal bg-white border-gray-300 text-gray-800 focus:border-pink-500 focus:ring-pink-500/20 transition-all duration-200 hover:bg-gray-50 h-9 text-sm"
                      />
                    </div>

                    {/* Quick actions */}
                    <Button
                      onClick={handleLastWeek}
                      variant="secondary"
                      size="sm"
                      className={`${
                        isLastWeekSelected()
                          ? 'bg-purple-400 text-white hover:bg-purple-500'
                          : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      } transition-all duration-200 font-semibold h-9 px-3`}
                    >
                      Last Week
                    </Button>

                    <Button
                      onClick={handleClearFilter}
                      variant="outline"
                      size="sm"
                      className="bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 h-9 px-3"
                    >
                      Clear
                    </Button>

                    {/* Navigation buttons */}
                    {startDate && endDate && (
                      <>
                        <Button
                          onClick={handlePreviousPeriod}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 bg-white border-gray-300 text-gray-700 hover:bg-purple-50 hover:border-purple-400 hover:text-purple-700 transition-all duration-200 h-9 px-2"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Prev
                        </Button>

                        <div className="text-xs text-gray-500 font-medium flex items-center px-2 h-9">
                          {(() => {
                            const start = new Date(startDate);
                            const end = new Date(endDate);
                            const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                            return `${days} days`;
                          })()}
                        </div>

                        <Button
                          onClick={handleNextPeriod}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 bg-white border-gray-300 text-gray-700 hover:bg-purple-50 hover:border-purple-400 hover:text-purple-700 transition-all duration-200 h-9 px-2"
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>

                  {startDate && endDate && (
                    <div className="mt-4 text-sm text-purple-600 font-medium font-montserrat">
                      Filtering data from {startDate} to {endDate}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 小王测试概览统计 - LifeCar样式 */}
            {!xiaowangTestLoading && xiaowangTestData?.rawData && (
              <div className="max-w-7xl mx-auto mb-6">
                {/* First row - 4 cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  {/* Views 卡片 */}
                  <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50 glass-card-hover relative">
                    <CardContent className="p-6 text-center">
                      <div className="text-sm font-bold text-gray-700 mb-2">Views</div>
                      <div className="text-3xl font-black bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent mb-1">
                        {(() => {
                          // 使用原始数据，根据时间筛选
                          let rawData = xiaowangTestData.rawData;
                          if (startDate && endDate) {
                            rawData = xiaowangTestData.rawData.filter((item: any) => {
                              return item.date >= startDate && item.date <= endDate;
                            });
                          }
                          const totalClicks = rawData.reduce((sum: number, item: any) => sum + (item.clicks || 0), 0);
                          return totalClicks.toLocaleString();
                        })()}
                      </div>

                      {/* 与平均值对比 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-1">
                          {(() => {
                            // 获取当前时间段的原始数据
                            let currentRawData = xiaowangTestData.rawData;
                            if (startDate && endDate) {
                              currentRawData = xiaowangTestData.rawData.filter((item: any) => {
                                return item.date >= startDate && item.date <= endDate;
                              });
                            }

                            const isNoTimeFilter = !startDate || !endDate;
                            if (isNoTimeFilter) {
                              return <span className="text-gray-400 text-sm font-bold flex items-center">▲ 0.0% <span className="text-xs text-gray-500 ml-1">vs Avg</span></span>;
                            }

                            // 计算当前时间段的总点击数和天数
                            const totalClicks = currentRawData.reduce((sum: number, item: any) => sum + (item.clicks || 0), 0);
                            const currentDays = currentRawData.length;
                            const currentAvgClicks = currentDays > 0 ? totalClicks / currentDays : 0;

                            // 计算所有时间的平均每日点击数（与Cost Analysis相同逻辑）
                            const allTimeRawData = xiaowangTestData.rawData;
                            const allTimeTotalClicks = allTimeRawData.reduce((sum: number, item: any) => sum + (item.clicks || 0), 0);
                            const allTimeDays = allTimeRawData.length;
                            const allTimeAvgClicks = allTimeDays > 0 ? allTimeTotalClicks / allTimeDays : 0;

                            const clicksDifference = currentAvgClicks - allTimeAvgClicks;
                            const clicksDifferencePercent = allTimeAvgClicks > 0 ? ((currentAvgClicks - allTimeAvgClicks) / allTimeAvgClicks) * 100 : 0;

                            return (
                              <>
                                <span className={`${clicksDifference >= 0 ? 'text-green-600' : 'text-red-600'} text-sm font-bold flex items-center`}>
                                  {clicksDifference >= 0 ? '▲' : '▼'}
                                  {Math.abs(clicksDifferencePercent).toFixed(1)}%
                                </span>
                                <span className="text-xs text-gray-500">vs Avg</span>
                              </>
                            );
                          })()}
                        </div>
                        <div className="text-xs text-gray-600">
                          {(() => {
                            const currentPeriodLength = filteredXiaowangTestData.dailyData.length;
                            const allTimePeriodAvgClicks = xiaowangTestData?.dailyData && xiaowangTestData.dailyData.length > 0 && currentPeriodLength > 0 ?
                              xiaowangTestData.dailyData.reduce((sum, item) => sum + (item.clicks || 0), 0) / Math.ceil(xiaowangTestData.dailyData.length / currentPeriodLength) : 0;
                            return `${currentPeriodLength}-day Avg: ${allTimePeriodAvgClicks.toFixed(0)} views`;
                          })()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Likes 卡片 */}
                  <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50 glass-card-hover relative">
                    <CardContent className="p-6 text-center">
                      <div className="text-sm font-bold text-gray-700 mb-2">Likes</div>
                      <div className="text-3xl font-black bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent mb-1">
                        {(() => {
                          const totalLikes = filteredXiaowangTestData.dailyData.reduce((sum, item) => sum + (item.likes || 0), 0);
                          return totalLikes.toLocaleString();
                        })()}
                      </div>

                      {/* 与平均值对比 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-1">
                          {(() => {
                            const currentPeriodLength = filteredXiaowangTestData.dailyData.length;
                            const totalLikes = filteredXiaowangTestData.dailyData.reduce((sum, item) => sum + (item.likes || 0), 0);
                            const isNoTimeFilter = !startDate || !endDate || filteredXiaowangTestData.dailyData.length === xiaowangTestData?.dailyData?.length;

                            if (isNoTimeFilter) {
                              return <span className="text-gray-400 text-sm font-bold flex items-center">▲ 0.0% <span className="text-xs text-gray-500 ml-1">vs Avg</span></span>;
                            }

                            const allTimePeriodAvgLikes = xiaowangTestData?.dailyData && xiaowangTestData.dailyData.length > 0 && currentPeriodLength > 0 ?
                              xiaowangTestData.dailyData.reduce((sum, item) => sum + (item.likes || 0), 0) / Math.ceil(xiaowangTestData.dailyData.length / currentPeriodLength) : 0;
                            const likesDifference = totalLikes - allTimePeriodAvgLikes;
                            const likesDifferencePercent = allTimePeriodAvgLikes > 0 ? ((totalLikes - allTimePeriodAvgLikes) / allTimePeriodAvgLikes) * 100 : 0;

                            return (
                              <>
                                <span className={`${likesDifference >= 0 ? 'text-green-600' : 'text-red-600'} text-sm font-bold flex items-center`}>
                                  {likesDifference >= 0 ? '▲' : '▼'}
                                  {Math.abs(likesDifferencePercent).toFixed(1)}%
                                </span>
                                <span className="text-xs text-gray-500">vs Avg</span>
                              </>
                            );
                          })()}
                        </div>
                        <div className="text-xs text-gray-600">
                          {(() => {
                            const currentPeriodLength = filteredXiaowangTestData.dailyData.length;
                            const allTimePeriodAvgLikes = xiaowangTestData?.dailyData && xiaowangTestData.dailyData.length > 0 && currentPeriodLength > 0 ?
                              xiaowangTestData.dailyData.reduce((sum, item) => sum + (item.likes || 0), 0) / Math.ceil(xiaowangTestData.dailyData.length / currentPeriodLength) : 0;
                            return `${currentPeriodLength}-day Avg: ${allTimePeriodAvgLikes.toFixed(0)} likes`;
                          })()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* New Followers 卡片 */}
                  <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50 glass-card-hover relative">
                    <CardContent className="p-6 text-center">
                      <div className="text-sm font-bold text-gray-700 mb-2">New Followers</div>
                      <div className="text-3xl font-black bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent mb-1">
                        {(() => {
                          const totalFollowers = filteredXiaowangTestData.dailyData.reduce((sum, item) => sum + (item.followers || 0), 0);
                          return totalFollowers.toLocaleString();
                        })()}
                      </div>

                      {/* 与平均值对比 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-1">
                          {(() => {
                            const currentPeriodLength = filteredXiaowangTestData.dailyData.length;
                            const totalFollowers = filteredXiaowangTestData.dailyData.reduce((sum, item) => sum + (item.followers || 0), 0);
                            const isNoTimeFilter = !startDate || !endDate || filteredXiaowangTestData.dailyData.length === xiaowangTestData?.dailyData?.length;

                            if (isNoTimeFilter) {
                              return <span className="text-gray-400 text-sm font-bold flex items-center">▲ 0.0% <span className="text-xs text-gray-500 ml-1">vs Avg</span></span>;
                            }

                            const allTimePeriodAvgFollowers = xiaowangTestData?.dailyData && xiaowangTestData.dailyData.length > 0 && currentPeriodLength > 0 ?
                              xiaowangTestData.dailyData.reduce((sum, item) => sum + (item.followers || 0), 0) / Math.ceil(xiaowangTestData.dailyData.length / currentPeriodLength) : 0;
                            const followersDifference = totalFollowers - allTimePeriodAvgFollowers;
                            const followersDifferencePercent = allTimePeriodAvgFollowers > 0 ? ((totalFollowers - allTimePeriodAvgFollowers) / allTimePeriodAvgFollowers) * 100 : 0;

                            return (
                              <>
                                <span className={`${followersDifference >= 0 ? 'text-green-600' : 'text-red-600'} text-sm font-bold flex items-center`}>
                                  {followersDifference >= 0 ? '▲' : '▼'}
                                  {Math.abs(followersDifferencePercent).toFixed(1)}%
                                </span>
                                <span className="text-xs text-gray-500">vs Avg</span>
                              </>
                            );
                          })()}
                        </div>
                        <div className="text-xs text-gray-600">
                          {(() => {
                            const currentPeriodLength = filteredXiaowangTestData.dailyData.length;
                            const allTimePeriodAvgFollowers = xiaowangTestData?.dailyData && xiaowangTestData.dailyData.length > 0 && currentPeriodLength > 0 ?
                              xiaowangTestData.dailyData.reduce((sum, item) => sum + (item.followers || 0), 0) / Math.ceil(xiaowangTestData.dailyData.length / currentPeriodLength) : 0;
                            return `${currentPeriodLength}-day Avg: ${allTimePeriodAvgFollowers.toFixed(0)} followers`;
                          })()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Leads 卡片 */}
                  <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50 glass-card-hover relative">
                    <CardContent className="p-6 text-center">
                      <div className="text-sm font-bold text-gray-700 mb-2">Leads</div>
                      <div className="text-3xl font-black bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent mb-1">
                        {(() => {
                          // 使用 Clients_info (new) sheet 数据计算Leads
                          if (!brokerDataJson || brokerDataJson.length === 0) return '0';

                          // 根据时间筛选过滤leads数据
                          let filteredLeads = brokerDataJson;
                          if (startDate && endDate) {
                            filteredLeads = brokerDataJson.filter((item: any) => {
                              if (!item || typeof item !== 'object') return false;

                              let dateValue: string | null = null;
                              const dateFields = ['Date', 'date', '时间', 'Date ', 'date '];
                              for (const field of dateFields) {
                                if (item[field] !== undefined && item[field] !== null && item[field] !== '') {
                                  if (typeof item[field] === 'number') {
                                    const excelDate = new Date((item[field] - 25569) * 86400 * 1000);
                                    if (!isNaN(excelDate.getTime())) {
                                      dateValue = excelDate.toISOString().split('T')[0];
                                      break;
                                    }
                                  } else if (typeof item[field] === 'string') {
                                    const parsedDate = new Date(item[field]);
                                    if (!isNaN(parsedDate.getTime())) {
                                      dateValue = parsedDate.toISOString().split('T')[0];
                                      break;
                                    }
                                  }
                                }
                              }

                              return dateValue && dateValue >= startDate && dateValue <= endDate;
                            });
                          }

                          return filteredLeads.length.toLocaleString();
                        })()}
                      </div>

                      {/* 与平均值对比 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-1">
                          {(() => {
                            if (!brokerDataJson || brokerDataJson.length === 0) {
                              return <span className="text-gray-400 text-sm font-bold flex items-center">▲ 0.0% <span className="text-xs text-gray-500 ml-1">vs Avg</span></span>;
                            }

                            const isNoTimeFilter = !startDate || !endDate;
                            if (isNoTimeFilter) {
                              return <span className="text-gray-400 text-sm font-bold flex items-center">▲ 0.0% <span className="text-xs text-gray-500 ml-1">vs Avg</span></span>;
                            }

                            // 计算当前时间段的leads数量
                            let currentLeads = brokerDataJson.filter((item: any) => {
                              if (!item || typeof item !== 'object') return false;

                              let dateValue: string | null = null;
                              const dateFields = ['Date', 'date', '时间', 'Date ', 'date '];
                              for (const field of dateFields) {
                                if (item[field] !== undefined && item[field] !== null && item[field] !== '') {
                                  if (typeof item[field] === 'number') {
                                    const excelDate = new Date((item[field] - 25569) * 86400 * 1000);
                                    if (!isNaN(excelDate.getTime())) {
                                      dateValue = excelDate.toISOString().split('T')[0];
                                      break;
                                    }
                                  } else if (typeof item[field] === 'string') {
                                    const parsedDate = new Date(item[field]);
                                    if (!isNaN(parsedDate.getTime())) {
                                      dateValue = parsedDate.toISOString().split('T')[0];
                                      break;
                                    }
                                  }
                                }
                              }

                              return dateValue && dateValue >= startDate && dateValue <= endDate;
                            }).length;

                            // 计算时间段天数
                            const currentStartDate = new Date(startDate);
                            const currentEndDate = new Date(endDate);
                            const timeDiff = currentEndDate.getTime() - currentStartDate.getTime();
                            const currentDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
                            const currentAvgLeads = currentDays > 0 ? currentLeads / currentDays : 0;

                            // 计算所有时间的平均每日leads数
                            const allTimeLeads = brokerDataJson.length;
                            const allTimeDays = Math.max(1, xiaowangTestData?.rawData?.length || 1);
                            const allTimeAvgLeads = allTimeLeads / allTimeDays;

                            const leadsDifference = currentAvgLeads - allTimeAvgLeads;
                            const leadsDifferencePercent = allTimeAvgLeads > 0 ? ((currentAvgLeads - allTimeAvgLeads) / allTimeAvgLeads) * 100 : 0;

                            return (
                              <>
                                <span className={`${leadsDifference >= 0 ? 'text-green-600' : 'text-red-600'} text-sm font-bold flex items-center`}>
                                  {leadsDifference >= 0 ? '▲' : '▼'}
                                  {Math.abs(leadsDifferencePercent).toFixed(1)}%
                                </span>
                                <span className="text-xs text-gray-500">vs Avg</span>
                              </>
                            );
                          })()}
                        </div>
                        <div className="text-xs text-gray-600">
                          {(() => {
                            if (!brokerDataJson || brokerDataJson.length === 0) return "No data";

                            if (!startDate || !endDate) {
                              const allTimeLeads = brokerDataJson.length;
                              const allTimeDays = Math.max(1, xiaowangTestData?.rawData?.length || 1);
                              const allTimeAvgLeads = allTimeLeads / allTimeDays;
                              return `All-time Avg: ${allTimeAvgLeads.toFixed(1)} leads/day`;
                            }

                            const currentStartDate = new Date(startDate);
                            const currentEndDate = new Date(endDate);
                            const timeDiff = currentEndDate.getTime() - currentStartDate.getTime();
                            const currentDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

                            const allTimeLeads = brokerDataJson.length;
                            const allTimeDays = Math.max(1, xiaowangTestData?.rawData?.length || 1);
                            const periodAvgLeads = allTimeLeads / Math.ceil(allTimeDays / currentDays);

                            return `${currentDays}-day Avg: ${periodAvgLeads.toFixed(1)} leads`;
                          })()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Second row - 5 cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  {/* Cost 卡片 */}
                  <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50 glass-card-hover relative">
                    <CardContent className="p-6 text-center">
                      <div className="text-sm font-bold text-gray-700 mb-2">Cost</div>
                      <div className="text-3xl font-black bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent mb-1">
                        ${(() => {
                          const totalSpend = filteredXiaowangTestData.dailyData.reduce((sum, item) => sum + (item.cost || 0), 0);
                          return totalSpend.toFixed(2);
                        })()}
                      </div>

                      {/* 与平均值对比 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-1">
                          {(() => {
                            const currentPeriodLength = filteredXiaowangTestData.dailyData.length;
                            const totalSpend = filteredXiaowangTestData.dailyData.reduce((sum, item) => sum + (item.cost || 0), 0);
                            const isNoTimeFilter = !startDate || !endDate || filteredXiaowangTestData.dailyData.length === xiaowangTestData?.dailyData?.length;

                            if (isNoTimeFilter) {
                              return <span className="text-gray-400 text-sm font-bold flex items-center">▲ 0.0% <span className="text-xs text-gray-500 ml-1">vs Avg</span></span>;
                            }

                            const allTimePeriodAvgSpend = xiaowangTestData?.dailyData && xiaowangTestData.dailyData.length > 0 && currentPeriodLength > 0 ?
                              xiaowangTestData.dailyData.reduce((sum, item) => sum + (item.cost || 0), 0) / Math.ceil(xiaowangTestData.dailyData.length / currentPeriodLength) : 0;
                            const spendDifference = totalSpend - allTimePeriodAvgSpend;
                            const spendDifferencePercent = allTimePeriodAvgSpend > 0 ? ((totalSpend - allTimePeriodAvgSpend) / allTimePeriodAvgSpend) * 100 : 0;

                            return (
                              <>
                                <span className={`${spendDifference >= 0 ? 'text-red-600' : 'text-green-600'} text-sm font-bold flex items-center`}>
                                  {spendDifference >= 0 ? '▲' : '▼'}
                                  {Math.abs(spendDifferencePercent).toFixed(1)}%
                                </span>
                                <span className="text-xs text-gray-500">vs Avg</span>
                              </>
                            );
                          })()}
                        </div>
                        <div className="text-xs text-gray-600">
                          {(() => {
                            const currentPeriodLength = filteredXiaowangTestData.dailyData.length;
                            const allTimePeriodAvgSpend = xiaowangTestData?.dailyData && xiaowangTestData.dailyData.length > 0 && currentPeriodLength > 0 ?
                              xiaowangTestData.dailyData.reduce((sum, item) => sum + (item.cost || 0), 0) / Math.ceil(xiaowangTestData.dailyData.length / currentPeriodLength) : 0;
                            return `${currentPeriodLength}-day Avg: $${allTimePeriodAvgSpend.toFixed(2)}`;
                          })()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Cost per View 卡片 */}
                  <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50 glass-card-hover relative">
                    <CardContent className="p-6 text-center">
                      <div className="text-sm font-bold text-gray-700 mb-2">Cost per View</div>
                      <div className="text-3xl font-black bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent mb-1">
                        ${(() => {
                          const totalSpend = filteredXiaowangTestData.dailyData.reduce((sum, item) => sum + (item.cost || 0), 0);
                          const totalClicks = filteredXiaowangTestData.dailyData.reduce((sum, item) => sum + (item.clicks || 0), 0);
                          const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
                          return cpc.toFixed(2);
                        })()}
                      </div>

                      {/* 与平均值对比 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-1">
                          {(() => {
                            const currentPeriodLength = filteredXiaowangTestData.dailyData.length;
                            const totalSpend = filteredXiaowangTestData.dailyData.reduce((sum, item) => sum + (item.cost || 0), 0);
                            const totalClicks = filteredXiaowangTestData.dailyData.reduce((sum, item) => sum + (item.clicks || 0), 0);
                            const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
                            const isNoTimeFilter = !startDate || !endDate || filteredXiaowangTestData.dailyData.length === xiaowangTestData?.dailyData?.length;

                            if (isNoTimeFilter) {
                              return <span className="text-gray-400 text-sm font-bold flex items-center">▲ 0.0% <span className="text-xs text-gray-500 ml-1">vs Avg</span></span>;
                            }

                            const avgSpendForCPC = xiaowangTestData?.dailyData && xiaowangTestData.dailyData.length > 0 && currentPeriodLength > 0 ?
                              xiaowangTestData.dailyData.reduce((sum, item) => sum + (item.cost || 0), 0) / Math.floor(xiaowangTestData.dailyData.length / currentPeriodLength) : 0;
                            const avgClicksForCPC = xiaowangTestData?.dailyData && xiaowangTestData.dailyData.length > 0 && currentPeriodLength > 0 ?
                              xiaowangTestData.dailyData.reduce((sum, item) => sum + (item.clicks || 0), 0) / Math.floor(xiaowangTestData.dailyData.length / currentPeriodLength) : 0;
                            const allTimePeriodAvgCPC = avgClicksForCPC > 0 ? avgSpendForCPC / avgClicksForCPC : 0;
                            const cpcDifference = cpc - allTimePeriodAvgCPC;
                            const cpcDifferencePercent = allTimePeriodAvgCPC > 0 ? ((cpc - allTimePeriodAvgCPC) / allTimePeriodAvgCPC) * 100 : 0;

                            return (
                              <>
                                <span className={`${cpcDifference >= 0 ? 'text-red-600' : 'text-green-600'} text-sm font-bold flex items-center`}>
                                  {cpcDifference >= 0 ? '▲' : '▼'}
                                  {Math.abs(cpcDifferencePercent).toFixed(1)}%
                                </span>
                                <span className="text-xs text-gray-500">vs Avg</span>
                              </>
                            );
                          })()}
                        </div>
                        <div className="text-xs text-gray-600">
                          {(() => {
                            const currentPeriodLength = filteredXiaowangTestData.dailyData.length;
                            const avgSpendForCPC = xiaowangTestData?.dailyData && xiaowangTestData.dailyData.length > 0 && currentPeriodLength > 0 ?
                              xiaowangTestData.dailyData.reduce((sum, item) => sum + (item.cost || 0), 0) / Math.floor(xiaowangTestData.dailyData.length / currentPeriodLength) : 0;
                            const avgClicksForCPC = xiaowangTestData?.dailyData && xiaowangTestData.dailyData.length > 0 && currentPeriodLength > 0 ?
                              xiaowangTestData.dailyData.reduce((sum, item) => sum + (item.clicks || 0), 0) / Math.floor(xiaowangTestData.dailyData.length / currentPeriodLength) : 0;
                            const allTimePeriodAvgCPC = avgClicksForCPC > 0 ? avgSpendForCPC / avgClicksForCPC : 0;
                            return `${currentPeriodLength}-day Avg: $${allTimePeriodAvgCPC.toFixed(2)}`;
                          })()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Cost per Like 卡片 */}
                  <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50 glass-card-hover relative">
                    <CardContent className="p-6 text-center">
                      <div className="text-sm font-bold text-gray-700 mb-2">Cost per Like</div>
                      <div className="text-3xl font-black bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent mb-1">
                        ${(() => {
                          const totalSpend = filteredXiaowangTestData.dailyData.reduce((sum, item) => sum + (item.cost || 0), 0);
                          const totalLikes = filteredXiaowangTestData.dailyData.reduce((sum, item) => sum + (item.likes || 0), 0);
                          const costPerLike = totalLikes > 0 ? totalSpend / totalLikes : 0;
                          return costPerLike.toFixed(2);
                        })()}
                      </div>

                      {/* 与平均值对比 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-1">
                          {(() => {
                            const currentPeriodLength = filteredXiaowangTestData.dailyData.length;
                            const totalSpend = filteredXiaowangTestData.dailyData.reduce((sum, item) => sum + (item.cost || 0), 0);
                            const totalLikes = filteredXiaowangTestData.dailyData.reduce((sum, item) => sum + (item.likes || 0), 0);
                            const costPerLike = totalLikes > 0 ? totalSpend / totalLikes : 0;
                            const isNoTimeFilter = !startDate || !endDate || filteredXiaowangTestData.dailyData.length === xiaowangTestData?.dailyData?.length;

                            if (isNoTimeFilter) {
                              return <span className="text-gray-400 text-sm font-bold flex items-center">▲ 0.0% <span className="text-xs text-gray-500 ml-1">vs Avg</span></span>;
                            }

                            const avgSpendForCPL = xiaowangTestData?.dailyData && xiaowangTestData.dailyData.length > 0 && currentPeriodLength > 0 ?
                              xiaowangTestData.dailyData.reduce((sum, item) => sum + (item.cost || 0), 0) / Math.floor(xiaowangTestData.dailyData.length / currentPeriodLength) : 0;
                            const avgLikesForCPL = xiaowangTestData?.dailyData && xiaowangTestData.dailyData.length > 0 && currentPeriodLength > 0 ?
                              xiaowangTestData.dailyData.reduce((sum, item) => sum + (item.likes || 0), 0) / Math.floor(xiaowangTestData.dailyData.length / currentPeriodLength) : 0;
                            const allTimePeriodAvgCPL = avgLikesForCPL > 0 ? avgSpendForCPL / avgLikesForCPL : 0;
                            const costPerLikeDifference = costPerLike - allTimePeriodAvgCPL;
                            const costPerLikeDifferencePercent = allTimePeriodAvgCPL > 0 ? ((costPerLike - allTimePeriodAvgCPL) / allTimePeriodAvgCPL) * 100 : 0;

                            return (
                              <>
                                <span className={`${costPerLikeDifference >= 0 ? 'text-red-600' : 'text-green-600'} text-sm font-bold flex items-center`}>
                                  {costPerLikeDifference >= 0 ? '▲' : '▼'}
                                  {Math.abs(costPerLikeDifferencePercent).toFixed(1)}%
                                </span>
                                <span className="text-xs text-gray-500">vs Avg</span>
                              </>
                            );
                          })()}
                        </div>
                        <div className="text-xs text-gray-600">
                          {(() => {
                            const currentPeriodLength = filteredXiaowangTestData.dailyData.length;
                            const avgSpendForCPL = xiaowangTestData?.dailyData && xiaowangTestData.dailyData.length > 0 && currentPeriodLength > 0 ?
                              xiaowangTestData.dailyData.reduce((sum, item) => sum + (item.cost || 0), 0) / Math.floor(xiaowangTestData.dailyData.length / currentPeriodLength) : 0;
                            const avgLikesForCPL = xiaowangTestData?.dailyData && xiaowangTestData.dailyData.length > 0 && currentPeriodLength > 0 ?
                              xiaowangTestData.dailyData.reduce((sum, item) => sum + (item.likes || 0), 0) / Math.floor(xiaowangTestData.dailyData.length / currentPeriodLength) : 0;
                            const allTimePeriodAvgCPL = avgLikesForCPL > 0 ? avgSpendForCPL / avgLikesForCPL : 0;
                            return `${currentPeriodLength}-day Avg: $${allTimePeriodAvgCPL.toFixed(2)}`;
                          })()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Cost per Follower 卡片 */}
                  <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50 glass-card-hover relative">
                    <CardContent className="p-6 text-center">
                      <div className="text-sm font-bold text-gray-700 mb-2">Cost per Follower</div>
                      <div className="text-3xl font-black bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent mb-1">
                        ${(() => {
                          const totalSpend = filteredXiaowangTestData.dailyData.reduce((sum, item) => sum + (item.cost || 0), 0);
                          const totalFollowers = filteredXiaowangTestData.dailyData.reduce((sum, item) => sum + (item.followers || 0), 0);
                          const costPerFollower = totalFollowers > 0 ? totalSpend / totalFollowers : 0;
                          return costPerFollower.toFixed(2);
                        })()}
                      </div>

                      {/* 与平均值对比 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-1">
                          {(() => {
                            const currentPeriodLength = filteredXiaowangTestData.dailyData.length;
                            const totalSpend = filteredXiaowangTestData.dailyData.reduce((sum, item) => sum + (item.cost || 0), 0);
                            const totalFollowers = filteredXiaowangTestData.dailyData.reduce((sum, item) => sum + (item.followers || 0), 0);
                            const costPerFollower = totalFollowers > 0 ? totalSpend / totalFollowers : 0;
                            const isNoTimeFilter = !startDate || !endDate || filteredXiaowangTestData.dailyData.length === xiaowangTestData?.dailyData?.length;

                            if (isNoTimeFilter) {
                              return <span className="text-gray-400 text-sm font-bold flex items-center">▲ 0.0% <span className="text-xs text-gray-500 ml-1">vs Avg</span></span>;
                            }

                            const avgSpendForCPF = xiaowangTestData?.dailyData && xiaowangTestData.dailyData.length > 0 && currentPeriodLength > 0 ?
                              xiaowangTestData.dailyData.reduce((sum, item) => sum + (item.cost || 0), 0) / Math.floor(xiaowangTestData.dailyData.length / currentPeriodLength) : 0;
                            const avgFollowersForCPF = xiaowangTestData?.dailyData && xiaowangTestData.dailyData.length > 0 && currentPeriodLength > 0 ?
                              xiaowangTestData.dailyData.reduce((sum, item) => sum + (item.followers || 0), 0) / Math.floor(xiaowangTestData.dailyData.length / currentPeriodLength) : 0;
                            const allTimePeriodAvgCPF = avgFollowersForCPF > 0 ? avgSpendForCPF / avgFollowersForCPF : 0;
                            const costPerFollowerDifference = costPerFollower - allTimePeriodAvgCPF;
                            const costPerFollowerDifferencePercent = allTimePeriodAvgCPF > 0 ? ((costPerFollower - allTimePeriodAvgCPF) / allTimePeriodAvgCPF) * 100 : 0;

                            return (
                              <>
                                <span className={`${costPerFollowerDifference >= 0 ? 'text-red-600' : 'text-green-600'} text-sm font-bold flex items-center`}>
                                  {costPerFollowerDifference >= 0 ? '▲' : '▼'}
                                  {Math.abs(costPerFollowerDifferencePercent).toFixed(1)}%
                                </span>
                                <span className="text-xs text-gray-500">vs Avg</span>
                              </>
                            );
                          })()}
                        </div>
                        <div className="text-xs text-gray-600">
                          {(() => {
                            const currentPeriodLength = filteredXiaowangTestData.dailyData.length;
                            const avgSpendForCPF = xiaowangTestData?.dailyData && xiaowangTestData.dailyData.length > 0 && currentPeriodLength > 0 ?
                              xiaowangTestData.dailyData.reduce((sum, item) => sum + (item.cost || 0), 0) / Math.floor(xiaowangTestData.dailyData.length / currentPeriodLength) : 0;
                            const avgFollowersForCPF = xiaowangTestData?.dailyData && xiaowangTestData.dailyData.length > 0 && currentPeriodLength > 0 ?
                              xiaowangTestData.dailyData.reduce((sum, item) => sum + (item.followers || 0), 0) / Math.floor(xiaowangTestData.dailyData.length / currentPeriodLength) : 0;
                            const allTimePeriodAvgCPF = avgFollowersForCPF > 0 ? avgSpendForCPF / avgFollowersForCPF : 0;
                            return `${currentPeriodLength}-day Avg: $${allTimePeriodAvgCPF.toFixed(2)}`;
                          })()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Cost per Lead 卡片 */}
                  <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50 glass-card-hover relative">
                    <CardContent className="p-6 text-center">
                      <div className="text-sm font-bold text-gray-700 mb-2">Cost per Lead</div>
                      <div className="text-3xl font-black bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent mb-1">
                        ${(() => {
                          // 计算总花费
                          const totalSpend = filteredXiaowangTestData.dailyData.reduce((sum, item) => sum + (item.cost || 0), 0);

                          // 计算leads数量（来自brokerDataJson，根据时间筛选）
                          if (!brokerDataJson || brokerDataJson.length === 0) return '0.00';

                          let filteredLeads = brokerDataJson;
                          if (startDate && endDate) {
                            filteredLeads = brokerDataJson.filter((item: any) => {
                              if (!item || typeof item !== 'object') return false;

                              let dateValue: string | null = null;
                              const dateFields = ['Date', 'date', '时间', 'Date ', 'date '];
                              for (const field of dateFields) {
                                if (item[field] !== undefined && item[field] !== null && item[field] !== '') {
                                  if (typeof item[field] === 'number') {
                                    const excelDate = new Date((item[field] - 25569) * 86400 * 1000);
                                    if (!isNaN(excelDate.getTime())) {
                                      dateValue = excelDate.toISOString().split('T')[0];
                                      break;
                                    }
                                  } else if (typeof item[field] === 'string') {
                                    const parsedDate = new Date(item[field]);
                                    if (!isNaN(parsedDate.getTime())) {
                                      dateValue = parsedDate.toISOString().split('T')[0];
                                      break;
                                    }
                                  }
                                }
                              }

                              return dateValue && dateValue >= startDate && dateValue <= endDate;
                            });
                          }

                          const totalLeads = filteredLeads.length;
                          const costPerLead = totalLeads > 0 ? totalSpend / totalLeads : 0;
                          return costPerLead.toFixed(2);
                        })()}
                      </div>

                      {/* 与平均值对比 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-1">
                          {(() => {
                            if (!brokerDataJson || brokerDataJson.length === 0) {
                              return <span className="text-gray-400 text-sm font-bold flex items-center">▲ 0.0% <span className="text-xs text-gray-500 ml-1">vs Avg</span></span>;
                            }

                            const currentPeriodLength = filteredXiaowangTestData.dailyData.length;
                            const totalSpend = filteredXiaowangTestData.dailyData.reduce((sum, item) => sum + (item.cost || 0), 0);

                            // 计算当前时间段的leads
                            let currentLeads = brokerDataJson;
                            if (startDate && endDate) {
                              currentLeads = brokerDataJson.filter((item: any) => {
                                if (!item || typeof item !== 'object') return false;

                                let dateValue: string | null = null;
                                const dateFields = ['Date', 'date', '时间', 'Date ', 'date '];
                                for (const field of dateFields) {
                                  if (item[field] !== undefined && item[field] !== null && item[field] !== '') {
                                    if (typeof item[field] === 'number') {
                                      const excelDate = new Date((item[field] - 25569) * 86400 * 1000);
                                      if (!isNaN(excelDate.getTime())) {
                                        dateValue = excelDate.toISOString().split('T')[0];
                                        break;
                                      }
                                    } else if (typeof item[field] === 'string') {
                                      const parsedDate = new Date(item[field]);
                                      if (!isNaN(parsedDate.getTime())) {
                                        dateValue = parsedDate.toISOString().split('T')[0];
                                        break;
                                      }
                                    }
                                  }
                                }

                                return dateValue && dateValue >= startDate && dateValue <= endDate;
                              });
                            }

                            const currentTotalLeads = currentLeads.length;
                            const costPerLead = currentTotalLeads > 0 ? totalSpend / currentTotalLeads : 0;
                            const isNoTimeFilter = !startDate || !endDate || filteredXiaowangTestData.dailyData.length === xiaowangTestData?.dailyData?.length;

                            if (isNoTimeFilter) {
                              return <span className="text-gray-400 text-sm font-bold flex items-center">▲ 0.0% <span className="text-xs text-gray-500 ml-1">vs Avg</span></span>;
                            }

                            // 计算全时间的平均Cost per Lead
                            const allTimeSpend = xiaowangTestData?.dailyData && xiaowangTestData.dailyData.length > 0 && currentPeriodLength > 0 ?
                              xiaowangTestData.dailyData.reduce((sum, item) => sum + (item.cost || 0), 0) / Math.floor(xiaowangTestData.dailyData.length / currentPeriodLength) : 0;
                            const allTimeLeads = brokerDataJson.length / Math.floor((xiaowangTestData?.dailyData?.length || 1) / currentPeriodLength);
                            const allTimePeriodAvgCPL = allTimeLeads > 0 ? allTimeSpend / allTimeLeads : 0;

                            const costPerLeadDifference = costPerLead - allTimePeriodAvgCPL;
                            const costPerLeadDifferencePercent = allTimePeriodAvgCPL > 0 ? ((costPerLead - allTimePeriodAvgCPL) / allTimePeriodAvgCPL) * 100 : 0;

                            return (
                              <>
                                <span className={`${costPerLeadDifference >= 0 ? 'text-red-600' : 'text-green-600'} text-sm font-bold flex items-center`}>
                                  {costPerLeadDifference >= 0 ? '▲' : '▼'}
                                  {Math.abs(costPerLeadDifferencePercent).toFixed(1)}%
                                </span>
                                <span className="text-xs text-gray-500">vs Avg</span>
                              </>
                            );
                          })()}
                        </div>
                        <div className="text-xs text-gray-600">
                          {(() => {
                            if (!brokerDataJson || brokerDataJson.length === 0) return "No data";

                            const currentPeriodLength = filteredXiaowangTestData.dailyData.length;
                            const allTimeSpend = xiaowangTestData?.dailyData && xiaowangTestData.dailyData.length > 0 && currentPeriodLength > 0 ?
                              xiaowangTestData.dailyData.reduce((sum, item) => sum + (item.cost || 0), 0) / Math.floor(xiaowangTestData.dailyData.length / currentPeriodLength) : 0;
                            const allTimeLeads = brokerDataJson.length / Math.floor((xiaowangTestData?.dailyData?.length || 1) / currentPeriodLength);
                            const allTimePeriodAvgCPL = allTimeLeads > 0 ? allTimeSpend / allTimeLeads : 0;
                            return `${currentPeriodLength}-day Avg: $${allTimePeriodAvgCPL.toFixed(2)}`;
                          })()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* 小王测试模块导航 */}
            {!xiaowangTestLoading && filteredXiaowangTestData && (
              <div className="max-w-7xl mx-auto mb-6">
                <div className="bg-white/95 backdrop-blur-xl rounded-lg shadow-lg border border-gray-200/50 p-1">
                  <div className="flex">
                    {allModules.map((module, index) => {
                      const isHidden = accountHiddenModules.includes(module.id);
                      const isActive = activeModule === module.id;
                      return (
                        <div key={module.id} className={`flex-1 relative ${
                          isHidden ? 'opacity-50' : ''
                        }`}>
                          <button
                            onClick={() => !isHidden && handleModuleChange(module.id)}
                            disabled={isHidden}
                            className={`w-full px-4 py-3 text-sm font-medium transition-all duration-200 ${
                              isActive && !isHidden
                                ? 'bg-gradient-to-r from-[#751FAE] to-[#EF3C99] text-white shadow-md'
                                : isHidden
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-transparent hover:bg-gray-50 text-gray-700'
                            } ${
                              index === 0 ? 'rounded-l-lg' : index === allModules.length - 1 ? 'rounded-r-lg' : ''
                            }`}
                          >
                            {module.name}
                          </button>
                          <button
                            onClick={() => toggleModuleVisibility(module.id)}
                            className="absolute top-1 right-1 p-1 rounded-full hover:bg-black/10 transition-colors duration-200"
                            title={isHidden ? 'Show module' : 'Hide module'}
                          >
                            {isHidden ? (
                              <EyeOff className="w-3 h-3 text-gray-400" />
                            ) : (
                              <Eye className="w-3 h-3 text-gray-500 hover:text-gray-700" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 小王测试动态内容区域 */}
            {!xiaowangTestLoading && filteredXiaowangTestData && (
              <>
                {activeModule === 'broker' && (
                  <div className="max-w-7xl mx-auto mb-4 space-y-6">
                    <h2 className="text-xl font-semibold mb-3 bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">📊 Broker Distribution Analysis</h2>

                    {/* 小王咨询数据图表（如果存在） */}
                    {brokerDataJson.length > 0 && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Broker分布饼图 */}
                          <div className="glass-card rounded-lg overflow-hidden">
                            <PieChartWithFilter startDate={startDate} endDate={endDate} brokerData={brokerDataJson} />
                          </div>

                          {/* 双环饼图 */}
                          {weeklyDataJson.length > 0 && (
                            <div className="glass-card rounded-lg overflow-hidden">
                              <BrokerWeeklyDonutChart startDate={startDate} endDate={endDate} brokerData={brokerDataJson} weeklyData={weeklyDataJson} leftChartLegendData={processedBrokerData} />
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                )}

                {/* Campaign Overview Module */}
                {activeModule === 'campaign-overview' && (
                  <div className="max-w-7xl mx-auto mb-4 space-y-6">
                    <h2 className="text-xl font-semibold mb-3 bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">📈 Campaign Overview</h2>


                    <XiaowangTestCampaignOverview
                      xiaowangTestData={xiaowangTestData}
                      brokerData={brokerDataJson}
                      startDate={startDate}
                      endDate={endDate}
                    />
                  </div>
                )}

                {/* Cost Analysis Module */}
                {activeModule === 'cost' && (
                  <>
                    {/* Left Sidebar Navigation - positioned below sticky header/bar */}
                    <div
                      className="fixed left-4 z-30"
                      style={{
                        top: `${(startDate || endDate) ? '176px' : '116px'}`
                      }}
                    >
                      <div className="bg-white/95 backdrop-blur-xl rounded-lg border border-gray-200/50 shadow-lg p-3 w-44">
                        <nav className="space-y-1">
                          <button
                            onClick={() => {
                              const element = document.getElementById('day-of-week-analysis');
                              if (element) {
                                // Calculate dynamic header heights
                                let totalHeaderHeight = 96; // base sticky header height

                                // Check if time filter sticky bar exists and is visible
                                if (startDate || endDate) {
                                  totalHeaderHeight += 60; // add sticky bar height (time filter bar)
                                }

                                const elementPosition = element.offsetTop;
                                window.scrollTo({
                                  top: elementPosition - totalHeaderHeight,
                                  behavior: 'smooth'
                                });
                              }
                            }}
                            className="w-full text-left px-2 py-1.5 text-xs text-gray-600 hover:text-[#751FAE] hover:bg-purple-50 rounded-md transition-all duration-200 flex items-center gap-2"
                          >
                            <div className="w-1.5 h-1.5 bg-[#751FAE]"></div>
                            Day of Week
                          </button>
                          <button
                            onClick={() => {
                              const element = document.getElementById('weekly-performance');
                              if (element) {
                                // Calculate dynamic header heights
                                let totalHeaderHeight = 96; // base sticky header height

                                // Check if time filter sticky bar exists and is visible
                                if (startDate || endDate) {
                                  totalHeaderHeight += 60; // add sticky bar height (time filter bar)
                                }

                                const elementPosition = element.offsetTop;
                                window.scrollTo({
                                  top: elementPosition - totalHeaderHeight,
                                  behavior: 'smooth'
                                });
                              }
                            }}
                            className="w-full text-left px-2 py-1.5 text-xs text-gray-600 hover:text-[#751FAE] hover:bg-purple-50 rounded-md transition-all duration-200 flex items-center gap-2"
                          >
                            <div className="w-1.5 h-1.5 bg-[#751FAE]"></div>
                            Weekly Performance
                          </button>
                          <button
                            onClick={() => {
                              const element = document.getElementById('monthly-analysis');
                              if (element) {
                                // Calculate dynamic header heights
                                let totalHeaderHeight = 96; // base sticky header height

                                // Check if time filter sticky bar exists and is visible
                                if (startDate || endDate) {
                                  totalHeaderHeight += 60; // add sticky bar height (time filter bar)
                                }

                                const elementPosition = element.offsetTop;
                                window.scrollTo({
                                  top: elementPosition - totalHeaderHeight,
                                  behavior: 'smooth'
                                });
                              }
                            }}
                            className="w-full text-left px-2 py-1.5 text-xs text-gray-600 hover:text-[#751FAE] hover:bg-purple-50 rounded-md transition-all duration-200 flex items-center gap-2"
                          >
                            <div className="w-1.5 h-1.5 bg-[#751FAE]"></div>
                            Monthly Analysis
                          </button>
                        </nav>
                      </div>
                    </div>

                    {/* Main Content */}
                    <div className="max-w-7xl mx-auto mb-4 space-y-6">
                      {/* Day of Week Analysis Section */}
                      <div id="day-of-week-analysis">
                        <h2 className="text-xl font-semibold mb-3 bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat flex items-center gap-2">
                          <div className="w-4 h-4 bg-[#751FAE]"></div>
                          Day of Week Analysis
                        </h2>

                        <XiaowangTestCostAnalysis
                          xiaowangTestData={xiaowangTestData}
                          brokerData={brokerDataJson}
                          startDate={startDate}
                          endDate={endDate}
                          selectedMetric={xiaowangSelectedMetric}
                          onMetricChange={setXiaowangSelectedMetric}
                          isFiltered={xiaowangChartFiltered}
                          onFilterChange={setXiaowangChartFiltered}
                          notesData={xiaowangTestNotesData}
                          notesWeekdayCount={xiaowangNotesWeekdayCount}
                        />

                        <div className="mt-8">
                          <XiaowangTestCostPerMetric
                            xiaowangTestData={xiaowangTestData}
                            brokerData={brokerDataJson}
                            startDate={startDate}
                            endDate={endDate}
                            selectedMetric={xiaowangSelectedMetric}
                            onMetricChange={setXiaowangSelectedMetric}
                            isFiltered={xiaowangChartFiltered}
                            onFilterChange={setXiaowangChartFiltered}
                            notesData={xiaowangTestNotesData}
                            notesWeekdayCount={xiaowangNotesWeekdayCount}
                          />
                        </div>
                      </div>

                      {/* Weekly Performance Section */}
                      <div id="weekly-performance" className="mt-12">
                        <div className="flex items-center justify-between mb-3">
                          <h2 className="text-xl font-semibold bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat flex items-center gap-2">
                            <div className="w-4 h-4 bg-[#751FAE]"></div>
                            Weekly Performance
                          </h2>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-700">Latest</span>
                            <input
                              type="number"
                              value={weeklyTimePeriod}
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                if (value > 0 && value <= 104) { // Max 2 years = 104 weeks
                                  setWeeklyTimePeriod(value);
                                }
                              }}
                              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              min="1"
                              max="104"
                            />
                            <span className="text-sm font-medium text-gray-700">weeks</span>
                          </div>
                        </div>

                        <XiaowangTestWeeklyCostAnalysis
                          xiaowangTestData={xiaowangTestData}
                          brokerData={brokerDataJson}
                          selectedMetric={xiaowangSelectedMetric}
                          onMetricChange={setXiaowangSelectedMetric}
                          weeklyTimePeriod={weeklyTimePeriod}
                          notesWeeklyCount={xiaowangNotesWeeklyCount}
                        />

                        <div className="mt-8">
                          <XiaowangTestWeeklyCostPerMetric
                            xiaowangTestData={xiaowangTestData}
                            brokerData={brokerDataJson}
                            selectedMetric={xiaowangSelectedMetric}
                            onMetricChange={setXiaowangSelectedMetric}
                            weeklyTimePeriod={weeklyTimePeriod}
                            notesWeeklyCount={xiaowangNotesWeeklyCount}
                          />
                        </div>
                      </div>

                      {/* Monthly Analysis Section */}
                      <div id="monthly-analysis" className="mt-12">
                        <h2 className="text-xl font-semibold mb-3 bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat flex items-center gap-2">
                          <div className="w-4 h-4 bg-[#751FAE]"></div>
                          Monthly Analysis
                        </h2>

                        <XiaowangTestMonthlyCostAnalysis
                          xiaowangTestData={xiaowangTestData}
                          brokerData={brokerDataJson}
                          selectedMetric={xiaowangSelectedMetric}
                          onMetricChange={setXiaowangSelectedMetric}
                          notesMonthlyCount={xiaowangNotesMonthlyCount}
                        />

                        <div className="mt-8">
                          <XiaowangTestMonthlyCostPerMetric
                            xiaowangTestData={xiaowangTestData}
                            brokerData={brokerDataJson}
                            selectedMetric={xiaowangSelectedMetric}
                            onMetricChange={setXiaowangSelectedMetric}
                            notesMonthlyCount={xiaowangNotesMonthlyCount}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Weekly Analysis Module */}
                {activeModule === 'weekly-analysis' && (
                  <div className="max-w-7xl mx-auto mb-4 space-y-6">
                    <h2 className="text-xl font-semibold mb-3 bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">📈 Weekly Analysis</h2>

                    {/* 检查是否有数据 - 只需要小王测试数据和咨询数据 */}
                    {xiaowangTestData && brokerDataJson.length > 0 ? (
                      <>
                        {/* Weekly Performance Details */}
                        <div className="space-y-6">
                          {/* Overall Weekly Average */}
                          <XiaowangTestWeeklyOverallAverage
                            weeklyData={xiaowangTestData?.dailyData || []}
                            brokerData={brokerDataJson}
                          />

                          {/* Weekly Performance Details */}
                          <XiaowangTestWeeklyAnalysisAdapted
                            weeklyData={xiaowangTestData?.dailyData || []}
                            brokerData={brokerDataJson}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="text-center bg-white/95 backdrop-blur-xl rounded-lg shadow-xl shadow-purple-500/10 ring-1 ring-purple-500/20 p-12">
                        <div className="text-6xl mb-6">📈</div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-4">No Data Available</h3>
                        <p className="text-gray-500 mb-4">Please upload both test data and consultation data to view weekly analysis.</p>
                        <div className="text-sm text-gray-400 space-y-1">
                          <p>1. Upload 小王测试 data (CSV format)</p>
                          <p>2. Upload 小王咨询 data with "new client info" sheet</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Template Module (activity-heatmap) */}
                {activeModule === 'activity-heatmap' && (
                  <div className="max-w-7xl mx-auto mb-4 space-y-6">
                    <h2 className="text-xl font-semibold mb-3 bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">🔥 Template - Monthly Leads Pattern & Activity Analysis</h2>

                    {/* Check if we have broker data for the components */}
                    {brokerDataJson.length > 0 ? (
                      <div className="space-y-6">
                        {/* Monthly Leads Pattern Analysis */}
                        <div className="glass-card rounded-lg overflow-hidden">
                          <div className="p-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800">Monthly Leads Pattern Analysis</h3>
                            <p className="text-sm text-gray-600 mt-1">Analyze leads quantity patterns for the same months across different years - easier to identify seasonal trend</p>
                          </div>
                          <MonthlyPatternChart
                            data={monthlyDataJson}
                            title="Monthly Leads Pattern Analysis"
                          />
                        </div>

                        {/* Activity Heatmap */}
                        <div className="glass-card rounded-lg overflow-hidden">
                          <div className="p-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800">Broker Activity Heatmap</h3>
                          </div>
                          <BrokerActivityHeatmap brokerData={brokerDataJson} />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center bg-white/95 backdrop-blur-xl rounded-lg shadow-xl shadow-purple-500/10 ring-1 ring-purple-500/20 p-12">
                        <div className="text-6xl mb-6">🔥</div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-4">No Data Available</h3>
                        <p className="text-gray-500 mb-4">Please upload both test data and consultation data to view the template analysis.</p>
                        <div className="text-sm text-gray-400 space-y-1">
                          <p>1. Upload 小王测试 data (CSV format)</p>
                          <p>2. Upload 小王咨询 data with broker information</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Placeholder for other modules */}
                {activeModule !== 'broker' && activeModule !== 'campaign-overview' && activeModule !== 'cost' && activeModule !== 'weekly-analysis' && activeModule !== 'activity-heatmap' && (
                  <div className="max-w-7xl mx-auto mb-4">
                    <div className="bg-white/95 backdrop-blur-xl rounded-lg shadow-xl shadow-purple-500/10 ring-1 ring-purple-500/20 p-12 text-center">
                      <div className="text-6xl mb-6">🚧</div>
                      <h3 className="text-xl font-semibold text-gray-700 mb-4">Module Under Development</h3>
                      <p className="text-gray-500">This module is currently being developed. More features coming soon!</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* 浮动笔记按钮 - 只在小王测试账号且有数据时显示 */}
            {selectedAccount === 'xiaowang-test' && !xiaowangTestLoading && filteredXiaowangTestData && (
              <div className="fixed top-1/2 right-6 transform -translate-y-1/2 z-40 space-y-2">
                <Button
                  onClick={() => setShowXiaowangNotesModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 rounded-full px-4 py-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-medium">Posts</span>
                </Button>
                {selectedXiaowangNoteDates.length > 0 && (
                  <Button
                    onClick={() => setSelectedXiaowangNoteDates([])}
                    variant="outline"
                    size="sm"
                    className="bg-white/90 border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    清除选中 ({selectedXiaowangNoteDates.length})
                  </Button>
                )}
                {selectedXiaowangNoteDates.length > 0 && (
                  <div className="text-xs text-gray-600 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md border border-blue-200/50 max-h-32 overflow-y-auto">
                    <div className="font-medium text-blue-600 mb-1">选中的笔记日期:</div>
                    {[...selectedXiaowangNoteDates].sort().map((date, index) => (
                      <div key={index} className="text-gray-600 py-0.5">{date}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 无数据状态 - 提示用户上传数据 */}
            {!xiaowangTestLoading && !filteredXiaowangTestData && (
              <div className="max-w-7xl mx-auto flex items-center justify-center py-12">
                <div className="text-center bg-white/95 backdrop-blur-xl rounded-lg shadow-xl shadow-purple-500/10 ring-1 ring-purple-500/20 p-12">
                  <div className="text-6xl mb-6">📤</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-4">No Test Data Uploaded</h3>
                  <p className="text-gray-500 mb-4">请点击顶部的"小王测试"按钮上传CSV数据文件以开始分析。</p>
                  <button
                    onClick={() => setShowXiaowangTestUpload(true)}
                    className="bg-gradient-to-r from-[#751FAE] to-[#EF3C99] text-white px-6 py-2 rounded-lg hover:from-[#6919A6] hover:to-[#E73691] transition-all duration-200"
                  >
                    Upload Test Data
                  </button>
                </div>
              </div>
            )}
          </>
        )}

      </div>
      
      {/* Upload Modal - 移到所有条件外部 */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white/90 backdrop-blur-xl rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl shadow-purple-500/20 border border-purple-200/50">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">Upload Excel Data</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUpload(false)}
                className="text-purple-500 hover:text-purple-700 hover:bg-purple-50"
              >
                ✕
              </Button>
            </div>
            <ExcelUpload
              onUploadSuccess={(data) => {
                // 根据上传类型切换账号
                if (uploadAccountType === 'lifecar') {
                  setSelectedAccount('lifecar');
                  // 处理LifeCAR CSV数据
                  if (data?.csvContent) {
                    // 存储CSV内容供子组件使用
                    setLifeCarCsvContent(data.csvContent);
                    // 解析并设置数据
                    const parsedData = parseLifeCarData(data.csvContent);
                    const monthlyData = aggregateByMonth(parsedData);
                    setLifeCarData(parsedData);
                    setLifeCarMonthlyData(monthlyData);
                  } else if (data?.lifecar_data) {
                    // 如果有已解析的数据，直接使用
                    setLifeCarData(data.lifecar_data);
                    const monthlyData = aggregateByMonth(data.lifecar_data);
                    setLifeCarMonthlyData(monthlyData);
                  }
                } else {
                  setSelectedAccount('xiaowang');
                  handleUploadSuccess(data);
                }
              }}
              accountType={uploadAccountType}
            />
          </div>
        </div>
      )}
      
      {/* LifeCar Notes Modal */}
      <LifeCarNotesModal
        isOpen={showNotesModal}
        onClose={handleNotesModalClose}
        onDataUpdate={(data) => {
          console.log('LifeCar Posts data updated:', data.length, 'posts')
          setLifeCarNotesData(data)
        }}
        initialData={lifeCarNotesData}
        onDateSelect={(date) => {
          setSelectedNoteDates(prev => {
            const chartDate = date.split(' ')[0]; // Extract date part
            if (prev.includes(chartDate)) {
              // Remove if already selected
              return prev.filter(d => d !== chartDate);
            } else {
              // Add if not selected
              return [...prev, chartDate];
            }
          });
        }}
        selectedDates={selectedNoteDates}
      />

      {/* XiaoWang Test Notes Modal */}
      <XiaoWangTestNotesModal
        isOpen={showXiaowangNotesModal}
        onClose={handleXiaowangNotesModalClose}
        onDataUpdate={(data) => {
          console.log('XiaoWang Test Posts data updated:', data.length, 'posts')
          setXiaowangTestNotesData(data)
        }}
        initialData={xiaowangTestNotesData}
        onDateSelect={(date) => {
          setSelectedXiaowangNoteDates(prev => {
            const chartDate = date.split(' ')[0]; // Extract date part
            if (prev.includes(chartDate)) {
              // Remove if already selected
              return prev.filter(d => d !== chartDate);
            } else {
              // Add if not selected
              return [...prev, chartDate];
            }
          });
        }}
        selectedDates={selectedXiaowangNoteDates}
      />

      {/* 小王测试数据上传模态框 */}
      {showXiaowangTestUpload && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white/90 backdrop-blur-xl rounded-xl p-6 max-w-3xl w-full mx-4 shadow-2xl shadow-purple-500/20 border border-purple-200/50">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">Upload Xiaowang Data</h2>
                <p className="text-sm text-gray-600 mt-1">Upload both test and consultation data simultaneously to access complete functionality</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowXiaowangTestUpload(false)}
                className="text-purple-500 hover:text-purple-700 hover:bg-purple-50"
              >
                ✕
              </Button>
            </div>
            <XiaowangDualUpload
              onTestUploadSuccess={(data) => {
                console.log('小王测试数据上传成功，设置数据...', data);
                if (data) {
                  const newTestData = {
                    adData: data.rawData || [],
                    rawData: data.rawData || [], // 组件期望这个字段
                    brokerData: brokerDataJson || [], // 使用现有的咨询数据，如果没有则为空数组
                    summary: data.summary || {},
                    dailyData: data.dailyData || []
                  };
                  console.log('设置小王测试数据:', newTestData);
                  setXiaowangTestData(newTestData);
                }
                setSelectedAccount('xiaowang-test');
              }}
              onConsultationUploadSuccess={(data) => {
                console.log('小王咨询数据上传成功，设置数据...');
                if (data) {
                  updateAllData({
                    broker_data: data.broker_data || [],
                    weekly_data: data.weekly_data || [],
                    monthly_data: data.monthly_data || [],
                    daily_cost_data: data.daily_cost_data || []
                  });
                  // 同时更新小王测试数据的broker部分
                  if (xiaowangTestData) {
                    setXiaowangTestData({
                      ...xiaowangTestData,
                      brokerData: data.broker_data || []
                    });
                  }
                }
                setSelectedAccount('xiaowang');
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
}
