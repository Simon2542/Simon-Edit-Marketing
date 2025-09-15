import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function DELETE() {
  try {
    const dataPath = path.join(process.cwd(), 'public', 'lifecar-notes-data.json')
    
    // Check if file exists and delete it
    if (fs.existsSync(dataPath)) {
      fs.unlinkSync(dataPath)
    }

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