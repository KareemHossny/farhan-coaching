import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type DbClient = SupabaseClient<Database>;

export async function createProgressPhotoUrl(client: DbClient, path: string | null) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const { data, error } = await client.storage.from("progress-photos").createSignedUrl(path, 60 * 60);
  return error ? null : data.signedUrl;
}
