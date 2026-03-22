import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { listingPhotos, listings } from "@/db/schema";
import { inngest } from "@/inngest/client";
import {
  addPhotoToListing,
  removePhotoFromListing,
  reorderPhotos,
} from "@/services/listing/photos";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/listings/[id]
 *
 * Fetch a single listing by ID with its photos.
 * Draft listings are only visible to the owning seller.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const { userId } = await auth();
  const { id } = await params;

  const listing = await db.query.listings.findFirst({
    where: eq(listings.id, id),
    with: { photos: true },
  });

  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Draft listings are private — only the owner can see them
  if (listing.status === "draft" && listing.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ listing });
}

/**
 * PATCH /api/listings/[id]
 *
 * Update allowed fields on a listing the authenticated user owns.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await db.query.listings.findFirst({
    where: eq(listings.id, id),
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  // ── Photo operations ──────────────────────────────────────────────────────

  if (body.addPhoto) {
    const { r2Key, r2Url } = body.addPhoto as { r2Key: string; r2Url: string };
    const newPhotoId = crypto.randomUUID();

    await db.insert(listingPhotos).values({
      id: newPhotoId,
      listingId: id,
      r2Key,
      r2Url,
    });

    await addPhotoToListing(id, newPhotoId);

    revalidateTag("listings", "default");

    return NextResponse.json({
      photo: { id: newPhotoId, r2Key, r2Url },
    });
  }

  if (body.removePhoto) {
    await removePhotoFromListing(id, body.removePhoto as string);

    revalidateTag("listings", "default");

    return NextResponse.json({ success: true });
  }

  if (body.reorderPhotos) {
    await reorderPhotos(id, body.reorderPhotos as string[]);

    revalidateTag("listings", "default");

    return NextResponse.json({ success: true });
  }

  // ── Normal field update (allowlist to prevent column injection) ───────────

  const ALLOWED_FIELDS = new Set([
    "streetAddress",
    "city",
    "state",
    "zip",
    "propertyType",
    "price",
    "bedrooms",
    "bathrooms",
    "sqft",
    "lotSizeSqft",
    "yearBuilt",
    "description",
    "descriptionStatus",
    "status",
  ]);

  const safeFields = Object.fromEntries(
    Object.entries(body).filter(([key]) => ALLOWED_FIELDS.has(key)),
  );

  // Set publishedAt timestamp when status transitions to 'active'
  const publishNow = safeFields.status === "active" && existing.status !== "active";

  const [updated] = await db
    .update(listings)
    .set({
      ...safeFields,
      ...(publishNow ? { publishedAt: new Date() } : {}),
      updatedAt: new Date(),
    })
    .where(eq(listings.id, id))
    .returning();

  revalidateTag("listings", "default");

  // Fire listing/published event for MLS syndication (fire-and-forget)
  if (publishNow) {
    await inngest.send({
      name: "listing/published",
      data: { listingId: id, sellerUserId: userId },
    });
  }

  return NextResponse.json({ listing: updated });
}

/**
 * DELETE /api/listings/[id]
 *
 * Delete a listing the authenticated user owns. Photos cascade via FK.
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await db.query.listings.findFirst({
    where: eq(listings.id, id),
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.delete(listings).where(eq(listings.id, id));

  return new NextResponse(null, { status: 204 });
}
