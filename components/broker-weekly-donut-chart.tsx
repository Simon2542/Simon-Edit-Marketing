"use client"

import React, { useMemo, useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
// 移除静态导入，改为接收props

interface BrokerWeeklyDonutChartProps {
  startDate?: string;
  endDate?: string;
  brokerData?: any[];
  weeklyData?: any[];
  leftChartLegendData?: any[]; // 接收左侧饼图的图例数据
}

// 处理broker每周平均值数据
function processBrokerWeeklyAverage(brokerDataJson: any[] = [], weeklyDataJson: any[] = []) {
  try {
    let clientsData = brokerDataJson || [];
    
    // 标准化broker名称的函数 - 将 Yuki 和若凡合并，将Zoey合并到小助手
    const normalizeBrokerName = (broker: string) => {
      if (!broker) return 'Unknown';
      if (broker.toLowerCase() === 'yuki') return 'Yuki/Ruofan';
      if (broker.toLowerCase() === 'ruofan') return 'Yuki/Ruofan';
      if (broker === 'Linudo') return 'Linduo';
      if (broker.toLowerCase() === 'ziv') return 'Ziv';
      if (broker.toLowerCase() === 'zoey') return '小助手';
      if (broker === '小助手') return '小助手';
      return broker;
    };
    
    // 解析日期的函数
    const parseClientDate = (dateValue: any) => {
      if (typeof dateValue === 'number') {
        return new Date((dateValue - 25569) * 86400 * 1000);
      } else if (typeof dateValue === 'string') {
        if (dateValue.includes('/')) {
          const parts = dateValue.split('/');
          if (parts.length === 3) {
            const month = parseInt(parts[0]);
            const day = parseInt(parts[1]);
            let year = parseInt(parts[2]);
            if (year < 100) {
              year = year > 50 ? 1900 + year : 2000 + year;
            }
            return new Date(year, month - 1, day);
          }
        } else {
          return new Date(dateValue);
        }
      }
      return null;
    };
    
    // 计算所有数据的范围和broker总数
    let allDataMinDate: Date | null = null;
    let allDataMaxDate: Date | null = null;
    const allBrokerCounts: { [key: string]: number } = {};
    
    clientsData.forEach((client: any) => {
      const clientDate = parseClientDate(client.date);
      if (clientDate && !isNaN(clientDate.getTime())) {
        // 记录日期范围
        if (!allDataMinDate || clientDate < allDataMinDate) allDataMinDate = clientDate;
        if (!allDataMaxDate || clientDate > allDataMaxDate) allDataMaxDate = clientDate;
        
        // 统计broker总数
        const broker = normalizeBrokerName(client.broker);
        allBrokerCounts[broker] = (allBrokerCounts[broker] || 0) + 1;
      }
    });
    
    // 使用实际的周数据总数，与其他组件保持一致
    const totalWeeks = weeklyDataJson.length;
    
    // 生成每周平均数据 - 过滤掉W、N/A、ruofan和Zoey
    const weeklyAverageData = Object.entries(allBrokerCounts)
      .filter(([broker, count]) => {
        // 过滤掉不需要的broker - 移除 ruofan，因为已经与 Yuki 合并；Zoey已合并到小助手
        const excludeBrokers = ['Unknown'];
        return count > 0 && !excludeBrokers.includes(broker);
      })
      .sort(([,a], [,b]) => b - a)
      .map(([broker, totalLeads]) => {
        const weeklyAverage = totalLeads / totalWeeks;
        return {
          name: broker,
          value: Math.round(weeklyAverage * 10) / 10,
          totalLeads
        };
      });
    
    console.log('Broker每周平均数据:', {
      totalWeeks,
      allBrokerCounts,
      weeklyAverageData
    });
    
    return {
      data: weeklyAverageData,
      totalWeeks
    };
    
  } catch (error) {
    console.error('Failed to process broker weekly average data:', error);
    return {
      data: [],
      totalWeeks: 0
    };
  }
}

// 颜色配置 - 锁死现有的broker名称和颜色映射
const getBrokerColor = (brokerName: string, index: number = 0) => {
  // 锁死的broker颜色映射（基于当前数据的顺序）
  const fixedBrokerColors: { [key: string]: string } = {
    'Ziv': '#FF8C00',
    'Yuki/Ruofan': '#751fae', 
    'Jo': '#a2e329',
    'Amy': '#3cbde5',
    '小助手': '#B07AA1',
    'Linduo': '#8f4abc',
  };
  
  // 直接返回预定义的颜色，不再使用动态index
  if (fixedBrokerColors[brokerName]) {
    return fixedBrokerColors[brokerName];
  }
  
  // 对于新的broker，使用备用颜色
  const fallbackColors = ['#a875ca', '#c29fd9', '#ef3c99', '#f186be', '#f3abd0', '#f4d0e3'];
  return fallbackColors[0]; // 默认第一个备用颜色
};

export function BrokerWeeklyDonutChart({ startDate = '', endDate = '', brokerData = [], weeklyData = [], leftChartLegendData = [] }: BrokerWeeklyDonutChartProps) {
  const { data, totalWeeks } = useMemo(() => {
    return processBrokerWeeklyAverage(brokerData, weeklyData);
  }, [brokerData, weeklyData]);

  // Comment状态
  const [comment, setComment] = useState('');
  
  // 从localStorage加载保存的评论
  useEffect(() => {
    const savedComment = localStorage.getItem('donutChartComment');
    if (savedComment) {
      setComment(savedComment);
    }
  }, []);

  // 渲染标签函数
  const renderLabel = (props: any) => {
    const { name, value, cx, cy, midAngle, innerRadius, outerRadius } = props;
    if (!value || value < 1) return null; // 只显示值>=1的标签
    
    // 计算标签位置 - 放在饼图外部
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 30; // 标签位置在饼图外部
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="#000" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {name}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-gray-600">
            Weekly Average: {data.value} leads
          </p>
          <p className="text-xs text-gray-500">
            Total: {data.totalLeads} leads
          </p>
        </div>
      );
    }
    return null;
  };

  // 计算平均每周总leads - 直接计算整体平均
  const avgLeadsPerWeek = useMemo(() => {
    const totalLeads = brokerData?.length || 0;
    const totalWeeksCount = weeklyData?.length || 1;
    return totalLeads / totalWeeksCount;
  }, [brokerData, weeklyData]);

  return (
    <div className="p-6 flex flex-col h-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 font-montserrat">Weekly Broker Avg Leads (All Time)</h3>
      </div>

      {/* KPI 卡片 - Avg Leads per Week */}
      <div className="mb-6 bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200/60 p-4 text-center hover:shadow-lg transition-all duration-200">
        <div className="text-sm font-semibold text-[#0ea5e9] mb-2 font-montserrat">Avg Leads per Week</div>
        <div className="text-3xl font-semibold text-[#1e293b] font-montserrat">
          {avgLeadsPerWeek.toFixed(1)}
        </div>
      </div>

      {/* 饼图 */}
      <div className="flex-1">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderLabel}
                innerRadius={0}
                outerRadius={120}
                paddingAngle={0}
                dataKey="value"
                nameKey="name"
                stroke="#fff"
                strokeWidth={2}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getBrokerColor(entry.name, index)} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* 使用自己的数据生成图例，确保显示合并后的Yuki/Ruofan */}
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {data.map((entry, index) => (
            <div key={entry.name} className="flex items-center gap-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: getBrokerColor(entry.name, index) }}
              />
              <span className="text-sm text-gray-700 font-montserrat font-light">{entry.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 详细数据列表 */}
      <div className="mt-2">
        <div className="grid grid-cols-2 gap-1">
          {data.map((entry, index) => {
            // 计算百分比 - 基于周平均leads数
            const totalWeeklyAvg = data.reduce((sum, item) => sum + item.value, 0);
            const percentage = totalWeeklyAvg > 0 ? ((entry.value / totalWeeklyAvg) * 100).toFixed(1) : '0.0';
            
            return (
              <div key={entry.name} className="flex items-center gap-1.5 p-1.5 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: getBrokerColor(entry.name, index) }}
                />
                <span className="text-xs font-medium text-gray-800 min-w-[30px]">{entry.name}</span>
                <span className="text-xs font-semibold text-gray-900">{entry.value} leads</span>
                <span className="text-xs text-gray-600 ml-1">{percentage}%</span>
              </div>
            );
          })}
        </div>
        
        {/* Comment输入框 */}
        <div className="mt-3 p-4 bg-black rounded-lg border border-gray-600">
          <Label htmlFor="donut-chart-comment" className="text-sm font-semibold text-white mb-2 block font-montserrat">
            Comments & Notes
          </Label>
          <Textarea
            id="donut-chart-comment"
            placeholder="Add your comments or insights about the broker weekly average performance..."
            value={comment}
            onChange={(e) => {
              const newComment = e.target.value;
              setComment(newComment);
              localStorage.setItem('donutChartComment', newComment);
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
    </div>
  );
}