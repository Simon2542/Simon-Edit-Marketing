import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import path from 'path'
import fs from 'fs'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'full data', 'LifeCar笔记.xlsx')
    console.log('Trying to access file at:', filePath)
    console.log('File exists:', fs.existsSync(filePath))
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: `Excel file not found at: ${filePath}` }, { status: 404 })
    }

    const fileBuffer = fs.readFileSync(filePath)
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
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
    
    return NextResponse.json({ 
      success: true, 
      data: processedData,
      total: processedData.length
    })
    
  } catch (error) {
    console.error('Error processing Excel file:', error)
    return NextResponse.json({ 
      error: 'Failed to process Excel file',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}