"use client"

import React, { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend, LabelList } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LifeCarDailyData } from "@/lib/lifecar-data-processor"

interface InteractionDonutChartProps {
  filteredData: LifeCarDailyData[]
  allTimeData: LifeCarDailyData[]
  title?: string
}

interface InteractionBarData {
  name: string
  filtered: number
  avgPeriod: number
  color: string
}

// Colors for different interaction types
const INTERACTION_COLORS = {
  likes: '#EF3C99',      // Pink
  comments: '#3B82F6',   // Blue
  saves: '#10B981',      // Green
  followers: '#F59E0B',  // Orange
  shares: '#8B5CF6'      // Purple
}

function calculateInteractionBarData(filteredData: LifeCarDailyData[], allTimeData: LifeCarDailyData[]): InteractionBarData[] {
  // Calculate filtered period totals
  const filteredTotals = filteredData.reduce((acc, item) => ({
    likes: acc.likes + (item.likes || 0),
    comments: acc.comments + (item.comments || 0),
    saves: acc.saves + (item.saves || 0),
    followers: acc.followers + (item.followers || 0),
    shares: acc.shares + (item.shares || 0)
  }), { likes: 0, comments: 0, saves: 0, followers: 0, shares: 0 })

  // Calculate all time totals and period averages based on filtered period length
  const allTimeTotals = allTimeData.reduce((acc, item) => ({
    likes: acc.likes + (item.likes || 0),
    comments: acc.comments + (item.comments || 0),
    saves: acc.saves + (item.saves || 0),
    followers: acc.followers + (item.followers || 0),
    shares: acc.shares + (item.shares || 0)
  }), { likes: 0, comments: 0, saves: 0, followers: 0, shares: 0 })

  // Calculate period length - use filtered data length or default to all time data length
  const filteredPeriodLength = filteredData.length > 0 ? filteredData.length : allTimeData.length
  const totalPeriods = Math.max(1, Math.ceil(allTimeData.length / filteredPeriodLength))

  if (!filteredData || filteredData.length === 0) {
    return [
      { name: 'Likes', filtered: 0, avgPeriod: Math.round(allTimeTotals.likes / totalPeriods), color: INTERACTION_COLORS.likes },
      { name: 'Comments', filtered: 0, avgPeriod: Math.round(allTimeTotals.comments / totalPeriods), color: INTERACTION_COLORS.comments },
      { name: 'Saves', filtered: 0, avgPeriod: Math.round(allTimeTotals.saves / totalPeriods), color: INTERACTION_COLORS.saves },
      { name: 'Followers', filtered: 0, avgPeriod: Math.round(allTimeTotals.followers / totalPeriods), color: INTERACTION_COLORS.followers },
      { name: 'Shares', filtered: 0, avgPeriod: Math.round(allTimeTotals.shares / totalPeriods), color: INTERACTION_COLORS.shares }
    ]
  }

  return [
    {
      name: 'Likes',
      filtered: filteredTotals.likes,
      avgPeriod: Math.round(allTimeTotals.likes / totalPeriods),
      color: INTERACTION_COLORS.likes
    },
    {
      name: 'Comments',
      filtered: filteredTotals.comments,
      avgPeriod: Math.round(allTimeTotals.comments / totalPeriods),
      color: INTERACTION_COLORS.comments
    },
    {
      name: 'Saves',
      filtered: filteredTotals.saves,
      avgPeriod: Math.round(allTimeTotals.saves / totalPeriods),
      color: INTERACTION_COLORS.saves
    },
    {
      name: 'Followers',
      filtered: filteredTotals.followers,
      avgPeriod: Math.round(allTimeTotals.followers / totalPeriods),
      color: INTERACTION_COLORS.followers
    },
    {
      name: 'Shares',
      filtered: filteredTotals.shares,
      avgPeriod: Math.round(allTimeTotals.shares / totalPeriods),
      color: INTERACTION_COLORS.shares
    }
  ]
}

export function InteractionDonutChart({ 
  filteredData, 
  allTimeData, 
  title = "Interaction Analysis: Filtered Period vs Weekly Average" 
}: InteractionDonutChartProps) {
  
  const interactionBarData = useMemo(() => {
    return calculateInteractionBarData(filteredData, allTimeData)
  }, [filteredData, allTimeData])

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-xl">
          <p className="font-semibold text-gray-800 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-gray-600">
              <span className="font-medium" style={{ color: entry.color }}>
                {entry.dataKey === 'filtered' ? 'Filtered Period: ' : 'Period Average: '}
              </span>
              {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      )
    }
    return null
  }


  if (!interactionBarData.length) {
    return (
      <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50">
        <CardHeader>
          <CardTitle className="text-lg font-bold bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">
            🍩 {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-gray-500">
            No interaction data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50">
      <CardHeader>
        <CardTitle className="text-lg font-bold bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">
          📊 {title}
        </CardTitle>
        <p className="text-sm text-gray-600 font-montserrat font-light">
          Blue bars: Filtered period total, Orange bars: Period average (all time)
        </p>
      </CardHeader>
      <CardContent>
        
        <div className="h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={interactionBarData}
              margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.3} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#6B7280' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              <Bar 
                dataKey="filtered" 
                name="Filtered Period"
                fill="#3B82F6"
                radius={[2, 2, 0, 0]}
              >
                <LabelList 
                  dataKey="filtered" 
                  position="top" 
                  style={{ fontSize: '12px', fontWeight: 'bold', fill: '#3B82F6' }}
                  formatter={(value: number) => value.toLocaleString()}
                />
              </Bar>
              <Bar 
                dataKey="avgPeriod" 
                name="Period Average"
                fill="#F59E0B"
                radius={[2, 2, 0, 0]}
              >
                <LabelList 
                  dataKey="avgPeriod" 
                  position="top" 
                  style={{ fontSize: '12px', fontWeight: 'bold', fill: '#F59E0B' }}
                  formatter={(value: number) => value.toLocaleString()}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}