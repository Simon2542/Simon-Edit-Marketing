import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";

// Helper function to generate missing weekly data from clients_info
function generateMissingWeeklyData(existingWeeklyData: any[], clientsData: any[]) {
  // Create a map of existing weeks
  const existingWeeks = new Set(existingWeeklyData.map(w => w.week));
  
  // Group clients by week
  const clientsByWeek: { [week: string]: any[] } = {};
  
  clientsData.forEach(client => {
    const clientDate = parseExcelDate(client.date);
    if (clientDate) {
      const weekStr = getWeekString(clientDate);
      if (!clientsByWeek[weekStr]) {
        clientsByWeek[weekStr] = [];
      }
      clientsByWeek[weekStr].push(client);
    }
  });
  
  // Generate missing weeks
  const missingWeeks: any[] = [];
  Object.keys(clientsByWeek).forEach(weekStr => {
    if (!existingWeeks.has(weekStr)) {
      const leadsCount = clientsByWeek[weekStr].length;
      // Estimate cost based on average from existing data
      const avgCostPerLead = existingWeeklyData.length > 0 
        ? existingWeeklyData.reduce((sum, w) => sum + (w.totalCost || 0), 0) / 
          existingWeeklyData.reduce((sum, w) => sum + (w.leadsTotal || 0), 0)
        : 20; // Default cost per lead if no existing data
      
      const estimatedCost = leadsCount * avgCostPerLead;
      
      missingWeeks.push({
        week: weekStr,
        totalCost: estimatedCost,
        leadsTotal: leadsCount,
        leadsPrice: leadsCount > 0 ? estimatedCost / leadsCount : 0,
        _isEstimated: true // 标记为估算数据
      });
    }
  });
  
  // Combine existing and missing weeks, then sort
  const allWeeks = [...existingWeeklyData, ...missingWeeks];
  allWeeks.sort((a, b) => {
    const parseWeek = (week: string) => {
      const match = week.match(/(\d{4})\/wk(\d+)/);
      if (match) {
        const year = parseInt(match[1]);
        const weekNum = parseInt(match[2]);
        return year * 100 + weekNum;
      }
      return 0;
    };
    return parseWeek(a.week) - parseWeek(b.week);
  });
  
  return allWeeks;
}

