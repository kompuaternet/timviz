import { randomUUID } from "crypto";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";

const DEFAULT_MEDIA_BUCKET = "timviz-media";
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

export type MediaUploadKind = "avatar" | "business-photo";

export function getMediaBucketName() {
  return process.env.SUPABASE_MEDIA_BUCKET || DEFAULT_MEDIA_BUCKET;
}

function getExtension(contentType: string) {
  if (contentType === "image/jpeg") return "jpg";
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/gif") return "gif";
  if (contentType === "image/avif") return "avif";
  return "bin";
}

export function parseDataImageUrl(value: string) {
  const match = value.match(/^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=\s]+)$/i);
  if (!match) {
    throw new Error("Invalid image payload.");
  }

  const contentType = match[1].toLowerCase();
  if (!allowedImageTypes.has(contentType)) {
    throw new Error("Unsupported image type.");
  }

  return {
    contentType,
    buffer: Buffer.from(match[2].replace(/\s/g, ""), "base64")
  };
}

async function ensureMediaBucket() {
  const supabase = getSupabaseAdmin();
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error("Supabase is not available.");
  }

  const bucket = getMediaBucketName();
  const { data: existing, error: lookupError } = await supabase.storage.getBucket(bucket);
  if (existing && !lookupError) {
    if (!existing.public) {
      await supabase.storage.updateBucket(bucket, {
        public: true,
        fileSizeLimit: "5MB",
        allowedMimeTypes: Array.from(allowedImageTypes)
      });
    }
    return { supabase, bucket };
  }

  const { error } = await supabase.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: "5MB",
    allowedMimeTypes: Array.from(allowedImageTypes)
  });

  if (error && !error.message.toLowerCase().includes("already exists")) {
    throw new Error(error.message);
  }

  return { supabase, bucket };
}

export async function uploadPublicImage(input: {
  ownerId: string;
  kind: MediaUploadKind;
  contentType: string;
  buffer: Buffer;
}) {
  if (!allowedImageTypes.has(input.contentType)) {
    throw new Error("Unsupported image type.");
  }

  if (input.buffer.byteLength === 0) {
    throw new Error("Image is empty.");
  }

  if (input.buffer.byteLength > 5 * 1024 * 1024) {
    throw new Error("Image is too large. Maximum size is 5 MB.");
  }

  const { supabase, bucket } = await ensureMediaBucket();
  const extension = getExtension(input.contentType);
  const path = `${input.kind}/${input.ownerId}/${Date.now()}-${randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(bucket).upload(path, input.buffer, {
    contentType: input.contentType,
    cacheControl: "31536000",
    upsert: false
  });

  if (error) {
    throw new Error(error.message);
  }

  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
