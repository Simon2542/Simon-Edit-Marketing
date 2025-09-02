"use client"

import React, { useMemo, useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
// 移除静态导入，改为接收props

interface WeeklyAnalysisProps {
  startDate?: string;
  endDate?: string;
  weeklyData?: any[];
  brokerData?: any[];
}

interface WeeklyData {
  week: string;
  leadsTotal: number;
  leadsPrice: number;
  totalCost: number;
}

interface ProcessedWeekData {
  week: string;
  weekStart: Date;
  totalLeads: number;
  dailyLeads: number;
  leadsCosts: number;
  perLeadsCosts: number;
  changes: {
    totalLeadsChange: number;
    dailyLeadsChange: number;
    leadsCostsChange: number;
    perLeadsCostsChange: number;
  };
}

export function WeeklyAnalysis({ startDate, endDate, weeklyData = [], brokerData = [] }: WeeklyAnalysisProps) {
  // 处理和筛选周数据
  const processedWeeklyData = useMemo(() => {
    const rawData = weeklyData as WeeklyData[];
    
    // 筛选和排序数据（先按时间正序，用于计算涨跌幅）
    let filteredData = rawData
      .filter(item => item.week && item.leadsTotal)
      .sort((a, b) => {
        const parseWeek = (week: string) => {
          const match = week.match(/(\d{4})\/wk(\d+)/);
          if (match) {
            const year = parseInt(match[1]);
            const weekNum = parseInt(match[2]);
            return year * 100 + weekNum;
          }
          return 0;
        };
        return parseWeek(a.week) - parseWeek(b.week); // 正序排序，用于计算涨跌幅
      });

    // 时间筛选
    if (startDate && endDate) {
      filteredData = filteredData.filter(item => {
        const weekMatch = item.week.match(/(\d{4})\/wk(\d+)/);
        if (!weekMatch) return false;
        
        const year = parseInt(weekMatch[1]);
        const weekNum = parseInt(weekMatch[2]);
        
        const firstDay = new Date(year, 0, 1);
        const dayOfWeek = firstDay.getDay();
        const firstMonday = new Date(year, 0, 1);
        firstMonday.setDate(firstDay.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
        
        const weekStart = new Date(firstMonday);
        weekStart.setDate(firstMonday.getDate() + (weekNum - 1) * 7);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        const filterStart = new Date(startDate);
        const filterEnd = new Date(endDate);
        
        return !(weekEnd < filterStart || weekStart > filterEnd);
      });
    }

    // 处理每周数据并计算涨跌幅
    const processedData: ProcessedWeekData[] = filteredData.map((item, index) => {
      const weekMatch = item.week.match(/(\d{4})\/wk(\d+)/);
      let weekStart = new Date();
      
      if (weekMatch) {
        const year = parseInt(weekMatch[1]);
        const weekNum = parseInt(weekMatch[2]);
        
        // Calculate first Monday of the year
        const firstDay = new Date(year, 0, 1);
        const dayOfWeek = firstDay.getDay();
        const firstMonday = new Date(year, 0, 1);
        firstMonday.setDate(firstDay.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
        
        // Calculate the Monday of the target week
        weekStart = new Date(firstMonday);
        weekStart.setDate(firstMonday.getDate() + (weekNum - 1) * 7);
      }

      const totalLeads = item.leadsTotal;
      const dailyLeads = totalLeads / 7;
      const leadsCosts = item.totalCost;
      const perLeadsCosts = totalLeads > 0 ? leadsCosts / totalLeads : 0;

      // 计算相对于上周的变化
      let changes = {
        totalLeadsChange: 0,
        dailyLeadsChange: 0,
        leadsCostsChange: 0,
        perLeadsCostsChange: 0,
      };

      if (index > 0) {
        const prevWeek = filteredData[index - 1];
        const prevTotalLeads = prevWeek.leadsTotal;
        const prevDailyLeads = prevTotalLeads / 7;
        const prevLeadsCosts = prevWeek.totalCost;
        const prevPerLeadsCosts = prevTotalLeads > 0 ? prevLeadsCosts / prevTotalLeads : 0;

        changes = {
          totalLeadsChange: prevTotalLeads > 0 ? ((totalLeads - prevTotalLeads) / prevTotalLeads) * 100 : 0,
          dailyLeadsChange: prevDailyLeads > 0 ? ((dailyLeads - prevDailyLeads) / prevDailyLeads) * 100 : 0,
          leadsCostsChange: prevLeadsCosts > 0 ? ((leadsCosts - prevLeadsCosts) / prevLeadsCosts) * 100 : 0,
          perLeadsCostsChange: prevPerLeadsCosts > 0 ? ((perLeadsCosts - prevPerLeadsCosts) / prevPerLeadsCosts) * 100 : 0,
        };
      }

      return {
        week: item.week,
        weekStart,
        totalLeads,
        dailyLeads,
        leadsCosts,
        perLeadsCosts,
        changes,
      };
    });

    // 返回时反转数组，让最新的周显示在前面
    return processedData.reverse();
  }, [weeklyData, startDate, endDate]);

  // 计算总体平均值
  const overallAverages = useMemo(() => {
    if (processedWeeklyData.length === 0) {
      return {
        avgLeads: 0,
        avgDailyLeads: 0,
        avgLeadsCosts: 0,
        avgPerLeadsCosts: 0,
        totalWeeks: 0,
      };
    }

    const totals = processedWeeklyData.reduce((acc, week) => ({
      totalLeads: acc.totalLeads + week.totalLeads,
      totalCosts: acc.totalCosts + week.leadsCosts,
      totalPerLeadsCosts: acc.totalPerLeadsCosts + week.perLeadsCosts,
    }), { totalLeads: 0, totalCosts: 0, totalPerLeadsCosts: 0 });

    const weekCount = processedWeeklyData.length;
    
    return {
      avgLeads: totals.totalLeads / weekCount,
      avgDailyLeads: (totals.totalLeads / weekCount) / 7,
      avgLeadsCosts: totals.totalCosts / weekCount, // 每周leads的平均花销
      avgPerLeadsCosts: totals.totalLeads > 0 ? totals.totalCosts / totals.totalLeads : 0, // 每个leads的平均花销
      totalWeeks: weekCount,
    };
  }, [processedWeeklyData]);

  // 格式化显示该周的周日日期
  const formatWeekEndDate = (weekStart: Date) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // 周一+6天=周日
    
    // Handle timezone offset to ensure correct date display
    const year = weekEnd.getFullYear();
    const month = String(weekEnd.getMonth() + 1).padStart(2, '0');
    const day = String(weekEnd.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 渲染变化百分比 - 根据指标类型判断好坏
  const renderChangePercent = (change: number, metricType: 'leads' | 'costs') => {
    if (change === 0) return <span className="text-gray-500 text-xs font-montserrat font-light">0%</span>;
    
    const isPositive = change > 0;
    const arrow = isPositive ? '↑' : '↓';
    
    // 根据指标类型决定颜色：
    // leads类：上涨好(绿)，下降坏(红)
    // costs类：下降好(绿)，上涨坏(红)
    let color;
    if (metricType === 'leads') {
      color = isPositive ? 'text-green-600' : 'text-red-600';
    } else { // costs
      color = isPositive ? 'text-red-600' : 'text-green-600';
    }
    
    return (
      <span className={`${color} text-xs font-medium font-montserrat`}>
        {arrow} {Math.abs(change).toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Weekly Performance Details Header */}
      <div className="bg-white/95 backdrop-blur-xl rounded-lg shadow-lg border border-gray-200/50 p-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
            <span className="text-purple-600 text-lg">📅</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 font-montserrat">Weekly Performance Details</h3>
        </div>
      </div>

      {/* Individual Weekly Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {processedWeeklyData.map((weekData, index) => (
          <div key={weekData.week} className="bg-white/95 backdrop-blur-xl rounded-lg shadow-lg border border-gray-200/50 p-4">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
              <div className="p-1.5 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
                <span className="text-purple-600 text-sm">📊</span>
              </div>
              <div>
                <h4 className="text-2xl font-black text-[#751FAE] font-montserrat">
                  Week of {formatWeekEndDate(weekData.weekStart)}
                </h4>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200/60 p-3 hover:shadow-lg transition-all duration-200 relative">
                <svg className="absolute top-2 right-2 w-4 h-4 text-[#751FAE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <div className="text-xs font-semibold text-[#751FAE] font-montserrat mb-2">Total Leads</div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-semibold text-[#FF1493] font-montserrat">{weekData.totalLeads}</div>
                  {renderChangePercent(weekData.changes.totalLeadsChange, 'leads')}
                </div>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200/60 p-3 hover:shadow-lg transition-all duration-200 relative">
                <svg className="absolute top-2 right-2 w-4 h-4 text-[#751FAE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <div className="text-xs font-semibold text-[#751FAE] font-montserrat mb-2">Daily Leads</div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-semibold text-[#FF1493] font-montserrat">{weekData.dailyLeads.toFixed(1)}</div>
                  {renderChangePercent(weekData.changes.dailyLeadsChange, 'leads')}
                </div>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200/60 p-3 hover:shadow-lg transition-all duration-200 relative">
                <svg className="absolute top-2 right-2 w-4 h-4 text-[#751FAE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-xs font-semibold text-[#751FAE] font-montserrat mb-2">Total Cost</div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-semibold text-[#FF1493] font-montserrat">${weekData.leadsCosts.toFixed(0)}</div>
                  {renderChangePercent(weekData.changes.leadsCostsChange, 'costs')}
                </div>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200/60 p-3 hover:shadow-lg transition-all duration-200 relative">
                <svg className="absolute top-2 right-2 w-4 h-4 text-[#751FAE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                <div className="text-xs font-semibold text-[#751FAE] font-montserrat mb-2">Cost per Lead</div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-semibold text-[#FF1493] font-montserrat">${weekData.perLeadsCosts.toFixed(2)}</div>
                  {renderChangePercent(weekData.changes.perLeadsCostsChange, 'costs')}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 导出Overall Weekly Average组件用于独立显示
export function WeeklyOverallAverage({ startDate, endDate, weeklyData = [], brokerData = [] }: WeeklyAnalysisProps) {
  // 复用相同的数据处理逻辑
  const processedWeeklyData = useMemo(() => {
    const rawData = weeklyData as WeeklyData[];
    
    let filteredData = rawData
      .filter(item => item.week && item.leadsTotal)
      .sort((a, b) => {
        const parseWeek = (week: string) => {
          const match = week.match(/(\d{4})\/wk(\d+)/);
          if (match) {
            const year = parseInt(match[1]);
            const weekNum = parseInt(match[2]);
            return year * 100 + weekNum;
          }
          return 0;
        };
        return parseWeek(a.week) - parseWeek(b.week);
      });

    if (startDate && endDate) {
      filteredData = filteredData.filter(item => {
        const weekMatch = item.week.match(/(\d{4})\/wk(\d+)/);
        if (!weekMatch) return false;
        
        const year = parseInt(weekMatch[1]);
        const weekNum = parseInt(weekMatch[2]);
        
        const firstDay = new Date(year, 0, 1);
        const dayOfWeek = firstDay.getDay();
        const firstMonday = new Date(year, 0, 1);
        firstMonday.setDate(firstDay.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
        
        const weekStart = new Date(firstMonday);
        weekStart.setDate(firstMonday.getDate() + (weekNum - 1) * 7);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        const filterStart = new Date(startDate);
        const filterEnd = new Date(endDate);
        
        return !(weekEnd < filterStart || weekStart > filterEnd);
      });
    }

    return filteredData;
  }, [weeklyData, startDate, endDate]);

  const overallAverages = useMemo(() => {
    if (processedWeeklyData.length === 0) {
      return {
        avgLeads: 0,
        avgDailyLeads: 0,
        avgLeadsCosts: 0,
        avgPerLeadsCosts: 0,
        totalWeeks: 0,
      };
    }

    const totals = processedWeeklyData.reduce((acc, week) => ({
      totalLeads: acc.totalLeads + week.leadsTotal,
      totalCosts: acc.totalCosts + week.totalCost,
    }), { totalLeads: 0, totalCosts: 0 });

    // 计算有营销成本周的leads总数（用于per lead cost计算）
    const leadsWithCosts = processedWeeklyData
      .filter(week => week.totalCost > 0)
      .reduce((sum, week) => sum + week.leadsTotal, 0);

    const weekCount = processedWeeklyData.length;
    
    // 正确的Average Leads计算：Clients_info总数 ÷ weekly_data工作表实际周数
    const totalClientsFromClientsInfo = brokerData.length; // Total clients
    const actualWeeklyDataSheetWeeks = processedWeeklyData.length; // 动态计算实际周数
    
    return {
      avgLeads: totalClientsFromClientsInfo / actualWeeklyDataSheetWeeks, // 动态计算周平均
      avgDailyLeads: (totalClientsFromClientsInfo / actualWeeklyDataSheetWeeks) / 7,
      avgLeadsCosts: totals.totalCosts / actualWeeklyDataSheetWeeks, // 总成本 ÷ 实际周数
      avgPerLeadsCosts: leadsWithCosts > 0 ? totals.totalCosts / leadsWithCosts : 0, // 总成本 ÷ 有营销成本的leads
      totalWeeks: weekCount,
    };
  }, [processedWeeklyData]);

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-lg shadow-lg border border-gray-200/50 p-6">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
        <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
          <span className="text-purple-600 text-lg">📊</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 font-montserrat">Overall Weekly Average (All Time)</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200/60 p-5 text-center hover:shadow-lg transition-all duration-200">
          <div className="text-sm font-semibold text-[#751FAE] mb-2 font-montserrat">Avg Leads</div>
          <div className="text-3xl font-semibold text-[#FF1493] font-montserrat">
            {overallAverages.avgLeads.toFixed(1)}
          </div>
        </div>
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200/60 p-5 text-center hover:shadow-lg transition-all duration-200">
          <div className="text-sm font-semibold text-[#751FAE] mb-2 font-montserrat">Avg Daily Leads</div>
          <div className="text-3xl font-semibold text-[#FF1493] font-montserrat">
            {overallAverages.avgDailyLeads.toFixed(1)}
          </div>
        </div>
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200/60 p-5 text-center hover:shadow-lg transition-all duration-200">
          <div className="text-sm font-semibold text-[#751FAE] mb-2 font-montserrat">Weekly Avg Cost</div>
          <div className="text-3xl font-semibold text-[#FF1493] font-montserrat">
            ${overallAverages.avgLeadsCosts.toFixed(0)}
          </div>
        </div>
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200/60 p-5 text-center hover:shadow-lg transition-all duration-200">
          <div className="text-sm font-semibold text-[#751FAE] mb-2 font-montserrat">Weekly Avg Cost per Lead</div>
          <div className="text-3xl font-semibold text-[#FF1493] font-montserrat">
            ${overallAverages.avgPerLeadsCosts.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}

// Weekly Analysis Comments组件
export function WeeklyAnalysisComments() {
  const [comment, setComment] = useState('');
  
  // 从localStorage加载保存的评论
  useEffect(() => {
    const savedComment = localStorage.getItem('weeklyAnalysisComment');
    if (savedComment) {
      setComment(savedComment);
    }
  }, []);

  return (
    <div className="bg-black rounded-lg shadow-lg border border-gray-600 p-6">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-600">
        <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
          <span className="text-white text-lg">💬</span>
        </div>
        <h3 className="text-lg font-semibold text-white font-montserrat">Weekly Analysis Comments</h3>
      </div>
      
      <div>
        <Label htmlFor="weekly-analysis-comment" className="text-sm font-semibold text-white mb-2 block font-montserrat">
          Comments & Notes
        </Label>
        <Textarea
          id="weekly-analysis-comment"
          placeholder="Add your comments or insights about the weekly analysis data..."
          value={comment}
          onChange={(e) => {
            const newComment = e.target.value;
            setComment(newComment);
            localStorage.setItem('weeklyAnalysisComment', newComment);
          }}
          className="w-full min-h-[80px] resize-none bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-purple-400 focus:ring-purple-400/20 font-montserrat font-light"
        />
        {comment && (
          <div className="mt-2 text-xs text-gray-400 font-montserrat font-light">
            Character count: {comment.length}
          </div>
        )}
      </div>
    </div>
  );
}