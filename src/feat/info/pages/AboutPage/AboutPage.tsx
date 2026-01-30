import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/ui/Button";
import { ArrowLeft, Award, Users, Globe, ShieldCheck } from "lucide-react";

export default function AboutPage() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-muted py-12 md:py-20">
                <div className="container px-4 mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">Redefining Activewear</h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        We believe that movement works wonders. Our mission is to empower your active lifestyle with premium quality sportswear that combines style, comfort, and performance.
                    </p>
                </div>
            </div>

            <div className="container px-4 mx-auto py-12 md:py-20 lg:max-w-6xl">
                <Button variant="ghost" asChild className="mb-8 pl-0 hover:bg-transparent hover:text-primary">
                    <Link to="/" className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back to Home
                    </Link>
                </Button>

                {/* Our Story */}
                <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold">Our Story</h2>
                        <div className="space-y-4 text-muted-foreground leading-relaxed">
                            <p>
                                Founded in 2025, Pravokha started with a simple question: Why do we have to choose between high-performance gear and stylish everyday wear?
                            </p>
                            <p>
                                Born in Bengaluru, India, we set out to bridge this gap. We spent months researching fabrics, testing designs, and collaborating with athletes to create a collection that looks as good as it performs.
                            </p>
                            <p>
                                Today, Pravokha is more than just a brand; it's a community of movers, dreamers, and doers. Whether you're hitting the gym, running a marathon, or just navigating your daily commute, we've got you covered.
                            </p>
                        </div>
                    </div>
                    <div className="relative aspect-square md:aspect-[4/3] bg-muted rounded-2xl overflow-hidden">
                        {/* Placeholder for About Image */}
                        <div className="absolute inset-0 flex items-center justify-center bg-secondary/20">
                            <img
                                src="https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=2600&auto=format&fit=crop"
                                alt="Athletes running"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>

                {/* Values */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
                    <div className="p-6 bg-card border rounded-xl space-y-4">
                        <Award className="h-10 w-10 text-primary" />
                        <h3 className="text-xl font-semibold">Premium Quality</h3>
                        <p className="text-muted-foreground">Detailed craftsmanship and high-grade materials ensure durability and comfort.</p>
                    </div>
                    <div className="p-6 bg-card border rounded-xl space-y-4">
                        <Users className="h-10 w-10 text-primary" />
                        <h3 className="text-xl font-semibold">Community First</h3>
                        <p className="text-muted-foreground">We listen to our customers and evolve our products based on feedback.</p>
                    </div>
                    <div className="p-6 bg-card border rounded-xl space-y-4">
                        <Globe className="h-10 w-10 text-primary" />
                        <h3 className="text-xl font-semibold">Sustainable Steps</h3>
                        <p className="text-muted-foreground">Committed to reducing our footprint through responsible sourcing.</p>
                    </div>
                    <div className="p-6 bg-card border rounded-xl space-y-4">
                        <ShieldCheck className="h-10 w-10 text-primary" />
                        <h3 className="text-xl font-semibold">Secure Shopping</h3>
                        <p className="text-muted-foreground">Your data and payments are protected with top-tier security standards.</p>
                    </div>
                </div>

                {/* CTA */}
                <div className="bg-primary text-primary-foreground rounded-2xl p-12 text-center">
                    <h2 className="text-3xl font-bold mb-4">Join the Movement</h2>
                    <p className="text-primary-foreground/90 max-w-xl mx-auto mb-8">
                        Experience the difference with Pravokha. Shop our latest collection today.
                    </p>
                    <Button variant="secondary" size="lg" asChild>
                        <Link to="/products">Explore Products</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
