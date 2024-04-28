import * as React from "react";
import { cn } from "@/utils/tailwind"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-14 w-full !rounded-lg card_background px-3 py-2 text-sm border-0 border-black  placeholder:text-gray-500 !ring-0 focus:!border-0 focus:!ring-0",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
