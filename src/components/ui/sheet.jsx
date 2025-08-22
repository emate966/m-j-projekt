// src/components/ui/sheet.jsx
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

// prosta utilka do klas (żeby nie wymagać "@/lib/utils")
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;

const SheetPortal = DialogPrimitive.Portal;

const SheetOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/50",
      // animacje stanu (działają z tailwindcss-animate)
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=open]:fade-in data-[state=closed]:fade-out",
      className
    )}
    {...props}
  />
));
SheetOverlay.displayName = "SheetOverlay";

const SheetContent = React.forwardRef(
  ({ side = "right", className, children, ...props }, ref) => {
    return (
      <SheetPortal>
        <SheetOverlay />
        <DialogPrimitive.Content
          ref={ref}
          {...props}
          className={cn(
            // pozycjonowanie i animacje; CLOSED => wysunięte poza ekran
            "fixed z-50 bg-white shadow-lg transition ease-in-out",
            "data-[state=closed]:duration-300 data-[state=open]:duration-500",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            side === "right" &&
              "inset-y-0 right-0 h-full w-3/4 sm:max-w-sm border-l " +
              "data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
            side === "left" &&
              "inset-y-0 left-0  h-full w-3/4 sm:max-w-sm border-r " +
              "data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
            side === "top" &&
              "inset-x-0 top-0 w-full border-b " +
              "data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top",
            side === "bottom" &&
              "inset-x-0 bottom-0 w-full border-t " +
              "data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
            className
          )}
        >
          {children}
        </DialogPrimitive.Content>
      </SheetPortal>
    );
  }
);
SheetContent.displayName = "SheetContent";

const SheetHeader = ({ className, ...props }) => (
  <div className={cn("grid gap-1.5 p-4", className)} {...props} />
);
SheetHeader.displayName = "SheetHeader";

const SheetTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
));
SheetTitle.displayName = "SheetTitle";

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
};
