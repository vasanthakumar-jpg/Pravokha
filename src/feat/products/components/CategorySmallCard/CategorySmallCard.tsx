import { Link } from "react-router-dom";
import { Card } from "@/ui/Card";
import { motion } from "framer-motion";
import type { CategorySmallCardProps } from './CategorySmallCard.types';
import styles from './CategorySmallCard.module.css';

export const CategorySmallCard = ({
    title,
    description,
    image,
    link,
    disabled
}: CategorySmallCardProps) => {
    const CardContent = () => (
        <motion.div
            whileHover={{ y: disabled ? 0 : -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={styles.wrapper}
        >
            <Card className={`${styles.card} ${disabled ? styles.disabled : ''}`}>
                {/* Full Height Image */}
                <div className={styles.imageContainer}>
                    <img
                        src={image}
                        alt={title}
                        className={styles.image}
                        loading="lazy"
                    />

                    {/* Dark Gradient Overlay */}
                    <div className={styles.overlay} />

                    {/* Text Content */}
                    <div className={styles.content}>
                        <h3 className={styles.title}>{title}</h3>
                        <p className={styles.description}>{description}</p>
                    </div>
                </div>
            </Card>
        </motion.div>
    );

    if (disabled) {
        return <CardContent />;
    }

    return (
        <Link to={link} className={styles.linkWrapper}>
            <CardContent />
        </Link>
    );
};
