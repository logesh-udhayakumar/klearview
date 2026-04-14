import { NextRequest, NextResponse } from "next/server";
import { updateVendorStatus } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, name, remarks } = body;

    if (!status || !name || !remarks) {
      return NextResponse.json(
        { error: "Status, Name, and Remarks are required" },
        { status: 400 }
      );
    }

    const success = await updateVendorStatus(id, status, name, remarks);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to update vendor status" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API Error updating vendor status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
