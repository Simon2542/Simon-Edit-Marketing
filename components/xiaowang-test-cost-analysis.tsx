"use client"

import React, { useMemo, useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, ReferenceLine } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface XiaowangTestCostAnalysisProps {
  xiaowangTestData?: any
  brokerData?: any[]
  title?: string
  startDate?: string
  endDate?: string
  selectedMetric?: MetricType
  onMetricChange?: (metric: MetricType) => void
  isFiltered?: boolean
  onFilterChange?: (filtered: boolean) => void
}

interface DailyData {
  date: string
  views: number
  likes: number
  followers: number
  leads: number
  cost: number
  weekday?: string
}

type MetricType = 'views' | 'likes' | 'followers' | 'leads'

// Process Xiaowang test data combined with consultation leads data
function processXiaowangTestData(xiaowangTestData: any, brokerData: any[]): DailyData[] {
  console.log('XiaowangTestCostAnalysis - 接收到的数据:', {
    xiaowangTestData,
    dailyData: xiaowangTestData?.dailyData,
    brokerDataLength: brokerData?.length || 0
  });

  if (!xiaowangTestData?.dailyData || !Array.isArray(xiaowangTestData.dailyData)) {
    console.log('XiaowangTestCostAnalysis - 没有找到dailyData，返回空数组');
    return []
  }

  // Create a map of leads by date from broker data
  const leadsPerDate: Record<string, number> = {}

  // Debug logging
  console.log('Processing broker data for leads:', {
    brokerDataLength: brokerData?.length || 0,
    sampleData: brokerData?.slice(0, 3) || [],
    allDateFields: brokerData?.slice(0, 5).map(item => ({
      date: item.date,
      Date: item.Date,
      时间: item.时间,
      'Date ': item['Date '],
      'date ': item['date '],
      no: item.no,
      allKeys: Object.keys(item)
    })) || []
  })

  if (brokerData && brokerData.length > 0) {
    // Count unique clients by their 'no' field for each date
    const uniqueClientsByDate: Record<string, Set<any>> = {}

    brokerData.forEach((item, index) => {
      // Debug logging for individual items
      if (index < 3) {
        console.log(`Processing broker item ${index}:`, {
          fullItem: item,
          no: item.no,
          date: item.date,
          '日期': item['日期'],
          Date: item.Date,
          时间: item.时间
        })
      }

      // Check different possible date field names (broker data maps '日期' to 'date' field)
      const dateField = item.date || item['日期'] || item.Date || item.时间 || item['Date '] || item['date ']

      console.log(`Item ${index}: dateField=${dateField}, no=${item.no}, hasDateField=${!!dateField}, hasNo=${item.no !== null && item.no !== undefined}`)

      if (dateField && item.no !== null && item.no !== undefined) {
        let date: string

        // Handle different date formats
        if (typeof dateField === 'string') {
          // Check if it's an Excel serial number (all digits)
          if (/^\d+$/.test(dateField)) {
            // Convert Excel serial number to Date
            const excelSerialNumber = parseInt(dateField)
            const excelDate = new Date((excelSerialNumber - 25569) * 86400 * 1000) // Excel epoch adjustment
            date = excelDate.toISOString().split('T')[0]
          } else {
            // If it's a string, extract date part (remove time if present)
            date = dateField.split(' ')[0]
          }
        } else if (dateField instanceof Date) {
          // If it's a Date object, convert to YYYY-MM-DD format
          date = dateField.toISOString().split('T')[0]
        } else if (typeof dateField === 'number') {
          // Handle Excel serial number as number
          const excelDate = new Date((dateField - 25569) * 86400 * 1000) // Excel epoch adjustment
          date = excelDate.toISOString().split('T')[0]
        } else {
          // If it's some other format, check if it's a numeric string (Excel serial)
          const stringValue = String(dateField)
          if (/^\d+$/.test(stringValue)) {
            const excelSerialNumber = parseInt(stringValue)
            const excelDate = new Date((excelSerialNumber - 25569) * 86400 * 1000)
            date = excelDate.toISOString().split('T')[0]
          } else {
            date = stringValue.split(' ')[0]
          }
        }

        console.log(`Processing date: original=${dateField}, processed=${date}`)

        // Ensure we have a valid date format (YYYY-MM-DD)
        if (date && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          if (!uniqueClientsByDate[date]) {
            uniqueClientsByDate[date] = new Set()
          }
          uniqueClientsByDate[date].add(item.no)
          console.log(`Added client ${item.no} to date ${date}`)
        } else {
          console.log(`Invalid date format: ${date}`)
        }
      } else {
        console.log(`Skipping item ${index}: dateField=${!!dateField}, no=${item.no}`)
      }
    })

    // Convert sets to counts
    Object.keys(uniqueClientsByDate).forEach(date => {
      leadsPerDate[date] = uniqueClientsByDate[date].size
    })

    console.log('Processed leads per date:', leadsPerDate)
  }

  // Process Xiaowang test daily data
  const processedData = xiaowangTestData.dailyData.map((item: any) => ({
    date: item.date,
    views: item.clicks || 0, // Map clicks to views
    likes: item.likes || 0,
    followers: item.followers || 0,
    leads: leadsPerDate[item.date] || 0, // Get leads count for this date
    cost: item.cost || 0,
    weekday: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })
  }))

  return processedData.sort((a, b) => a.date.localeCompare(b.date))
}

