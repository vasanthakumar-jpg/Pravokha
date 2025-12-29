import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/Button";
import styles from './Calendar.module.css';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn(styles.calendar, className)}
            classNames={{
                months: styles.months,
                month: styles.month,
                caption: styles.caption,
                caption_label: styles.captionLabel,
                nav: styles.nav,
                nav_button: cn(
                    buttonVariants({ variant: "outline" }),
                    styles.navButton
                ),
                nav_button_previous: styles.navButtonPrevious,
                nav_button_next: styles.navButtonNext,
                table: styles.table,
                head_row: styles.headRow,
                head_cell: styles.headCell,
                row: styles.row,
                cell: styles.cell,
                day: cn(
                    buttonVariants({ variant: "ghost" }),
                    styles.day
                ),
                day_range_end: "day-range-end",
                day_selected: styles.daySelected,
                day_today: styles.dayToday,
                day_outside: styles.dayOutside,
                day_disabled: styles.dayDisabled,
                day_range_middle: styles.dayRangeMiddle,
                day_hidden: styles.dayHidden,
                ...classNames,
            }}
            components={{
                IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
                IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
            }}
            {...props}
        />
    );
}
Calendar.displayName = "Calendar";

export { Calendar };
