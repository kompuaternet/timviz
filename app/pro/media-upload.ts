export type ProMediaKind = "avatar" | "business-photo";

function loadImageFromFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read image."));
    };
    image.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

async function prepareImageForUpload(file: File, kind: ProMediaKind) {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") {
    return file;
  }

  try {
    const image = await loadImageFromFile(file);
    const maxDimension = kind === "avatar" ? 512 : 1200;
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      return file;
    }

    context.drawImage(image, 0, 0, width, height);
    const blob =
      (await canvasToBlob(canvas, "image/webp", kind === "avatar" ? 0.82 : 0.78)) ??
      (await canvasToBlob(canvas, "image/jpeg", kind === "avatar" ? 0.82 : 0.78));

    if (!blob || blob.size >= file.size) {
      return file;
    }

    const nextName = file.name.replace(/\.[^.]+$/, "") || kind;
    return new File([blob], `${nextName}.${blob.type === "image/webp" ? "webp" : "jpg"}`, {
      type: blob.type,
      lastModified: Date.now()
    });
  } catch {
    return file;
  }
}

export async function uploadProMediaFile(input: {
  file: File;
  kind: ProMediaKind;
  fallbackError: string;
}) {
  const file = await prepareImageForUpload(input.file, input.kind);
  const formData = new FormData();
  formData.append("kind", input.kind);
  formData.append("file", file);

  const response = await fetch("/api/pro/media/upload", {
    method: "POST",
    body: formData
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || typeof payload?.url !== "string") {
    throw new Error(typeof payload?.error === "string" ? payload.error : input.fallbackError);
  }

  return payload.url.trim();
}