// Process data grouped by weekday (for non-7-day ranges)
function processWeekdayData(data: DailyData[]): DailyData[] {
  const weekdayGroups: { [key: string]: { views: number[], likes: number[], followers: number[], leads: number[], costs: number[] } } = {
    'Mon': { views: [], likes: [], followers: [], leads: [], costs: [] },
    'Tue': { views: [], likes: [], followers: [], leads: [], costs: [] },
    'Wed': { views: [], likes: [], followers: [], leads: [], costs: [] },
    'Thu': { views: [], likes: [], followers: [], leads: [], costs: [] },
    'Fri': { views: [], likes: [], followers: [], leads: [], costs: [] },
    'Sat': { views: [], likes: [], followers: [], leads: [], costs: [] },
    'Sun': { views: [], likes: [], followers: [], leads: [], costs: [] }
  }

  // Group data by weekday
  data.forEach(item => {
    const weekday = new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })
    if (weekdayGroups[weekday]) {
      weekdayGroups[weekday].views.push(item.views)
      weekdayGroups[weekday].likes.push(item.likes)
      weekdayGroups[weekday].followers.push(item.followers)
      weekdayGroups[weekday].leads.push(item.leads)
      weekdayGroups[weekday].costs.push(item.cost)
    }
  })

  // Calculate averages and create result
  const weekdayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return weekdayOrder.map(weekday => {
    const group = weekdayGroups[weekday]
    const avgViews = group.views.length > 0
      ? group.views.reduce((a, b) => a + b, 0) / group.views.length
      : 0
    const avgLikes = group.likes.length > 0
      ? group.likes.reduce((a, b) => a + b, 0) / group.likes.length
      : 0
    const avgFollowers = group.followers.length > 0
      ? group.followers.reduce((a, b) => a + b, 0) / group.followers.length
      : 0
    const avgLeads = group.leads.length > 0
      ? group.leads.reduce((a, b) => a + b, 0) / group.leads.length
      : 0
    const avgCost = group.costs.length > 0
      ? group.costs.reduce((a, b) => a + b, 0) / group.costs.length
      : 0

    return {
      date: weekday,
      weekday: weekday,
      views: Math.round(avgViews * 100) / 100, // Round to 2 decimal places
      likes: Math.round(avgLikes * 100) / 100, // Round to 2 decimal places
      followers: Math.round(avgFollowers * 100) / 100, // Round to 2 decimal places
      leads: Math.round(avgLeads * 100) / 100, // Round to 2 decimal places
      cost: Math.round(avgCost * 100) / 100 // Round to 2 decimal places
    }
  }).filter(item => item.views > 0 || item.likes > 0 || item.followers > 0 || item.leads > 0 || item.cost > 0)
}

