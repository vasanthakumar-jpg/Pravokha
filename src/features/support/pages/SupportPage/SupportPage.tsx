import { Mail, Phone, LifeBuoy, HelpCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Link } from "react-router-dom";

export function SupportPage() {
    const supportOptions = [
        {
            icon: Mail,
            title: "Email Support",
            description: "Get help via email within 24 hours",
            action: "vasanthakumar141099@gmail.com",
            link: "mailto:vasanthakumar141099@gmail.com",
        },
        {
            icon: Phone,
            title: "Phone Support",
            description: "Call us during business hours",
            action: "7339232817, 7708368442",
            link: "tel:+917339232817",
        },
        {
            icon: LifeBuoy,
            title: "Formal Ticket System",
            description: "Appeals, escalations & complex issues",
            action: "Open Ticket",
            link: "/tickets",
        },
        {
            icon: HelpCircle,
            title: "FAQ",
            description: "Find answers to common questions",
            action: "View FAQ",
            link: "/faq",
        },
    ];

    return (
        <div className="w-full py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-center">Support Center</h1>
                <p className="text-muted-foreground text-center mb-8 sm:mb-12 text-sm sm:text-base md:text-lg">
                    We're here to help! Choose how you'd like to get in touch.
                </p>

                <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
                    {supportOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                            <Card key={option.title} className="hover:shadow-lg transition-shadow">
                                <CardHeader className="p-4 sm:p-6">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                                        <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                                    </div>
                                    <CardTitle className="text-base sm:text-lg md:text-xl">{option.title}</CardTitle>
                                    <CardDescription className="text-xs sm:text-sm">{option.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-6 pt-0">
                                    {option.link.startsWith("http") || option.link.startsWith("mailto") || option.link.startsWith("tel") ? (
                                        <a href={option.link} className="block">
                                            <Button variant="outline" className="w-full h-9 sm:h-10 text-xs sm:text-sm">
                                                {option.action}
                                            </Button>
                                        </a>
                                    ) : (
                                        <Link to={option.link}>
                                            <Button variant="outline" className="w-full h-9 sm:h-10 text-xs sm:text-sm">
                                                {option.action}
                                            </Button>
                                        </Link>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <Card>
                    <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="text-base sm:text-lg md:text-xl">Bulk Orders</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                            Need to place a bulk order? We offer special pricing for large quantities.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                        <p className="mb-3 sm:mb-4 text-sm sm:text-base">
                            For bulk orders (50+ items), please contact our sales team directly:
                        </p>
                        <div className="space-y-2">
                            <p className="flex items-center gap-2 text-sm sm:text-base">
                                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                <a href="mailto:vasanthakumar141099@gmail.com" className="text-primary hover:underline break-all">
                                    vasanthakumar141099@gmail.com
                                </a>
                            </p>
                            <p className="flex items-center gap-2 text-sm sm:text-base">
                                <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                <a href="tel:+917339232817" className="text-primary hover:underline">
                                    7339232817
                                </a>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default SupportPage;
