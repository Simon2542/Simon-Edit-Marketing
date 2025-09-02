"use client"

import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface DailyLeadsChartProps {
  data: Array<{
    week: string
    leadsTotal: number
    leadsPrice: number
    totalCost: number
  }>
  title?: string
  startDate?: string
  endDate?: string
}

export function DailyLeadsChart({ data, title = "Daily Leads", startDate, endDate }: DailyLeadsChartProps) {
  // Comment状态
  const [comment, setComment] = useState('');
  
  // 从localStorage加载保存的评论
  useEffect(() => {
    const savedComment = localStorage.getItem('dailyLeadsChartComment');
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

  const chartData = filteredData.map(item => ({
    week: item.week,
    dailyLeads: parseFloat((item.leadsTotal / 7).toFixed(1))
  }))

  // Custom label component - displays 1 decimal place
  const renderLabel = (props: any) => {
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
        {value.toFixed(1)}
      </text>
    );
  };

  return (
    <div className="w-full">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4 text-left font-montserrat">
          {title}
          {startDate && endDate && (
            <span className="text-sm text-gray-500 ml-2 font-montserrat font-light">({startDate} to {endDate})</span>
          )}
        </h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 40,
                right: 30,
                left: 20,
                bottom: 80,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="week" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
                stroke="#666"
              />
              <YAxis 
                stroke="#666"
                fontSize={12}
                domain={[0, 12]}
                allowDecimals={true}
                type="number"
                tickFormatter={(value) => value.toFixed(1)}
              />
              <Tooltip 
                formatter={(value: number) => [value.toFixed(1), 'Daily Leads']}
                labelFormatter={(label) => `Week: ${label}`}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
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
                        <div className="w-3 h-3 bg-pink-500" />
                        <span className="text-gray-700">
                          Target: 3.5 Daily Leads
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
              <ReferenceLine 
                y={3.5} 
                stroke="#ef3c99" 
                strokeDasharray="5 5" 
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="dailyLeads" 
                stroke="#751fae" 
                strokeWidth={2}
                dot={{ fill: '#751fae', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#751fae', strokeWidth: 2, fill: '#fff' }}
                name="Daily Leads"
                label={renderLabel}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Comment输入框 */}
      <div className="mt-6 p-4 bg-black rounded-lg border border-gray-600">
        <Label htmlFor="daily-leads-chart-comment" className="text-sm text-white font-montserrat font-semibold mb-2 block">
          Comments & Notes
        </Label>
        <Textarea
          id="daily-leads-chart-comment"
          placeholder="Add your comments or insights about the daily leads data..."
          value={comment}
          onChange={(e) => {
            const newComment = e.target.value;
            setComment(newComment);
            localStorage.setItem('dailyLeadsChartComment', newComment);
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
  )
}