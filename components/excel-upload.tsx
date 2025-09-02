"use client"

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, FileSpreadsheet, Check, AlertCircle, Loader2 } from 'lucide-react'

interface ExcelUploadProps {
  onUploadSuccess?: (data?: any) => void
  accountType?: 'lifecar' | 'xiaowang'
}

export function ExcelUpload({ onUploadSuccess, accountType = 'xiaowang' }: ExcelUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setUploadStatus('idle')
      setMessage('')
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
    setMessage('Processing file...')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('accountType', accountType)

      console.log('Uploading file:', selectedFile.name, 'Size:', selectedFile.size)

      const response = await fetch(`${window.location.origin}/api/excel-data`, {
        method: 'POST',
        body: formData,
        // Remove Content-Type header to let browser set it with boundary
      })

      console.log('Response received:', response.status, response.statusText)
      console.log('Response headers:', [...response.headers.entries()])
      
      if (!response.ok) {
        console.error('Response not OK:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Error response body:', errorText)
        console.error('Response content-type:', response.headers.get('content-type'))
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      console.log('Response status:', response.status)
      const result = await response.json()
      console.log('Response data:', result)

      if (response.ok) {
        setUploadStatus('success')
        setMessage(`Successfully uploaded ${selectedFile.name}. Dashboard data has been updated!`)
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
        if (result.details) {
          console.error('Server error details:', result.details)
        }
      }
    } catch (error: any) {
      setUploadStatus('error')
      setMessage(`Network error: ${error.message || 'Connection failed'}`)
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
          <FileSpreadsheet className="h-5 w-5" />
          Upload {accountType === 'lifecar' ? 'LifeCar' : 'XiaoWang'} Data
        </CardTitle>
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
            id="file-upload"
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
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload & Update Data
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

        {/* Instructions */}
        <div className="text-xs text-gray-500 space-y-1 font-montserrat font-light">
          <p><strong>Supported file formats:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Excel files (.xlsx, .xlsm)</li>
            <li>CSV files (.csv)</li>
          </ul>
          {accountType === 'xiaowang' && (
            <>
              <p className="mt-2"><strong>Expected Excel structure:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Sheet: "Clients_info(new)" - Main client data</li>
                <li>Sheet: "Weekly_data" - Weekly metrics</li>
                <li>Sheet: "Monthly_data" - Monthly metrics</li>
                <li>Sheet: "Daily_cost" - Daily cost data</li>
              </ul>
            </>
          )}
          {accountType === 'lifecar' && (
            <>
              <p className="mt-2"><strong>Expected CSV structure:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Daily marketing performance data</li>
                <li>Columns: Date, Spend, Impressions, Clicks, etc.</li>
              </ul>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}