"use client"

import React from "react"
import { ArrowLeft, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function InformationHubPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100 to-pink-100">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-purple-200/30 sticky top-0 z-50 shadow-lg shadow-purple-500/10">
        <div className="w-full px-8">
          <div className="relative flex items-center h-24 py-4">
            <div className="flex items-center space-x-4">
              <img
                src="/LifeX_logo.png"
                alt="LifeX Logo"
                className="h-12 w-auto"
              />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <h1 className="text-4xl font-black bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">Information Hub</h1>
              <p className="text-base text-purple-600 mt-1 font-montserrat font-light">Analytics & Insights</p>
            </div>
            <div className="ml-auto">
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content - Single Card */}
      <div className="flex items-center justify-center min-h-[calc(100vh-96px)]">
        <div className="w-full max-w-md px-8">

          {/* Xiaowang Post Performance Analysis Card */}
          <Card
            className="bg-white/95 backdrop-blur-xl shadow-xl shadow-purple-500/10 ring-1 ring-purple-500/20 hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105"
            onClick={() => window.location.href = '/xiaowang-post-performance'}
          >
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Xiaowang Post Performance Analysis</CardTitle>
              </div>
              <CardDescription className="text-base">
                Click to view detailed post performance metrics and analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-4">
                <Button
                  className="bg-gradient-to-r from-[#751FAE] to-[#EF3C99] text-white hover:from-[#6919A6] hover:to-[#E73691] transition-all duration-200"
                  size="lg"
                >
                  View Analysis
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}