import { Dumbbell } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="bg-gradient-to-br from-primary to-accent p-2 rounded-xl">
        <Dumbbell className="size-6 text-white" strokeWidth={2.5} />
      </div>
      <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        FitMind
      </span>
    </div>
  );
}
