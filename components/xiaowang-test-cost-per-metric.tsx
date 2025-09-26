"use client"

import React, { useMemo, useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, ReferenceLine } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface XiaowangTestCostPerMetricProps {
  xiaowangTestData?: any
  brokerData?: any[]
  title?: string
  startDate?: string
  endDate?: string
  selectedMetric?: 'views' | 'likes' | 'followers' | 'leads'
  onMetricChange?: (metric: 'views' | 'likes' | 'followers' | 'leads') => void
  isFiltered?: boolean
  onFilterChange?: (filtered: boolean) => void
  notesData?: any[] // Notes data for vertical line display
  notesWeekdayCount?: {[key: string]: number} // Notes count by weekday
}

interface DailyData {
  date: string
  costPerView: number
  costPerLike: number
  costPerFollower: number
  costPerLead: number
  weekday?: string
}

type MetricType = 'costPerView' | 'costPerLike' | 'costPerFollower' | 'costPerLead'

// Process Xiaowang test data for cost per metrics
function processXiaowangTestCostData(xiaowangTestData: any, brokerData: any[]): DailyData[] {
  if (!xiaowangTestData?.dailyData || !Array.isArray(xiaowangTestData.dailyData)) {
    return []
  }

  // Create a map of leads by date from broker data
  const leadsPerDate: Record<string, number> = {}

  if (brokerData && brokerData.length > 0) {
    const uniqueClientsByDate: Record<string, Set<any>> = {}

    brokerData.forEach((item) => {
      const dateField = item.date || item['日期'] || item.Date || item.时间
      if (dateField && item.no !== null && item.no !== undefined) {
        let date: string

        if (typeof dateField === 'number') {
          const excelDate = new Date((dateField - 25569) * 86400 * 1000)
          date = excelDate.toISOString().split('T')[0]
        } else if (typeof dateField === 'string' && /^\d+$/.test(dateField)) {
          const excelSerialNumber = parseInt(dateField)
          const excelDate = new Date((excelSerialNumber - 25569) * 86400 * 1000)
          date = excelDate.toISOString().split('T')[0]
        } else if (dateField instanceof Date) {
          date = dateField.toISOString().split('T')[0]
        } else {
          date = String(dateField).split(' ')[0]
        }

        if (date && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          if (!uniqueClientsByDate[date]) {
            uniqueClientsByDate[date] = new Set()
          }
          uniqueClientsByDate[date].add(item.no)
        }
      }
    })

    Object.keys(uniqueClientsByDate).forEach(date => {
      leadsPerDate[date] = uniqueClientsByDate[date].size
    })
  }

  // Process Xiaowang test daily data and calculate cost per metrics
  const processedData = xiaowangTestData.dailyData.map((item: any) => {
    const views = item.clicks || 0 // Map clicks to views
    const likes = item.likes || 0
    const followers = item.followers || 0
    const leads = leadsPerDate[item.date] || 0
    const cost = item.cost || 0

    return {
      date: item.date,
      costPerView: views > 0 ? cost / views : 0,
      costPerLike: likes > 0 ? cost / likes : 0,
      costPerFollower: followers > 0 ? cost / followers : 0,
      costPerLead: leads > 0 ? cost / leads : 0,
      weekday: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })
    }
  })

  return processedData.sort((a, b) => {
    const dateA = typeof a.date === 'string' ? a.date : String(a.date);
    const dateB = typeof b.date === 'string' ? b.date : String(b.date);
    return dateA.localeCompare(dateB);
  })
}

