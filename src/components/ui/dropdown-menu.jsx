import * as React from "react"
import { cn } from "@/lib/utils"

const DropdownMenu = ({ children, open, onOpenChange }) => {
  return (
    <div className="relative inline-block text-left">
      {React.Children.map(children, child => 
        React.cloneElement(child, { open, onOpenChange })
      )}
    </div>
  )
}

const DropdownMenuTrigger = React.forwardRef(({ className, children, open, onOpenChange, asChild, ...props }, ref) => {
  const { open: _, onOpenChange: __, ...domProps } = props;
  
  if (asChild) {
    return React.cloneElement(children, {
      ref,
      onClick: () => onOpenChange?.(!open),
      ...domProps
    })
  }
  
  return (
    <button
      ref={ref}
      className={cn("inline-flex items-center justify-center", className)}
      onClick={() => onOpenChange?.(!open)}
      {...domProps}
    >
      {children}
    </button>
  )
})
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

const DropdownMenuContent = React.forwardRef(({ className, children, open, ...props }, ref) => {
  const { open: _, onOpenChange, ...domProps } = props;
  
  return (
    <div
      ref={ref}
      className={cn(
        "absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none transition-all duration-200",
        open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none",
        className
      )}
      {...domProps}
    >
      <div className="py-1">{children}</div>
    </div>
  )
})
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuItem = React.forwardRef(({ className, ...props }, ref) => (
  <a
    ref={ref}
    className={cn(
      "block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = "DropdownMenuItem"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
}