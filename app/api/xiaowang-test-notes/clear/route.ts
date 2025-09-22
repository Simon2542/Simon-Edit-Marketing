import { NextResponse } from 'next/server'
import { getXiaoWangTestNotesStore } from '../notes-store'

export async function DELETE() {
  try {
    const store = getXiaoWangTestNotesStore()
    store.clear()
    console.log('XiaoWang Test Notes: Cleared all data from memory')

    return NextResponse.json({
      success: true,
      message: 'All data cleared successfully'
    })
  } catch (error) {
    console.error('Error clearing xiaowang test notes:', error)
    return NextResponse.json({
      error: 'Failed to clear data',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}