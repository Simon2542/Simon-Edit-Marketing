import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST() {
  try {
    console.log('Refreshing data using manual refresh script...');
    
    // Use child_process to run the manual refresh script
    const { stdout, stderr } = await execAsync('node manual-refresh.js', {
      cwd: process.cwd()
    });
    
    if (stderr) {
      console.error('Script error:', stderr);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error running refresh script',
          details: stderr
        },
        { status: 500 }
      );
    }
    
    console.log('Script output:', stdout);
    
    // Force a small delay to ensure files are written
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return NextResponse.json({ 
      success: true, 
      message: 'Data refreshed successfully',
      output: stdout
    });
  } catch (error: any) {
    console.error('Error processing Excel file:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to refresh data',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}