import { MDXRemote } from "next-mdx-remote/rsc";
import { ComponentProps } from "react";

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

