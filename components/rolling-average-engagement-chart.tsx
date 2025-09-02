"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { parseLifeCarData } from "@/lib/lifecar-data-processor"

interface ChartData {
  date: string
  avgCost: number
  avgEngagement: number
  avgConversion: number
}

interface RollingAverageEngagementChartProps {
  csvContent?: string // Optional CSV content passed from parent
}

export function RollingAverageEngagementChart({ csvContent }: RollingAverageEngagementChartProps) {
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
          
          // 计算窗口内的总和（rolling sum）
          const totalCost = window.reduce((sum, item) => 
            sum + item.spend, 0)
          
          const totalEngagement = window.reduce((sum, item) => 
            sum + item.interactions, 0)
          
          // 转化 = SUM（多转化人数（添加企微+私信咨询）+多转化人数（添加企微成功+私信留资））
          const totalConversion = window.reduce((sum, item) => 
            sum + item.multiConversion1 + item.multiConversion2, 0)
          
          // 计算滚动平均值（rolling average of sum）
          const avgCost = totalCost / 7
          const avgEngagement = totalEngagement / 7
          const avgConversion = totalConversion / 7
          
          // 格式化日期 - 使用当前日期作为标签
          const date = new Date(sortedData[i].date)
          const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`
          
          rollingAvgData.push({
            date: formattedDate,
            avgCost: Math.round(avgCost * 100) / 100,
            avgEngagement: Math.round(avgEngagement * 100) / 100,
            avgConversion: Math.round(avgConversion * 100) / 100
          })
        }
        
        setChartData(rollingAvgData)
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>7-Day Rolling Average - Followers & Conversions</CardTitle>
        <CardDescription>
          消费、互动和转化的7天滚动平均趋势（不受时间筛选影响）
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
              label={{ value: '7天rolling avg消费 ($)', angle: -90, position: 'insideLeft' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              className="text-xs"
              label={{ value: '7天rolling avg互动/转化', angle: 90, position: 'insideRight' }}
              domain={[0, 45]}
            />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === '7天rolling avg消费') return `$${value.toFixed(2)}`
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
              name="7天rolling avg消费"
              dot={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avgEngagement"
              stroke="#FFA500"
              strokeWidth={3}
              name="7天rolling avg互动"
              dot={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avgConversion"
              stroke="#FF69B4"
              strokeWidth={3}
              name="7天rolling avg转化"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}