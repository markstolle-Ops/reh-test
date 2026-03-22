import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { deleteSavedSearch } from "@/services/search/saved-searches";

/**
 * DELETE /api/saved-searches/[id]
 *
 * Deletes a saved search if it belongs to the authenticated user.
 * Returns 200 on success.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await deleteSavedSearch(userId, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/saved-searches/:id] error:", error);
    return NextResponse.json({ error: "Failed to delete saved search" }, { status: 500 });
  }
}
