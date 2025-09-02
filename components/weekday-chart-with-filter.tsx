"use client"

import React, { useMemo } from 'react';
import { WeekdayLeadsDistribution } from '@/components/weekday-leads-distribution';


interface WeekdayChartWithFilterProps {
  brokerData?: any[];
  weeklyData?: any[];
  dailyCostData?: any[];
  startDate?: string;
  endDate?: string;
}

export function WeekdayChartWithFilter({ brokerData = [], weeklyData = [], dailyCostData = [], startDate, endDate }: WeekdayChartWithFilterProps) {
  // 根据主筛选器进行数据过滤
  const brokerWeekdayData = useMemo(() => {
    let data = brokerData || [];
    
    // 如果有时间筛选，过滤数据
    if (startDate && endDate) {
      const filterStart = new Date(startDate);
      const filterEnd = new Date(endDate);
      filterEnd.setHours(23, 59, 59, 999); // 设置为当天结束时间
      
      data = data.filter((item: any) => {
        if (!item.date) return false;
        
        // Convert Excel date serial number to JavaScript Date
        let itemDate: Date;
        if (typeof item.date === 'number') {
          const excelBase = new Date(1899, 11, 30);
          itemDate = new Date(excelBase.getTime() + item.date * 24 * 60 * 60 * 1000);
        } else {
          itemDate = new Date(item.date);
        }
        
        // 规范化到同一天的开始时间进行比较
        const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
        const startDateOnly = new Date(filterStart.getFullYear(), filterStart.getMonth(), filterStart.getDate());
        const endDateOnly = new Date(filterEnd.getFullYear(), filterEnd.getMonth(), filterEnd.getDate());
        
        return itemDateOnly >= startDateOnly && itemDateOnly <= endDateOnly;
      });
    }
    
    return data;
  }, [brokerData, startDate, endDate]);

  const weeklyCostLeadsData = useMemo(() => {
    let data = weeklyData || [];
    
    // 如果有时间筛选，过滤数据
    if (startDate && endDate) {
      const filterStart = new Date(startDate);
      const filterEnd = new Date(endDate);
      
      data = data.filter((item: any) => {
        if (!item.week) return false;
        
        // 解析周次格式并计算周的日期范围
        const weekMatch = item.week.match(/(\d{4})\/wk(\d+)/);
        if (!weekMatch) return false;
        
        const year = parseInt(weekMatch[1]);
        const weekNum = parseInt(weekMatch[2]);
        
        // 计算该周的开始和结束日期
        const firstDay = new Date(year, 0, 1);
        const dayOfWeek = firstDay.getDay();
        const firstMonday = new Date(firstDay);
        firstMonday.setDate(firstDay.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
        
        const weekStart = new Date(firstMonday);
        weekStart.setDate(firstMonday.getDate() + (weekNum - 1) * 7);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        // 检查是否在筛选范围内
        return !(weekEnd < filterStart || weekStart > filterEnd);
      });
    }
    
    return data
      .filter((item: any) => item.week && (item.totalCost > 0 || item.leadsTotal > 0))
      .sort((a: any, b: any) => {
        // 按年份和周次排序
        const parseWeek = (week: string) => {
          const match = week.match(/(\d{4})\/wk(\d+)/);
          if (match) {
            const year = parseInt(match[1]);
            const weekNum = parseInt(match[2]);
            return year * 100 + weekNum;
          }
          return 0;
        }
        return parseWeek(a.week) - parseWeek(b.week);
      });
  }, [weeklyData, startDate, endDate]);

  const filteredDailyCostData = useMemo(() => {
    let data = dailyCostData || [];
    
    if (startDate && endDate) {
      const filterStart = new Date(startDate);
      const filterEnd = new Date(endDate);
      filterEnd.setHours(23, 59, 59, 999);
      
      data = data.filter((item: any) => {
        if (!item.date) return false;
        
        // Convert Excel date serial number to JavaScript Date
        let itemDate: Date;
        if (typeof item.date === 'number') {
          const excelBase = new Date(1899, 11, 30);
          itemDate = new Date(excelBase.getTime() + item.date * 24 * 60 * 60 * 1000);
        } else {
          itemDate = new Date(item.date);
        }
        
        const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
        const startDateOnly = new Date(filterStart.getFullYear(), filterStart.getMonth(), filterStart.getDate());
        const endDateOnly = new Date(filterEnd.getFullYear(), filterEnd.getMonth(), filterEnd.getDate());
        
        return itemDateOnly >= startDateOnly && itemDateOnly <= endDateOnly;
      });
    }
    
    return data;
  }, [dailyCostData, startDate, endDate]);

  const totalClients = useMemo(() => {
    return brokerWeekdayData.length;
  }, [brokerWeekdayData]);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      {/* Weekday Leads Distribution 图表 */}
      <WeekdayLeadsDistribution 
        clientData={brokerWeekdayData}
        weeklyData={weeklyCostLeadsData}
        dailyCostData={filteredDailyCostData}
        title={`Weekday Leads Distribution${startDate && endDate ? ` (${startDate} to ${endDate})` : ''}`}
      />
    </div>
  );
}