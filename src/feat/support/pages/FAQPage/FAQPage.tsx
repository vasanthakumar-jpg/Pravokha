import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/ui/Accordion";
import { Card, CardContent } from "@/ui/Card";
import { Link } from "react-router-dom";

export function FAQPage() {
    const faqs = [
        {
            question: "What is your shipping policy?",
            answer:
                "We offer free shipping on all orders above ₹999. For orders below ₹999, a flat shipping fee of ₹99 applies. Orders are typically processed within 1-2 business days and delivered within 5-7 business days.",
        },
        {
            question: "What is your return policy?",
            answer:
                "We accept returns within 30 days of delivery. Items must be unused, unwashed, and in original condition with tags attached. Please refer to our Returns & Exchange page for detailed information.",
        },
        {
            question: "How do I track my order?",
            answer:
                "Once your order is shipped, you will receive a tracking number via email. You can use this number to track your order on our website or the courier's website.",
        },
        {
            question: "What payment methods do you accept?",
            answer:
                "We accept all major payment methods including Credit/Debit Cards, UPI, Net Banking, and QR code payments. All transactions are secured and encrypted.",
        },
        {
            question: "How do I know my size?",
            answer:
                "Please refer to our Size Guide page for detailed measurements. We offer sizes from S to XXXL. If you're between sizes, we recommend sizing up for a more comfortable fit.",
        },
        {
            question: "Can I cancel my order?",
            answer:
                "Yes, you can cancel your order within 24 hours of placement. Once the order is shipped, cancellation is not possible, but you can initiate a return after receiving the product.",
        },
        {
            question: "Do you offer international shipping?",
            answer:
                "Currently, we only ship within India. We are working on expanding our services internationally. Stay tuned for updates!",
        },
        {
            question: "How do I care for my Pravokha products?",
            answer:
                "Machine wash cold with like colors. Do not bleach. Tumble dry low or hang to dry. Iron on low heat if needed. Check the care label on each product for specific instructions.",
        },
        {
            question: "Do you offer bulk order discounts?",
            answer:
                "Yes! We offer special pricing for bulk orders of 50+ items. Please contact our sales team at vasanthakumar141099@gmail.com or call 7339232817 for more information.",
        },
        {
            question: "How can I contact customer support?",
            answer:
                "You can reach us via email at vasanthakumar141099@gmail.com or call us at 7339232817 / 7708368442. We're available Monday-Friday, 9 AM - 6 PM, and Saturday 10 AM - 4 PM.",
        },
    ];

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
            <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
                <div className="text-center space-y-3">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">Frequently Asked Questions</h1>
                    <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-xl mx-auto leading-relaxed">
                        Find answers to common questions about Pravokha products and services.
                    </p>
                </div>

                <Card className="border-primary/5 shadow-sm overflow-hidden rounded-2xl">
                    <CardContent className="p-0">
                        <Accordion type="single" collapsible className="w-full">
                            {faqs.map((faq, index) => (
                                <AccordionItem key={index} value={`item-${index}`} className="border-b last:border-0 px-4 sm:px-6">
                                    <AccordionTrigger className="text-left text-sm sm:text-base font-semibold hover:no-underline py-4 sm:py-5 group">
                                        <span className="group-hover:text-primary transition-colors">{faq.question}</span>
                                    </AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground text-xs sm:text-sm leading-relaxed pb-4 sm:pb-5">
                                        {faq.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                </Card>

                <div className="text-center pt-8">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Still have questions? <Link to="/support" className="text-primary font-bold hover:underline">Contact our support team</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default FAQPage;
