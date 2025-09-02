"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { parseLifeCarData } from "@/lib/lifecar-data-processor"

interface ChartData {
  date: string
  avgCost: number
  avgClicks: number
}

interface RollingAverageChartProps {
  csvContent?: string // Optional CSV content passed from parent
}

export function RollingAverageChart({ csvContent }: RollingAverageChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([])

  useEffect(() => {
    // If CSV content is provided, use it directly
    if (csvContent) {
      processCSVData(csvContent)
    } else {
      // Otherwise try to fetch from static file (for development)
      fetch('/database_lifecar/lifecar-data.csv')
        .then(res => res.text())
        .then(csvText => processCSVData(csvText))
        .catch(err => console.error('Failed to load data:', err))
    }
  }, [csvContent])

  const processCSVData = (csvText: string) => {
        // 使用现有的解析函数
        const dailyData = parseLifeCarData(csvText)
        
        // 按日期排序（parseLifeCarData 已经做了排序）
        const sortedData = dailyData

        // 计算7天滚动平均
        const rollingAvgData: ChartData[] = []
        
        // 从第7天开始，只处理有完整7天历史数据的日期
        for (let i = 6; i < sortedData.length; i++) {
          // 计算当前日期前6天及当天（共7天）的数据
          const startIndex = i - 6
          const endIndex = i + 1
          const window = sortedData.slice(startIndex, endIndex)
          
          // 计算窗口内的平均值
          const avgCost = window.reduce((sum, item) => 
            sum + item.spend, 0) / window.length
          
          const avgClicks = window.reduce((sum, item) => 
            sum + item.clicks, 0) / window.length
          
          // 格式化日期 - 使用当前日期作为标签
          const date = new Date(sortedData[i].date)
          const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`
          
          rollingAvgData.push({
            date: formattedDate,
            avgCost: Math.round(avgCost * 100) / 100,
            avgClicks: Math.round(avgClicks * 100) / 100
          })
        }
        
        setChartData(rollingAvgData)
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>7-Day Rolling Average Analysis</CardTitle>
        <CardDescription>
          消费和点击量的7天滚动平均趋势（不受时间筛选影响）
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <XAxis 
              dataKey="date" 
              className="text-xs"
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              yAxisId="left"
              className="text-xs"
              label={{ value: '7天平均消费 ($)', angle: -90, position: 'insideLeft' }}
              domain={['dataMin * 0.9', 'dataMax * 1.1']}
              scale="linear"
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              className="text-xs"
              label={{ value: '7天平均点击量', angle: 90, position: 'insideRight' }}
              domain={['dataMin * 0.9', 'dataMax * 1.1']}
              scale="linear"
            />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === '平均消费') return `$${value.toFixed(2)}`
                return value.toFixed(2)
              }}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="avgCost"
              stroke="#8884d8"
              strokeWidth={3}
              name="平均消费"
              dot={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avgClicks"
              stroke="#82ca9d"
              strokeWidth={3}
              name="平均点击量"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}