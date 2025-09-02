"use client"

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface WeeklyLeadsCostData {
  week: string;
  leadsPrice: number;
  originalWeek: string;
}

interface WeeklyLeadsCostProps {
  data: WeeklyLeadsCostData[];
  title?: string;
  startDate?: string;
  endDate?: string;
}

// 自定义标签组件
const renderCostLabel = (props: any) => {
  const { x, y, value } = props;
  return (
    <text 
      x={x} 
      y={y - 10} 
      fill="#751fae" 
      textAnchor="middle" 
      fontSize="10" 
      fontWeight="600"
    >
      ${Math.round(value)}
    </text>
  );
};

export function WeeklyLeadsCost({ data, title = "Weekly Cost per Lead", startDate, endDate }: WeeklyLeadsCostProps) {
  // Comment状态
  const [comment, setComment] = useState('');
  
  // 从localStorage加载保存的评论
  useEffect(() => {
    const savedComment = localStorage.getItem('weeklyLeadsCostComment');
    if (savedComment) {
      setComment(savedComment);
    }
  }, []);
  
  // 时间筛选逻辑
  const filteredData = React.useMemo(() => {
    if (!startDate || !endDate) {
      return data;
    }

    return data.filter(item => {
      // 解析周次格式 (e.g., "2024/wk44")
      const weekMatch = item.week.match(/(\d{4})\/wk(\d+)/);
      if (!weekMatch) return true;
      
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
      const filterStart = new Date(startDate);
      const filterEnd = new Date(endDate);
      
      return !(weekEnd < filterStart || weekStart > filterEnd);
    });
  }, [data, startDate, endDate]);

  // 计算平均成本 - 按照Excel weekly_data工作表逻辑：D列总和/A列周数总数
  const averageCost = React.useMemo(() => {
    if (filteredData.length === 0) {
      return 0;
    }
    
    // 正确的平均成本计算：所有周的leadsPrice总和 / 周数总数
    const totalCost = filteredData.reduce((sum, item) => sum + (Number(item.leadsPrice) || 0), 0);
    const weekCount = filteredData.length; // A列周数的总数
    
    return totalCost / weekCount;
  }, [filteredData]);

  return (
    <div className="w-full">
      <div className="h-96">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 font-montserrat">
          {title}
          {startDate && endDate && (
            <span className="text-sm text-gray-500 ml-2 font-montserrat font-light">({startDate} to {endDate})</span>
          )}
        </h2>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={filteredData} 
            margin={{ 
              top: 40, 
              right: 30, 
              left: 20, 
              bottom: 80 
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="week" 
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={10}
              interval={0}
              stroke="#666"
            />
            <YAxis 
              yAxisId="left" 
              fontSize={12}
              stroke="#666"
            />
            <Tooltip 
              formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Acquisition Cost (AUD)']}
              labelFormatter={(label) => `Week: ${label}`}
            />
            <Legend 
              content={(props) => {
                const { payload } = props;
                return (
                  <div className="flex flex-wrap justify-center gap-6 mt-4 text-sm font-montserrat">
                    {payload?.map((entry, index) => (
                      <div key={`item-${index}`} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3" 
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-gray-700">{entry.value}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500" />
                      <span className="text-gray-700">
                        Avg Cost per Lead: ${averageCost.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              }}
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="leadsPrice" 
              stroke="#751fae" 
              strokeWidth={2}
              name="Acquisition Cost (AUD)"
              dot={{ fill: '#751fae', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7, stroke: '#751fae', strokeWidth: 2, fill: '#fff' }}
              label={renderCostLabel}
            />
            <ReferenceLine 
              yAxisId="left"
              y={averageCost} 
              stroke="#ff6b35" 
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{
                value: `Avg: $${averageCost.toFixed(2)}`,
                position: 'insideTopLeft',
                style: { fontSize: '12px', fill: '#ff6b35', fontWeight: 'bold' }
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Comment输入框 */}
      <div className="mt-6 p-4 bg-black rounded-lg border border-gray-600">
        <Label htmlFor="weekly-leads-cost-comment" className="text-sm text-white font-montserrat font-semibold mb-2 block">
          Comments & Notes
        </Label>
        <Textarea
          id="weekly-leads-cost-comment"
          placeholder="Add your comments or insights about the weekly leads cost data..."
          value={comment}
          onChange={(e) => {
            const newComment = e.target.value;
            setComment(newComment);
            localStorage.setItem('weeklyLeadsCostComment', newComment);
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
  );
}