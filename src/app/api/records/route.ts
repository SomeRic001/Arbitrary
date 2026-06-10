import { NextResponse } from "next/server";
import { RecordService } from "@/src/services/record.service";

export const revalidate = 0;

export async function GET() {
  const result = await RecordService.getRecords();
  if (!result.success) {
    return NextResponse.json({ success: false, message: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, records: result.data }, { status: 200 });
}