// Smart number formatting - shows decimals only when needed
function formatSmartDecimal(value: number): string {
  if (value % 1 === 0) {
    // It's a whole number, don't show decimals
    return value.toFixed(0)
  } else {
    // It has decimals, show up to 2 decimal places
    return value.toFixed(2)
  }
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

// Intelligent label component with LifeCar's smart positioning logic
const IntelligentLabel = (props: any) => {
  const { x, y, value, index, data, dataKey, payload, metricScale, costScale, selectedMetric, metricConfig } = props

  if (!value || value === 0) return null

  // Get current data point values
  const currentData = payload || data?.[index]
  if (!currentData || !metricScale || !costScale) {
    // Fallback to simple positioning if we don't have the necessary data
    const displayValue = dataKey === 'cost'
      ? `$${value >= 1000 ? `${(value/1000).toFixed(1)}K` : value.toFixed(0)}`
      : (value >= 1000 ? `${formatSmartDecimal(value/1000)}K` : formatSmartDecimal(value))
    const width = dataKey === 'cost' ? 36 : 30
    const height = 14
    const labelY = dataKey === 'cost' ? y + 8 : y - height - 8
    const labelColor = dataKey === 'cost' ? '#751FAE' : (metricConfig?.color || '#3CBDE5')

    return (
      <g>
        <rect
          x={x - width/2}
          y={labelY}
          width={width}
          height={height}
          fill={`${labelColor}CC`}
          stroke={labelColor}
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
          {displayValue}
        </text>
      </g>
    )
  }

  // LifeCar's intelligent positioning logic
  const metricValue = currentData[selectedMetric] || 0
  const costValue = currentData.cost || 0

  // Calculate ratios relative to their maximum scales
  const metricRatio = metricValue / metricScale.domain[1]
  const costRatio = costValue / costScale.domain[1]

  // Smart positioning based on which line is higher
  const baseOffset = 15
  const staggerOffset = (index % 3) * 6 // Stagger every 3 points
  const yOffset = baseOffset + staggerOffset

  let labelY
  if (dataKey === 'cost') {
    // For cost labels
    if (costRatio > metricRatio) {
      // Cost line is higher, place cost label above
      labelY = y - yOffset - 14
    } else {
      // Metric line is higher, place cost label below
      labelY = y + yOffset
    }
  } else {
    // For metric labels
    if (metricRatio > costRatio) {
      // Metric line is higher, place metric label above
      labelY = y - yOffset - 14
    } else {
      // Cost line is higher, place metric label below
      labelY = y + yOffset
    }
  }

  const displayValue = dataKey === 'cost'
    ? `$${value >= 1000 ? `${(value/1000).toFixed(1)}K` : value.toFixed(0)}`
    : (value >= 1000 ? `${formatSmartDecimal(value/1000)}K` : formatSmartDecimal(value))
  const width = dataKey === 'cost' ? 36 : 30
  const height = 14
  const labelColor = dataKey === 'cost' ? '#751FAE' : (metricConfig?.color || '#3CBDE5')

  return (
    <g>
      <rect
        x={x - width/2}
        y={labelY}
        width={width}
        height={height}
        fill={`${labelColor}CC`}
        stroke={labelColor}
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
        {displayValue}
      </text>
    </g>
  )
}

export function XiaowangTestCostAnalysis({
  xiaowangTestData,
  brokerData = [],
  title = "Views/Likes/Followers/Leads & Cost Trend Analysis",
  startDate,
  endDate,
  selectedMetric: propSelectedMetric,
  onMetricChange,
  isFiltered: propIsFiltered,
  onFilterChange
}: XiaowangTestCostAnalysisProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>(propSelectedMetric || 'views')
  const isFiltered = propIsFiltered !== undefined ? propIsFiltered : true

  // Sync with prop changes
  useEffect(() => {
    if (propSelectedMetric) {
      setSelectedMetric(propSelectedMetric)
    }
  }, [propSelectedMetric])

  // Handle metric change
  const handleMetricChange = (metric: MetricType) => {
    setSelectedMetric(metric)
    onMetricChange?.(metric)
  }

  // Debug logging for component props
  console.log('XiaowangTestCostAnalysis props:', {
    xiaowangTestDataExists: !!xiaowangTestData,
    xiaowangTestDailyDataLength: xiaowangTestData?.dailyData?.length || 0,
    xiaowangTestRawDataLength: xiaowangTestData?.rawData?.length || 0,
    brokerDataLength: brokerData?.length || 0,
    brokerDataSample: brokerData?.slice(0, 2) || [],
    startDate,
    endDate,
    isFiltered,
    hasRawData: !!xiaowangTestData?.rawData
  })

  // Get current metric config
  const metricConfig = useMemo(() => {
    switch (selectedMetric) {
      case 'likes':
        return {
          dataKey: 'likes',
          name: 'Likes',
          color: '#EF3C99',
          label: 'Likes',
          yAxisLabel: 'Likes'
        }
      case 'followers':
        return {
          dataKey: 'followers',
          name: 'New Followers',
          color: '#10B981',
          label: 'New Followers',
          yAxisLabel: 'New Followers'
        }
      case 'leads':
        return {
          dataKey: 'leads',
          name: 'Leads',
          color: '#F59E0B',
          label: 'Leads',
          yAxisLabel: 'Leads'
        }
      default: // views
        return {
          dataKey: 'views',
          name: 'Views',
          color: '#3CBDE5',
          label: 'Views',
          yAxisLabel: 'Views'
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

    console.log('Processing FILTERED data:', {
      originalLength: xiaowangTestData.rawData.length,
      filteredLength: filteredRawData.length,
      startDate,
      endDate
    })

    return processXiaowangTestData(filteredDataStructure, brokerData)
  }, [xiaowangTestData, brokerData, startDate, endDate])

  // Process ALL data (ignoring time filters) - for "All Data" mode
  const allDailyData = useMemo(() => {
    if (!xiaowangTestData?.rawData) {
      console.log('No rawData available, using filtered data as fallback')
      return filteredDailyData
    }

    console.log('Processing ALL data:', {
      rawDataLength: xiaowangTestData.rawData.length,
      filteredDataLength: filteredDailyData.length
    })

    // Create a fake xiaowangTestData structure with rawData as dailyData to get all records
    const allDataStructure = {
      ...xiaowangTestData,
      dailyData: xiaowangTestData.rawData // Use rawData which contains all records
    }

    const result = processXiaowangTestData(allDataStructure, brokerData)
    console.log('ALL data processed result length:', result.length)
    return result
  }, [xiaowangTestData, brokerData, filteredDailyData])

  // Use filtered or all data based on toggle state
  const activeData = useMemo(() => {
    const result = isFiltered ? filteredDailyData : allDailyData
    console.log('Active data selection:', {
      isFiltered,
      activeDataLength: result.length,
      filteredLength: filteredDailyData.length,
      allLength: allDailyData.length,
      sampleActiveData: result.slice(0, 2)
    })
    return result
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

  // Calculate average cost per day directly from raw data (changes with filter toggle)
  const avgCostPerDay = useMemo(() => {
    // Determine which raw data to use based on filter state
    let rawData = []
    if (isFiltered && xiaowangTestData?.rawData && startDate && endDate) {
      // Use filtered raw data
      rawData = xiaowangTestData.rawData.filter((item: any) => {
        return item.date >= startDate && item.date <= endDate
      })
    } else if (xiaowangTestData?.rawData) {
      // Use all raw data
      rawData = xiaowangTestData.rawData
    }

    if (!rawData || rawData.length === 0) return 0
    const totalCost = rawData.reduce((sum, item) => sum + item.cost, 0)
    const totalDays = rawData.length
    return totalDays > 0 ? totalCost / totalDays : 0
  }, [xiaowangTestData, isFiltered, startDate, endDate])

  // Calculate average for selected metric directly from raw data
  const avgMetricPerDay = useMemo(() => {
    // Determine which raw data to use based on filter state
    let rawData = []
    if (isFiltered && xiaowangTestData?.rawData && startDate && endDate) {
      // Use filtered raw data
      rawData = xiaowangTestData.rawData.filter((item: any) => {
        return item.date >= startDate && item.date <= endDate
      })
    } else if (xiaowangTestData?.rawData) {
      // Use all raw data
      rawData = xiaowangTestData.rawData
    }

    if (!rawData || rawData.length === 0) return 0

    let totalMetric = 0
    switch (selectedMetric) {
      case 'views':
        totalMetric = rawData.reduce((sum, item) => sum + item.clicks, 0)
        break
      case 'likes':
        totalMetric = rawData.reduce((sum, item) => sum + item.likes, 0)
        break
      case 'followers':
        totalMetric = rawData.reduce((sum, item) => sum + item.followers, 0)
        break
      case 'leads':
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
        totalMetric = rawData.reduce((sum, item) => sum + (leadsPerDate[item.date] || 0), 0)
        break
      default:
        totalMetric = 0
    }

    const totalDays = rawData.length
    return totalDays > 0 ? totalMetric / totalDays : 0
  }, [xiaowangTestData, brokerData, selectedMetric, isFiltered, startDate, endDate])

  // Calculate average cost per metric (total cost ÷ total metric)
  const avgCostPerMetric = useMemo(() => {
    // Determine which raw data to use based on filter state
    let rawData = []
    if (isFiltered && xiaowangTestData?.rawData && startDate && endDate) {
      // Use filtered raw data
      rawData = xiaowangTestData.rawData.filter((item: any) => {
        return item.date >= startDate && item.date <= endDate
      })
    } else if (xiaowangTestData?.rawData) {
      // Use all raw data
      rawData = xiaowangTestData.rawData
    }

    if (!rawData || rawData.length === 0) return 0

    const totalCost = rawData.reduce((sum, item) => sum + item.cost, 0)
    let totalMetric = 0

    switch (selectedMetric) {
      case 'views':
        totalMetric = rawData.reduce((sum, item) => sum + item.clicks, 0)
        break
      case 'likes':
        totalMetric = rawData.reduce((sum, item) => sum + item.likes, 0)
        break
      case 'followers':
        totalMetric = rawData.reduce((sum, item) => sum + item.followers, 0)
        break
      case 'leads':
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
        totalMetric = rawData.reduce((sum, item) => sum + (leadsPerDate[item.date] || 0), 0)
        break
      default:
        totalMetric = 0
    }

    return totalMetric > 0 ? totalCost / totalMetric : 0
  }, [xiaowangTestData, brokerData, selectedMetric, isFiltered, startDate, endDate])

  // Get lighter version of metric color for average line
  const getLighterColor = (color: string) => {
    switch (color) {
      case '#3CBDE5': return '#A8E6F7' // lighter blue for views
      case '#EF3C99': return '#F8A6CE' // lighter pink for likes
      case '#10B981': return '#7EDCC4' // lighter green for followers
      case '#F59E0B': return '#FBC366' // lighter amber for leads
      default: return color + '80' // fallback with opacity
    }
  }

  // Calculate dynamic scales for both axes
  const { metricScale, costScale } = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return {
        metricScale: { domain: [0, 100], ticks: [0, 25, 50, 75, 100] },
        costScale: { domain: [0, Math.max(1000, avgCostPerDay * 1.2)], ticks: [0, 250, 500, 750, 1000] }
      }
    }

    // Find min and max for selected metric
    const metricValues = chartData.map(d => d[metricConfig.dataKey]).filter(v => v > 0)
    if (avgMetricPerDay > 0) metricValues.push(avgMetricPerDay)
    const minMetric = metricValues.length > 0 ? Math.min(...metricValues) : 0
    const maxMetric = metricValues.length > 0 ? Math.max(...metricValues) : 100

    // Find min and max for cost
    const costValues = chartData.map(d => d.cost).filter(v => v > 0)
    if (avgCostPerDay > 0) costValues.push(avgCostPerDay)
    const minCost = costValues.length > 0 ? Math.min(...costValues) : 0
    const maxCost = costValues.length > 0 ? Math.max(...costValues) : 1000

    return {
      metricScale: calculateNiceScale(minMetric, maxMetric, 5),
      costScale: calculateNiceScale(minCost, maxCost, 5)
    }
  }, [chartData, metricConfig.dataKey, avgCostPerDay, avgMetricPerDay])

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

        return (
          <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-4 shadow-xl min-w-[200px]">
            <p className="font-bold text-gray-900 mb-3 border-b pb-2">{formattedDate}</p>

            {/* Selected Metric Section */}
            <div className="mb-2">
              <p className="text-sm font-semibold mb-1" style={{ color: metricConfig.color }}>
                {selectedMetric === 'views' ? '👁️' : selectedMetric === 'likes' ? '👍' : selectedMetric === 'followers' ? '👥' : '🎯'} {metricConfig.label}
              </p>
              <p className="text-sm text-gray-700">{dataPoint[metricConfig.dataKey].toLocaleString()}</p>
            </div>

            {/* Cost Section */}
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: '#751FAE' }}>💰 Cost</p>
              <p className="text-sm text-gray-700">${dataPoint.cost.toFixed(2)}</p>
            </div>
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
              Daily {metricConfig.label} & Cost Trend {(!isSevenDayRange || !isFiltered) && "(Weekday Averages)"}
            </CardTitle>
          </div>

          <div className="flex items-center gap-4">
            {/* Metric Selection Buttons */}
            <div className="flex gap-2">
              <Button
                variant={selectedMetric === 'views' ? "default" : "outline"}
                size="sm"
                onClick={() => handleMetricChange('views')}
                className={selectedMetric === 'views'
                  ? 'bg-[#3CBDE5] hover:bg-[#2563EB] text-white border-0'
                  : 'border-[#3CBDE5] text-[#3CBDE5] hover:bg-[#3CBDE5] hover:text-white'
                }
              >
                Views
              </Button>
              <Button
                variant={selectedMetric === 'likes' ? "default" : "outline"}
                size="sm"
                onClick={() => handleMetricChange('likes')}
                className={selectedMetric === 'likes'
                  ? 'bg-[#EF3C99] hover:bg-[#E91E63] text-white border-0'
                  : 'border-[#EF3C99] text-[#EF3C99] hover:bg-[#EF3C99] hover:text-white'
                }
              >
                Likes
              </Button>
              <Button
                variant={selectedMetric === 'followers' ? "default" : "outline"}
                size="sm"
                onClick={() => handleMetricChange('followers')}
                className={selectedMetric === 'followers'
                  ? 'bg-[#10B981] hover:bg-[#059669] text-white border-0'
                  : 'border-[#10B981] text-[#10B981] hover:bg-[#10B981] hover:text-white'
                }
              >
                Followers
              </Button>
              <Button
                variant={selectedMetric === 'leads' ? "default" : "outline"}
                size="sm"
                onClick={() => handleMetricChange('leads')}
                className={selectedMetric === 'leads'
                  ? 'bg-[#F59E0B] hover:bg-[#D97706] text-white border-0'
                  : 'border-[#F59E0B] text-[#F59E0B] hover:bg-[#F59E0B] hover:text-white'
                }
              >
                Leads
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
              margin={{ top: 20, right: 80, left: 40, bottom: 60 }}
            >
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: '#6B7280' }}
                height={60}
                scale="point"
                padding={{ left: 30, right: 30 }}
                tickFormatter={formatDate}
              />

              {/* Left Y-axis - Cost */}
              <YAxis
                yAxisId="cost"
                orientation="left"
                domain={costScale.domain}
                ticks={costScale.ticks}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `$${(value/1000000).toFixed(1)}M`
                  if (value >= 1000) return `$${(value/1000).toFixed(1)}K`
                  return `$${value.toFixed(0)}`
                }}
                label={{ value: 'Cost ($)', angle: -90, position: 'insideLeft' }}
              />

              {/* Right Y-axis - Selected Metric */}
              <YAxis
                yAxisId="metric"
                orientation="right"
                domain={metricScale.domain}
                ticks={metricScale.ticks}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value/1000000).toFixed(1)}M`
                  if (value >= 1000) return `${(value/1000).toFixed(1)}K`
                  return formatSmartDecimal(value)
                }}
                label={{ value: metricConfig.yAxisLabel, angle: 90, position: 'insideRight' }}
              />

              <Tooltip content={<CustomTooltip />} />
              <Legend />

              {/* Average Cost per Day Reference Line */}
              {avgCostPerDay > 0 && (
                <ReferenceLine
                  yAxisId="cost"
                  y={avgCostPerDay}
                  stroke="#C4A5E7"
                  strokeDasharray="8 4"
                  strokeWidth={2}
                />
              )}

              {/* Average Metric Reference Line */}
              {avgMetricPerDay > 0 && (
                <ReferenceLine
                  yAxisId="metric"
                  y={avgMetricPerDay}
                  stroke={getLighterColor(metricConfig.color)}
                  strokeDasharray="8 4"
                  strokeWidth={2}
                />
              )}

              {/* Cost Line - Left axis */}
              <Line
                yAxisId="cost"
                type="monotone"
                dataKey="cost"
                stroke="#751FAE"
                strokeWidth={3}
                dot={{ fill: "#751FAE", strokeWidth: 2, r: 4 }}
                name={`Cost (Avg: $${avgCostPerDay.toFixed(2)})`}
                connectNulls={false}
              />

              {/* Selected Metric Line - Right axis */}
              <Line
                yAxisId="metric"
                type="monotone"
                dataKey={metricConfig.dataKey}
                stroke={metricConfig.color}
                strokeWidth={3}
                dot={{ fill: metricConfig.color, strokeWidth: 2, r: 4 }}
                name={`${metricConfig.name} (Avg: ${avgMetricPerDay >= 1000 ? `${formatSmartDecimal(avgMetricPerDay/1000)}K` : formatSmartDecimal(avgMetricPerDay)})`}
                connectNulls={false}
              />

              {/* Labels for Cost */}
              <Line
                yAxisId="cost"
                type="monotone"
                dataKey="cost"
                stroke="transparent"
                dot={false}
                connectNulls={false}
                legendType="none"
              >
                <LabelList
                  content={(props) => (
                    <IntelligentLabel
                      {...props}
                      data={chartData}
                      dataKey="cost"
                      metricScale={metricScale}
                      costScale={costScale}
                      selectedMetric={selectedMetric}
                      metricConfig={metricConfig}
                    />
                  )}
                  position="top"
                />
              </Line>

              {/* Labels for Selected Metric */}
              <Line
                yAxisId="metric"
                type="monotone"
                dataKey={metricConfig.dataKey}
                stroke="transparent"
                dot={false}
                connectNulls={false}
                legendType="none"
              >
                <LabelList
                  content={(props) => (
                    <IntelligentLabel
                      {...props}
                      data={chartData}
                      dataKey={metricConfig.dataKey}
                      metricScale={metricScale}
                      costScale={costScale}
                      selectedMetric={selectedMetric}
                      metricConfig={metricConfig}
                    />
                  )}
                  position="top"
                />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}