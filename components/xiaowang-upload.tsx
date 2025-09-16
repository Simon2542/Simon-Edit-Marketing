"use client"

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, FileSpreadsheet, Check, AlertCircle, Loader2 } from 'lucide-react'

interface XiaowangUploadProps {
  onUploadSuccess?: (data?: any) => void
}

export function XiaowangUpload({ onUploadSuccess }: XiaowangUploadProps) {
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
      setMessage('请先选择一个文件')
      setUploadStatus('error')
      return
    }

    setIsUploading(true)
    setUploadStatus('idle')
    setMessage('正在处理文件...')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('accountType', 'xiaowang')

      console.log('上传文件:', selectedFile.name, '大小:', selectedFile.size)

      const response = await fetch(`${window.location.origin}/api/xiaowang-data`, {
        method: 'POST',
        body: formData,
      })

      console.log('响应状态:', response.status, response.statusText)

      if (!response.ok) {
        console.error('响应错误:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('错误响应内容:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      console.log('响应数据:', result)

      if (response.ok) {
        setUploadStatus('success')
        setMessage(`成功上传 ${selectedFile.name}。数据已更新！`)
        setSelectedFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }

        // 调用成功回调
        if (onUploadSuccess) {
          onUploadSuccess(result.data)
        }
      } else {
        setUploadStatus('error')
        setMessage(result.error || `上传失败 (${response.status})`)
      }
    } catch (error: any) {
      setUploadStatus('error')
      setMessage(`网络错误: ${error.message || '连接失败'}`)
      console.error('上传错误:', error)
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
      if (file.name.endsWith('.csv') || file.name.endsWith('.xlsx')) {
        setSelectedFile(file)
        setUploadStatus('idle')
        setMessage('')
      } else {
        setMessage('请选择CSV或Excel文件 (.csv 或 .xlsx)')
        setUploadStatus('error')
      }
    }
  }


  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          上传小王测试数据
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 文件拖放区域 */}
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
          <p className="text-sm text-gray-600 mb-2">
            {selectedFile ? selectedFile.name : '拖放CSV文件到这里或点击浏览'}
          </p>
          <Input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx"
            onChange={handleFileSelect}
            className="hidden"
            id="xiaowang-file-upload"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            浏览文件
          </Button>
        </div>

        {/* 上传按钮 */}
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              上传中...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              上传并更新数据
            </>
          )}
        </Button>

        {/* 状态消息 */}
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

        {/* 说明 */}
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>支持的文件格式：</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>CSV文件 (.csv)</li>
            <li>Excel文件 (.xlsx)</li>
          </ul>
          <p className="mt-2"><strong>文件要求：</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>包含时间、消费、展现量、点击量等指标</li>
            <li>支持小王投放数据格式</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}