"use client"

import React from 'react'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface WeekdayLeadsDistributionProps {
  clientData: Array<{
    no: string | number
    broker: string
    date: string | number
  }>
  weeklyData: Array<{
    week: string
    leadsPrice: number
    leadsTotal: number
    totalCost: number
  }>
  dailyCostData: Array<{
    date: string
    cost: number
  }>
  title?: string
}

const getDayOfWeek = (dateInput: string | number): string => {
  let date: Date;
  
  if (typeof dateInput === 'number') {
    // Convert Excel date serial number to JavaScript Date
    const excelBase = new Date(1899, 11, 30);
    date = new Date(excelBase.getTime() + dateInput * 24 * 60 * 60 * 1000);
  } else {
    date = new Date(dateInput);
  }
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

export function WeekdayLeadsDistribution({ 
  clientData, 
  weeklyData, 
  dailyCostData,
  title = "Weekday Leads Distribution" 
}: WeekdayLeadsDistributionProps) {
  
  const processData = () => {
    const weekdayData = {
      Monday: { leads: 0, cost: 0 },
      Tuesday: { leads: 0, cost: 0 },
      Wednesday: { leads: 0, cost: 0 },
      Thursday: { leads: 0, cost: 0 },
      Friday: { leads: 0, cost: 0 },
      Saturday: { leads: 0, cost: 0 },
      Sunday: { leads: 0, cost: 0 }
    }

    // Count leads for each day of the week
    clientData.forEach(client => {
      const dayOfWeek = getDayOfWeek(client.date)
      if (weekdayData[dayOfWeek as keyof typeof weekdayData]) {
        weekdayData[dayOfWeek as keyof typeof weekdayData].leads += 1
      }
    })

    // Use real daily cost data distributed by day of week
    dailyCostData.forEach(dailyCost => {
      const dayOfWeek = getDayOfWeek(dailyCost.date)
      if (weekdayData[dayOfWeek as keyof typeof weekdayData]) {
        weekdayData[dayOfWeek as keyof typeof weekdayData].cost += dailyCost.cost
      }
    })

    // Calculate average cost for each day of the week
    const dayCounts = {
      Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, 
      Friday: 0, Saturday: 0, Sunday: 0
    }
    
    dailyCostData.forEach(dailyCost => {
      const dayOfWeek = getDayOfWeek(dailyCost.date)
      if (dayCounts[dayOfWeek as keyof typeof dayCounts] !== undefined) {
        dayCounts[dayOfWeek as keyof typeof dayCounts] += 1
      }
    })

    // Convert to chart data format
    return Object.entries(weekdayData).map(([day, data]) => ({
      weekday: day,
      leads: data.leads,
      costAUD: dayCounts[day as keyof typeof dayCounts] > 0 
        ? data.cost / dayCounts[day as keyof typeof dayCounts] 
        : 0
    }))
  }

  const chartData = processData()

  // Calculate totals for summary display
  const totalLeads = chartData.reduce((sum, d) => sum + d.leads, 0)
  const totalCost = chartData.reduce((sum, d) => sum + d.costAUD, 0)
  const avgDailyCost = totalCost / 7 // Average across all 7 days
  
  // Calculate weekdays vs weekends average ratio
  const weekdayLeads = chartData
    .filter(d => !['Saturday', 'Sunday'].includes(d.weekday))
    .reduce((sum, d) => sum + d.leads, 0)
  const weekendLeads = chartData
    .filter(d => ['Saturday', 'Sunday'].includes(d.weekday))
    .reduce((sum, d) => sum + d.leads, 0)
  
  // Calculate average per day
  const weekdayAverage = weekdayLeads / 5  // 5 working days
  const weekendAverage = weekendLeads / 2  // 2 weekend days
  const weekdayWeekendRatio = weekendAverage > 0 ? (weekdayAverage / weekendAverage).toFixed(1) : 'N/A'

  // Calculate data range for better Y-axis separation
  const maxLeads = Math.max(...chartData.map(d => d.leads))
  const maxCost = Math.max(...chartData.map(d => d.costAUD))

  // Custom label component - bar chart data (placed in bar center, using prominent white color)
  const renderBarLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    return (
      <text 
        x={x + width / 2} 
        y={y + height / 2} 
        fill="#ffffff" 
        textAnchor="middle" 
        dominantBaseline="middle"
        fontSize="12" 
        fontWeight="700"
      >
        {value}
      </text>
    );
  };

  // Custom label component - line chart data
  const renderLineLabel = (props: any) => {
    const { x, y, value } = props;
    return (
      <text 
        x={x} 
        y={y - 15} 
        fill="#ef3c99" 
        textAnchor="middle" 
        fontSize="10" 
        fontWeight="600"
      >
        ${value.toFixed(1)}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-medium">{`Day: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey === 'leads' 
                ? `Leads Count: ${entry.value}`
                : `Avg Daily Cost: $${entry.value.toFixed(2)} AUD`
              }
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full">
      <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center font-montserrat">{title}</h3>
      

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{
              top: 50,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="weekday" 
              stroke="#666"
              fontSize={12}
            />
            <YAxis 
              yAxisId="left"
              stroke="#751fae"
              fontSize={12}
              domain={[0, maxLeads * 1.2]}
              label={{ value: 'Leads Count', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#751fae' } }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#ef3c99"
              fontSize={12}
              domain={[0, maxCost * 1.3]}
              label={{ value: 'Daily Cost (AUD)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#ef3c99' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              yAxisId="left"
              dataKey="leads" 
              fill="#751fae" 
              name="Leads Count"
              opacity={0.8}
              label={renderBarLabel}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="costAUD" 
              stroke="#ef3c99" 
              strokeWidth={3}
              dot={{ fill: '#ef3c99', strokeWidth: 2, r: 5 }}
              name="Daily Cost (AUD)"
              label={renderLineLabel}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}