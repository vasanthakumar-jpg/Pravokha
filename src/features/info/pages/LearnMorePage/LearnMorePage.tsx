import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Shirt, Users, Award, Heart, Truck, Shield } from "lucide-react";

export function LearnMorePage() {
    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative bg-gradient-hero py-20 text-background">
                <div className="container mx-auto px-4 md:px-6 lg:px-8">
                    <div className="max-w-3xl mx-auto text-center">
                        <h1 className="text-4xl md:text-5xl font-bold mb-6">About Pravokha</h1>
                        <p className="text-lg md:text-xl mb-8 text-background/90">
                            Your trusted destination for premium quality clothing and exceptional style
                        </p>
                        <Link to="/products">
                            <Button size="lg" className="bg-background text-foreground hover:bg-background/90">
                                Shop Our Collection
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Our Story */}
            <section className="py-16">
                <div className="container mx-auto px-4 md:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-3xl font-bold mb-6 text-center">Our Story</h2>
                        <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                            Founded with a passion for quality and style, Pravokha has been delivering premium clothing to customers across India. We believe that everyone deserves to look and feel their best, which is why we carefully curate our collection to bring you the finest fabrics and the latest trends.
                        </p>
                        <p className="text-muted-foreground text-lg leading-relaxed">
                            From classic tees to comfortable track pants and versatile shorts, every piece in our collection is designed with your comfort and style in mind. We're committed to providing exceptional quality at prices that make sense.
                        </p>
                    </div>
                </div>
            </section>

            {/* Why Choose Us */}
            <section className="py-16 bg-muted/50">
                <div className="container mx-auto px-4 md:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold mb-12 text-center">Why Choose Pravokha</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        <Card>
                            <CardHeader>
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                    <Shirt className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle>Premium Quality</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    We source only the finest fabrics and materials to ensure every product meets our high standards.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                    <Award className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle>Trendy Designs</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Stay ahead of fashion trends with our regularly updated collection of stylish clothing.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                    <Heart className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle>Customer First</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Your satisfaction is our priority. We're here to ensure you have the best shopping experience.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                    <Truck className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle>Fast Delivery</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Free shipping on orders above ₹999 with delivery within 3-5 business days.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                    <Shield className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle>Secure Shopping</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Shop with confidence knowing your payments and personal information are protected.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                    <Users className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle>Community</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Join thousands of satisfied customers who trust Pravokha for their fashion needs.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16">
                <div className="container mx-auto px-4 md:px-6 lg:px-8">
                    <div className="max-w-3xl mx-auto text-center bg-gradient-hero p-8 md:p-12 rounded-2xl text-background">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Upgrade Your Wardrobe?</h2>
                        <p className="text-lg mb-8 text-background/90">
                            Explore our collection and find the perfect pieces that match your style.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/products">
                                <Button size="lg" className="bg-background text-foreground hover:bg-background/90">
                                    Shop Now
                                </Button>
                            </Link>
                            <Link to="/contact">
                                <Button size="lg" variant="outline" className="border-background bg-background/10 text-background hover:bg-background/20">
                                    Contact Us
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default LearnMorePage;
