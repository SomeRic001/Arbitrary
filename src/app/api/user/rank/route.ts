import { getUserRankInfo } from "@/src/db/user-queries";
import { requireUser } from "@/src/services/auth.service";
import { NextResponse } from "next/server";



export async function GET() {
    const auth = await requireUser();
    if (!auth.success) {
        return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    if (auth.data.role === "ADMIN" || auth.data.role === "admin") {
        return NextResponse.json({ rank: null });
    }

    const info = await getUserRankInfo(auth.data.id);
    if (!info) {
        return NextResponse.json({ rank: null });
    }


    return NextResponse.json({
        rank: info.rank,
        points: info.points,
        tier: info.tier
    })
}