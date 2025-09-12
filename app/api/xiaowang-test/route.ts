import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";

// Helper function to parse CSV
function parseCSVLine(line: string): string[] {
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
}

// Helper function to parse date from various formats
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  // Handle D/M/YYYY format (e.g., "31/10/2024")
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const year = parseInt(parts[2]);
      return new Date(year, month - 1, day);
    }
  }
  
  // Try standard date parsing
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

export async function GET() {
  try {
    // Read the CSV file for 小王测试 data
    const csvPath = path.join(process.cwd(), "full data", "账户-小王投放数据（~9.9）.csv");
    const xlsmPath = path.join(process.cwd(), "marketing_data.xlsm");
    
    let adData = [];
    let brokerData = [];
    
    // Read advertising data from CSV
    if (fs.existsSync(csvPath)) {
      const csvContent = fs.readFileSync(csvPath, 'utf-8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      if (lines.length > 0) {
        // Remove BOM if present
        let firstLine = lines[0];
        if (firstLine.charCodeAt(0) === 0xFEFF) {
          firstLine = firstLine.substring(1);
          lines[0] = firstLine;
        }
        
        const headers = parseCSVLine(lines[0]);
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = parseCSVLine(line);
          const row: any = {};
          
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          
          // Parse the date and numeric values
          const date = parseDate(row['时间']);
          
          adData.push({
            date: row['时间'],
            dateObj: date,
            cost: parseFloat(row['消费']) || 0,
            impressions: parseInt(row['展现量']) || 0,
            clicks: parseInt(row['点击量']) || 0,
            clickRate: parseFloat(row['点击率']?.replace('%', '')) || 0,
            avgClickCost: parseFloat(row['平均点击成本']) || 0,
            likes: parseInt(row['点赞']) || 0,
            comments: parseInt(row['评论']) || 0,
            favorites: parseInt(row['收藏']) || 0,
            follows: parseInt(row['关注']) || 0,
            shares: parseInt(row['分享']) || 0,
            interactions: parseInt(row['互动量']) || 0,
            avgInteractionCost: parseFloat(row['平均互动成本']) || 0,
            actionClicks: parseInt(row['行动按钮点击量']) || 0,
            actionClickRate: parseFloat(row['行动按钮点击率']?.replace('%', '')) || 0,
            conversions: parseInt(row['多转化人数（添加企微+私信咨询）']) || 0,
            conversionCost: parseFloat(row['多转化成本（添加企微+私信咨询）']) || 0
          });
        }
      }
    }
    
    // Read broker data from XLSM file
    if (fs.existsSync(xlsmPath)) {
      try {
        const buffer = fs.readFileSync(xlsmPath);
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        
        // Process broker data from Clients_info sheet
        const clientSheetName = "Clients_info（new）";
        if (workbook.Sheets[clientSheetName]) {
          const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[clientSheetName]);
          
          brokerData = rawData.map((item: any) => ({
            no: item['No.'] || item.no,
            broker: item['Broker'] || item.broker,
            date: item['日期'] || item.date,
            wechat: item['微信'] || item.wechat,
            source: item['来源'] || item.source
          }));
        }
      } catch (error) {
        console.error('Error reading XLSM file:', error);
      }
    }
    
    // Combine the data
    const combinedData = {
      adData: adData,
      brokerData: brokerData,
      summary: {
        totalCost: adData.reduce((sum, d) => sum + d.cost, 0),
        totalImpressions: adData.reduce((sum, d) => sum + d.impressions, 0),
        totalClicks: adData.reduce((sum, d) => sum + d.clicks, 0),
        totalInteractions: adData.reduce((sum, d) => sum + d.interactions, 0),
        totalConversions: adData.reduce((sum, d) => sum + d.conversions, 0),
        totalBrokerClients: brokerData.length,
        avgClickRate: adData.length > 0 ? 
          adData.reduce((sum, d) => sum + d.clickRate, 0) / adData.length : 0,
        avgConversionCost: adData.filter(d => d.conversions > 0).length > 0 ?
          adData.filter(d => d.conversions > 0).reduce((sum, d) => sum + d.conversionCost, 0) / 
          adData.filter(d => d.conversions > 0).length : 0
      }
    };
    
    return NextResponse.json({
      message: "小王测试 data loaded successfully",
      data: combinedData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error("Error loading 小王测试 data:", error);
    return NextResponse.json({
      error: "Failed to load 小王测试 data",
      details: error.message
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    let results = {
      adData: [],
      brokerData: [],
      summary: {}
    };
    
    // Process CSV file for ad data
    if (file.name.endsWith('.csv')) {
      let text = buffer.toString('utf-8');
      if (text.charCodeAt(0) === 0xFEFF) {
        text = text.substring(1);
      }
      
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length > 0) {
        const headers = parseCSVLine(lines[0]);
        const adData = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line || line.startsWith('合计')) continue;
          
          const values = parseCSVLine(line);
          const row: any = {};
          
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          
          const date = parseDate(row['时间']);
          
          adData.push({
            date: row['时间'],
            dateObj: date,
            cost: parseFloat(row['消费']) || 0,
            impressions: parseInt(row['展现量']) || 0,
            clicks: parseInt(row['点击量']) || 0,
            clickRate: parseFloat(row['点击率']?.replace('%', '')) || 0,
            avgClickCost: parseFloat(row['平均点击成本']) || 0,
            likes: parseInt(row['点赞']) || 0,
            comments: parseInt(row['评论']) || 0,
            favorites: parseInt(row['收藏']) || 0,
            follows: parseInt(row['关注']) || 0,
            shares: parseInt(row['分享']) || 0,
            interactions: parseInt(row['互动量']) || 0,
            avgInteractionCost: parseFloat(row['平均互动成本']) || 0,
            actionClicks: parseInt(row['行动按钮点击量']) || 0,
            actionClickRate: parseFloat(row['行动按钮点击率']?.replace('%', '')) || 0,
            conversions: parseInt(row['多转化人数（添加企微+私信咨询）']) || 0,
            conversionCost: parseFloat(row['多转化成本（添加企微+私信咨询）']) || 0
          });
        }
        
        results.adData = adData;
      }
    }
    
    // Process Excel file for broker data
    else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xlsm')) {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      
      const clientSheetName = "Clients_info（new）";
      if (workbook.Sheets[clientSheetName]) {
        const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[clientSheetName]);
        
        results.brokerData = rawData.map((item: any) => ({
          no: item['No.'] || item.no,
          broker: item['Broker'] || item.broker,
          date: item['日期'] || item.date,
          wechat: item['微信'] || item.wechat,
          source: item['来源'] || item.source
        }));
      }
    }
    
    // Calculate summary
    results.summary = {
      totalCost: results.adData.reduce((sum: number, d: any) => sum + d.cost, 0),
      totalImpressions: results.adData.reduce((sum: number, d: any) => sum + d.impressions, 0),
      totalClicks: results.adData.reduce((sum: number, d: any) => sum + d.clicks, 0),
      totalInteractions: results.adData.reduce((sum: number, d: any) => sum + d.interactions, 0),
      totalConversions: results.adData.reduce((sum: number, d: any) => sum + d.conversions, 0),
      totalBrokerClients: results.brokerData.length
    };
    
    return NextResponse.json({
      message: "File processed successfully",
      data: results,
      filename: file.name
    });
    
  } catch (error: any) {
    console.error("Error processing file:", error);
    return NextResponse.json({
      error: "Failed to process file",
      details: error.message
    }, { status: 500 });
  }
}