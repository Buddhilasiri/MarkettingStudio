export type PostStatus =
  | "queued"
  | "generating"
  | "awaiting_approval"
  | "approved"
  | "rejected"
  | "posting"
  | "posted"
  | "failed";

export interface Post {
  id: string;
  title: string;
  platform: "instagram" | "linkedin";
  prompt: string;
  aspect_ratio: "1:1" | "4:5" | "16:9" | "9:16";
  tone: "friendly" | "professional" | "playful";
  caption_draft: string | null;
  caption_final: string | null;
  status: PostStatus;
  selected_asset_id: string | null;
  drive_file_url: string | null;
  posted_ref: string | null;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  post_id: string;
  provider: string;
  prompt: string;
  aspect_ratio: string;
  drive_file_url: string;
  status: "processing" | "ready" | "failed";
  meta: Record<string, unknown> | null;
  created_at: string;
}
