"use client"

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface BrokerData {
  broker: string;
  count: number;
  percentage: string;
}

interface WeeklyLeadsDistributionProps {
  data: BrokerData[];
  title?: string;
}

// 锁死的broker颜色映射 - 与右侧饼图保持完全一致
const getBrokerColor = (brokerName: string, index: number) => {
  // 锁死的broker颜色映射（与右侧饼图保持一致）
  const fixedBrokerColors: { [key: string]: string } = {
    'Ziv': '#FF8C00',
    'Yuki/Ruofan': '#751fae',
    'Jo': '#a2e329',
    'Amy': '#3cbde5',
    '小助手': '#B07AA1',
    'Linduo': '#8f4abc',
  };
  
  // 直接返回预定义的颜色，不再使用动态逻辑
  if (fixedBrokerColors[brokerName]) {
    return fixedBrokerColors[brokerName];
  }
  
  // 对于新的broker，使用备用颜色
  const fallbackColors = ['#a875ca', '#c29fd9', '#ef3c99', '#f186be', '#f3abd0', '#f4d0e3'];
  return fallbackColors[0]; // 默认第一个备用颜色
};

export function WeeklyLeadsDistribution({ data, title = "Weekly Leads Distribution" }: WeeklyLeadsDistributionProps) {
  const chartData = data.map(item => ({
    name: item.broker,
    value: item.count,
    percentage: item.percentage
  }));

  // Calculate total client count
  const totalClients = data.reduce((sum, item) => sum + item.count, 0);
  
  // Dynamically calculate threshold: adjust display conditions based on total data volume
  const getThreshold = () => {
    if (totalClients <= 100) return 1; // Total ≤100: show all ≥1
    if (totalClients <= 300) return 5; // Total ≤300: show all ≥5
    return 50; // Total >300: show all ≥50
  };
  
  const threshold = getThreshold();
  
  // Dynamic label function: adaptive threshold based on data volume
  const renderLabel = (props: any) => {
    const { name, value, cx, cy, midAngle, innerRadius, outerRadius } = props;
    if (!value || value < threshold) return null;
    
    // Calculate label position - place outside the pie
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 30; // Position labels outside the pie
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

  return (
    <div className="w-full relative">
      {title && <h2 className="text-xl font-semibold text-gray-900 mb-6 font-montserrat">{title}</h2>}
      
      
      {/* 饼图 */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderLabel}
              outerRadius={120}
              innerRadius={0}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBrokerColor(entry.name, index)} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} clients`, 'Client Count']} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* 自定义图例 - 与右侧图表一致的间距 */}
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {chartData.map((entry, index) => (
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
  );
}