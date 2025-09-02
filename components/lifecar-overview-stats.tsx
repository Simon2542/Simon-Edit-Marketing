"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LifeCarDailyData } from "@/lib/lifecar-data-processor"

interface LifeCarOverviewStatsProps {
  data: LifeCarDailyData[]
  allTimeData?: LifeCarDailyData[]
}

// SVG图标渲染函数
const renderIcon = (iconName: string) => {
  const iconProps = {
    className: "w-4 h-4 text-[#751FAE]",
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2
  };

  switch (iconName) {
    case 'money':
      return (
        <svg {...iconProps}>
          <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'eye':
      return (
        <svg {...iconProps}>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case 'heart':
      return (
        <svg {...iconProps}>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      );
    case 'users':
      return (
        <svg {...iconProps}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="m22 21-3-3m0 0-3 3m3-3v-4" />
        </svg>
      );
    case 'dollar':
      return (
        <svg {...iconProps}>
          <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      );
    case 'cash':
      return (
        <svg {...iconProps}>
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      );
    case 'user':
      return (
        <svg {...iconProps}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    default:
      return <span className="text-lg">📊</span>;
  }
};

export function LifeCarOverviewStats({ data, allTimeData }: LifeCarOverviewStatsProps) {
  const totalSpend = data.reduce((sum, item) => sum + item.spend, 0)
  const totalFollowers = data.reduce((sum, item) => sum + item.followers, 0)
  const totalInteractions = data.reduce((sum, item) => sum + item.interactions, 0)
  const totalLikes = data.reduce((sum, item) => sum + item.likes, 0)
  const totalImpressions = data.reduce((sum, item) => sum + item.impressions, 0)
  const totalClicks = data.reduce((sum, item) => sum + item.clicks, 0)
  const totalPrivateMessages = data.reduce((sum, item) => sum + ((item.multiConversion1 || 0) + (item.multiConversion2 || 0)), 0)
  
  // 检测是否有时间筛选 - 如果data长度等于allTimeData长度，说明没有筛选
  const isNoTimeFilter = !allTimeData || data.length === allTimeData.length
  
  const avgDailySpend = data.length > 0 ? totalSpend / data.length : 0
  const cpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
  const interactionRate = totalFollowers > 0 ? (totalInteractions / totalFollowers) * 100 : 0
  const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0
  const cpe = totalInteractions > 0 ? totalSpend / totalInteractions : 0
  const costPerLike = totalLikes > 0 ? totalSpend / totalLikes : 0
  const cppm = totalPrivateMessages > 0 ? totalSpend / totalPrivateMessages : 0
  const costPerFollower = totalFollowers > 0 ? totalSpend / totalFollowers : 0
  
  // 计算所有时间的总体CTR作为基准AVG
  const allTimeTotalClicks = allTimeData ? allTimeData.reduce((sum, item) => sum + (item.clicks || 0), 0) : totalClicks
  const allTimeTotalImpressions = allTimeData ? allTimeData.reduce((sum, item) => sum + (item.impressions || 0), 0) : totalImpressions
  const avgCTR = allTimeTotalImpressions > 0 ? (allTimeTotalClicks / allTimeTotalImpressions) * 100 : 0
  const ctrDifference = ctr - avgCTR
  const ctrDifferencePercent = avgCTR > 0 ? ((ctr - avgCTR) / avgCTR) * 100 : 0

  // 计算所有时间的总体Interaction Rate作为基准AVG
  const allTimeTotalInteractions = allTimeData ? allTimeData.reduce((sum, item) => sum + (item.interactions || 0), 0) : totalInteractions
  const avgInteractionRate = allTimeTotalClicks > 0 ? (allTimeTotalInteractions / allTimeTotalClicks) * 100 : 0
  const currentInteractionRate = totalClicks > 0 ? (totalInteractions / totalClicks) * 100 : 0
  const interactionRateDifference = currentInteractionRate - avgInteractionRate
  const interactionRateDifferencePercent = avgInteractionRate > 0 ? ((currentInteractionRate - avgInteractionRate) / avgInteractionRate) * 100 : 0

  // 计算所有时间的总体Private Message Rate作为基准AVG
  const allTimeTotalPrivateMessages = allTimeData ? allTimeData.reduce((sum, item) => sum + ((item.multiConversion1 || 0) + (item.multiConversion2 || 0)), 0) : totalPrivateMessages
  const avgPrivateMessageRate = allTimeTotalClicks > 0 ? (allTimeTotalPrivateMessages / allTimeTotalClicks) * 100 : 0
  const currentPrivateMessageRate = totalClicks > 0 ? (totalPrivateMessages / totalClicks) * 100 : 0
  const privateMessageRateDifference = currentPrivateMessageRate - avgPrivateMessageRate
  const privateMessageRateDifferencePercent = avgPrivateMessageRate > 0 ? ((currentPrivateMessageRate - avgPrivateMessageRate) / avgPrivateMessageRate) * 100 : 0
  
  // 计算Spend的同期长度平均值对比
  const currentPeriodDays = data.length
  const allTimePeriodAvgSpend = allTimeData && allTimeData.length > 0 && currentPeriodDays > 0 ? 
    allTimeData.reduce((sum, item) => sum + item.spend, 0) / Math.ceil(allTimeData.length / currentPeriodDays) : 0
  const spendDifference = totalSpend - allTimePeriodAvgSpend
  const spendDifferencePercent = allTimePeriodAvgSpend > 0 ? ((totalSpend - allTimePeriodAvgSpend) / allTimePeriodAvgSpend) * 100 : 0
  
  // 保留之前时间段的数据计算逻辑用于其他指标
  let previousPeriodSpend = 0
  let previousPeriodData: LifeCarDailyData[] = []
  
  if (allTimeData && allTimeData.length > 0 && data.length > 0) {
    // 获取当前选择时间段的开始日期
    const currentStartDate = new Date(Math.min(...data.map(d => new Date(d.date).getTime())))
    
    // 计算之前同等长度时间段的数据
    const previousEndDate = new Date(currentStartDate)
    previousEndDate.setDate(previousEndDate.getDate() - 1)
    const previousStartDate = new Date(previousEndDate)
    previousStartDate.setDate(previousStartDate.getDate() - currentPeriodDays + 1)
    
    // 过滤出之前时间段的数据
    previousPeriodData = allTimeData.filter(item => {
      const itemDate = new Date(item.date)
      return itemDate >= previousStartDate && itemDate <= previousEndDate
    })
    
    previousPeriodSpend = previousPeriodData.reduce((sum, item) => sum + item.spend, 0)
  }
  
  // 计算之前时间段的CPM
  const previousPeriodImpressions = previousPeriodData.reduce((sum, item) => sum + item.impressions, 0)
  const previousPeriodCPM = previousPeriodImpressions > 0 ? (previousPeriodSpend / previousPeriodImpressions) * 1000 : 0
  const cpmDifference = cpm - previousPeriodCPM
  const cpmDifferencePercent = previousPeriodCPM > 0 ? ((cpm - previousPeriodCPM) / previousPeriodCPM) * 100 : 0
  
  // 计算Cost per View的同期长度平均值对比 - 先算平均cost，再算平均clicks，最后相除
  const avgSpendForCPC = allTimeData && allTimeData.length > 0 && currentPeriodDays > 0 ? 
    allTimeData.reduce((sum, item) => sum + item.spend, 0) / Math.floor(allTimeData.length / currentPeriodDays) : 0
  const avgClicksForCPC = allTimeData && allTimeData.length > 0 && currentPeriodDays > 0 ? 
    allTimeData.reduce((sum, item) => sum + item.clicks, 0) / Math.floor(allTimeData.length / currentPeriodDays) : 0
  const allTimePeriodAvgCPC = avgClicksForCPC > 0 ? avgSpendForCPC / avgClicksForCPC : 0
  const cpcDifference = cpc - allTimePeriodAvgCPC
  const cpcDifferencePercent = allTimePeriodAvgCPC > 0 ? ((cpc - allTimePeriodAvgCPC) / allTimePeriodAvgCPC) * 100 : 0

  // 计算Cost per Like的同期长度平均值对比 - 先算平均cost，再算平均likes，最后相除
  const avgSpendForCPL = allTimeData && allTimeData.length > 0 && currentPeriodDays > 0 ? 
    allTimeData.reduce((sum, item) => sum + item.spend, 0) / Math.floor(allTimeData.length / currentPeriodDays) : 0
  const avgLikesForCPL = allTimeData && allTimeData.length > 0 && currentPeriodDays > 0 ? 
    allTimeData.reduce((sum, item) => sum + item.likes, 0) / Math.floor(allTimeData.length / currentPeriodDays) : 0
  const allTimePeriodAvgCPL = avgLikesForCPL > 0 ? avgSpendForCPL / avgLikesForCPL : 0
  const costPerLikeDifference = costPerLike - allTimePeriodAvgCPL
  const costPerLikeDifferencePercent = allTimePeriodAvgCPL > 0 ? ((costPerLike - allTimePeriodAvgCPL) / allTimePeriodAvgCPL) * 100 : 0

  // 计算Cost per Follower的同期长度平均值对比 - 先算平均cost，再算平均followers，最后相除
  const avgSpendForCPF = allTimeData && allTimeData.length > 0 && currentPeriodDays > 0 ? 
    allTimeData.reduce((sum, item) => sum + item.spend, 0) / Math.floor(allTimeData.length / currentPeriodDays) : 0
  const avgFollowersForCPF = allTimeData && allTimeData.length > 0 && currentPeriodDays > 0 ? 
    allTimeData.reduce((sum, item) => sum + item.followers, 0) / Math.floor(allTimeData.length / currentPeriodDays) : 0
  const allTimePeriodAvgCPF = avgFollowersForCPF > 0 ? avgSpendForCPF / avgFollowersForCPF : 0
  const costPerFollowerDifference = costPerFollower - allTimePeriodAvgCPF
  const costPerFollowerDifferencePercent = allTimePeriodAvgCPF > 0 ? ((costPerFollower - allTimePeriodAvgCPF) / allTimePeriodAvgCPF) * 100 : 0

  // 调试所有Cost per X计算
  console.log('=== Cost Metrics Debug ===')
  console.log('currentPeriodDays (筛选时间长度):', currentPeriodDays)
  console.log('allTimeData.length (总历史数据天数):', allTimeData?.length)
  console.log('实际时间段数量:', Math.floor((allTimeData?.length || 0) / currentPeriodDays))
  console.log('Cost per View - 当前:', cpc, '平均:', allTimePeriodAvgCPC)
  console.log('Cost per Like - 当前:', costPerLike, '平均:', allTimePeriodAvgCPL)  
  console.log('Cost per Follower - 当前:', costPerFollower, '平均:', allTimePeriodAvgCPF)
  
  // 保留之前时间段的CPC计算用于其他需要
  const previousPeriodClicks = previousPeriodData.reduce((sum, item) => sum + item.clicks, 0)
  const previousPeriodCPC = previousPeriodClicks > 0 ? previousPeriodSpend / previousPeriodClicks : 0
  
  // 计算之前时间段的CPE
  const previousPeriodInteractions = previousPeriodData.reduce((sum, item) => sum + item.interactions, 0)
  const previousPeriodCPE = previousPeriodInteractions > 0 ? previousPeriodSpend / previousPeriodInteractions : 0
  const cpeDifference = cpe - previousPeriodCPE
  const cpeDifferencePercent = previousPeriodCPE > 0 ? ((cpe - previousPeriodCPE) / previousPeriodCPE) * 100 : 0
  
  // 计算之前时间段的CPPM
  const previousPeriodPrivateMessages = previousPeriodData.reduce((sum, item) => sum + ((item.multiConversion1 || 0) + (item.multiConversion2 || 0)), 0)
  const previousPeriodCPPM = previousPeriodPrivateMessages > 0 ? previousPeriodSpend / previousPeriodPrivateMessages : 0
  const cppmDifference = cppm - previousPeriodCPPM
  const cppmDifferencePercent = previousPeriodCPPM > 0 ? ((cppm - previousPeriodCPPM) / previousPeriodCPPM) * 100 : 0

  // 计算之前时间段的CTR与Previous Period比较
  const previousPeriodCTR = previousPeriodImpressions > 0 ? (previousPeriodClicks / previousPeriodImpressions) * 100 : 0
  const ctrDifferenceFromPrevious = ctr - previousPeriodCTR
  const ctrDifferencePercentFromPrevious = previousPeriodCTR > 0 ? ((ctr - previousPeriodCTR) / previousPeriodCTR) * 100 : 0

  // 计算之前时间段的Interaction Rate与Previous Period比较
  const previousPeriodInteractionRate = previousPeriodClicks > 0 ? (previousPeriodInteractions / previousPeriodClicks) * 100 : 0
  const interactionRateDifferenceFromPrevious = currentInteractionRate - previousPeriodInteractionRate
  const interactionRateDifferencePercentFromPrevious = previousPeriodInteractionRate > 0 ? ((currentInteractionRate - previousPeriodInteractionRate) / previousPeriodInteractionRate) * 100 : 0

  // 计算之前时间段的Private Message Rate与Previous Period比较
  const previousPeriodPrivateMessageRate = previousPeriodClicks > 0 ? (previousPeriodPrivateMessages / previousPeriodClicks) * 100 : 0
  const privateMessageRateDifferenceFromPrevious = currentPrivateMessageRate - previousPeriodPrivateMessageRate
  const privateMessageRateDifferencePercentFromPrevious = previousPeriodPrivateMessageRate > 0 ? ((currentPrivateMessageRate - previousPeriodPrivateMessageRate) / previousPeriodPrivateMessageRate) * 100 : 0

  // 计算Total Views (Clicks)的同期长度平均值对比
  const currentPeriodLength = data.length
  const allTimePeriodAvgClicks = allTimeData && allTimeData.length > 0 && currentPeriodLength > 0 ? 
    allTimeData.reduce((sum, item) => sum + item.clicks, 0) / Math.ceil(allTimeData.length / currentPeriodLength) : 0
  const clicksDifference = totalClicks - allTimePeriodAvgClicks
  const clicksDifferencePercent = allTimePeriodAvgClicks > 0 ? ((totalClicks - allTimePeriodAvgClicks) / allTimePeriodAvgClicks) * 100 : 0

  // 计算Likes的同期长度平均值对比
  const allTimePeriodAvgLikes = allTimeData && allTimeData.length > 0 && currentPeriodLength > 0 ? 
    allTimeData.reduce((sum, item) => sum + item.likes, 0) / Math.ceil(allTimeData.length / currentPeriodLength) : 0
  const likesDifference = totalLikes - allTimePeriodAvgLikes
  const likesDifferencePercent = allTimePeriodAvgLikes > 0 ? ((totalLikes - allTimePeriodAvgLikes) / allTimePeriodAvgLikes) * 100 : 0

  // 计算New Followers的同期长度平均值对比
  const allTimePeriodAvgFollowers = allTimeData && allTimeData.length > 0 && currentPeriodLength > 0 ? 
    allTimeData.reduce((sum, item) => sum + item.followers, 0) / Math.ceil(allTimeData.length / currentPeriodLength) : 0
  const followersDifference = totalFollowers - allTimePeriodAvgFollowers
  const followersDifferencePercent = allTimePeriodAvgFollowers > 0 ? ((totalFollowers - allTimePeriodAvgFollowers) / allTimePeriodAvgFollowers) * 100 : 0

  const stats = [
    {
      title: "Views",
      value: `${totalClicks.toLocaleString()}`,
      description: "Total clicks",
      icon: "eye",
      color: "from-purple-700 to-pink-600",
      isSpecial: true,
      clicksDifference: clicksDifference,
      clicksDifferencePercent: clicksDifferencePercent,
      allTimePeriodAvgClicks: allTimePeriodAvgClicks,
      currentPeriodLength: currentPeriodLength
    },
    {
      title: "Likes",
      value: `${totalLikes.toLocaleString()}`,
      description: "Total likes",
      icon: "heart",
      color: "from-purple-700 to-pink-600",
      isSpecial: true,
      likesDifference: likesDifference,
      likesDifferencePercent: likesDifferencePercent,
      allTimePeriodAvgLikes: allTimePeriodAvgLikes,
      currentPeriodLength: currentPeriodLength
    },
    {
      title: "New Followers",
      value: `${totalFollowers.toLocaleString()}`,
      description: "Total new followers",
      icon: "users",
      color: "from-purple-700 to-pink-600",
      isSpecial: true,
      followersDifference: followersDifference,
      followersDifferencePercent: followersDifferencePercent,
      allTimePeriodAvgFollowers: allTimePeriodAvgFollowers,
      currentPeriodLength: currentPeriodLength
    },
    {
      title: "Cost",
      value: `$${totalSpend.toFixed(2)}`,
      description: "Campaign investment",
      icon: "money",
      color: "from-purple-700 to-pink-600",
      isSpecial: true,
      spendDifference: spendDifference,
      spendDifferencePercent: spendDifferencePercent,
      allTimePeriodAvgSpend: allTimePeriodAvgSpend,
      currentPeriodDays: currentPeriodDays
    },
    {
      title: "Cost per View",
      value: `$${cpc.toFixed(2)}`,
      description: "Cost per click",
      icon: "dollar",
      color: "from-purple-700 to-pink-600",
      isSpecial: true,
      cpcDifference: cpcDifference,
      cpcDifferencePercent: cpcDifferencePercent,
      allTimePeriodAvgCPC: allTimePeriodAvgCPC,
      currentPeriodDays: currentPeriodDays
    },
    {
      title: "Cost per Like",
      value: `$${costPerLike.toFixed(2)}`,
      description: "Cost per like",
      icon: "cash",
      color: "from-purple-700 to-pink-600",
      isSpecial: true,
      costPerLikeDifference: costPerLikeDifference,
      costPerLikeDifferencePercent: costPerLikeDifferencePercent,
      allTimePeriodAvgCPL: allTimePeriodAvgCPL,
      currentPeriodDays: currentPeriodDays
    },
    {
      title: "Cost per Follower",
      value: `$${costPerFollower.toFixed(2)}`,
      description: "Cost per follower",
      icon: "user",
      color: "from-purple-700 to-pink-600",
      isSpecial: true,
      costPerFollowerDifference: costPerFollowerDifference,
      costPerFollowerDifferencePercent: costPerFollowerDifferencePercent,
      allTimePeriodAvgCPF: allTimePeriodAvgCPF,
      currentPeriodDays: currentPeriodDays
    }
  ]

  return (
    <div className="mb-6">
      {/* First row - 3 cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {stats.slice(0, 3).map((stat, index) => (
          <Card key={index} className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50 glass-card-hover relative">
            <CardContent className="p-6 text-center">
              <div className="text-sm font-bold text-gray-700 mb-2">{stat.title}</div>
              <div className={`text-3xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1`}>
                {stat.value}
              </div>
              
              {/* 特殊的CTR、Interaction Rate或Private Message Rate卡片显示 */}
              {stat.isSpecial ? (
                <div className="space-y-2">
                  {/* 与平均值对比的箭头和百分比 */}
                  <div className="flex items-center justify-center gap-1">
                    {stat.title === 'Views' ? (
                      <span className={`${isNoTimeFilter ? 'text-gray-400' : stat.clicksDifference >= 0 ? 'text-green-600' : 'text-red-600'} text-sm font-bold flex items-center`}>
                        {stat.clicksDifference >= 0 ? '▲' : '▼'}
                        {Math.abs(stat.clicksDifferencePercent).toFixed(1)}%
                      </span>
                    ) : stat.title === 'Likes' ? (
                      <span className={`${isNoTimeFilter ? 'text-gray-400' : stat.likesDifference >= 0 ? 'text-green-600' : 'text-red-600'} text-sm font-bold flex items-center`}>
                        {stat.likesDifference >= 0 ? '▲' : '▼'}
                        {Math.abs(stat.likesDifferencePercent).toFixed(1)}%
                      </span>
                    ) : stat.title === 'New Followers' ? (
                      <span className={`${isNoTimeFilter ? 'text-gray-400' : stat.followersDifference >= 0 ? 'text-green-600' : 'text-red-600'} text-sm font-bold flex items-center`}>
                        {stat.followersDifference >= 0 ? '▲' : '▼'}
                        {Math.abs(stat.followersDifferencePercent).toFixed(1)}%
                      </span>
                    ) : stat.title === 'Cost' ? (
                      <span className={`${isNoTimeFilter ? 'text-gray-400' : stat.spendDifference >= 0 ? 'text-red-600' : 'text-green-600'} text-sm font-bold flex items-center`}>
                        {stat.spendDifference >= 0 ? '▲' : '▼'}
                        {Math.abs(stat.spendDifferencePercent).toFixed(1)}%
                      </span>
                    ) : null}
                    <span className="text-xs text-gray-500">vs Avg</span>
                  </div>
                  {/* 详细信息 */}
                  <div className="text-xs text-gray-600">
                    {stat.title === 'Views' ? (
                      <>{stat.currentPeriodLength}-day avg: {stat.allTimePeriodAvgClicks?.toFixed(0)} clicks</>
                    ) : stat.title === 'Likes' ? (
                      <>{stat.currentPeriodLength}-day avg: {stat.allTimePeriodAvgLikes?.toFixed(0)} likes</>
                    ) : stat.title === 'New Followers' ? (
                      <>{stat.currentPeriodLength}-day avg: {stat.allTimePeriodAvgFollowers?.toFixed(0)} followers</>
                    ) : stat.title === 'Cost' ? (
                      <>{stat.currentPeriodDays}-day avg: ${stat.allTimePeriodAvgSpend?.toFixed(2)}</>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="text-xs font-semibold text-gray-600">{stat.description}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Second row - 4 cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.slice(3).map((stat, index) => (
          <Card key={index + 3} className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50 glass-card-hover relative">
          <CardContent className="p-6 text-center">
            <div className="text-sm font-bold text-gray-700 mb-2">{stat.title}</div>
            <div className={`text-3xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1`}>
              {stat.value}
            </div>
            
            {/* 特殊的CTR、Engagement Rate或Private Message Rate卡片显示 */}
            {stat.isSpecial ? (
              <div className="space-y-2">
                {/* 与平均值对比的箭头和百分比 */}
                <div className="flex items-center justify-center gap-1">
                  {stat.title === 'Views' ? (
                    <span className={`${isNoTimeFilter ? 'text-gray-400' : stat.clicksDifference >= 0 ? 'text-green-600' : 'text-red-600'} text-sm font-bold flex items-center`}>
                      {stat.clicksDifference >= 0 ? '▲' : '▼'}
                      {Math.abs(stat.clicksDifferencePercent).toFixed(1)}%
                    </span>
                  ) : stat.title === 'Likes' ? (
                    <span className={`${isNoTimeFilter ? 'text-gray-400' : stat.likesDifference >= 0 ? 'text-green-600' : 'text-red-600'} text-sm font-bold flex items-center`}>
                      {stat.likesDifference >= 0 ? '▲' : '▼'}
                      {Math.abs(stat.likesDifferencePercent).toFixed(1)}%
                    </span>
                  ) : stat.title === 'New Followers' ? (
                    <span className={`${isNoTimeFilter ? 'text-gray-400' : stat.followersDifference >= 0 ? 'text-green-600' : 'text-red-600'} text-sm font-bold flex items-center`}>
                      {stat.followersDifference >= 0 ? '▲' : '▼'}
                      {Math.abs(stat.followersDifferencePercent).toFixed(1)}%
                    </span>
                  ) : stat.title === 'Cost' ? (
                    <span className={`${isNoTimeFilter ? 'text-gray-400' : stat.spendDifference >= 0 ? 'text-red-600' : 'text-green-600'} text-sm font-bold flex items-center`}>
                      {stat.spendDifference >= 0 ? '▲' : '▼'}
                      {Math.abs(stat.spendDifferencePercent).toFixed(1)}%
                    </span>
                  ) : stat.title === 'Cost per View' ? (
                    <span className={`${isNoTimeFilter ? 'text-gray-400' : stat.cpcDifference >= 0 ? 'text-red-600' : 'text-green-600'} text-sm font-bold flex items-center`}>
                      {stat.cpcDifference >= 0 ? '▲' : '▼'}
                      {Math.abs(stat.cpcDifferencePercent).toFixed(1)}%
                    </span>
                  ) : stat.title === 'Cost per Like' ? (
                    <span className={`${isNoTimeFilter ? 'text-gray-400' : stat.costPerLikeDifference >= 0 ? 'text-red-600' : 'text-green-600'} text-sm font-bold flex items-center`}>
                      {stat.costPerLikeDifference >= 0 ? '▲' : '▼'}
                      {Math.abs(stat.costPerLikeDifferencePercent).toFixed(1)}%
                    </span>
                  ) : stat.title === 'Cost per Follower' ? (
                    <span className={`${isNoTimeFilter ? 'text-gray-400' : stat.costPerFollowerDifference >= 0 ? 'text-red-600' : 'text-green-600'} text-sm font-bold flex items-center`}>
                      {stat.costPerFollowerDifference >= 0 ? '▲' : '▼'}
                      {Math.abs(stat.costPerFollowerDifferencePercent).toFixed(1)}%
                    </span>
                  ) : null}
                  <span className="text-xs text-gray-500">vs Avg</span>
                </div>
                {/* 详细信息 */}
                <div className="text-xs text-gray-600">
                  {stat.title === 'Views' ? (
                    <>{stat.currentPeriodLength}-day avg: {stat.allTimePeriodAvgClicks?.toFixed(0)} clicks</>
                  ) : stat.title === 'Likes' ? (
                    <>{stat.currentPeriodLength}-day avg: {stat.allTimePeriodAvgLikes?.toFixed(0)} likes</>
                  ) : stat.title === 'New Followers' ? (
                    <>{stat.currentPeriodLength}-day avg: {stat.allTimePeriodAvgFollowers?.toFixed(0)} followers</>
                  ) : stat.title === 'Cost' ? (
                    <>{stat.currentPeriodDays}-day avg: ${stat.allTimePeriodAvgSpend?.toFixed(2)}</>
                  ) : stat.title === 'Cost per View' ? (
                    <>{stat.currentPeriodDays}-day avg: ${stat.allTimePeriodAvgCPC?.toFixed(2)}</>
                  ) : stat.title === 'Cost per Like' ? (
                    <>{stat.currentPeriodDays}-day avg: ${stat.allTimePeriodAvgCPL?.toFixed(2)}</>
                  ) : stat.title === 'Cost per Follower' ? (
                    <>{stat.currentPeriodDays}-day avg: ${stat.allTimePeriodAvgCPF?.toFixed(2)}</>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="text-xs font-semibold text-gray-600">{stat.description}</div>
            )}
          </CardContent>
        </Card>
        ))}
      </div>
    </div>
  )
}