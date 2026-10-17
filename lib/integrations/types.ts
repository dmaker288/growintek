export type Platform = "GOOGLE" | "TRUSTPILOT" | "FACEBOOK" | "DIRECT";

export type NormalisedReview = {
  platform: Platform;
  externalId: string;
  authorName: string;
  authorUrl?: string | null;
  avatarUrl?: string | null;
  rating: number;
  text: string;
  reviewedAt: Date;
  platformScore?: number | null;
  platformTotal?: number | null;
  profileUrl?: string | null;
};

export type ReviewSummary = {
  platform: Platform;
  label: string;
  score: number | null;
  total: number;
  profileUrl: string | null;
  connected: boolean;
  reviews: NormalisedReview[];
  syncedAt: Date | null;
  warning?: string;
};

export type SocialPlatform = "instagram" | "youtube" | "facebook";

export type NormalisedSocialPost = {
  platform: SocialPlatform;
  externalId: string;
  kind: "image" | "video" | "reel" | "short" | "post";
  caption?: string | null;
  thumbnailUrl?: string | null;
  mediaUrl?: string | null;
  permalink?: string | null;
  postedAt: Date;
  metrics?: Record<string, number>;
};

export type SocialFeed = {
  platform: SocialPlatform;
  label: string;
  connected: boolean;
  posts: NormalisedSocialPost[];
  syncedAt: Date | null;
  warning?: string;
};

export type SyncReport = {
  platform: string;
  ok: boolean;
  imported: number;
  message: string;
};