// Helper function to parse Excel date serial number
function parseExcelDate(excelDate: any): Date | null {
  if (typeof excelDate === 'number') {
    // Excel date serial number
    const excelBase = new Date(1899, 11, 30);
    return new Date(excelBase.getTime() + excelDate * 24 * 60 * 60 * 1000);
  } else if (typeof excelDate === 'string') {
    // Try to parse as date string
    const date = new Date(excelDate);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}

// Helper function to get week string from date (consistent with existing logic)
function getWeekString(date: Date): string {
  const year = date.getFullYear();
  
  // Use the same logic as the component to find first Monday
  const firstDay = new Date(year, 0, 1);
  const dayOfWeek = firstDay.getDay();
  const firstMonday = new Date(firstDay);
  firstMonday.setDate(firstDay.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
  
  // Find the Monday of the week containing this date
  const targetDayOfWeek = date.getDay();
  const mondayOfTargetWeek = new Date(date);
  mondayOfTargetWeek.setDate(date.getDate() - targetDayOfWeek + (targetDayOfWeek === 0 ? -6 : 1));
  
  // Calculate week number
  const daysDiff = Math.floor((mondayOfTargetWeek.getTime() - firstMonday.getTime()) / (24 * 60 * 60 * 1000));
  const weekNum = Math.floor(daysDiff / 7) + 1;
  
  // Handle edge cases for negative week numbers or very large week numbers
  if (weekNum <= 0) {
    // This belongs to previous year's last week
    return getWeekString(new Date(year - 1, 11, 31));
  } else if (weekNum > 53) {
    // This might belong to next year's first week
    return `${year + 1}/wk01`;
  }
  
  return `${year}/wk${weekNum.toString().padStart(2, '0')}`;
}

// Helper function to process Excel data from file path
async function processExcelData(filePath: string) {
  console.log('Processing Excel file:', filePath);
  
  // Check if file exists and is accessible
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  // Check file permissions
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
  } catch (error) {
    throw new Error(`Cannot access file ${filePath}. Make sure the file is not open in Excel or another program.`);
  }

  let workbook;
  let retries = 3;
  
  while (retries > 0) {
    try {
      // Try to read with different options to handle file locks
      const buffer = fs.readFileSync(filePath);
      workbook = XLSX.read(buffer, { type: 'buffer' });
      break;
    } catch (error: any) {
      if ((error.code === 'EBUSY' || error.code === 'ENOENT') && retries > 1) {
        console.log(`File busy/not found, retrying... (${retries - 1} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries--;
      } else {
        throw new Error(`Failed to read Excel file: ${error.message}. Please close the file in Excel if it's open.`);
      }
    }
  }

  if (!workbook) {
    throw new Error('Failed to read workbook');
  }
  return await processWorkbook(workbook);
}

// Helper function to process Excel data from buffer (for uploads)
async function processExcelBuffer(buffer: Buffer) {
  console.log('Processing Excel buffer, size:', buffer.length);
  
  let workbook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer' });
  } catch (error: any) {
    throw new Error(`Failed to read Excel buffer: ${error.message}`);
  }

  if (!workbook) {
    throw new Error('Failed to read workbook from buffer');
  }
  return await processWorkbook(workbook);
}

// Common workbook processing function
async function processWorkbook(workbook: XLSX.WorkBook) {
  
  console.log('Available sheets:', workbook.SheetNames);
  
  // Process different sheets and generate corresponding JSON files
  const results = {
    broker_data: [] as any[],
    weekly_data: [] as any[],
    monthly_data: [] as any[],
    daily_cost_data: [] as any[]
  };

  // Process broker data from main sheet
  const clientSheetName = "Clients_info（new）";
  if (workbook.Sheets[clientSheetName]) {
    console.log('Processing client data...');
    try {
      const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[clientSheetName]);
      console.log(`Found ${rawData.length} raw client records`);
      
      // Transform data to match expected format
      const clientData = rawData.map((item: any) => ({
        no: item['No.'] || item.no,
        broker: item['Broker'] || item.broker,
        date: item['日期'] || item.date,
        wechat: item['微信'] || item.wechat,
        source: item['来源'] || item.source
      }));
      
      results.broker_data = clientData;
      console.log(`Processed ${clientData.length} broker records`);
    } catch (error: any) {
      console.error('Error processing client data:', error.message);
      throw new Error(`Failed to process client data: ${error.message}`);
    }
  } else {
    console.log(`Sheet "${clientSheetName}" not found. Available sheets:`, workbook.SheetNames);
  }

  // Process weekly data - use data directly from weekly_data sheet
  const weeklySheetName = "weekly_data";
  
  if (workbook.Sheets[weeklySheetName]) {
    console.log('Processing weekly_data sheet...');
    const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[weeklySheetName]);
    
    // Transform data to match expected format - directly from weekly_data sheet
    const weeklyData = rawData.map((item: any) => ({
      week: item['Week'] || item.week,
      totalCost: item['消费总额（aud)'] || item.totalCost || 0,
      leadsTotal: item['Leads总数'] || item.leadsTotal || 0,  // C列
      leadsPrice: item['Leads单价（aud）'] || item.leadsPrice || 0
    }));
    
    // Sort by week chronologically
    weeklyData.sort((a, b) => {
      const parseWeek = (week: string) => {
        const match = week.match(/(\d{4})\/wk(\d+)/);
        if (match) {
          const year = parseInt(match[1]);
          const weekNum = parseInt(match[2]);
          return year * 100 + weekNum;
        }
        return 0;
      };
      return parseWeek(a.week) - parseWeek(b.week);
    });
    
    // Generate missing weeks from clients_info data
    const clientsData = results.broker_data || [];
    const enhancedWeeklyData = generateMissingWeeklyData(weeklyData, clientsData);
    
    results.weekly_data = enhancedWeeklyData;
    
    const totalLeads = enhancedWeeklyData.reduce((sum, w) => sum + w.leadsTotal, 0);
    console.log(`Enhanced weekly data: ${enhancedWeeklyData.length} weeks, ${totalLeads} total leads`);
    
    console.log(`Processed ${enhancedWeeklyData.length} weekly records`);
  }

  // Process monthly data - combine cost data with actual client counts
  const monthlySheetName = "monthly_data";
  
  let monthlyData = [];
  
  if (workbook.Sheets[monthlySheetName]) {
    console.log('Processing monthly data...');
    const costData = XLSX.utils.sheet_to_json(workbook.Sheets[monthlySheetName]);
    
    // Calculate actual monthly counts from broker_data (Clients_info)
    const monthlyClientCounts: { [month: string]: number } = {};
    
    if (results.broker_data && results.broker_data.length > 0) {
      results.broker_data.forEach((client: any) => {
        const clientDate = parseExcelDate(client.date);
        if (clientDate) {
          const year = clientDate.getFullYear();
          const month = clientDate.getMonth() + 1;
          const monthKey = `${year}/${month.toString().padStart(2, '0')}`;
          monthlyClientCounts[monthKey] = (monthlyClientCounts[monthKey] || 0) + 1;
        }
      });
      console.log('Monthly client counts from Clients_info:', monthlyClientCounts);
    }
    
    // Merge cost data with actual client counts
    monthlyData = costData.map((costItem: any) => {
      const month = costItem['月份'] || costItem.month;
      const actualCount = monthlyClientCounts[month] || 0;
      
      return {
        month: month,
        cost: costItem['消费总额（aud)'] || costItem.cost || 0,
        count: actualCount  // Use actual count from Clients_info
      };
    });
    
    // Also add any months that have clients but no cost data
    Object.keys(monthlyClientCounts).forEach(month => {
      if (!monthlyData.find((m: any) => m.month === month)) {
        monthlyData.push({
          month: month,
          cost: 0,
          count: monthlyClientCounts[month]
        });
      }
    });
    
    // Sort by month
    monthlyData.sort((a: any, b: any) => {
      return a.month.localeCompare(b.month);
    });
    
    results.monthly_data = monthlyData;
    
    console.log(`Processed ${monthlyData.length} monthly records with actual client counts`);
  }

  // Process daily cost data if exists (using database_marketing sheet)
  const dailySheetName = "database_marketing";
  if (workbook.Sheets[dailySheetName]) {
    console.log('Processing daily cost data...');
    const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[dailySheetName]);
    
    const dailyData = rawData.map((item: any) => ({
      date: item['时间'] || item.date,
      cost: ((item['消费'] || item.cost || 0) / 4.72) // Convert to AUD by dividing by 4.72
    }));
    
    results.daily_cost_data = dailyData;
    
    console.log(`Processed ${dailyData.length} daily cost records`);
  }

  console.log('Excel processing completed');
  return results;
}

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "marketing_data.xlsm");
    console.log("Attempting to read file:", filePath);

    if (!fs.existsSync(filePath)) {
      console.log("File not found, returning empty data:", filePath);
      // 在serverless环境中，如果没有本地文件，返回空数据结构
      return NextResponse.json({ 
        message: "No local data file found. Please upload an Excel file to populate the dashboard.",
        data: {
          broker_data: [],
          weekly_data: [],
          monthly_data: [],
          daily_cost_data: []
        },
        timestamp: new Date().toISOString()
      });
    }

    console.log("File exists, processing...");
    const results = await processExcelData(filePath);
    
    return NextResponse.json({ 
      message: "Data processed successfully",
      data: results,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Error reading Excel file:", error);
    return NextResponse.json({ 
      error: "Failed to read Excel file", 
      details: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}

// Helper function to process CSV buffer for LifeCAR data
async function processCSVBuffer(buffer: Buffer): Promise<any> {
  // Convert buffer to string and remove BOM if present
  let text = buffer.toString('utf-8');
  if (text.charCodeAt(0) === 0xFEFF) {
    text = text.substring(1);
  }
  
  const lines = text.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }
  
  // Parse CSV header - handle complex CSV with quotes
  const parseCSVLine = (line: string): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    if (current) {
      result.push(current.trim());
    }
    
    return result;
  };
  
  // Parse CSV header
  const headers = parseCSVLine(lines[0]);
  console.log('CSV Headers:', headers);
  
  // Parse CSV data - skip the summary row (row 2) if it exists
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Skip summary rows (e.g., "合计104条记录")
    if (line.startsWith('合计') || line.includes('条记录')) {
      console.log('Skipping summary row:', line.substring(0, 50));
      continue;
    }
    
    const values = parseCSVLine(line);
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    data.push(row);
  }
  
  console.log(`Parsed ${data.length} data rows from CSV`);
  
  // In production (Vercel), we can't write to the file system
  // So we'll only save locally if we're in development
  if (process.env.NODE_ENV === 'development') {
    try {
      const publicDir = path.join(process.cwd(), 'public', 'database_lifecar');
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      
      // Save the CSV file (keeping original format)
      const csvPath = path.join(publicDir, 'lifecar-data.csv');
      fs.writeFileSync(csvPath, text, 'utf-8');
      console.log('LifeCAR CSV saved locally to:', csvPath);
    } catch (error) {
      console.log('Could not save CSV file locally (expected in production):', error);
    }
  }
  
  // Return formatted data for LifeCAR
  return {
    broker_data: [],
    weekly_data: [],
    monthly_data: [],
    daily_cost_data: data,
    lifecar_data: data,
    csvContent: text // Include the raw CSV content for client-side processing
  };
}

