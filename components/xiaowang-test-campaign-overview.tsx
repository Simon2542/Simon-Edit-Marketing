"use client"

import React, { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface XiaowangTestCampaignOverviewProps {
  xiaowangTestData?: any
  brokerData?: any[]
  startDate?: string
  endDate?: string
}

interface DailyMetrics {
  date: string
  displayDate: string
  cost: number
  views: number
  likes: number
  followers: number
  leads: number
}

function processDataForCampaignOverview(
  xiaowangTestData: any,
  brokerData: any[],
  startDate?: string,
  endDate?: string
): DailyMetrics[] {
  if (!xiaowangTestData?.dailyData || !Array.isArray(xiaowangTestData.dailyData)) {
    return []
  }

  // Create a map of leads by date from broker data
  const leadsPerDate: Record<string, number> = {}

  if (brokerData && Array.isArray(brokerData)) {
    brokerData.forEach(item => {
      if (!item || typeof item !== 'object') return

      let dateValue: string | null = null

      // Try different date field names
      const dateFields = ['Date', 'date', '时间', 'Date ', 'date ']
      for (const field of dateFields) {
        if (item[field] !== undefined && item[field] !== null && item[field] !== '') {
          if (typeof item[field] === 'number') {
            // Excel serial number conversion
            const excelDate = new Date((item[field] - 25569) * 86400 * 1000)
            if (!isNaN(excelDate.getTime())) {
              dateValue = excelDate.toISOString().split('T')[0]
              break
            }
          } else if (typeof item[field] === 'string') {
            // Try to parse string date
            const parsedDate = new Date(item[field])
            if (!isNaN(parsedDate.getTime())) {
              dateValue = parsedDate.toISOString().split('T')[0]
              break
            }
          }
        }
      }

      if (dateValue) {
        leadsPerDate[dateValue] = (leadsPerDate[dateValue] || 0) + 1
      }
    })
  }

  // Filter and process daily data
  let filteredData = xiaowangTestData.dailyData

  if (startDate && endDate) {
    filteredData = xiaowangTestData.dailyData.filter((item: any) => {
      const itemDate = item.date
      return itemDate >= startDate && itemDate <= endDate
    })
  }

  return filteredData.map((item: any) => {
    const date = new Date(item.date)
    const displayDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })

    return {
      date: item.date,
      displayDate,
      cost: item.cost || 0,
      views: (item.clicks || 0) / 50,  // Divide views by 50 for better scale
      likes: item.likes || 0,
      followers: item.followers || 0,
      leads: leadsPerDate[item.date] || 0
    }
  }).sort((a, b) => {
    const dateA = typeof a.date === 'string' ? a.date : String(a.date);
    const dateB = typeof b.date === 'string' ? b.date : String(b.date);
    return dateA.localeCompare(dateB);
  })
}

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => {
          // Show actual values for views (multiply back by 50)
          const displayValue = entry.dataKey === 'views'
            ? (entry.value * 50).toLocaleString()
            : entry.value.toLocaleString()

          const displayName = entry.dataKey === 'views' ? 'Views' : entry.name

          return (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${displayName}: ${displayValue}`}
            </p>
          )
        })}
      </div>
    )
  }
  return null
}

export function XiaowangTestCampaignOverview({
  xiaowangTestData,
  brokerData = [],
  startDate,
  endDate
}: XiaowangTestCampaignOverviewProps) {
  // State for line visibility
  const [visibleLines, setVisibleLines] = useState({
    cost: true,
    views: true,
    likes: true,
    followers: true,
    leads: true
  })

  // Toggle line visibility
  const toggleLine = (lineKey: keyof typeof visibleLines) => {
    setVisibleLines(prev => ({
      ...prev,
      [lineKey]: !prev[lineKey]
    }))
  }

  // Process data for the chart
  const chartData = useMemo(() => {
    return processDataForCampaignOverview(xiaowangTestData, brokerData, startDate, endDate)
  }, [xiaowangTestData, brokerData, startDate, endDate])

  // Calculate Y-axis domains for dual axis
  const { leftAxisDomain, rightAxisDomain } = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return {
        leftAxisDomain: [0, 100],
        rightAxisDomain: [0, 100]
      }
    }

    // Left axis: Cost
    const costValues = chartData.map(d => d.cost).filter(v => v > 0)
    const maxCost = costValues.length > 0 ? Math.max(...costValues) : 1
    const leftMax = Math.ceil(maxCost * 1.1)

    // Right axis: Views, Likes, Followers, Leads
    const rightValues = chartData.flatMap(d => [d.views, d.likes, d.followers, d.leads])
    const maxRight = Math.max(...rightValues, 1)
    const rightMax = Math.ceil(maxRight * 1.1)

    return {
      leftAxisDomain: [0, leftMax],
      rightAxisDomain: [0, rightMax]
    }
  }, [chartData])

  if (!chartData || chartData.length === 0) {
    return (
      <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 font-montserrat">
            Daily Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center text-gray-500">
            No data available for the selected period
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-gray-900 font-montserrat">
              Daily Performance Metrics
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Tracking Cost, Views, Likes, Followers, and Leads over time
            </p>
          </div>

          {/* Line Toggle Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={visibleLines.cost ? "default" : "outline"}
              size="sm"
              onClick={() => toggleLine('cost')}
              className={`text-xs ${
                visibleLines.cost
                  ? 'bg-[#751FAE] hover:bg-[#6919A6] text-white border-0'
                  : 'border-[#751FAE] text-[#751FAE] hover:bg-[#751FAE] hover:text-white bg-white'
              }`}
            >
              Cost
            </Button>
            <Button
              variant={visibleLines.views ? "default" : "outline"}
              size="sm"
              onClick={() => toggleLine('views')}
              className={`text-xs ${
                visibleLines.views
                  ? 'bg-[#3CBDE5] hover:bg-[#2563EB] text-white border-0'
                  : 'border-[#3CBDE5] text-[#3CBDE5] hover:bg-[#3CBDE5] hover:text-white bg-white'
              }`}
            >
              Views
            </Button>
            <Button
              variant={visibleLines.likes ? "default" : "outline"}
              size="sm"
              onClick={() => toggleLine('likes')}
              className={`text-xs ${
                visibleLines.likes
                  ? 'bg-[#EF3C99] hover:bg-[#E91E63] text-white border-0'
                  : 'border-[#EF3C99] text-[#EF3C99] hover:bg-[#EF3C99] hover:text-white bg-white'
              }`}
            >
              Likes
            </Button>
            <Button
              variant={visibleLines.followers ? "default" : "outline"}
              size="sm"
              onClick={() => toggleLine('followers')}
              className={`text-xs ${
                visibleLines.followers
                  ? 'bg-[#10B981] hover:bg-[#059669] text-white border-0'
                  : 'border-[#10B981] text-[#10B981] hover:bg-[#10B981] hover:text-white bg-white'
              }`}
            >
              Followers
            </Button>
            <Button
              variant={visibleLines.leads ? "default" : "outline"}
              size="sm"
              onClick={() => toggleLine('leads')}
              className={`text-xs ${
                visibleLines.leads
                  ? 'bg-[#F59E0B] hover:bg-[#D97706] text-white border-0'
                  : 'border-[#F59E0B] text-[#F59E0B] hover:bg-[#F59E0B] hover:text-white bg-white'
              }`}
            >
              Leads
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
            >
              <XAxis
                dataKey="displayDate"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 11 }}
                interval={Math.floor(chartData.length / 20)}
              />
              {/* Left Y-axis for Cost */}
              <YAxis
                yAxisId="left"
                domain={leftAxisDomain}
                tick={{ fontSize: 11 }}
                label={{
                  value: 'Cost ($)',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 12 }
                }}
              />
              {/* Right Y-axis for Views, Likes, Followers, Leads */}
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={rightAxisDomain}
                tick={{ fontSize: 11 }}
                label={{
                  value: 'Metrics Count',
                  angle: 90,
                  position: 'insideRight',
                  style: { fontSize: 12 }
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />

              {/* Cost Line - Left Y-axis */}
              {visibleLines.cost && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="cost"
                  name="Cost ($)"
                  stroke="#751FAE"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              )}

              {/* Views Line - Right Y-axis */}
              {visibleLines.views && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="views"
                  name="Views (÷50)"
                  stroke="#3CBDE5"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              )}

              {/* Likes Line - Right Y-axis */}
              {visibleLines.likes && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="likes"
                  name="Likes"
                  stroke="#EF3C99"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              )}

              {/* Followers Line - Right Y-axis */}
              {visibleLines.followers && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="followers"
                  name="Followers"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              )}

              {/* Leads Line - Right Y-axis */}
              {visibleLines.leads && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="leads"
                  name="Leads"
                  stroke="#F59E0B"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}