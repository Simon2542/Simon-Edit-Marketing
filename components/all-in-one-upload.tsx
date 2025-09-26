"use client"

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, FileSpreadsheet, Check, AlertCircle, Loader2, Package } from 'lucide-react'

interface AllInOneUploadProps {
  onUploadSuccess?: (data?: any) => void
}

export function AllInOneUpload({ onUploadSuccess }: AllInOneUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [processedData, setProcessedData] = useState<{
    xiaowangConsultation: boolean
    xiaowangAdvertising: boolean
    xiaowangNotes: boolean
    lifecarData: boolean
    lifecarNotes: boolean
  }>({
    xiaowangConsultation: false,
    xiaowangAdvertising: false,
    xiaowangNotes: false,
    lifecarData: false,
    lifecarNotes: false
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setUploadStatus('idle')
      setMessage('')
      setProcessedData({
        xiaowangConsultation: false,
        xiaowangAdvertising: false,
        xiaowangNotes: false,
        lifecarData: false,
        lifecarNotes: false
      })
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('Please select a file first')
      setUploadStatus('error')
      return
    }

    setIsUploading(true)
    setUploadStatus('idle')
    setMessage('Processing all data sheets...')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      console.log('Uploading all-in-one file:', selectedFile.name, 'Size:', selectedFile.size)

      const response = await fetch(`${window.location.origin}/api/all-in-one-upload`, {
        method: 'POST',
        body: formData,
      })

      console.log('Response received:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response body:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      console.log('Response data:', result)
      console.log('Result.data keys:', Object.keys(result.data || {}))
      console.log('Result.data.xiaowangConsultation:', result.data?.xiaowangConsultation)
      console.log('xiaowangConsultation broker_data length:', result.data?.xiaowangConsultation?.broker_data?.length || 0)
      console.log('xiaowangConsultation weekly_data length:', result.data?.xiaowangConsultation?.weekly_data?.length || 0)
      console.log('Result.data.xiaowangAdvertising:', result.data?.xiaowangAdvertising)
      console.log('xiaowangAdvertising rawData length:', result.data?.xiaowangAdvertising?.rawData?.length || 0)
      console.log('Result.data.lifecarData sample:', result.data?.lifecarData?.slice(0, 2))

      if (response.ok && result.success) {
        setUploadStatus('success')
        setMessage(`Successfully processed all data from ${selectedFile.name}`)

        // Update processed data indicators
        setProcessedData({
          xiaowangConsultation: result.processed?.xiaowangConsultation || false,
          xiaowangAdvertising: result.processed?.xiaowangAdvertising || false,
          xiaowangNotes: result.processed?.xiaowangNotes || false,
          lifecarData: result.processed?.lifecarData || false,
          lifecarNotes: result.processed?.lifecarNotes || false
        })

        setSelectedFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }

        // Call the success callback with the processed data
        if (onUploadSuccess) {
          onUploadSuccess(result.data)
        }
      } else {
        setUploadStatus('error')
        setMessage(result.error || `Upload failed (${response.status})`)
      }
    } catch (error: any) {
      setUploadStatus('error')
      setMessage(`Error: ${error.message || 'Connection failed'}`)
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const files = event.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xlsm') || file.name.endsWith('.csv')) {
        setSelectedFile(file)
        setUploadStatus('idle')
        setMessage('')
        setProcessedData({
          xiaowangConsultation: false,
          xiaowangAdvertising: false,
          xiaowangNotes: false,
          lifecarData: false,
          lifecarNotes: false
        })
      } else {
        setMessage('Please select an Excel or CSV file (.xlsx, .xlsm, or .csv)')
        setUploadStatus('error')
      }
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          All in One Upload
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">测试阶段</span>
        </CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Upload a single file containing all data: XiaoWang (Leads, Advertising, Posts) and LifeCar (Data, Posts)
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Drop Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            selectedFile
              ? 'border-green-300 bg-green-50'
              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          }`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 mb-2 font-montserrat font-light">
            {selectedFile ? selectedFile.name : 'Drag & drop your Excel/CSV file here or click to browse'}
          </p>
          <Input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xlsm,.csv"
            onChange={handleFileSelect}
            className="hidden"
            id="all-in-one-file-upload"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            Browse Files
          </Button>
        </div>

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing All Data...
            </>
          ) : (
            <>
              <Package className="mr-2 h-4 w-4" />
              Upload & Process All Data
            </>
          )}
        </Button>

        {/* Status Message */}
        {message && (
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            uploadStatus === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : uploadStatus === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            {uploadStatus === 'success' && <Check className="h-4 w-4" />}
            {uploadStatus === 'error' && <AlertCircle className="h-4 w-4" />}
            {uploadStatus === 'idle' && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{message}</span>
          </div>
        )}

        {/* Processed Data Indicators */}
        {uploadStatus === 'success' && (
          <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-semibold text-gray-700">Processed Data:</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                {processedData.xiaowangConsultation ?
                  <Check className="h-3 w-3 text-green-600" /> :
                  <AlertCircle className="h-3 w-3 text-gray-400" />
                }
                <span className={processedData.xiaowangConsultation ? 'text-green-700' : 'text-gray-500'}>
                  XiaoWang Leads Database (Clients_info)
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {processedData.xiaowangAdvertising ?
                  <Check className="h-3 w-3 text-green-600" /> :
                  <AlertCircle className="h-3 w-3 text-gray-400" />
                }
                <span className={processedData.xiaowangAdvertising ? 'text-green-700' : 'text-gray-500'}>
                  XiaoWang Advertising Data (小王投放)
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {processedData.xiaowangNotes ?
                  <Check className="h-3 w-3 text-green-600" /> :
                  <AlertCircle className="h-3 w-3 text-gray-400" />
                }
                <span className={processedData.xiaowangNotes ? 'text-green-700' : 'text-gray-500'}>
                  XiaoWang Posts Data (小王笔记)
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {processedData.lifecarData ?
                  <Check className="h-3 w-3 text-green-600" /> :
                  <AlertCircle className="h-3 w-3 text-gray-400" />
                }
                <span className={processedData.lifecarData ? 'text-green-700' : 'text-gray-500'}>
                  LifeCar Advertising Data (Lifecar投放)
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {processedData.lifecarNotes ?
                  <Check className="h-3 w-3 text-green-600" /> :
                  <AlertCircle className="h-3 w-3 text-gray-400" />
                }
                <span className={processedData.lifecarNotes ? 'text-green-700' : 'text-gray-500'}>
                  LifeCar Posts Data (Lifecar笔记)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-500 space-y-1 font-montserrat font-light">
          <p><strong>Expected Excel structure:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Sheet "Clients_info" - XiaoWang Leads Database</li>
            <li>Sheet "小王投放" - XiaoWang Advertising Data</li>
            <li>Sheet "小王笔记" - XiaoWang Posts Data</li>
            <li>Sheet "Lifecar投放" - LifeCar Advertising Data</li>
            <li>Sheet "Lifecar笔记" - LifeCar Posts Data</li>
          </ul>
          <p className="text-xs text-blue-600 mt-1">
            数据映射: client_info → Leads数据库, 小王投放 → 小王投放数据, 小王笔记 → 小王笔记数据, LifeCar投放 → LifeCar投放数据, LifeCar笔记 → LifeCar笔记数据
          </p>
        </div>
      </CardContent>
    </Card>
  )
}