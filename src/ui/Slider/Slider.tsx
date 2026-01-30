import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";
import styles from './Slider.module.css';

const Slider = React.forwardRef<
    React.ElementRef<typeof SliderPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => {
    const value = props.value || props.defaultValue || [0];
    const initialValue = Array.isArray(value) ? value : [value];

    return (
        <SliderPrimitive.Root
            ref={ref}
            className={cn("relative flex w-full touch-none select-none items-center cursor-pointer", styles.root, className)}
            {...props}
        >
            <SliderPrimitive.Track className={cn("relative h-2 w-full grow overflow-hidden rounded-full bg-secondary", styles.track)}>
                <SliderPrimitive.Range className={cn("absolute h-full bg-primary", styles.range)} />
            </SliderPrimitive.Track>
            {initialValue.map((_, i) => (
                <SliderPrimitive.Thumb
                    key={i}
                    className={cn(
                        "block h-5 w-5 rounded-full border-2 border-white bg-teal-500 ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-110 cursor-pointer",
                        styles.thumb
                    )}
                />
            ))}
        </SliderPrimitive.Root>
    );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
