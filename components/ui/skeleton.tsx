import { cn } from "@/utils/tailwind"


function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-[#565c73] dark:bg-gray-800", className)}
      {...props}
    />
  )
}

export { Skeleton }
