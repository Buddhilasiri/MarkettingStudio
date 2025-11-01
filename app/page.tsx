"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { STATUS_META } from "@/lib/status";
import type { Asset, Post } from "@/lib/types";
import { isSupabaseConfigured, supabase } from "@/lib/supabase-client";

interface IdeaFormState {
  title: string;
  platform: "instagram" | "linkedin";
  prompt: string;
  aspectRatio: "1:1" | "4:5" | "16:9" | "9:16";
  tone: "friendly" | "professional" | "playful";
  tags: string;
}

interface FormFeedback {
  type: "success" | "error" | null;
  message: string;
}

const initialFormState: IdeaFormState = {
  title: "",
  platform: "instagram",
  prompt: "",
  aspectRatio: "1:1",
  tone: "friendly",
  tags: ""
};

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "2-digit"
    }).format(new Date(value));
  } catch (error) {
    return "-";
  }
}

function classForRow(isActive: boolean) {
  return cn(
    "cursor-pointer rounded-xl transition-colors",
    isActive ? "bg-brand-purple/10" : "hover:bg-brand-neutral"
  );
}

export default function DashboardPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [assetsError, setAssetsError] = useState<string | null>(null);
  const [formState, setFormState] = useState<IdeaFormState>(initialFormState);
  const [formFeedback, setFormFeedback] = useState<FormFeedback>({
    type: null,
    message: ""
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setPostsLoading(false);
      setPostsError("Supabase is not configured. Provide NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable live data.");
      return;
    }

    const fetchPosts = async () => {
      setPostsLoading(true);
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        setPostsError(error.message);
      } else {
        setPosts(data as Post[]);
        setPostsError(null);
      }
      setPostsLoading(false);
    };

    fetchPosts();

    const channel = supabase
      .channel("posts-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        (payload) => {
          setPosts((current) => {
            const next = [...current];
            if (payload.eventType === "INSERT") {
              next.unshift(payload.new as Post);
              return dedupePosts(next);
            }

            if (payload.eventType === "UPDATE") {
              const index = next.findIndex((item) => item.id === (payload.new as Post).id);
              if (index !== -1) {
                next[index] = payload.new as Post;
                return dedupePosts(next);
              }
              next.unshift(payload.new as Post);
              return dedupePosts(next);
            }

            if (payload.eventType === "DELETE") {
              return next.filter((item) => item.id !== (payload.old as { id: string } | null)?.id);
            }

            return current;
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase]);

  useEffect(() => {
    if (posts.length === 0) {
      setSelectedPostId(null);
      return;
    }

    if (selectedPostId && posts.some((post) => post.id === selectedPostId)) {
      return;
    }

    const awaiting = posts.find((post) => post.status === "awaiting_approval");
    setSelectedPostId(awaiting?.id ?? posts[0]?.id ?? null);
  }, [posts, selectedPostId]);

  useEffect(() => {
    if (!supabase || !selectedPostId) {
      setAssets([]);
      setAssetsError(null);
      setAssetsLoading(false);
      return;
    }

    const fetchAssets = async () => {
      setAssetsLoading(true);
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("post_id", selectedPostId)
        .order("created_at", { ascending: false });

      if (error) {
        setAssetsError(error.message);
      } else {
        setAssetsError(null);
        setAssets(data as Asset[]);
      }
      setAssetsLoading(false);
    };

    fetchAssets();

    const channel = supabase
      .channel(`assets-${selectedPostId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assets", filter: `post_id=eq.${selectedPostId}` },
        (payload) => {
          setAssets((current) => {
            const next = [...current];
            if (payload.eventType === "INSERT") {
              next.unshift(payload.new as Asset);
              return dedupeAssets(next);
            }
            if (payload.eventType === "UPDATE") {
              const index = next.findIndex((item) => item.id === (payload.new as Asset).id);
              if (index !== -1) {
                next[index] = payload.new as Asset;
                return dedupeAssets(next);
              }
              next.unshift(payload.new as Asset);
              return dedupeAssets(next);
            }
            if (payload.eventType === "DELETE") {
              return next.filter((item) => item.id !== (payload.old as { id: string } | null)?.id);
            }
            return current;
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [selectedPostId, supabase]);

  const selectedPost = useMemo(
    () => posts.find((post) => post.id === selectedPostId) ?? null,
    [posts, selectedPostId]
  );

  const awaitingCount = useMemo(
    () => posts.filter((post) => post.status === "awaiting_approval").length,
    [posts]
  );

  const handleFormChange = (
    field: keyof IdeaFormState,
    value: IdeaFormState[keyof IdeaFormState]
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (mode: "generate_now" | "queue") => {
    setSubmitting(true);
    setFormFeedback({ type: null, message: "" });

    try {
      const base = process.env.NEXT_PUBLIC_N8N_BASE_URL ?? "";
      const sanitizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
      const url = `${sanitizedBase}/webhook/marketing/router`;
      if (!sanitizedBase) {
        throw new Error("N8N base URL is not configured.");
      }

      const payload = {
        request_id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2),
        action: "create_idea",
        mode,
        post: {
          title: formState.title,
          platform: formState.platform,
          prompt: formState.prompt,
          aspect_ratio: formState.aspectRatio,
          tone: formState.tone,
          tags: formState.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        }
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `n8n webhook returned ${response.status} ${response.statusText}: ${errorBody}`
        );
      }

      setFormFeedback({
        type: "success",
        message:
          mode === "generate_now"
            ? "Idea sent to n8n. Generation will begin immediately."
            : "Idea queued successfully."
      });
      setFormState(initialFormState);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setFormFeedback({ type: "error", message });
    } finally {
      setSubmitting(false);
    }
  };

  const awaitingPosts = useMemo(
    () => posts.filter((post) => post.status === "awaiting_approval"),
    [posts]
  );

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10 flex flex-col gap-2">
        <span className="text-xs uppercase tracking-[0.4em] text-brand-purple">
          BIoT Marketing Studio
        </span>
        <h1 className="text-3xl font-bold text-brand-navy sm:text-4xl">
          Content Automation Control Center
        </h1>
        <p className="max-w-2xl text-base text-slate-600">
          Coordinate creative generation, approvals, and publishing for every campaign post in one place.
        </p>
        {!isSupabaseConfigured && (
          <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Supabase environment variables are missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to unlock live data.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle>Pipeline Summary</CardTitle>
            <p className="text-sm text-slate-500">
              Track the latest 100 posts across the automation pipeline.
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            {postsLoading ? (
              <div className="flex h-48 items-center justify-center text-sm text-slate-500">
                Loading posts…
              </div>
            ) : postsError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
                {postsError}
              </div>
            ) : posts.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-slate-500">
                No posts yet. Use the New Idea form to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-transparent">
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="text-right">Stage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => {
                    const meta = STATUS_META[post.status];
                    return (
                      <TableRow
                        key={post.id}
                        className={classForRow(post.id === selectedPostId)}
                        onClick={() => setSelectedPostId(post.id)}
                      >
                        <TableCell className="font-medium text-slate-600">
                          {formatDate(post.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-semibold text-brand-navy">{post.title}</p>
                            <p className="text-xs uppercase tracking-wide text-slate-400">
                              {post.platform}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="inline-flex items-center gap-2">
                            <Badge variant={meta.variant}>{meta.label}</Badge>
                            {post.status === "generating" && (
                              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" aria-hidden />
                            )}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle>New Idea</CardTitle>
            <p className="text-sm text-slate-500">
              Trigger n8n agents to craft new visuals and captions or queue an idea for later.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Smart Lighting Tip #3"
                  value={formState.title}
                  onChange={(event) => handleFormChange("title", event.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platform">Platform</Label>
                  <Select
                    id="platform"
                    value={formState.platform}
                    onChange={(event) => handleFormChange("platform", event.target.value as IdeaFormState["platform"])}
                  >
                    <option value="instagram">Instagram</option>
                    <option value="linkedin">LinkedIn</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aspect">Aspect Ratio</Label>
                  <Select
                    id="aspect"
                    value={formState.aspectRatio}
                    onChange={(event) => handleFormChange("aspectRatio", event.target.value as IdeaFormState["aspectRatio"])}
                  >
                    <option value="1:1">1:1 (Square)</option>
                    <option value="4:5">4:5 (Portrait)</option>
                    <option value="16:9">16:9 (Landscape)</option>
                    <option value="9:16">9:16 (Story)</option>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tone">Tone</Label>
                <Select
                  id="tone"
                  value={formState.tone}
                  onChange={(event) => handleFormChange("tone", event.target.value as IdeaFormState["tone"])}
                >
                  <option value="friendly">Friendly</option>
                  <option value="professional">Professional</option>
                  <option value="playful">Playful</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="A sleek smart bulb glowing with gold and purple tones, studio background."
                  value={formState.prompt}
                  onChange={(event) => handleFormChange("prompt", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  placeholder="smart_home, iot, tips"
                  value={formState.tags}
                  onChange={(event) => handleFormChange("tags", event.target.value)}
                />
              </div>
            </div>
            {formFeedback.type && (
              <div
                className={cn(
                  "rounded-xl px-4 py-3 text-sm",
                  formFeedback.type === "success"
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border border-rose-200 bg-rose-50 text-rose-600"
                )}
              >
                {formFeedback.message}
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                onClick={() => handleSubmit("generate_now")}
                loading={submitting}
                disabled={submitting}
              >
                Generate Now
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSubmit("queue")}
                loading={submitting}
                disabled={submitting}
              >
                Push to Queue
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle>Pending Approval</CardTitle>
            <p className="text-sm text-slate-500">
              {awaitingCount > 0
                ? `${awaitingCount} post${awaitingCount === 1 ? "" : "s"} waiting for review.`
                : "No posts awaiting approval right now."}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {awaitingPosts.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {awaitingPosts.map((post) => (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => setSelectedPostId(post.id)}
                    className={cn(
                      "rounded-full border px-4 py-1 text-xs font-medium uppercase tracking-wide transition",
                      post.id === selectedPostId
                        ? "border-brand-purple bg-brand-purple/10 text-brand-purple"
                        : "border-brand-navy/10 text-slate-500 hover:border-brand-purple/40 hover:text-brand-purple"
                    )}
                  >
                    {post.title}
                  </button>
                ))}
              </div>
            )}

            {!selectedPost ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                Select a post from the Pipeline Summary to view details.
              </div>
            ) : (
              <div className="space-y-6">
                <section className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold text-brand-navy">
                        {selectedPost.title}
                      </h3>
                      <p className="text-sm uppercase tracking-wide text-slate-400">
                        {selectedPost.platform} • {selectedPost.aspect_ratio} • {selectedPost.tone}
                      </p>
                    </div>
                    <Badge variant={STATUS_META[selectedPost.status].variant}>
                      {STATUS_META[selectedPost.status].label}
                    </Badge>
                  </div>
                  <p className="rounded-xl bg-white/70 p-4 text-sm text-slate-600">
                    {selectedPost.prompt}
                  </p>
                </section>

                <section className="space-y-3">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Caption Draft
                  </h4>
                  <div className="rounded-xl border border-brand-navy/10 bg-white/80 p-4 text-sm text-slate-700">
                    {selectedPost.caption_draft ? selectedPost.caption_draft : "Waiting for caption generation."}
                  </div>
                </section>

                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Generated Assets
                    </h4>
                    {assetsLoading && <span className="text-xs text-slate-400">Refreshing…</span>}
                  </div>
                  {assetsError ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
                      {assetsError}
                    </div>
                  ) : assets.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-brand-navy/10 p-6 text-sm text-slate-500">
                      No assets yet. Generation results will appear here.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {assets.map((asset) => (
                        <a
                          key={asset.id}
                          href={asset.drive_file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="group overflow-hidden rounded-2xl border border-transparent bg-white shadow-sm transition hover:-translate-y-1 hover:border-brand-purple/50 hover:shadow-lg"
                        >
                          <div className="relative h-40 w-full overflow-hidden bg-brand-neutral">
                            <img
                              src={`${asset.drive_file_url}?preview=1`}
                              alt={asset.prompt}
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                            <div className="absolute bottom-2 left-2 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-slate-600">
                              <span>{asset.aspect_ratio}</span>
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
                              <span className="capitalize">{asset.status}</span>
                            </div>
                          </div>
                          <div className="space-y-2 p-4">
                            <p className="text-sm text-slate-600">{asset.prompt}</p>
                            <p className="text-xs uppercase tracking-wide text-slate-400">
                              {new Date(asset.created_at).toLocaleString()}
                            </p>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function dedupePosts(list: Post[]) {
  const seen = new Set<string>();
  return list.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}

function dedupeAssets(list: Asset[]) {
  const seen = new Set<string>();
  return list.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}
