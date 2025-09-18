"use client"

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, FileSpreadsheet, Check, AlertCircle, Loader2 } from 'lucide-react'

interface XiaowangDualUploadProps {
  onTestUploadSuccess?: (data?: any) => void
  onConsultationUploadSuccess?: (data?: any) => void
}

export function XiaowangDualUpload({ onTestUploadSuccess, onConsultationUploadSuccess }: XiaowangDualUploadProps) {
  // Test data upload state
  const [testFile, setTestFile] = useState<File | null>(null)
  const [testUploading, setTestUploading] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')
  const testFileInputRef = useRef<HTMLInputElement>(null)

  // Consultation data upload state
  const [consultationFile, setConsultationFile] = useState<File | null>(null)
  const [consultationUploading, setConsultationUploading] = useState(false)
  const [consultationStatus, setConsultationStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [consultationMessage, setConsultationMessage] = useState('')
  const consultationFileInputRef = useRef<HTMLInputElement>(null)

  const handleTestFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setTestFile(file)
      setTestStatus('idle')
      setTestMessage('')
    }
  }

  const handleConsultationFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setConsultationFile(file)
      setConsultationStatus('idle')
      setConsultationMessage('')
    }
  }

  const handleTestUpload = async () => {
    if (!testFile) {
      setTestMessage('Please select a Xiaowang Advertising file first')
      setTestStatus('error')
      return
    }

    setTestUploading(true)
    setTestStatus('idle')
    setTestMessage('Processing Xiaowang Advertising file...')

    try {
      const formData = new FormData()
      formData.append('file', testFile)
      formData.append('accountType', 'xiaowang-test')

      const response = await fetch(`${window.location.origin}/api/xiaowang-data`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()

      if (response.ok) {
        setTestStatus('success')
        setTestMessage(`Successfully uploaded Xiaowang Advertising ${testFile.name}`)
        if (onTestUploadSuccess) {
          onTestUploadSuccess(result.data)
        }
      } else {
        setTestStatus('error')
        setTestMessage(result.error || 'Xiaowang Advertising upload failed')
      }
    } catch (error: any) {
      setTestStatus('error')
      setTestMessage(`Xiaowang Advertising upload error: ${error.message || 'Connection failed'}`)
      console.error('Test upload error:', error)
    } finally {
      setTestUploading(false)
    }
  }

  const handleConsultationUpload = async () => {
    if (!consultationFile) {
      setConsultationMessage('Please select a Leads Database file first')
      setConsultationStatus('error')
      return
    }

    setConsultationUploading(true)
    setConsultationStatus('idle')
    setConsultationMessage('Processing Leads Database file...')

    try {
      const formData = new FormData()
      formData.append('file', consultationFile)
      formData.append('accountType', 'xiaowang')

      const response = await fetch(`${window.location.origin}/api/excel-data`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()

      if (response.ok) {
        setConsultationStatus('success')
        setConsultationMessage(`Successfully uploaded Leads Database ${consultationFile.name}`)
        if (onConsultationUploadSuccess) {
          onConsultationUploadSuccess(result.data)
        }
      } else {
        setConsultationStatus('error')
        setConsultationMessage(result.error || 'Leads Database upload failed')
      }
    } catch (error: any) {
      setConsultationStatus('error')
      setConsultationMessage(`Leads Database upload error: ${error.message || 'Connection failed'}`)
      console.error('Consultation upload error:', error)
    } finally {
      setConsultationUploading(false)
    }
  }


  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const handleTestDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const files = event.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.name.endsWith('.csv') || file.name.endsWith('.xlsx')) {
        setTestFile(file)
        setTestStatus('idle')
        setTestMessage('')
      } else {
        setTestMessage('Please select CSV or Excel file (.csv or .xlsx)')
        setTestStatus('error')
      }
    }
  }

  const handleConsultationDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const files = event.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xlsm')) {
        setConsultationFile(file)
        setConsultationStatus('idle')
        setConsultationMessage('')
      } else {
        setConsultationMessage('Please select CSV or Excel file (.csv, .xlsx or .xlsm)')
        setConsultationStatus('error')
      }
    }
  }


  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Upload Xiaowang Data - Leads Database & Xiaowang Advertising
        </CardTitle>
        <p className="text-sm text-gray-600">
          Upload Xiaowang Data - Upload both test and consultation data simultaneously to access complete functionality
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Consultation Data Upload Section - First */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <h3 className="font-semibold text-gray-800">💼 Leads Database</h3>
              {consultationStatus === 'success' && <Check className="h-4 w-4 text-green-600" />}
            </div>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                consultationFile
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400 bg-gray-50'
              }`}
              onDragOver={handleDragOver}
              onDrop={handleConsultationDrop}
            >
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                {consultationFile ? consultationFile.name : 'Drag & drop Leads Database Excel file here or click to browse'}
              </p>
              <Input
                ref={consultationFileInputRef}
                type="file"
                accept=".xlsx,.xlsm,.csv"
                onChange={handleConsultationFileSelect}
                className="hidden"
                id="consultation-file-upload"
                key="consultation-input"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('Consultation file button clicked');
                  consultationFileInputRef.current?.click();
                }}
                disabled={consultationUploading}
              >
                Browse Leads Database File
              </Button>
            </div>

            {consultationMessage && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                consultationStatus === 'success' ? 'bg-green-50 text-green-700' :
                consultationStatus === 'error' ? 'bg-red-50 text-red-700' :
                'bg-blue-50 text-blue-700'
              }`}>
                {consultationStatus === 'success' && <Check className="h-4 w-4" />}
                {consultationStatus === 'error' && <AlertCircle className="h-4 w-4" />}
                {consultationUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span className="text-sm">{consultationMessage}</span>
              </div>
            )}

            <Button
              onClick={handleConsultationUpload}
              disabled={!consultationFile || consultationUploading || consultationStatus === 'success'}
              className="w-full"
            >
              {consultationUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {consultationStatus === 'success' ? '✓ Leads Database Uploaded' : 'Upload Leads Database'}
            </Button>
          </div>

          {/* Test Data Upload Section - Second */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <h3 className="font-semibold text-gray-800">📊 Xiaowang Advertising</h3>
              {testStatus === 'success' && <Check className="h-4 w-4 text-green-600" />}
            </div>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                testFile
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400 bg-gray-50'
              }`}
              onDragOver={handleDragOver}
              onDrop={handleTestDrop}
            >
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                {testFile ? testFile.name : 'Drag & drop Xiaowang Advertising CSV file here or click to browse'}
              </p>
              <Input
                ref={testFileInputRef}
                type="file"
                accept=".csv,.xlsx"
                onChange={handleTestFileSelect}
                className="hidden"
                id="test-file-upload"
                key="test-input"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('Test file button clicked');
                  testFileInputRef.current?.click();
                }}
                disabled={testUploading}
              >
                Browse Xiaowang Advertising File
              </Button>
            </div>

            {testMessage && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                testStatus === 'success' ? 'bg-green-50 text-green-700' :
                testStatus === 'error' ? 'bg-red-50 text-red-700' :
                'bg-blue-50 text-blue-700'
              }`}>
                {testStatus === 'success' && <Check className="h-4 w-4" />}
                {testStatus === 'error' && <AlertCircle className="h-4 w-4" />}
                {testUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span className="text-sm">{testMessage}</span>
              </div>
            )}

            <Button
              onClick={handleTestUpload}
              disabled={!testFile || testUploading || testStatus === 'success'}
              className="w-full"
            >
              {testUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {testStatus === 'success' ? '✓ Xiaowang Advertising Uploaded' : 'Upload Xiaowang Advertising'}
            </Button>
          </div>
        </div>

      </CardContent>
    </Card>
  )
}