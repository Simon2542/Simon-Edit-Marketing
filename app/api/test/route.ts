import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Test API endpoint working", timestamp: new Date().toISOString() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({ 
      message: "Test POST endpoint working", 
      receivedData: body,
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    return NextResponse.json({ 
      message: "Test POST endpoint working (no JSON body)", 
      timestamp: new Date().toISOString() 
    });
  }
}