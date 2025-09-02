"use client"

import React, { useMemo } from 'react';

interface BrokerActivityHeatmapProps {
  brokerData?: any[];
}

function processActivityHeatmapData(brokerDataJson: any[] = []) {
  try {
    const clientsData = brokerDataJson || [];
    
    // 获取主要的broker（过滤掉leads少于5的）
    const brokerCounts = clientsData.reduce((acc: any, client: any) => {
      let broker = client.broker || 'Unknown';
      if (broker.toLowerCase() === 'yuki') broker = 'Yuki';
      else if (broker === 'Linudo') broker = 'Linduo';
      else if (broker.toLowerCase() === 'ziv') broker = 'Ziv';
      acc[broker] = (acc[broker] || 0) + 1;
      return acc;
    }, {});
    
    const allBrokers = Object.entries(brokerCounts)
      .filter(([broker, count]: [string, any]) => count >= 5 && broker !== 'Unknown')
      .map(([broker]) => broker);
    
    // 按指定顺序排列：Jo, Amy, Yuki, Ziv, Linduo, Zoey, 小助手
    const preferredOrder = ['Jo', 'Amy', 'Yuki', 'Ziv', 'Linduo', 'Zoey', '小助手'];
    const mainBrokers = preferredOrder.filter(broker => allBrokers.includes(broker));

    // 创建月份和broker的二维数组
    const monthBrokerMatrix: { [month: string]: { [broker: string]: number } } = {};
    
    clientsData.forEach((client: any) => {
      // 转换Excel日期
      const excelEpoch = new Date(1900, 0, 1).getTime() - 2 * 24 * 60 * 60 * 1000;
      const clientDate = new Date(excelEpoch + (client.date - 1) * 24 * 60 * 60 * 1000);
      const monthKey = `${clientDate.getFullYear()}-${String(clientDate.getMonth() + 1).padStart(2, '0')}`;
      
      let broker = client.broker || 'Unknown';
      if (broker.toLowerCase() === 'yuki') broker = 'Yuki';
      else if (broker === 'Linudo') broker = 'Linduo';
      else if (broker.toLowerCase() === 'ziv') broker = 'Ziv';
      
      if (!mainBrokers.includes(broker)) return;
      
      if (!monthBrokerMatrix[monthKey]) {
        monthBrokerMatrix[monthKey] = {};
      }
      monthBrokerMatrix[monthKey][broker] = (monthBrokerMatrix[monthKey][broker] || 0) + 1;
    });

    const months = Object.keys(monthBrokerMatrix).sort();
    
    // 计算最大值用于归一化
    const allValues = Object.values(monthBrokerMatrix).flatMap(monthData => Object.values(monthData));
    const maxValue = Math.max(...allValues);
    
    // 计算2024年全年的平均值
    const year2024Months = months.filter(month => month.startsWith('2024'));
    const year2024Values = year2024Months.flatMap(month => 
      Object.values(monthBrokerMatrix[month] || {})
    );
    const averageValue = year2024Values.length > 0 
      ? year2024Values.reduce((sum, val) => sum + val, 0) / year2024Values.length 
      : 0;
    
    return {
      months,
      brokers: mainBrokers,
      matrix: monthBrokerMatrix,
      maxValue,
      averageValue
    };
  } catch (error) {
    console.error('Failed to process activity heatmap data:', error);
    return { months: [], brokers: [], matrix: {}, maxValue: 1, averageValue: 0 };
  }
}

interface BrokerActivityHeatmapProps {
  startDate?: string;
  endDate?: string;
  brokerData?: any[];
}

