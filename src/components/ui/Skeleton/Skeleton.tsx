import { cn } from "@/lib/utils"
// import styles from "./Skeleton.module.css"
import styles from "./Skeleton.module.css"

function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn(styles.skeleton, className)} {...props} />
}

export { Skeleton }
