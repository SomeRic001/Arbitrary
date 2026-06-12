import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { success: false, error: "API endpoint not found" },
    { status: 404 }
  );
}

export async function POST() {
  return NextResponse.json(
    { success: false, error: "API endpoint not found" },
    { status: 404 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { success: false, error: "API endpoint not found" },
    { status: 404 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { success: false, error: "API endpoint not found" },
    { status: 404 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, error: "API endpoint not found" },
    { status: 404 }
  );
}
