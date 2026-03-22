import { auth } from "@clerk/nextjs/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { listings } from "@/db/schema";

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

/**
 * POST /api/upload/presign
 *
 * Generates a presigned PUT URL for uploading a photo directly to Cloudflare R2.
 * The client uploads directly to R2, then saves the key/url to the listing.
 * Validates content type and listing ownership before issuing URL.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { fileName, contentType, listingId } = body as {
    fileName: string;
    contentType: string;
    listingId: string;
  };

  if (!fileName || !contentType || !listingId) {
    return NextResponse.json(
      { error: "fileName, contentType, and listingId are required" },
      { status: 400 }
    );
  }

  // Validate content type — prevent non-image uploads
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    return NextResponse.json(
      { error: "Unsupported content type. Allowed: JPEG, PNG, WebP, GIF" },
      { status: 400 }
    );
  }

  // Verify the listing belongs to this user
  const listing = await db.query.listings.findFirst({
    where: eq(listings.id, listingId),
    columns: { userId: true },
  });

  if (!listing || listing.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const r2Client = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT!,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  const key = `listings/${listingId}/${crypto.randomUUID()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(r2Client, command, { expiresIn: 300 });

  return NextResponse.json({
    uploadUrl: url,
    key,
    publicUrl: `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`,
  });
}
