import {
  AtSign,
  Facebook,
  Github,
  Globe,
  Instagram,
  Link2,
  Linkedin,
  Mail,
  Music2,
  Phone,
  Rss,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  mail: Mail,
  email: Mail,
  phone: Phone,
  twitter: Twitter,
  x: Twitter,
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  youtube: Youtube,
  github: Github,
  tiktok: Music2,
  threads: AtSign,
  bluesky: AtSign,
  mastodon: AtSign,
  rss: Rss,
  blog: Rss,
  website: Globe,
  web: Globe,
  globe: Globe,
};

export function resolveContactIcon(icon: string | null | undefined): LucideIcon {
  if (!icon) return Link2;
  return ICON_MAP[icon.trim().toLowerCase()] ?? Link2;
}