// Process data grouped by weekday (for non-7-day ranges)
function processWeekdayData(data: DailyData[]): DailyData[] {
  const weekdayGroups: { [key: string]: { costPerView: number[], costPerLike: number[], costPerFollower: number[], costPerLead: number[] } } = {
    'Mon': { costPerView: [], costPerLike: [], costPerFollower: [], costPerLead: [] },
    'Tue': { costPerView: [], costPerLike: [], costPerFollower: [], costPerLead: [] },
    'Wed': { costPerView: [], costPerLike: [], costPerFollower: [], costPerLead: [] },
    'Thu': { costPerView: [], costPerLike: [], costPerFollower: [], costPerLead: [] },
    'Fri': { costPerView: [], costPerLike: [], costPerFollower: [], costPerLead: [] },
    'Sat': { costPerView: [], costPerLike: [], costPerFollower: [], costPerLead: [] },
    'Sun': { costPerView: [], costPerLike: [], costPerFollower: [], costPerLead: [] }
  }

  // Group data by weekday
  data.forEach(item => {
    const weekday = new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })
    if (weekdayGroups[weekday]) {
      if (item.costPerView > 0) weekdayGroups[weekday].costPerView.push(item.costPerView)
      if (item.costPerLike > 0) weekdayGroups[weekday].costPerLike.push(item.costPerLike)
      if (item.costPerFollower > 0) weekdayGroups[weekday].costPerFollower.push(item.costPerFollower)
      if (item.costPerLead > 0) weekdayGroups[weekday].costPerLead.push(item.costPerLead)
    }
  })

  // Calculate averages and create result
  const weekdayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return weekdayOrder.map(weekday => {
    const group = weekdayGroups[weekday]
    const avgCostPerView = group.costPerView.length > 0
      ? group.costPerView.reduce((a, b) => a + b, 0) / group.costPerView.length
      : 0
    const avgCostPerLike = group.costPerLike.length > 0
      ? group.costPerLike.reduce((a, b) => a + b, 0) / group.costPerLike.length
      : 0
    const avgCostPerFollower = group.costPerFollower.length > 0
      ? group.costPerFollower.reduce((a, b) => a + b, 0) / group.costPerFollower.length
      : 0
    const avgCostPerLead = group.costPerLead.length > 0
      ? group.costPerLead.reduce((a, b) => a + b, 0) / group.costPerLead.length
      : 0

    return {
      date: weekday,
      weekday: weekday,
      costPerView: Math.round(avgCostPerView * 1000) / 1000, // Round to 3 decimal places
      costPerLike: Math.round(avgCostPerLike * 1000) / 1000,
      costPerFollower: Math.round(avgCostPerFollower * 1000) / 1000,
      costPerLead: Math.round(avgCostPerLead * 1000) / 1000
    }
  }).filter(item => item.costPerView > 0 || item.costPerLike > 0 || item.costPerFollower > 0 || item.costPerLead > 0)
}

// Calculate nice axis domain and ticks for dynamic scaling
function calculateNiceScale(minValue: number, maxValue: number, targetTicks: number = 5) {
  const range = maxValue - minValue
  const padding = range * 0.1
  const paddedMin = Math.max(0, minValue - padding)
  const paddedMax = maxValue + padding

  const rawInterval = (paddedMax - paddedMin) / targetTicks
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawInterval)))
  const normalizedInterval = rawInterval / magnitude

  let niceInterval: number
  if (normalizedInterval <= 1) niceInterval = 1
  else if (normalizedInterval <= 2) niceInterval = 2
  else if (normalizedInterval <= 2.5) niceInterval = 2.5
  else if (normalizedInterval <= 5) niceInterval = 5
  else niceInterval = 10

  niceInterval *= magnitude

  const niceMin = Math.floor(paddedMin / niceInterval) * niceInterval
  const niceMax = Math.ceil(paddedMax / niceInterval) * niceInterval

  const ticks: number[] = []
  for (let tick = niceMin; tick <= niceMax; tick += niceInterval) {
    ticks.push(tick)
  }

  return {
    domain: [Math.max(0, niceMin), niceMax],
    ticks: ticks.filter(t => t >= 0),
    interval: niceInterval
  }
}

// Label components for cost metrics
const MetricLabel = (props: any) => {
  const { x, y, value, metricConfig } = props

  if (!value || value === 0) return null

  const text = value >= 100 ? `$${value.toFixed(0)}` : `$${value.toFixed(2)}`
  const width = 40
  const height = 16
  const labelY = y - height - 8

  return (
    <g>
      <rect
        x={x - width/2}
        y={labelY}
        width={width}
        height={height}
        fill={`${metricConfig?.color || '#3CBDE5'}CC`}
        stroke={metricConfig?.color || '#3CBDE5'}
        strokeWidth="1"
        rx="3"
      />
      <text
        x={x}
        y={labelY + height/2}
        fill="white"
        fontSize={10}
        fontWeight="bold"
        textAnchor="middle"
        dominantBaseline="central"
      >
        {text}
      </text>
    </g>
  )
}

