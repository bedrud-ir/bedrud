import { cn } from "~/lib/utils";

interface SpotlightProps {
  className?: string;
  fill?: string;
}

export function Spotlight({ className, fill }: SpotlightProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      <div
        className="spotlight-beam absolute -top-[40%] left-[10%] h-[70rem] w-[50rem] rotate-[15deg] opacity-100 [dir=rtl]:left-auto [dir=rtl]:right-[10%] [dir=rtl]:-rotate-[15deg]"
        style={
          fill ? ({ "--spotlight-a": fill } as React.CSSProperties) : undefined
        }
      />
      <div
        className="spotlight-beam absolute -top-[30%] left-[35%] h-[60rem] w-[40rem] rotate-[25deg] opacity-70 [animation-delay:-4s] [dir=rtl]:left-auto [dir=rtl]:right-[35%] [dir=rtl]:-rotate-[25deg]"
        style={
          fill ? ({ "--spotlight-b": fill } as React.CSSProperties) : undefined
        }
      />
    </div>
  );
}
