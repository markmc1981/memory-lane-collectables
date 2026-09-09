import { removeBackground } from "@imgly/background-removal";

/**
 * Client-side, free. Cuts the item out of its photo and drops it onto a
 * warm neutral studio backdrop with a soft contact shadow. Returns a JPEG
 * blob. The original photo is never touched — the caller keeps it.
 *
 * A paid cut-out service (Photoroom etc.) can replace `removeBackground`
 * later for better edges; the compositing below stays the same.
 */
export async function enhancePhoto(imageUrl: string): Promise<Blob> {
  const cutoutBlob = await removeBackground(imageUrl, {
    output: { format: "image/png", quality: 0.9 },
  });
  const cutout = await blobToImage(cutoutBlob);

  const SIZE = 1400;
  const PAD = 0.11; // fraction of canvas kept clear around the item

  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not available.");

  // --- backdrop: warm off-white with a faint centre glow ---
  ctx.fillStyle = "#efeae0";
  ctx.fillRect(0, 0, SIZE, SIZE);
  const glow = ctx.createRadialGradient(
    SIZE / 2,
    SIZE * 0.42,
    SIZE * 0.1,
    SIZE / 2,
    SIZE * 0.42,
    SIZE * 0.75
  );
  glow.addColorStop(0, "rgba(255,254,251,0.9)");
  glow.addColorStop(1, "rgba(255,254,251,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // --- fit the cutout ---
  const maxW = SIZE * (1 - PAD * 2);
  const maxH = SIZE * (1 - PAD * 2);
  const scale = Math.min(maxW / cutout.width, maxH / cutout.height);
  const w = cutout.width * scale;
  const h = cutout.height * scale;
  const x = (SIZE - w) / 2;
  const y = (SIZE - h) / 2 - SIZE * 0.02; // sit slightly high, shadow below

  // --- soft contact shadow: draw the cutout dark + blurred, just below ---
  ctx.save();
  ctx.filter = "blur(22px)";
  ctx.globalAlpha = 0.28;
  ctx.drawImage(cutout, x + SIZE * 0.01, y + SIZE * 0.03, w, h);
  ctx.restore();

  // --- the item ---
  ctx.drawImage(cutout, x, y, w, h);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not export image."))),
      "image/jpeg",
      0.9
    );
  });
}

function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read the cut-out image."));
    };
    img.src = url;
  });
}
