import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import styles from "./WhatsAppButton.module.css";

export const WhatsAppButton = () => {
    const phoneNumber = "917339232817";
    const message = "Hi there! 👋 Thanks for reaching out to PRAVOKHA. How can our team assist you today?";

    const handleClick = () => {
        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    return (
        <Button
            onClick={handleClick}
            size="icon"
            className={styles.button}
            aria-label="Contact us on WhatsApp"
        >
            <MessageCircle className={styles.icon} />
        </Button>
    );
};

export default WhatsAppButton;