export function XiaowangTestCostPerMetric({
  xiaowangTestData,
  brokerData = [],
  title = "Daily Cost Per Metric Analysis",
  startDate,
  endDate,
  selectedMetric: propSelectedMetric,
  onMetricChange,
  isFiltered: propIsFiltered,
  onFilterChange,
  notesData = [],
  notesWeekdayCount = {}
}: XiaowangTestCostPerMetricProps) {
  // Map external metric to internal metric type
  const mapToInternalMetric = (metric: 'views' | 'likes' | 'followers' | 'leads'): MetricType => {
    const mapping: Record<string, MetricType> = {
      'views': 'costPerView',
      'likes': 'costPerLike',
      'followers': 'costPerFollower',
      'leads': 'costPerLead'
    }
    return mapping[metric] || 'costPerView'
  }

  const mapToExternalMetric = (metric: MetricType): 'views' | 'likes' | 'followers' | 'leads' => {
    const mapping: Record<MetricType, 'views' | 'likes' | 'followers' | 'leads'> = {
      'costPerView': 'views',
      'costPerLike': 'likes',
      'costPerFollower': 'followers',
      'costPerLead': 'leads'
    }
    return mapping[metric] || 'views'
  }

  const [selectedMetric, setSelectedMetric] = useState<MetricType>(
    propSelectedMetric ? mapToInternalMetric(propSelectedMetric) : 'costPerView'
  )
  const isFiltered = propIsFiltered !== undefined ? propIsFiltered : true

  // Sync with prop changes
  useEffect(() => {
    if (propSelectedMetric) {
      setSelectedMetric(mapToInternalMetric(propSelectedMetric))
    }
  }, [propSelectedMetric])

  // Handle metric change
  const handleMetricChange = (metric: MetricType) => {
    setSelectedMetric(metric)
    onMetricChange?.(mapToExternalMetric(metric))
  }

  // Get current metric config
  const metricConfig = useMemo(() => {
    switch (selectedMetric) {
      case 'costPerLike':
        return {
          dataKey: 'costPerLike',
          name: 'Cost Per Like',
          color: '#EF3C99',
          label: 'Cost Per Like',
          yAxisLabel: 'Cost Per Like ($)'
        }
      case 'costPerFollower':
        return {
          dataKey: 'costPerFollower',
          name: 'Cost Per Follower',
          color: '#10B981',
          label: 'Cost Per Follower',
          yAxisLabel: 'Cost Per Follower ($)'
        }
      case 'costPerLead':
        return {
          dataKey: 'costPerLead',
          name: 'Cost Per Lead',
          color: '#F59E0B',
          label: 'Cost Per Lead',
          yAxisLabel: 'Cost Per Lead ($)'
        }
      default: // costPerView
        return {
          dataKey: 'costPerView',
          name: 'Cost Per View',
          color: '#3CBDE5',
          label: 'Cost Per View',
          yAxisLabel: 'Cost Per View ($)'
        }
    }
  }, [selectedMetric])

  // Check if the date range is exactly 7 days
  const isSevenDayRange = useMemo(() => {
    if (!startDate || !endDate) return false
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays === 6 // 6 days difference means 7 days total (inclusive)
  }, [startDate, endDate])

  // Process the filtered data (based on time filters)
  const filteredDailyData = useMemo(() => {
    if (!xiaowangTestData?.rawData) return []

    // Filter the raw data by date range first
    let filteredRawData = xiaowangTestData.rawData
    if (startDate && endDate) {
      filteredRawData = xiaowangTestData.rawData.filter((item: any) => {
        return item.date >= startDate && item.date <= endDate
      })
    }

    // Create filtered xiaowangTestData structure
    const filteredDataStructure = {
      ...xiaowangTestData,
      dailyData: filteredRawData
    }

    return processXiaowangTestCostData(filteredDataStructure, brokerData)
  }, [xiaowangTestData, brokerData, startDate, endDate])

  // Process ALL data (ignoring time filters) - for "All Data" mode
  const allDailyData = useMemo(() => {
    if (!xiaowangTestData?.rawData) {
      return filteredDailyData
    }

    // Create all data structure with rawData as dailyData to get all records
    const allDataStructure = {
      ...xiaowangTestData,
      dailyData: xiaowangTestData.rawData // Use rawData which contains all records
    }

    return processXiaowangTestCostData(allDataStructure, brokerData)
  }, [xiaowangTestData, brokerData, filteredDailyData])

  // Use filtered or all data based on toggle state
  const activeData = useMemo(() => {
    return isFiltered ? filteredDailyData : allDailyData
  }, [filteredDailyData, allDailyData, isFiltered])

  const chartData = useMemo(() => {
    if (!activeData || activeData.length === 0) return []

    // If it's a 7-day range and filtered, show daily data; otherwise group by weekday
    if (isSevenDayRange && isFiltered) {
      return activeData
    } else {
      // Always group by weekday when not filtered or when not 7-day range
      return processWeekdayData(activeData)
    }
  }, [activeData, isSevenDayRange, isFiltered])


  // Calculate dynamic scales
  const metricScale = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return { domain: [0, 10], ticks: [0, 2.5, 5, 7.5, 10] }
    }

    const metricValues = chartData.map(d => d[metricConfig.dataKey]).filter(v => v > 0)
    const minMetric = metricValues.length > 0 ? Math.min(...metricValues) : 0
    const maxMetric = metricValues.length > 0 ? Math.max(...metricValues) : 10

    return calculateNiceScale(minMetric, maxMetric, 5)
  }, [chartData, metricConfig.dataKey])

  // Calculate average for reference line as SUM(Cost)/SUM(Metric)
  const average = useMemo(() => {
    // Determine which data to use based on filter state
    let sourceData = []
    if (isFiltered && xiaowangTestData?.dailyData && startDate && endDate) {
      // Use filtered dailyData
      sourceData = xiaowangTestData.dailyData.filter((item: any) => {
        return item.date >= startDate && item.date <= endDate
      })
    } else if (xiaowangTestData?.dailyData) {
      // Use all dailyData
      sourceData = xiaowangTestData.dailyData
    }

    if (!sourceData || sourceData.length === 0) return 0

    const totalCost = sourceData.reduce((sum, item) => sum + item.cost, 0)
    let totalMetric = 0

    switch (selectedMetric) {
      case 'costPerView':
        totalMetric = sourceData.reduce((sum, item) => sum + item.clicks, 0)
        break
      case 'costPerLike':
        totalMetric = sourceData.reduce((sum, item) => sum + item.likes, 0)
        break
      case 'costPerFollower':
        totalMetric = sourceData.reduce((sum, item) => sum + item.followers, 0)
        break
      case 'costPerLead':
        // For leads, we need to calculate from brokerData
        const leadsPerDate: Record<string, number> = {}
        if (brokerData && brokerData.length > 0) {
          const uniqueClientsByDate: Record<string, Set<any>> = {}
          brokerData.forEach((item) => {
            const dateField = item.date || item['日期'] || item.Date || item.时间
            if (dateField && item.no !== null && item.no !== undefined) {
              let date: string
              if (typeof dateField === 'number') {
                const excelDate = new Date((dateField - 25569) * 86400 * 1000)
                date = excelDate.toISOString().split('T')[0]
              } else if (typeof dateField === 'string' && /^\d+$/.test(dateField)) {
                const excelSerialNumber = parseInt(dateField)
                const excelDate = new Date((excelSerialNumber - 25569) * 86400 * 1000)
                date = excelDate.toISOString().split('T')[0]
              } else if (dateField instanceof Date) {
                date = dateField.toISOString().split('T')[0]
              } else {
                date = String(dateField).split(' ')[0]
              }
              if (date && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                if (!uniqueClientsByDate[date]) {
                  uniqueClientsByDate[date] = new Set()
                }
                uniqueClientsByDate[date].add(item.no)
              }
            }
          })
          Object.keys(uniqueClientsByDate).forEach(date => {
            leadsPerDate[date] = uniqueClientsByDate[date].size
          })
        }
        totalMetric = sourceData.reduce((sum, item) => sum + (leadsPerDate[item.date] || 0), 0)
        break
      default:
        totalMetric = 0
    }

    return totalMetric > 0 ? totalCost / totalMetric : 0
  }, [xiaowangTestData, brokerData, selectedMetric, isFiltered, startDate, endDate])

  // Format date display
  const formatDate = (dateStr: string) => {
    if (isSevenDayRange && isFiltered) {
      const date = new Date(dateStr)
      const weekday = date.toLocaleDateString('en-US', { weekday: 'short' })
      const monthDay = date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
      return `${weekday} ${monthDay}`
    }
    return dateStr
  }

  // Get posts for a specific date when in 7-day filtered mode
  const getPostsForDate = (date: string) => {
    if (!isSevenDayRange || !isFiltered || !notesData || notesData.length === 0) {
      return []
    }

    return notesData.filter(note => {
      if (!note.发布时间) return false
      const noteDate = note.发布时间.split(' ')[0] // Extract date part
      return noteDate === date
    })
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = chartData.find(d => d.date === label)

      if (dataPoint) {
        let formattedDate: string

        if (isSevenDayRange && isFiltered) {
          formattedDate = new Date(label).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
        } else {
          formattedDate = `${label} (Average)`
        }

        // Get posts for this date when in 7-day filtered mode
        const postsForDate = getPostsForDate(label)

        return (
          <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-4 shadow-xl min-w-[240px] max-w-[400px]">
            <p className="font-bold text-gray-900 mb-3 border-b pb-2">{formattedDate}</p>

            {/* Selected Metric Section */}
            <div className="mb-2">
              <p className="text-sm font-semibold mb-1" style={{ color: metricConfig.color }}>
                💰 {metricConfig.label}
              </p>
              <p className="text-sm text-gray-700">${dataPoint[metricConfig.dataKey].toFixed(3)}</p>
            </div>

            {/* Posts Section - Show only if there are posts for this date */}
            {postsForDate.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-semibold mb-2 text-purple-700">
                  📝 Posts ({postsForDate.length})
                </p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {postsForDate.map((post, index) => (
                    <div key={index} className="text-xs p-2 bg-purple-50 rounded border-l-2 border-purple-300">
                      <div className="font-medium text-purple-800 line-clamp-2">{post.名称}</div>
                      <div className="text-purple-600 text-xs mt-1">{post.类型}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      }
    }
    return null
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 mb-6 font-montserrat">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-gray-500">
            No data available for the selected time period
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle className="text-xl font-semibold text-gray-900 mb-6 font-montserrat">
              Daily {metricConfig.label} Trend {(!isSevenDayRange || !isFiltered) && "(Weekday Averages)"}
            </CardTitle>
          </div>

          <div className="flex items-center gap-4">
            {/* Metric Selection Buttons - Same order as LifeCar */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Cost per:</span>
              <Button
                variant={selectedMetric === 'costPerView' ? "default" : "outline"}
                size="sm"
                onClick={() => handleMetricChange('costPerView')}
                className={selectedMetric === 'costPerView'
                  ? 'bg-[#3CBDE5] hover:bg-[#2563EB] text-white border-0'
                  : 'border-[#3CBDE5] text-[#3CBDE5] hover:bg-[#3CBDE5] hover:text-white'
                }
              >
                View
              </Button>
              <Button
                variant={selectedMetric === 'costPerLike' ? "default" : "outline"}
                size="sm"
                onClick={() => handleMetricChange('costPerLike')}
                className={selectedMetric === 'costPerLike'
                  ? 'bg-[#EF3C99] hover:bg-[#E91E63] text-white border-0'
                  : 'border-[#EF3C99] text-[#EF3C99] hover:bg-[#EF3C99] hover:text-white'
                }
              >
                Like
              </Button>
              <Button
                variant={selectedMetric === 'costPerFollower' ? "default" : "outline"}
                size="sm"
                onClick={() => handleMetricChange('costPerFollower')}
                className={selectedMetric === 'costPerFollower'
                  ? 'bg-[#10B981] hover:bg-[#059669] text-white border-0'
                  : 'border-[#10B981] text-[#10B981] hover:bg-[#10B981] hover:text-white'
                }
              >
                Follower
              </Button>
              <Button
                variant={selectedMetric === 'costPerLead' ? "default" : "outline"}
                size="sm"
                onClick={() => handleMetricChange('costPerLead')}
                className={selectedMetric === 'costPerLead'
                  ? 'bg-[#F59E0B] hover:bg-[#D97706] text-white border-0'
                  : 'border-[#F59E0B] text-[#F59E0B] hover:bg-[#F59E0B] hover:text-white'
                }
              >
                Lead
              </Button>
            </div>

            {/* Filter Toggle Button */}
            <Button
              variant={isFiltered ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange?.(!isFiltered)}
              className={isFiltered
                ? 'bg-gradient-to-r from-[#751FAE] to-[#8B5CF6] hover:from-[#6B1F9A] hover:to-[#7C3AED] text-white border-0'
                : 'border-[#751FAE] text-[#751FAE] hover:bg-[#751FAE] hover:text-white'
              }
            >
              {isFiltered ? 'Filtered' : 'All Data'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 40, right: 80, left: 40, bottom: 60 }}
            >
              <XAxis
                dataKey="date"
                tick={(props: any) => {
                  const { x, y, payload } = props
                  const dateStr = payload.value

                  // Show Posts count when: (non-7-day range) OR (using "All data" mode in chart)
                  if (!isSevenDayRange || !isFiltered) {
                    const postsCount = notesWeekdayCount && notesWeekdayCount[dateStr] ? notesWeekdayCount[dateStr] : 0
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text x={0} y={0} dy={16} textAnchor="middle" fill="#6B7280" fontSize="12">
                          {dateStr}
                        </text>
                        <text x={0} y={0} dy={32} textAnchor="middle" fill="#6B7280" fontSize="11">
                          {postsCount} Posts
                        </text>
                      </g>
                    )
                  } else {
                    // For 7-day range, just show the formatted date
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text x={0} y={0} dy={16} textAnchor="middle" fill="#6B7280" fontSize="12">
                          {formatDate(dateStr)}
                        </text>
                      </g>
                    )
                  }
                }}
                height={60}
                scale="point"
                padding={{ left: 30, right: 30 }}
              />

              {/* Y-axis - Cost Per Metric */}
              <YAxis
                domain={metricScale.domain}
                ticks={metricScale.ticks}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickFormatter={(value) => {
                  if (value >= 1000) return `$${(value/1000).toFixed(1)}K`
                  return `$${value.toFixed(2)}`
                }}
                label={{ value: metricConfig.yAxisLabel, angle: -90, position: 'insideLeft' }}
              />

              <Tooltip content={<CustomTooltip />} />
              <Legend />


              {/* Average Reference Line */}
              {average > 0 && (
                <ReferenceLine
                  y={average}
                  stroke={`${metricConfig.color}80`}
                  strokeWidth={2}
                  strokeDasharray="8 8"
                />
              )}

              {/* Main Cost Per Metric Line */}
              <Line
                type="monotone"
                dataKey={metricConfig.dataKey}
                stroke={metricConfig.color}
                strokeWidth={3}
                dot={(props: any) => {
                  // Check if there are posts for this date when showing 7-day range
                  const hasNotesForDate = isSevenDayRange && isFiltered && props.payload && notesData.length > 0 &&
                    notesData.some(note => {
                      if (!note.发布时间) return false
                      const noteDate = note.发布时间.split(' ')[0] // Extract date part
                      return noteDate === props.payload.date
                    })

                  return (
                    <g>
                      {/* Normal dot */}
                      <circle
                        cx={props.cx}
                        cy={props.cy}
                        r={4}
                        fill={metricConfig.color}
                        strokeWidth={2}
                      />
                      {/* Vertical line for dates with notes (only in 7-day view) */}
                      {hasNotesForDate && (
                        <line
                          x1={props.cx}
                          y1={30}
                          x2={props.cx}
                          y2={280}
                          stroke="#6B7280"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          opacity={0.8}
                        />
                      )}
                    </g>
                  )
                }}
                name={`${metricConfig.name} (Avg: $${average.toFixed(2)})`}
                connectNulls={false}
              />

              {/* Labels for metrics */}
              <Line
                type="monotone"
                dataKey={metricConfig.dataKey}
                stroke="transparent"
                dot={false}
                connectNulls={false}
                legendType="none"
              >
                <LabelList content={(props) => <MetricLabel {...props} metricConfig={metricConfig} />} position="top" />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}