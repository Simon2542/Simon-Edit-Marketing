"use client"

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import brokerDataJson from "@/public/broker_data.json";

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#87ceeb', '#dda0dd', '#98fb98', '#f0e68c'];

function processBrokerPerformanceData() {
  try {
    const clientsData = brokerDataJson || [];
    
    // 统计每个 Broker 的客户数量，并应用名称标准化
    const brokerCounts = clientsData.reduce((acc: any, client: any) => {
      let broker = client.broker || 'Unknown';
      
      // Normalize broker names
      if (broker.toLowerCase() === 'yuki') {
        broker = 'Yuki';
      } else if (broker === 'Linudo') {
        broker = 'Linduo';
      } else if (broker.toLowerCase() === 'ziv') {
        broker = 'Ziv';
      }
      
      acc[broker] = (acc[broker] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(brokerCounts)
      .map(([broker, count]: [string, any]) => ({
        broker: broker.length > 12 ? broker.substring(0, 12) + '...' : broker,
        fullName: broker,
        count,
        performance: count >= 50 ? 'High' : count >= 20 ? 'Medium' : 'Low'
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // 显示前10个broker
  } catch (error) {
    console.error('Failed to process broker performance data:', error);
    return [];
  }
}

export function BrokerPerformanceChart() {
  const performanceData = useMemo(() => processBrokerPerformanceData(), []);
  const totalLeads = performanceData.reduce((sum, item) => sum + item.count, 0);
  const averageLeads = totalLeads / performanceData.length;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-800">{data.fullName}</p>
          <p className="text-sm text-gray-600">
            Leads: <span className="font-semibold text-blue-600">{data.count}</span>
          </p>
          <p className="text-sm text-gray-600">
            Performance: <span className={`font-semibold ${
              data.performance === 'High' ? 'text-green-600' : 
              data.performance === 'Medium' ? 'text-yellow-600' : 'text-red-600'
            }`}>{data.performance}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Broker Performance Ranking</h3>
        <div className="text-sm text-gray-500">
          Avg: {averageLeads.toFixed(1)} leads/broker
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={performanceData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="broker" 
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={12}
            />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {performanceData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={
                    entry.performance === 'High' ? '#22c55e' :
                    entry.performance === 'Medium' ? '#eab308' : '#ef4444'
                  } 
                />
              ))}
              <LabelList 
                dataKey="count" 
                position="top" 
                style={{ 
                  fill: '#374151', 
                  fontSize: '12px', 
                  fontWeight: '600' 
                }} 
                offset={5}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 性能等级说明 */}
      <div className="mt-4 flex justify-center space-x-6 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
          <span className="text-gray-600">High (50+ leads)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
          <span className="text-gray-600">Medium (20-49 leads)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
          <span className="text-gray-600">Low (&lt;20 leads)</span>
        </div>
      </div>
    </div>
  );
}