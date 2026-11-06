import { AnimatedProgressCard } from "@/components/ui/progress-card";
import { Timer } from "lucide-react";

/**
 * A demo page to showcase the AnimatedProgressCard component.
 */
export default function AnimatedProgressCardDemo() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-8 bg-background p-4">
      {/* Example 1: Running Progress (from the image) */}
      <AnimatedProgressCard
        title="Running last week"
        icon={<Timer className="h-5 w-5 text-primary-foreground" />}
        progressLabel="Your Progress"
        progressSubLabel="Since 20 days ago"
        currentValue={152}
        maxValue={160}
      />
    </div>
  );
}
