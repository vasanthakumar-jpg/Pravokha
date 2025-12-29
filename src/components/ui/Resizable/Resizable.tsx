import * as React from "react";
import { GripVertical } from "lucide-react";
import * as ResizablePrimitive from "react-resizable-panels";

import { cn } from "@/lib/utils";
import styles from './Resizable.module.css';

const ResizablePanelGroup = ({ className, ...props }: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
    <ResizablePrimitive.PanelGroup
        className={cn(styles.panelGroup, className)}
        {...props}
    />
);

const ResizablePanel = ResizablePrimitive.Panel;

const ResizableHandle = ({
    withHandle,
    className,
    ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
    withHandle?: boolean;
}) => (
    <ResizablePrimitive.PanelResizeHandle
        className={cn(
            styles.handle,
            className,
        )}
        {...props}
    >
        {withHandle && (
            <div className={styles.handleIcon}>
                <GripVertical className="h-2.5 w-2.5" />
            </div>
        )}
    </ResizablePrimitive.PanelResizeHandle>
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
