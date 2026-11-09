import * as React from "react";
import { Button as CoreButton, cn } from "@canopy/shadcn-core";

type ButtonProps = React.ComponentProps<typeof CoreButton> & {
  size?: React.ComponentProps<typeof CoreButton>["size"] | "sm-loose";
};

export function Button({
  className,
  size = "default",
  variant = "default",
  ...props
}: ButtonProps) {
  return (
    <CoreButton
      data-size={size}
      data-variant={variant}
      size={size}
      variant={variant}
      className={cn(className)}
      {...props}
    />
  );
}
