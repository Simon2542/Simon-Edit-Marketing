"use client"

import React, { useState, useMemo, useEffect } from 'react';
import { WeeklyLeadsDistribution } from '@/components/weekly-leads-distribution';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
// 移除静态导入，改为接收props
import { getDataRange } from '@/lib/date-utils';

// 处理饼图数据 - 使用真实Excel数据中的 Broker 列，支持时间筛选
function processBrokerData(brokerDataJson: any[], startDate?: string, endDate?: string) {
  try {
    let clientsData = brokerDataJson || []
    
    // 如果有时间筛选，过滤数据
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999) // 设置为当天结束时间
      
      clientsData = clientsData.filter((client: any) => {
        // Convert Excel date serial number to JavaScript Date
        const excelBase = new Date(1899, 11, 30);
        const clientDate = new Date(excelBase.getTime() + client.date * 24 * 60 * 60 * 1000);
        
        // 规范化到同一天的开始时间进行比较
        const clientDateOnly = new Date(clientDate.getFullYear(), clientDate.getMonth(), clientDate.getDate())
        const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate())
        const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate())
        
        return clientDateOnly >= startDateOnly && clientDateOnly <= endDateOnly
      })
    }
    
    // 统计每个 Broker 的客户数量
    const brokerCounts = clientsData.reduce((acc: any, client: any) => {
      let broker = client.broker || 'Unknown'
      
      // Normalize broker names - 将 Yuki 和若凡合并，将Zoey合并到小助手
      if (broker.toLowerCase() === 'yuki') {
        broker = 'Yuki/Ruofan'
      } else if (broker.toLowerCase() === 'ruofan') {
        broker = 'Yuki/Ruofan'
      } else if (broker === 'Linudo') {
        broker = 'Linduo'
      } else if (broker.toLowerCase() === 'ziv') {
        broker = 'Ziv'
      } else if (broker.toLowerCase() === 'zoey') {
        broker = '小助手'
      } else if (broker === '小助手') {
        broker = '小助手'
      }
      
      acc[broker] = (acc[broker] || 0) + 1
      return acc
    }, {})

    // 过滤掉不需要的broker - 移除 ruofan，因为已经与 Yuki 合并；Zoey已合并到小助手
    const excludeBrokers = ['Unknown'];
    const filteredBrokers = Object.entries(brokerCounts)
      .filter(([broker, count]: [string, any]) => {
        return count > 0 && !excludeBrokers.includes(broker);
      });
    
    // 计算过滤后的总数用于百分比计算
    const total = filteredBrokers.reduce((sum, [broker, count]) => sum + (count as number), 0);
    
    return filteredBrokers
      .map(([broker, count]: [string, any]) => ({
        broker,
        count,
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0.0'
      }))
      .sort((a, b) => b.count - a.count) // 按数量降序排列
  } catch (error) {
    console.error('Failed to process pie chart data:', error)
    return []
  }
}

interface PieChartWithFilterProps {
  startDate?: string;
  endDate?: string;
  brokerData?: any[];
}

export function PieChartWithFilter({ startDate = '', endDate = '', brokerData = [] }: PieChartWithFilterProps) {
  // 获取筛选后的数据
  const processedBrokerData = useMemo(() => {
    const data = processBrokerData(brokerData, startDate, endDate);
    return data;
  }, [brokerData, startDate, endDate]);

  const totalClients = useMemo(() => {
    return processedBrokerData.reduce((sum, broker) => sum + broker.count, 0);
  }, [processedBrokerData]);

  // Comment状态
  const [comment, setComment] = useState('');
  
  // 从localStorage加载保存的评论
  useEffect(() => {
    const savedComment = localStorage.getItem('pieChartComment');
    if (savedComment) {
      setComment(savedComment);
    }
  }, []);

  return (
    <div className="p-6 flex flex-col h-full">
      {/* 饼图标题 */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 font-montserrat">Weekly Broker Avg Leads (Filtered)</h3>
      </div>

      {/* KPI 卡片 - Total Leads This Week */}
      <div className="mb-6 bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200/60 p-4 text-center hover:shadow-lg transition-all duration-200">
        <div className="text-sm font-semibold text-[#0ea5e9] mb-2 font-montserrat">Total Leads This Week</div>
        <div className="text-3xl font-semibold text-[#1e293b] font-montserrat">
          {totalClients}
        </div>
      </div>

      {/* 饼图 */}
      <div className="flex-1">
        <WeeklyLeadsDistribution 
          data={processedBrokerData} 
          title=""
        />
      </div>
      
      {/* Broker统计信息 */}
      <div className="mt-2">        
        {/* 详细列表 - 两列显示 */}
        <div className="grid grid-cols-2 gap-1">
          {processedBrokerData.length > 0 ? (
            processedBrokerData.map((broker, index) => {
              // 使用与右侧饼图完全一致的锁死颜色映射
              const getBrokerColor = (brokerName: string) => {
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

              return (
                <div key={broker.broker} className="flex items-center gap-1.5 p-1.5 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ 
                      backgroundColor: getBrokerColor(broker.broker)
                    }}
                  />
                  <span className="text-xs font-medium text-gray-800 min-w-[30px]">{broker.broker}</span>
                  <span className="text-xs font-semibold text-gray-900">{broker.count} leads</span>
                  <span className="text-xs text-gray-600 ml-1">{broker.percentage}%</span>
                </div>
              );
            })
          ) : (
            <div className="col-span-2 text-center text-gray-500 py-4 font-montserrat font-light">
              No data available for the selected time period
            </div>
          )}
        </div>
        
        {/* Comment输入框 */}
        <div className="mt-3 p-4 bg-black rounded-lg border border-gray-600">
          <Label htmlFor="pie-chart-comment" className="text-sm text-white font-montserrat font-semibold mb-2 block">
            Comments & Notes
          </Label>
          <Textarea
            id="pie-chart-comment"
            placeholder="Add your comments or insights about the broker distribution..."
            value={comment}
            onChange={(e) => {
              const newComment = e.target.value;
              setComment(newComment);
              localStorage.setItem('pieChartComment', newComment);
            }}
            className="w-full min-h-[80px] resize-none bg-gray-800 border-gray-600 text-white placeholder-gray-400 font-montserrat font-light focus:border-purple-400 focus:ring-purple-400/20"
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