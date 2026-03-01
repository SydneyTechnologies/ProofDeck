declare module "react-katex" {
  import type { ComponentType, ReactNode } from "react";

  interface BaseMathProps {
    math: string;
    errorColor?: string;
    renderError?: (error: Error) => ReactNode;
  }

  export const BlockMath: ComponentType<BaseMathProps>;
  export const InlineMath: ComponentType<BaseMathProps>;
}
