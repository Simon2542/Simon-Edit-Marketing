"use client"

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface MonthlyCountStackedChartProps {
  data: Array<{
    month: string
    cost: number
    count: number
  }>
  title?: string
}

export function MonthlyCountStackedChart({ data, title = "Monthly Leads Amount" }: MonthlyCountStackedChartProps) {
  // 重新组织数据：每个月一个柱子，包含24年和25年的数据
  const monthNames = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
  const monthMapping: { [key: string]: string } = {
    '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
    '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', 
    '05': 'May', '06': 'Jun', '07': 'Jul'
  }
  
  const chartData = monthNames.map(monthName => {
    const result: any = { month: monthName, year2024: 0, year2025: 0 }
    
    data.forEach(item => {
      const [year, month] = item.month.split('/')
      const mappedMonth = monthMapping[month]
      
      if (mappedMonth === monthName) {
        if (year === '2024') {
          result.year2024 = item.count
        } else if (year === '2025') {
          result.year2025 = item.count
        }
      }
    })
    
    return result
  })

  // 自定义标签组件 - 2024年数据（显示在顶部）
  const render2024Label = (props: any): React.ReactElement<SVGElement> | null => {
    const { x, y, width, value } = props;
    if (!value || value === 0) return null;
    
    return (
      <text 
        x={x + width / 2} 
        y={y - 5} 
        fill="#751fae" 
        textAnchor="middle" 
        dominantBaseline="bottom"
        fontSize="11" 
        fontWeight="700"
      >
        {value}
      </text>
    );
  };

  // 自定义标签组件 - 2025年数据（顶部堆叠，显示在顶部外侧）
  const render2025Label = (props: any): React.ReactElement<SVGElement> | null => {
    const { x, y, width, value } = props;
    if (!value || value === 0) return null;
    
    return (
      <text 
        x={x + width / 2} 
        y={y - 5} 
        fill="#ef3c99" 
        textAnchor="middle" 
        dominantBaseline="bottom"
        fontSize="11" 
        fontWeight="700"
      >
        {value}
      </text>
    );
  };

  // 自定义Tooltip，只显示悬停的数据
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const year2024 = payload.find((p: any) => p.dataKey === 'year2024')?.value || 0
      const year2025 = payload.find((p: any) => p.dataKey === 'year2025')?.value || 0
      const total = year2024 + year2025
      
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{`${label}`}</p>
          {year2024 > 0 && <p style={{ color: '#751fae' }}>2024: {year2024} Leads</p>}
          {year2025 > 0 && <p style={{ color: '#ef3c99' }}>2025: {year2025} Leads</p>}
          <p className="font-medium text-gray-700 border-t pt-1">Total: {total} Leads</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full">
      <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">{title}</h3>
      <div className="text-sm text-gray-600 mb-4 text-center">
        Stacked bar chart showing leads comparison between 2024 (purple) and 2025 (pink) by month
      </div>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 40,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              stroke="#666"
              fontSize={12}
            />
            <YAxis 
              stroke="#666"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="year2024" 
              stackId="monthlyStack"
              fill="#751fae"
              name="2024"
            />
            <Bar 
              dataKey="year2025" 
              stackId="monthlyStack"
              fill="#ef3c99"
              name="2025"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2 flex items-center">
              <div className="w-3 h-3 bg-purple-600 rounded mr-2"></div>
              2024 Data
            </h4>
            <p className="text-xs">Purple section shows 2024 monthly leads count</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2 flex items-center">
              <div className="w-3 h-3 bg-pink-500 rounded mr-2"></div>
              2025 Data
            </h4>
            <p className="text-xs">Pink section shows 2025 monthly leads count</p>
          </div>
        </div>
      </div>
    </div>
  )
}