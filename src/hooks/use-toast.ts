import { toast as sonnerToast } from "sonner";
import { useTimer } from "@/contexts/TimerContext"; // Import useTimer

// This type definition is typically found in a shadcn/ui toast setup.
// Assuming a basic structure for now.
type ToastProps = {
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "success"; // Add success variant if used
  duration?: number;
  action?: React.ReactNode;
  // Add any other properties that your toast function accepts
  [key: string]: any;
};

export function useToast() {
  const { areToastsEnabled } = useTimer(); // Get the state from TimerContext

  const toast = (props: ToastProps) => {
    if (areToastsEnabled) { // Only show toast if enabled
      // Map shadcn/ui variants to sonner's toast types if necessary,
      // or just pass them through if sonner handles a 'variant' prop.
      // For simplicity, we'll pass them directly and assume sonner can handle it or ignore.
      return sonnerToast(props.title, {
        description: props.description,
        duration: props.duration || 3000, // Default duration
        // You might need to map 'variant' to sonner's specific types like 'error', 'success', etc.
        // For example:
        // type: props.variant === "destructive" ? "error" : (props.variant === "success" ? "success" : "default"),
        ...props, // Spread props to pass all other options like action, etc.
      });
    }
    return undefined; // Return undefined if toast is disabled
  };

  return { toast };
}