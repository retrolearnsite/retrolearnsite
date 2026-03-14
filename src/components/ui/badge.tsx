import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center border px-2 py-[3px] text-[11px] font-mono uppercase tracking-[0.06em] transition-colors focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-crt-orange text-crt-orange bg-[rgba(232,98,42,0.12)]",
        secondary: "border-crt-teal text-crt-teal bg-[rgba(62,207,207,0.12)]",
        destructive: "border-crt-red text-crt-red bg-[rgba(204,68,68,0.12)]",
        outline: "border-border text-foreground",
        warning: "border-crt-yellow text-crt-yellow bg-[rgba(240,192,64,0.12)]",
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