export function BrokerActivityHeatmap({ startDate, endDate, brokerData = [] }: BrokerActivityHeatmapProps) {
  const { months, brokers, matrix, maxValue, averageValue } = useMemo(() => processActivityHeatmapData(brokerData), [brokerData]);

  const getIntensityColor = (value: number) => {
    if (!value) return '#f8fafc'; // 最浅灰色
    
    const isAboveAverage = value > averageValue;
    const intensity = value / maxValue;
    
    if (isAboveAverage) {
      // 高于平均值 - 使用紫色系
      if (intensity >= 0.8) return '#751fae'; // 深紫色
      if (intensity >= 0.6) return '#8f4abc'; // 紫色
      if (intensity >= 0.4) return '#a875ca'; // 中紫色
      return '#c29fd9'; // 浅紫色
    } else {
      // 低于平均值 - 使用粉色系
      if (intensity >= 0.8) return '#ef3c99'; // 深粉色
      if (intensity >= 0.6) return '#f186be'; // 粉色
      if (intensity >= 0.4) return '#f3abd0'; // 中粉色
      return '#f4d0e3'; // 浅粉色
    }
  };

  const getIntensityText = (value: number) => {
    if (!value) return 'No Activity';
    const isAboveAverage = value > averageValue;
    const intensity = value / maxValue;
    
    let level = '';
    if (intensity >= 0.8) level = 'Very High';
    else if (intensity >= 0.6) level = 'High';
    else if (intensity >= 0.4) level = 'Medium';
    else if (intensity >= 0.2) level = 'Low';
    else level = 'Very Low';
    
    return `${level} (${isAboveAverage ? 'Above' : 'Below'} 2024 Avg)`;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Broker Activity Heatmap</h3>
        <p className="text-sm text-gray-600">Visualize broker performance patterns across different months (Colors based on 2024 average)</p>
      </div>

      {/* 热力图 */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* 月份标题行 */}
          <div className="flex">
            <div className="w-24 p-2 text-center font-medium text-sm text-gray-700">Broker</div>
            {months.map(month => (
              <div key={month} className="w-16 p-2 text-center text-xs font-medium text-gray-700">
                {month.split('-')[1]}/{month.split('-')[0].slice(-2)}
              </div>
            ))}
          </div>
          
          {/* Broker行 */}
          {brokers.map(broker => (
            <div key={broker} className="flex items-center border-t border-gray-100">
              <div className="w-24 p-2 text-sm text-gray-800 truncate" title={broker}>
                {broker}
              </div>
              {months.map(month => {
                const value = matrix[month]?.[broker] || 0;
                return (
                  <div
                    key={`${broker}-${month}`}
                    className="w-16 h-12 border border-gray-100 flex items-center justify-center text-xs font-medium cursor-pointer transition-all hover:border-gray-400 text-white"
                    style={{ backgroundColor: getIntensityColor(value) }}
                    title={`${broker} - ${month}: ${value} leads (${getIntensityText(value)})`}
                  >
                    {value || ''}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 平均值图注 - 放在图的正下方 */}
      <div className="mt-4 text-center">
        <div className="text-sm font-bold text-gray-800">
          2024 Average: {averageValue.toFixed(1)} leads/month
        </div>
      </div>

      {/* 图例 */}
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-end">
          <div className="text-xs text-gray-500">
            Max: {maxValue} leads/month
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Above Average (Purple)</div>
            <div className="flex items-center space-x-2">
              {[0.2, 0.4, 0.6, 0.8].map((intensity) => (
                <div key={`above-${intensity}`} className="flex items-center space-x-1">
                  <div
                    className="w-4 h-4 border border-gray-300 rounded"
                    style={{ backgroundColor: getIntensityColor((averageValue + 1) * intensity) }}
                  ></div>
                </div>
              ))}
              <span className="text-xs text-gray-500">Light → Dark</span>
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Below Average (Pink)</div>
            <div className="flex items-center space-x-2">
              {[0.2, 0.4, 0.6, 0.8].map((intensity) => (
                <div key={`below-${intensity}`} className="flex items-center space-x-1">
                  <div
                    className="w-4 h-4 border border-gray-300 rounded"
                    style={{ backgroundColor: getIntensityColor((averageValue - 1) * intensity) }}
                  ></div>
                </div>
              ))}
              <span className="text-xs text-gray-500">Light → Dark</span>
            </div>
          </div>
        </div>
      </div>

      {/* 洞察摘要 */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
        {brokers.slice(0, 6).map(broker => {
          const brokerData = months.map(month => matrix[month]?.[broker] || 0);
          const total = brokerData.reduce((sum, val) => sum + val, 0);
          const avg = total / brokerData.length;
          const consistency = brokerData.filter(val => val > 0).length / brokerData.length;
          
          return (
            <div key={broker} className="bg-gray-50 p-3 rounded-lg">
              <div className="font-medium text-sm text-gray-800">{broker}</div>
              <div className="text-xs text-gray-600">Avg: {avg.toFixed(1)} leads/month</div>
              <div className="text-xs text-gray-600">
                Consistency: {(consistency * 100).toFixed(0)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}