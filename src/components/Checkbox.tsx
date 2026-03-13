import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { Check } from "lucide-react";

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = "", ...props }, ref) => {
    return (
      <label className="flex items-center gap-2 cursor-pointer group">
        <div className="relative">
          <input
            ref={ref}
            type="checkbox"
            className="peer sr-only"
            {...props}
          />
          <div
            className="size-5 border-2 border-border rounded-md bg-input-background
            peer-checked:bg-gradient-to-br peer-checked:from-primary peer-checked:to-accent 
            peer-checked:border-transparent transition-all duration-200 
            flex items-center justify-center group-hover:border-primary"
          >
            <Check className="size-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
          </div>
        </div>
        {label && (
          <span className="text-sm text-foreground select-none">{label}</span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";
