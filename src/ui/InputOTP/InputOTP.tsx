import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import { Dot } from "lucide-react";

import { cn } from "@/lib/utils";
import styles from './InputOTP.module.css';

const InputOTP = React.forwardRef<React.ElementRef<typeof OTPInput>, React.ComponentPropsWithoutRef<typeof OTPInput>>(
    ({ className, containerClassName, ...props }, ref) => (
        <OTPInput
            ref={ref}
            containerClassName={cn(styles.container, containerClassName)}
            className={cn(styles.input, className)}
            {...props}
        />
    ),
);
InputOTP.displayName = "InputOTP";

const InputOTPGroup = React.forwardRef<React.ElementRef<"div">, React.ComponentPropsWithoutRef<"div">>(
    ({ className, ...props }, ref) => <div ref={ref} className={cn(styles.group, className)} {...props} />,
);
InputOTPGroup.displayName = "InputOTPGroup";

const InputOTPSlot = React.forwardRef<
    React.ElementRef<"div">,
    React.ComponentPropsWithoutRef<"div"> & { index: number }
>(({ index, className, ...props }, ref) => {
    const inputOTPContext = React.useContext(OTPInputContext);
    const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index];

    return (
        <div
            ref={ref}
            className={cn(
                styles.slot,
                isActive && styles.slotActive,
                className,
            )}
            {...props}
        >
            {char}
            {hasFakeCaret && (
                <div className={styles.caretWrapper}>
                    <div className={styles.caret} />
                </div>
            )}
        </div>
    );
});
InputOTPSlot.displayName = "InputOTPSlot";

const InputOTPSeparator = React.forwardRef<React.ElementRef<"div">, React.ComponentPropsWithoutRef<"div">>(
    ({ ...props }, ref) => (
        <div ref={ref} role="separator" className={styles.separator} {...props}>
            <Dot />
        </div>
    ),
);
InputOTPSeparator.displayName = "InputOTPSeparator";

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
