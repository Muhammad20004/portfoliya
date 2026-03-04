import crypto from "node:crypto";
import path from "node:path";
import { getSupabase } from "../config/supabase.js";

function safeExt(originalName, mime) {
  const extFromName = path.extname(originalName || "").slice(1);
  if (extFromName) return extFromName.toLowerCase();

  const m = (mime || "").toLowerCase();
  if (m.includes("png")) return "png";
  if (m.includes("jpeg") || m.includes("jpg")) return "jpg";
  if (m.includes("pdf")) return "pdf";
  if (m.includes("ppt")) return "pptx";

  return "bin";
}

function makePath(prefix, originalName, mime) {
  const ext = safeExt(originalName, mime);
  const id = crypto.randomBytes(16).toString("hex");

  const date = new Date();
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");

  return `${prefix}/${y}/${m}/${d}/${id}.${ext}`;
}

async function uploadBuffer({ bucket, filePath, buffer, contentType }) {
  const supabase = getSupabase();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, buffer, {
      contentType,
      upsert: true,
    });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return { publicUrl: data.publicUrl, path: filePath };
}

async function removeFile({ bucket, filePath }) {
  if (!filePath) return;

  const supabase = getSupabase();
  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath]);

  if (error) {
    return; // silent fail
  }
}

export { makePath, uploadBuffer, removeFile };
