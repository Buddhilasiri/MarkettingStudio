import type { PostStatus } from "./types";

type StatusMeta = {
  label: string;
  variant:
    | "default"
    | "secondary"
    | "success"
    | "warning"
    | "info"
    | "danger"
    | "muted"
    | "teal";
};

export const STATUS_META: Record<PostStatus, StatusMeta> = {
  queued: { label: "Queued", variant: "muted" },
  generating: { label: "Generating", variant: "warning" },
  awaiting_approval: { label: "Awaiting Approval", variant: "info" },
  approved: { label: "Approved", variant: "success" },
  rejected: { label: "Rejected", variant: "danger" },
  posting: { label: "Posting", variant: "default" },
  posted: { label: "Posted", variant: "teal" },
  failed: { label: "Failed", variant: "danger" }
};
