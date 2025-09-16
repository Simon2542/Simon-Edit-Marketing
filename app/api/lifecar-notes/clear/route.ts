import { NextResponse } from 'next/server'
import { getNotesStore } from '../notes-store'

export async function DELETE() {
  try {
    const store = getNotesStore()

    // Clear data from memory store
    store.clearData()

    return NextResponse.json({
      success: true,
      message: '数据已清除'
    })
    
  } catch (error) {
    console.error('Error clearing data:', error)
    return NextResponse.json({ 
      error: 'Failed to clear data',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}