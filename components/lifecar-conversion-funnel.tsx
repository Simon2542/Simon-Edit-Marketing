"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LifeCarDailyData } from "@/lib/lifecar-data-processor"

interface LifeCarConversionFunnelProps {
  data: LifeCarDailyData[]
}

export function LifeCarConversionFunnel({ data }: LifeCarConversionFunnelProps) {
  const totalImpressions = data.reduce((sum, item) => sum + item.impressions, 0)
  const totalClicks = data.reduce((sum, item) => sum + item.clicks, 0)
  const totalInteractions = data.reduce((sum, item) => sum + item.interactions, 0)
  
  // Funnel data calculation
  const funnelData = [
    { step: "Impressions", value: totalImpressions, percentage: 100 },
    { step: "Clicks", value: totalClicks, percentage: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0 },
    { step: "Interactions", value: totalInteractions, percentage: totalImpressions > 0 ? (totalInteractions / totalImpressions) * 100 : 0 },
    { step: "Inquiries", value: data.reduce((sum, item) => sum + (item.multiConversion1 || 0), 0), percentage: totalImpressions > 0 ? (data.reduce((sum, item) => sum + (item.multiConversion1 || 0), 0) / totalImpressions) * 100 : 0 },
    { step: "WeChat Adds", value: data.reduce((sum, item) => sum + (item.multiConversion2 || 0), 0), percentage: totalImpressions > 0 ? (data.reduce((sum, item) => sum + (item.multiConversion2 || 0), 0) / totalImpressions) * 100 : 0 }
  ]

  return (
    <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50 glass-card-hover">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-gray-800 text-center">Conversion Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-1 w-full">
          {funnelData.map((item, index) => {
            const maxWidth = 100
            // 对Impressions使用特殊处理，减少与其他阶段的差距
            let width;
            if (item.value === 0) {
              width = 10; // 0值保持10%
            } else if (index === 0) {
              // Impressions (第一个) 固定为85%，减少与其他的差距
              width = 85;
            } else {
              // 其他阶段使用立方根缩放，对后面阶段差距更大
              const cbrtValue = Math.pow(item.value, 1/3) // 立方根，比平方根差距更大
              const otherValues = funnelData.slice(1).filter(d => d.value > 0).map(d => Math.pow(d.value, 1/3))
              const maxCbrtValue = Math.max(...otherValues)
              const normalizedCbrt = maxCbrtValue > 0 ? cbrtValue / maxCbrtValue : 0
              width = 15 + (normalizedCbrt * 60); // 15%-75% 的范围，进一步增加差距
            }
            const colors = [
              'bg-purple-700',
              'bg-purple-600', 
              'bg-purple-500',
              'bg-pink-600',
              'bg-pink-700'
            ]
            
            return (
              <div key={index} className="flex items-center w-full max-w-2xl justify-center">
                <div className="text-xs font-semibold text-gray-700 w-28 text-right mr-4">{item.step}</div>
                <div className="flex flex-col items-center flex-1">
                  <div 
                    className={`${colors[index]} text-white py-3 px-4 rounded shadow-md transition-all duration-300 hover:shadow-lg flex flex-col items-center justify-center`}
                    style={{ width: `${width}%` }}
                  >
                    <div className="font-bold text-lg text-center">{item.value.toLocaleString()}</div>
                    <div className="text-xs opacity-90 text-center">{item.percentage.toFixed(2)}%</div>
                  </div>
                  {index < funnelData.length - 1 && (
                    <div className="w-0 h-0 border-l-3 border-r-3 border-t-6 border-l-transparent border-r-transparent border-t-gray-400 my-1"></div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}