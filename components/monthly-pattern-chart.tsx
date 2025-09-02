"use client"

import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface MonthlyPatternChartProps {
  data: Array<{
    month: string
    cost: number
    count: number
  }>
  title?: string
}

export function MonthlyPatternChart({ data, title = "Monthly Leads Pattern Analysis" }: MonthlyPatternChartProps) {
  // 转换数据格式，按月份分组，每年作为一条线
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  // 按月份重新组织数据 - 使用真实数据
  const chartData = monthNames.map((monthName, index) => {
    const monthNumber = String(index + 1).padStart(2, '0')
    const result: any = { month: monthName }
    
    // 为每年创建数据点
    data.forEach(item => {
      const [year, month] = item.month.split('/')
      if (month === monthNumber) {
        result[year] = item.count
      }
    })
    
    return result
  })

  // 获取所有年份
  const years = Array.from(new Set(data.map(item => item.month.split('/')[0]))).sort()
  
  // 为不同年份设定特定颜色：24年紫色，25年粉色
  const getYearColor = (year: string) => {
    switch(year) {
      case '2024': return '#751fae' // 公司配色紫色
      case '2025': return '#ef3c99' // 公司配色粉色
      default: return '#8f4abc' // 备用颜色
    }
  }

  return (
    <div className="w-full">
      <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center font-montserrat">{title}</h3>
      <div className="text-sm text-gray-600 mb-4 text-center font-montserrat font-light">
        Analyze leads quantity patterns for the same months across different years - easier to identify seasonal trends
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 20,
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
            <Tooltip 
              formatter={(value: number, name: string) => [value ? `${value} Leads` : '0 Leads', `Year ${name}`]}
              labelFormatter={(label) => `${label}`}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #ddd',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            />
            <Legend />
            {years.map((year, index) => (
              <Line
                key={year}
                type="monotone"
                dataKey={year}
                stroke={getYearColor(year)}
                strokeWidth={3}
                dot={{ fill: getYearColor(year), strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, stroke: getYearColor(year), strokeWidth: 2, fill: '#fff' }}
                name={`Year ${year}`}
                label={{
                  fill: getYearColor(year),
                  fontSize: 10,
                  position: index === 0 ? 'top' : 'bottom',
                  offset: 8
                }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}