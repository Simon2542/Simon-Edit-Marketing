import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
    
    if (rawData.length < 2) {
      return NextResponse.json({ error: 'Excel file must have at least 2 rows' }, { status: 400 })
    }

    // Remove first row, use second row as headers
    const headers = rawData[1] as string[]
    const dataRows = rawData.slice(2) as any[][]
    
    // Convert to objects with headers as keys
    const data = dataRows.map(row => {
      const obj: any = {}
      headers.forEach((header, index) => {
        obj[header] = row[index] || ''
      })
      return obj
    })
    
    // Filter out rows with "笔记违规" or "仅自己可见" status, and rows starting with "专业号行业"
    const filteredData = data.filter(row => {
      const status = row['笔记状态'] || ''
      const publishTime = row['笔记发布时间'] || ''
      return status !== '笔记违规' && status !== '仅自己可见' && !publishTime.toString().startsWith('专业号行业')
    })
    
    // Only return specific columns: 笔记发布时间, 笔记类型, 笔记名称, 笔记链接
    const processedData = filteredData.map(row => ({
      发布时间: row['笔记发布时间'] || '',
      类型: row['笔记类型'] || '',
      名称: row['笔记名称'] || '',
      链接: row['笔记链接'] || ''
    }))

    // Save to JSON file in public directory for persistence
    const dataPath = path.join(process.cwd(), 'public', 'lifecar-notes-data.json')
    fs.writeFileSync(dataPath, JSON.stringify(processedData, null, 2))

    return NextResponse.json({ 
      success: true, 
      data: processedData,
      total: processedData.length,
      message: `成功上传 ${processedData.length} 条记录`
    })
    
  } catch (error) {
    console.error('Error processing uploaded file:', error)
    return NextResponse.json({ 
      error: 'Failed to process uploaded file',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}