export async function POST(request: Request) {
  try {
    console.log('POST /api/excel-data called - Start');
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    console.log('Request method:', request.method);
    console.log('Request URL:', request.url);
    
    const formData = await request.formData();
    console.log('FormData received, processing...');
    const file = formData.get("file") as File;
    const accountType = formData.get("accountType") as string;

    console.log('File received:', file ? file.name : 'No file', 'Size:', file?.size);

    if (!file) {
      console.log('No file provided in request');
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xlsm') && !file.name.endsWith('.csv')) {
      console.log('Invalid file type:', file.name);
      return NextResponse.json({ 
        error: "Invalid file type. Please upload an Excel (.xlsx, .xlsm) or CSV file" 
      }, { status: 400 });
    }

    console.log('Processing file:', file.name, 'Size:', file.size, 'Account Type:', accountType);

    // Process uploaded file buffer directly (no file system write needed)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    console.log('Processing buffer directly, size:', buffer.length);
    
    let results;
    
    // Check if it's a CSV file
    if (file.name.endsWith('.csv')) {
      console.log('Starting CSV processing for LifeCAR data...');
      results = await processCSVBuffer(buffer);
      console.log('CSV processing completed');
    } else {
      // Process Excel file
      console.log('Starting Excel processing...');
      results = await processExcelBuffer(buffer);
      console.log('Excel processing completed, results:', Object.keys(results));
    }

    return NextResponse.json({ 
      message: "File uploaded and processed successfully",
      data: results,
      filename: file.name,
      recordCounts: {
        broker_data: results.broker_data.length,
        weekly_data: results.weekly_data.length,
        monthly_data: results.monthly_data.length,
        daily_cost_data: results.daily_cost_data.length
      }
    });
  } catch (error: any) {
    console.error("Error processing uploaded file:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json({ 
      error: "Failed to process uploaded file",
      details: error.message,
      errorType: error.constructor.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}