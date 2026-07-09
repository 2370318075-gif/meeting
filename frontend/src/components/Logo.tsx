import React from "react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog";
import { VisuallyHidden } from "./ui/visually-hidden";
import { About } from "./About";

interface LogoProps {
    isCollapsed: boolean;
}

const ProductMark = ({ compact = false }: { compact?: boolean }) => (
  <img
    src="/brand-icon.svg"
    alt=""
    aria-hidden="true"
    className={`shrink-0 ${compact ? 'h-10 w-10' : 'h-8 w-8'}`}
  />
);

const Logo = React.forwardRef<HTMLButtonElement, LogoProps>(({ isCollapsed }, ref) => {
  return (
    <Dialog aria-describedby={undefined}>
      {isCollapsed ? (
        <DialogTrigger asChild>
          <button
            ref={ref}
            className="mb-2 flex items-center justify-start border-none bg-transparent p-0 transition-transform hover:scale-[1.03]"
            aria-label="Open MinuteFlow about dialog"
          >
            <ProductMark compact />
          </button>
        </DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <button
            ref={ref}
            className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[#d4eef3] bg-[#f7fdff] px-3 py-2 text-base font-semibold text-gray-700 shadow-sm transition-colors hover:border-[#22B8CF]/70 hover:bg-[#effcff]"
          >
            <ProductMark />
            <span>MinuteFlow</span>
          </button>
        </DialogTrigger>
      )}
      <DialogContent>
        <VisuallyHidden>
          <DialogTitle>About MinuteFlow</DialogTitle>
        </VisuallyHidden>
        <About />
      </DialogContent>
    </Dialog>
  );
});

Logo.displayName = "Logo";

export default Logo;
