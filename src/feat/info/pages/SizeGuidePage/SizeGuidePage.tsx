import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/Table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import { Link } from "react-router-dom";

export function SizeGuidePage() {
    const tshirtSizes = [
        { size: "S", chest: "36-38", length: "27", shoulder: "16" },
        { size: "M", chest: "38-40", length: "28", shoulder: "17" },
        { size: "L", chest: "40-42", length: "29", shoulder: "18" },
        { size: "XL", chest: "42-44", length: "30", shoulder: "19" },
        { size: "XXL", chest: "44-46", length: "31", shoulder: "20" },
        { size: "XXXL", chest: "46-48", length: "32", shoulder: "21" },
    ];

    const pantsSizes = [
        { size: "S", waist: "28-30", hip: "36-38", length: "39" },
        { size: "M", waist: "30-32", hip: "38-40", length: "40" },
        { size: "L", waist: "32-34", hip: "40-42", length: "41" },
        { size: "XL", waist: "34-36", hip: "42-44", length: "42" },
        { size: "XXL", waist: "36-38", hip: "44-46", length: "43" },
        { size: "XXXL", waist: "38-40", hip: "46-48", length: "44" },
    ];

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
            <div className="max-w-4xl mx-auto space-y-8 sm:space-y-12">
                <div className="text-center space-y-3">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">Size Guide</h1>
                    <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                        Find your perfect fit with our detailed size charts. All measurements are in inches.
                    </p>
                </div>

                <div className="grid gap-8">
                    {/* T-Shirts Section */}
                    <Card className="border-primary/5 shadow-sm overflow-hidden rounded-2xl">
                        <CardHeader className="bg-muted/30 pb-4 sm:pb-6">
                            <CardTitle className="text-lg sm:text-xl font-bold">T-Shirts</CardTitle>
                            <CardDescription className="text-xs sm:text-sm font-medium">
                                Measurements for chest, length, and shoulder width
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto custom-scrollbar">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead className="font-bold text-[11px] sm:text-xs uppercase tracking-wider">Size</TableHead>
                                            <TableHead className="font-bold text-[11px] sm:text-xs uppercase tracking-wider">Chest (in)</TableHead>
                                            <TableHead className="font-bold text-[11px] sm:text-xs uppercase tracking-wider">Length (in)</TableHead>
                                            <TableHead className="font-bold text-[11px] sm:text-xs uppercase tracking-wider">Shoulder (in)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tshirtSizes.map((size) => (
                                            <TableRow key={size.size} className="hover:bg-muted/20 transition-colors">
                                                <TableCell className="font-black text-primary text-xs sm:text-sm">{size.size}</TableCell>
                                                <TableCell className="text-xs sm:text-sm font-medium">{size.chest}</TableCell>
                                                <TableCell className="text-xs sm:text-sm font-medium">{size.length}</TableCell>
                                                <TableCell className="text-xs sm:text-sm font-medium">{size.shoulder}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pants Section */}
                    <Card className="border-primary/5 shadow-sm overflow-hidden rounded-2xl">
                        <CardHeader className="bg-muted/30 pb-4 sm:pb-6">
                            <CardTitle className="text-lg sm:text-xl font-bold">Track Pants & Shorts</CardTitle>
                            <CardDescription className="text-xs sm:text-sm font-medium">
                                Measurements for waist, hip, and length
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto custom-scrollbar">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead className="font-bold text-[11px] sm:text-xs uppercase tracking-wider">Size</TableHead>
                                            <TableHead className="font-bold text-[11px] sm:text-xs uppercase tracking-wider">Waist (in)</TableHead>
                                            <TableHead className="font-bold text-[11px] sm:text-xs uppercase tracking-wider">Hip (in)</TableHead>
                                            <TableHead className="font-bold text-[11px] sm:text-xs uppercase tracking-wider">Length (in)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pantsSizes.map((size) => (
                                            <TableRow key={size.size} className="hover:bg-muted/20 transition-colors">
                                                <TableCell className="font-black text-primary text-xs sm:text-sm">{size.size}</TableCell>
                                                <TableCell className="text-xs sm:text-sm font-medium">{size.waist}</TableCell>
                                                <TableCell className="text-xs sm:text-sm font-medium">{size.hip}</TableCell>
                                                <TableCell className="text-xs sm:text-sm font-medium">{size.length}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Measuring Guide */}
                    <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 pt-4">
                        <div className="space-y-4 sm:space-y-6">
                            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">How to Measure</h2>
                            <p className="text-sm text-primary font-bold">Follow these steps to get your perfect size:</p>
                        </div>
                        <div className="grid gap-6">
                            {[
                                { title: "Chest", desc: "Measure around the fullest part of your chest, keeping the tape parallel to the floor." },
                                { title: "Length", desc: "Measure from the highest point of the shoulder to the hem." },
                                { title: "Waist", desc: "Measure around your natural waistline, keeping the tape comfortably loose." },
                                { title: "Hip", desc: "Measure around the fullest part of your hips." }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 group">
                                    <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-black text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                                        {i + 1}
                                    </span>
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-sm sm:text-base">{item.title}</h3>
                                        <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Card className="bg-primary/5 border-primary/10 shadow-none rounded-2xl">
                        <CardContent className="p-4 sm:p-6 text-center">
                            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                                <span className="text-primary font-bold">Fit Tip:</span> If you're between sizes, we recommend sizing up for a more comfortable fit.
                                <br className="hidden sm:block" />
                                Still unsure? <Link to="/support" className="text-primary font-bold hover:underline">Contact our support team</Link> for sizing help.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default SizeGuidePage;
