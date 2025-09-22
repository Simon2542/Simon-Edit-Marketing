import { NextResponse } from 'next/server'
import { getXiaoWangTestNotesStore } from './notes-store'

export async function GET() {
  try {
    const store = getXiaoWangTestNotesStore()
    const data = store.getData()
    const source = store.getSource()

    console.log('XiaoWang Test Notes API: Retrieved data from memory:', data.length, 'notes')

    return NextResponse.json({
      success: true,
      data: data,
      source: source,
      total: data.length
    })
  } catch (error) {
    console.error('Error fetching xiaowang test notes:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch notes',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}