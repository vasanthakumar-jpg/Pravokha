import { Link } from "react-router-dom";
import { Card } from "@/ui/Card";
import { motion } from "framer-motion";
import { Badge } from "@/ui/Badge";
import type { CategoryCardProps } from './CategoryCard.types';
import styles from './CategoryCard.module.css';

export const CategoryCard = ({
    title,
    description,
    image,
    link,
    comingSoon
}: CategoryCardProps) => {
    const CardContent = (
        <motion.div
            whileHover={{ y: comingSoon ? 0 : -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={styles.wrapper}
        >
            <Card className={`${styles.card} ${comingSoon ? styles.disabled : ''}`}>
                <div className={styles.imageContainer}>
                    <img
                        src={image}
                        alt={title}
                        className={styles.image}
                        loading="lazy"
                    />
                    <div className={styles.overlay} />
                    {comingSoon && (
                        <div className={styles.badgeWrapper}>
                            <Badge className={styles.badge}>Coming Soon</Badge>
                        </div>
                    )}
                    <div className={styles.content}>
                        <h3 className={styles.title}>{title}</h3>
                        <p className={styles.description}>{description}</p>
                    </div>
                </div>
            </Card>
        </motion.div>
    );

    if (comingSoon || !link) {
        return CardContent;
    }

    return <Link to={link}>{CardContent}</Link>;
};
