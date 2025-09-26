'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { X, ExternalLink, FileText, Upload, Trash2 } from "lucide-react"

interface LifeCarNote {
  发布时间: string
  类型: string
  名称: string
  链接: string
}

interface LifeCarNotesModalProps {
  isOpen: boolean
  onClose: () => void
  onDateSelect?: (date: string) => void
  selectedDates?: string[]
  onDataUpdate?: (data: LifeCarNote[]) => void
  initialData?: LifeCarNote[] // 父组件传递的已有数据
}

export function LifeCarNotesModal({ isOpen, onClose, onDateSelect, selectedDates = [], onDataUpdate, initialData = [] }: LifeCarNotesModalProps) {
  const [notes, setNotes] = useState<LifeCarNote[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dataSource, setDataSource] = useState<'uploaded' | 'default' | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      // 优先使用父组件传递的数据
      if (initialData && initialData.length > 0) {
        // 排序数据：按发布时间从晚到早
        const sortedInitialData = [...initialData].sort((a, b) => {
          const dateA = new Date(a.发布时间).getTime()
          const dateB = new Date(b.发布时间).getTime()
          return dateB - dateA
        })
        setNotes(sortedInitialData)
        setDataSource('uploaded')
        setError(null)
      } else {
        // 如果没有初始数据，才调用API
        fetchNotes()
      }
    }
  }, [isOpen, initialData])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const fetchNotes = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/lifecar-notes')
      if (!response.ok) {
        throw new Error('Failed to fetch notes')
      }
      const result = await response.json()
      if (result.success) {
        // 排序数据：按发布时间从晚到早
        const sortedData = (result.data || []).sort((a, b) => {
          const dateA = new Date(a.发布时间).getTime()
          const dateB = new Date(b.发布时间).getTime()
          return dateB - dateA
        })
        setNotes(sortedData)
        setDataSource(result.source || null)
      } else {
        throw new Error(result.error || 'Unknown error')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notes')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/lifecar-notes/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to upload file')
      }

      const result = await response.json()
      if (result.success) {
        // 排序数据：按发布时间从晚到早
        const sortedData = (result.data || []).sort((a, b) => {
          const dateA = new Date(a.发布时间).getTime()
          const dateB = new Date(b.发布时间).getTime()
          return dateB - dateA
        })
        setNotes(sortedData)
        setDataSource('uploaded')
        // Notify parent component of data update
        if (onDataUpdate) {
          onDataUpdate(sortedData)
        }
        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const handleClearData = async () => {
    if (!confirm('确定要清除所有数据吗？')) return

    try {
      const response = await fetch('/api/lifecar-notes/clear', {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to clear data')
      }

      setNotes([])
      setError(null)
      setDataSource(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear data')
    }
  }

  const handleNoteTitleClick = (url: string) => {
    if (url && url.trim()) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  // Convert note date format (2025-09-11 12:59:29) to chart date format (2025-09-11)
  const convertDateFormat = (noteDate: string): string => {
    if (!noteDate) return ''
    return noteDate.split(' ')[0] // Extract just the date part
  }

  const handleDateClick = (noteDate: string) => {
    if (onDateSelect) {
      onDateSelect(noteDate) // Pass full date, conversion happens in parent
    }
  }
  
  // Check if a date is selected
  const isDateSelected = (noteDate: string) => {
    const chartDate = convertDateFormat(noteDate)
    return selectedDates.includes(chartDate)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-4xl mx-4 bg-white rounded-lg shadow-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">LifeCar 笔记列表</h2>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
              id="lifecar-file-upload"
            />
            <label htmlFor="lifecar-file-upload">
              <Button
                variant="outline"
                size="sm"
                disabled={uploading}
                className="cursor-pointer"
                asChild
              >
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? '上传中...' : '上传文件'}
                </span>
              </Button>
            </label>
            {notes.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearData}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                清除数据
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-gray-600">加载中...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <div className="text-red-600 mb-2">加载失败</div>
              <div className="text-gray-500 text-sm mb-4">{error}</div>
              <Button onClick={fetchNotes} variant="outline" size="sm">
                重试
              </Button>
            </div>
          )}

          {!loading && !error && notes.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              没有找到笔记数据
            </div>
          )}

          {!loading && !error && notes.length > 0 && (
            <div className="space-y-4">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 p-3 bg-gray-50 rounded-lg font-medium text-gray-700">
                <div className="col-span-3">发布时间</div>
                <div className="col-span-2">类型</div>
                <div className="col-span-7">笔记名称</div>
              </div>

              {/* Table Rows */}
              {notes.map((note, index) => (
                <div 
                  key={index}
                  className="grid grid-cols-12 gap-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="col-span-3 text-sm">
                    <button
                      onClick={() => handleDateClick(note.发布时间)}
                      className={`text-left transition-all cursor-pointer px-2 py-1 rounded ${
                        isDateSelected(note.发布时间)
                          ? 'bg-purple-100 text-purple-700 font-semibold'
                          : 'text-gray-600 hover:text-purple-600 hover:underline'
                      }`}
                      title={isDateSelected(note.发布时间) ? "点击取消选中" : "点击在图表中高亮此日期"}
                    >
                      {isDateSelected(note.发布时间) && '✓ '}
                      {note.发布时间}
                    </button>
                  </div>
                  <div className="col-span-2">
                    <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                      {note.类型}
                    </span>
                  </div>
                  <div className="col-span-7">
                    {note.链接 && note.链接.trim() ? (
                      <button
                        onClick={() => handleNoteTitleClick(note.链接)}
                        className="text-left w-full text-purple-600 hover:text-purple-800 hover:underline flex items-center gap-1 group"
                        title="点击打开链接"
                      >
                        <span>{note.名称}</span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ) : (
                      <span className="text-gray-800">{note.名称}</span>
                    )}
                  </div>
                </div>
              ))}

              {/* Footer Info */}
              <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-200">
                共 {notes.length} 条记录
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}