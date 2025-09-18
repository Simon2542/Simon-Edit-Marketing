"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface XiaowangTestDailyData {
  date: string
  cost: number
  clicks: number
  likes: number
  followers: number
  [key: string]: any
}

interface XiaowangTestOverviewStatsProps {
  data: XiaowangTestDailyData[]
  allTimeData?: XiaowangTestDailyData[]
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

export function XiaowangTestOverviewStats({ data, allTimeData }: XiaowangTestOverviewStatsProps) {
  const totalSpend = data.reduce((sum, item) => sum + item.cost, 0)
  const totalFollowers = data.reduce((sum, item) => sum + item.followers, 0)
  const totalLikes = data.reduce((sum, item) => sum + item.likes, 0)
  const totalClicks = data.reduce((sum, item) => sum + item.clicks, 0)

  // 检测是否有时间筛选 - 如果data长度等于allTimeData长度，说明没有筛选
  const isNoTimeFilter = !allTimeData || data.length === allTimeData.length

  const avgDailySpend = data.length > 0 ? totalSpend / data.length : 0
  const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0
  const costPerLike = totalLikes > 0 ? totalSpend / totalLikes : 0
  const costPerFollower = totalFollowers > 0 ? totalSpend / totalFollowers : 0

  // 计算Cost per View的同期长度平均值对比
  const currentPeriodDays = data.length
  const avgSpendForCPC = allTimeData && allTimeData.length > 0 && currentPeriodDays > 0 ?
    allTimeData.reduce((sum, item) => sum + item.cost, 0) / Math.floor(allTimeData.length / currentPeriodDays) : 0
  const avgClicksForCPC = allTimeData && allTimeData.length > 0 && currentPeriodDays > 0 ?
    allTimeData.reduce((sum, item) => sum + item.clicks, 0) / Math.floor(allTimeData.length / currentPeriodDays) : 0
  const allTimePeriodAvgCPC = avgClicksForCPC > 0 ? avgSpendForCPC / avgClicksForCPC : 0
  const cpcDifference = cpc - allTimePeriodAvgCPC
  const cpcDifferencePercent = allTimePeriodAvgCPC > 0 ? ((cpc - allTimePeriodAvgCPC) / allTimePeriodAvgCPC) * 100 : 0

  // 计算Cost per Like的同期长度平均值对比
  const avgSpendForCPL = allTimeData && allTimeData.length > 0 && currentPeriodDays > 0 ?
    allTimeData.reduce((sum, item) => sum + item.cost, 0) / Math.floor(allTimeData.length / currentPeriodDays) : 0
  const avgLikesForCPL = allTimeData && allTimeData.length > 0 && currentPeriodDays > 0 ?
    allTimeData.reduce((sum, item) => sum + item.likes, 0) / Math.floor(allTimeData.length / currentPeriodDays) : 0
  const allTimePeriodAvgCPL = avgLikesForCPL > 0 ? avgSpendForCPL / avgLikesForCPL : 0
  const costPerLikeDifference = costPerLike - allTimePeriodAvgCPL
  const costPerLikeDifferencePercent = allTimePeriodAvgCPL > 0 ? ((costPerLike - allTimePeriodAvgCPL) / allTimePeriodAvgCPL) * 100 : 0

  // 计算Cost per Follower的同期长度平均值对比
  const avgSpendForCPF = allTimeData && allTimeData.length > 0 && currentPeriodDays > 0 ?
    allTimeData.reduce((sum, item) => sum + item.cost, 0) / Math.floor(allTimeData.length / currentPeriodDays) : 0
  const avgFollowersForCPF = allTimeData && allTimeData.length > 0 && currentPeriodDays > 0 ?
    allTimeData.reduce((sum, item) => sum + item.followers, 0) / Math.floor(allTimeData.length / currentPeriodDays) : 0
  const allTimePeriodAvgCPF = avgFollowersForCPF > 0 ? avgSpendForCPF / avgFollowersForCPF : 0
  const costPerFollowerDifference = costPerFollower - allTimePeriodAvgCPF
  const costPerFollowerDifferencePercent = allTimePeriodAvgCPF > 0 ? ((costPerFollower - allTimePeriodAvgCPF) / allTimePeriodAvgCPF) * 100 : 0

  // 计算Spend的同期长度平均值对比
  const currentPeriodLength = data.length
  const allTimePeriodAvgSpend = allTimeData && allTimeData.length > 0 && currentPeriodLength > 0 ?
    allTimeData.reduce((sum, item) => sum + item.cost, 0) / Math.ceil(allTimeData.length / currentPeriodLength) : 0
  const spendDifference = totalSpend - allTimePeriodAvgSpend
  const spendDifferencePercent = allTimePeriodAvgSpend > 0 ? ((totalSpend - allTimePeriodAvgSpend) / allTimePeriodAvgSpend) * 100 : 0

  // 计算Total Views (Clicks)的同期长度平均值对比
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

              {/* 特殊的指标卡片显示 */}
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
                      <>{stat.currentPeriodLength}-day Avg: {stat.allTimePeriodAvgClicks?.toFixed(0)} views</>
                    ) : stat.title === 'Likes' ? (
                      <>{stat.currentPeriodLength}-day Avg: {stat.allTimePeriodAvgLikes?.toFixed(0)} likes</>
                    ) : stat.title === 'New Followers' ? (
                      <>{stat.currentPeriodLength}-day Avg: {stat.allTimePeriodAvgFollowers?.toFixed(0)} followers</>
                    ) : stat.title === 'Cost' ? (
                      <>{stat.currentPeriodDays}-day Avg: ${stat.allTimePeriodAvgSpend?.toFixed(2)}</>
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

            {/* 特殊的指标卡片显示 */}
            {stat.isSpecial ? (
              <div className="space-y-2">
                {/* 与平均值对比的箭头和百分比 */}
                <div className="flex items-center justify-center gap-1">
                  {stat.title === 'Cost' ? (
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
                  {stat.title === 'Cost' ? (
                    <>{stat.currentPeriodDays}-day Avg: ${stat.allTimePeriodAvgSpend?.toFixed(2)}</>
                  ) : stat.title === 'Cost per View' ? (
                    <>{stat.currentPeriodDays}-day Avg: ${stat.allTimePeriodAvgCPC?.toFixed(2)}</>
                  ) : stat.title === 'Cost per Like' ? (
                    <>{stat.currentPeriodDays}-day Avg: ${stat.allTimePeriodAvgCPL?.toFixed(2)}</>
                  ) : stat.title === 'Cost per Follower' ? (
                    <>{stat.currentPeriodDays}-day Avg: ${stat.allTimePeriodAvgCPF?.toFixed(2)}</>
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