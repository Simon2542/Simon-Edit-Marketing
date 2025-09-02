"use client"

import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import brokerDataJson from "@/public/broker_data.json";

function processMonthlyTrendsData() {
  try {
    const clientsData = brokerDataJson || [];
    
    // 将Excel日期转换为月份并统计
    const monthlyData: { [key: string]: { [broker: string]: number } } = {};
    
    clientsData.forEach((client: any) => {
      // 将Excel日期序列号转换为JavaScript日期
      const excelEpoch = new Date(1900, 0, 1).getTime() - 2 * 24 * 60 * 60 * 1000;
      const clientDate = new Date(excelEpoch + (client.date - 1) * 24 * 60 * 60 * 1000);
      const monthKey = `${clientDate.getFullYear()}-${String(clientDate.getMonth() + 1).padStart(2, '0')}`;
      
      // 标准化broker名称
      let broker = client.broker || 'Unknown';
      if (broker.toLowerCase() === 'yuki') broker = 'Yuki';
      else if (broker === 'Linudo') broker = 'Linduo';
      else if (broker.toLowerCase() === 'ziv') broker = 'Ziv';
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {};
      }
      monthlyData[monthKey][broker] = (monthlyData[monthKey][broker] || 0) + 1;
    });

    // 获取所有broker和月份
    const allBrokers = [...new Set(clientsData.map((c: any) => {
      let broker = c.broker || 'Unknown';
      if (broker.toLowerCase() === 'yuki') broker = 'Yuki';
      else if (broker === 'Linudo') broker = 'Linduo';
      else if (broker.toLowerCase() === 'ziv') broker = 'Ziv';
      return broker;
    }))];
    
    const sortedMonths = Object.keys(monthlyData).sort();
    
    // 转换为图表数据格式
    const chartData = sortedMonths.map(month => {
      const monthData: any = { month };
      allBrokers.forEach(broker => {
        monthData[broker] = monthlyData[month][broker] || 0;
      });
      return monthData;
    });

    return {
      data: chartData,
      brokers: allBrokers.filter(broker => broker !== 'Unknown').slice(0, 8) // 显示前8个主要broker
    };
  } catch (error) {
    console.error('Failed to process monthly trends data:', error);
    return { data: [], brokers: [] };
  }
}

// 与饼图保持一致的颜色映射函数
const getBrokerColor = (brokerName: string, index: number) => {
  const brokerColors: { [key: string]: string } = {
    'Ziv': '#FF8C00',
    'Yuki': '#B07AA1', 
    'Jo': '#a2e329',
    'Amy': '#3cbde5'
  };
  
  // If specific broker, return specific color
  if (brokerColors[brokerName]) {
    return brokerColors[brokerName];
  }
  
  // Otherwise use company color scheme
  const companyColors = ['#751fae', '#8f4abc', '#a875ca', '#c29fd9', '#ef3c99', '#f186be', '#f3abd0', '#f4d0e3'];
  return companyColors[index % companyColors.length];
};

export function BrokerMonthlyTrends() {
  const { data, brokers } = useMemo(() => processMonthlyTrendsData(), []);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Broker Monthly Performance Trends</h3>
        <p className="text-sm text-gray-600">Track each broker's lead acquisition performance over time</p>
      </div>
      
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="month" 
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={12}
            />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => [value, `${name} Leads`]}
              labelFormatter={(label) => `Month: ${label}`}
            />
            <Legend />
            {brokers.map((broker, index) => (
              <Line
                key={broker}
                type="monotone"
                dataKey={broker}
                stroke={getBrokerColor(broker, index)}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 趋势洞察 */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {brokers.slice(0, 4).map((broker, index) => {
          const brokerData = data.map(d => d[broker] || 0);
          const total = brokerData.reduce((sum, val) => sum + val, 0);
          const avg = total / brokerData.length;
          const trend = brokerData.length > 1 ? 
            brokerData[brokerData.length - 1] - brokerData[brokerData.length - 2] : 0;
          
          return (
            <div key={broker} className="bg-gray-50 p-3 rounded-lg">
              <div className="font-medium text-sm text-gray-800">{broker}</div>
              <div className="text-xs text-gray-600">Avg: {avg.toFixed(1)} leads/month</div>
              <div className={`text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend >= 0 ? '↗' : '↘'} {trend >= 0 ? '+' : ''}{trend} last month
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}