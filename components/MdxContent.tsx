import { MDXRemote } from "next-mdx-remote/rsc";
import { ComponentProps } from "react";
import Image from "next/image";

// Custom components for MDX
const components = {
  // Override default elements with custom styling if needed
  h2: (props: ComponentProps<"h2">) => (
    <h2 {...props} className="scroll-mt-20" />
  ),
  h3: (props: ComponentProps<"h3">) => (
    <h3 {...props} className="scroll-mt-20" />
  ),
  a: (props: ComponentProps<"a">) => (
    <a {...props} target={props.href?.startsWith("http") ? "_blank" : undefined} rel={props.href?.startsWith("http") ? "noopener noreferrer" : undefined} />
  ),
  img: (props: ComponentProps<"img">) => {
    // Handle Next.js Image component for local images
    if (props.src?.startsWith("/")) {
      return (
        <div className="my-8 rounded-lg overflow-hidden">
          <Image
            src={props.src}
            alt={props.alt || ""}
            width={1200}
            height={675}
            className="w-full h-auto"
          />
        </div>
      );
    }
    // Fallback to regular img for external images
    return <img {...props} className="my-8 rounded-lg w-full h-auto" />;
  },
  video: (props: ComponentProps<"video">) => (
    <div className="my-8 rounded-lg overflow-hidden bg-[var(--color-background-secondary)] shadow-md">
      <video
        {...props}
        className="w-full h-auto"
        controls
        playsInline
        preload="metadata"
      />
    </div>
  ),
};

interface MdxContentProps {
  source: string;
}

export function MdxContent({ source }: MdxContentProps) {
  return (
    <div className="prose">
      <MDXRemote source={source} components={components} />
    </div>
  );
}

