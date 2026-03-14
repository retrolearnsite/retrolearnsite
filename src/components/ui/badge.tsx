import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center border px-2.5 py-0.5 text-[11px] font-mono uppercase tracking-[0.08em] transition-colors focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-primary text-primary bg-transparent",
        secondary: "border-crt-teal text-crt-teal bg-transparent",
        destructive: "border-crt-red text-crt-red bg-transparent",
        outline: "border-border text-foreground",
        warning: "border-crt-yellow text-crt-yellow bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} style={{ borderRadius: '2px' }} {...props} />;
}

export { Badge, badgeVariants };
