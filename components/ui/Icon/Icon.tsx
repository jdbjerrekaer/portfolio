"use client";

import type { ComponentType } from "react";
import {
  BookOpen,
  BriefcaseBusiness,
  ChartNoAxesColumnIncreasing,
  Code2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Heart,
  House,
  Images,
  Users,
  Wrench,
  X,
  type LucideProps,
} from "lucide-react";
import { ArrowLeft } from "@/components/animate-ui/icons/arrow-left";
import { ArrowRight } from "@/components/animate-ui/icons/arrow-right";
import { Brush } from "@/components/animate-ui/icons/brush";
import { CircleCheck } from "@/components/animate-ui/icons/circle-check";
import { ExternalLink } from "@/components/animate-ui/icons/external-link";
import { Folder } from "@/components/animate-ui/icons/folder";
import { Search } from "@/components/animate-ui/icons/search";
import { Sparkles } from "@/components/animate-ui/icons/sparkles";
import { User } from "@/components/animate-ui/icons/user";

export type IconName =
  | "arrow-left"
  | "arrow-right"
  | "arrow-up-right"
  | "book"
  | "briefcase"
  | "brush"
  | "chart"
  | "chevron-left"
  | "chevron-right"
  | "check-circle"
  | "code"
  | "copy"
  | "eye"
  | "eye-off"
  | "folder"
  | "heart"
  | "home"
  | "images"
  | "search"
  | "sparkles"
  | "user"
  | "users"
  | "wrench"
  | "x";

interface SharedIconProps {
  size?: number;
  className?: string;
  "aria-label"?: string;
  "aria-hidden"?: boolean;
}

interface AnimatedIconProps extends SharedIconProps {
  animate?: boolean;
  animateOnHover?: boolean;
  loop?: boolean;
}

export interface IconProps extends AnimatedIconProps {
  name: IconName;
}

const animatedIcons = {
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  "arrow-up-right": ExternalLink,
  brush: Brush,
  "check-circle": CircleCheck,
  folder: Folder,
  search: Search,
  sparkles: Sparkles,
  user: User,
} as Record<string, ComponentType<AnimatedIconProps>>;

const staticIcons: Record<string, ComponentType<LucideProps>> = {
  book: BookOpen,
  briefcase: BriefcaseBusiness,
  chart: ChartNoAxesColumnIncreasing,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  code: Code2,
  copy: Copy,
  eye: Eye,
  "eye-off": EyeOff,
  heart: Heart,
  home: House,
  images: Images,
  users: Users,
  wrench: Wrench,
  x: X,
};

export function Icon({
  name,
  size = 20,
  className,
  animate,
  animateOnHover,
  loop,
  "aria-label": label,
  "aria-hidden": ariaHidden,
}: IconProps) {
  const accessibility = label
    ? { "aria-label": label, "aria-hidden": false }
    : { "aria-hidden": ariaHidden ?? true };
  const AnimatedIcon = animatedIcons[name];

  if (AnimatedIcon) {
    return (
      <AnimatedIcon
        size={size}
        className={className}
        animate={animate}
        animateOnHover={animateOnHover}
        loop={loop}
        {...accessibility}
      />
    );
  }

  const StaticIcon = staticIcons[name];
  return (
    <StaticIcon
      size={size}
      strokeWidth={1.9}
      className={className}
      role={label ? "img" : undefined}
      {...accessibility}
    />
  );
}
