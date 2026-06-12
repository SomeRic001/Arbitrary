import { NextRequest, NextResponse } from "next/server";
import { TaskService } from "@/src/services/task.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ shareCode: string }> },
) {
  const { shareCode } = await params;

  const result = await TaskService.getShareProgress(shareCode);

  if (!result.success) {
    return NextResponse.json(
      { error: "not_found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    clickCount: result.data.current,
    threshold: result.data.threshold,
    completed: result.data.current >= result.data.threshold,
  });
}
