import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from "@/utils/tailwind"
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex !outline-none !focus:outline-none !focus:ring-0 !ring-0 !outline-none !focus:outline-none !focus:ring-0 !ring-0 items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        primary: "rounded-full h-14 !text-md font-ppmori font-bold bg-gradient-to-r to-[#439FE7] from-[#2778E9] transform transition-transform hover:scale-[1.03] text-white",
        wormhole: "rounded-full h-14 !text-md font-ppmori font-bold bg-gradient-to-r from-purple-600 to-purple-400 transform transition-transform hover:scale-[1.03] text-white"
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-full px-3',
        lg: 'h-12 rounded-full px-6',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingMessage?: string;
  subMessage?: string;
  signatures?: string
}

const LoadingButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, loadingMessage, subMessage, signatures, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <>
       <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={loading}
        ref={ref}
        {...props}
      >
        <>
          {children}
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-xl backdrop-blur-sm">
              <div className="flex items-center gap-2 text-white">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="font-medium">{loadingMessage || `Please sign transaction(s) on your wallet ${signatures}`}</span>
              </div>
            </div>
          )}
        </>
      </Comp></>
     
    );
  },
);
LoadingButton.displayName = 'LoadingButton';

export { LoadingButton, buttonVariants };