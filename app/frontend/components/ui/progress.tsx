import * as RadixProgress from "@radix-ui/react-progress";
import { cn } from "@/lib/utils"; // Utility for combining classes

const Progress = ({ value, className, indicatorClassName, ...props }) => {
  return (
    <RadixProgress.Root
      className={cn("relative overflow-hidden rounded-full", className)}
      value={value}
      {...props}
    >
      <RadixProgress.Indicator
        className={cn("h-full w-full transition-transform", indicatorClassName)}
        style={{ transform: `translateX(-${100 - value}%)` }}
      />
    </RadixProgress.Root>
  );
};

export default Progress;