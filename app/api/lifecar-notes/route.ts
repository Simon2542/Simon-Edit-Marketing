import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Always return empty data to force upload
    console.log('Notes API called - returning empty data to force upload')
    return NextResponse.json({
      success: true,
      data: [],
      total: 0,
      message: '请上传Excel文件以查看数据'
    })

  } catch (error) {
    console.error('Error in notes API:', error)
    return NextResponse.json({
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}