import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_30px_hsl(186_100%_50%/0.3)] hover:shadow-[0_0_60px_hsl(186_100%_50%/0.5)]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-primary/50 bg-transparent text-primary hover:bg-primary/10 hover:border-primary",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-[0_0_30px_hsl(260_100%_65%/0.3)]",
        ghost: "text-foreground hover:bg-muted hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        glass: "bg-[hsl(217_32%_15%/0.5)] backdrop-blur-xl text-foreground hover:bg-[hsl(217_32%_15%/0.7)] border border-[hsl(217_32%_25%)]",
        neon: "bg-gradient-to-r from-[hsl(186_100%_50%)] to-[hsl(260_100%_65%)] text-[hsl(222_47%_6%)] font-bold hover:opacity-90 shadow-[0_0_60px_hsl(186_100%_50%/0.5)]",
        hero: "bg-gradient-to-r from-[hsl(186_100%_50%)] to-[hsl(260_100%_65%)] text-[hsl(222_47%_6%)] font-bold text-lg px-8 py-6 rounded-2xl hover:opacity-90 shadow-[0_0_60px_hsl(186_100%_50%/0.5)] hover:scale-105 transition-transform",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-lg px-4",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
