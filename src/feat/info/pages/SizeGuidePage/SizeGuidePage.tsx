import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/Table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";

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
        <div className="container py-8">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-4xl font-bold mb-4 text-center">Size Guide</h1>
                <p className="text-muted-foreground text-center mb-12 text-lg">
                    Find your perfect fit with our detailed size charts. All measurements are in inches.
                </p>

                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>T-Shirts</CardTitle>
                            <CardDescription>
                                Measurements for chest, length, and shoulder width
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Size</TableHead>
                                        <TableHead>Chest (inches)</TableHead>
                                        <TableHead>Length (inches)</TableHead>
                                        <TableHead>Shoulder (inches)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tshirtSizes.map((size) => (
                                        <TableRow key={size.size}>
                                            <TableCell className="font-medium">{size.size}</TableCell>
                                            <TableCell>{size.chest}</TableCell>
                                            <TableCell>{size.length}</TableCell>
                                            <TableCell>{size.shoulder}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Track Pants & Shorts</CardTitle>
                            <CardDescription>
                                Measurements for waist, hip, and length
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Size</TableHead>
                                        <TableHead>Waist (inches)</TableHead>
                                        <TableHead>Hip (inches)</TableHead>
                                        <TableHead>Length (inches)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pantsSizes.map((size) => (
                                        <TableRow key={size.size}>
                                            <TableCell className="font-medium">{size.size}</TableCell>
                                            <TableCell>{size.waist}</TableCell>
                                            <TableCell>{size.hip}</TableCell>
                                            <TableCell>{size.length}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>How to Measure</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="font-semibold mb-2">Chest</h3>
                                <p className="text-muted-foreground">
                                    Measure around the fullest part of your chest, keeping the tape parallel to the floor.
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">Length</h3>
                                <p className="text-muted-foreground">
                                    Measure from the highest point of the shoulder to the hem.
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">Shoulder</h3>
                                <p className="text-muted-foreground">
                                    Measure from one shoulder point to the other across the back.
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">Waist</h3>
                                <p className="text-muted-foreground">
                                    Measure around your natural waistline, keeping the tape comfortably loose.
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">Hip</h3>
                                <p className="text-muted-foreground">
                                    Measure around the fullest part of your hips.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-muted">
                        <CardContent className="pt-6">
                            <p className="text-center text-sm text-muted-foreground">
                                <strong>Tip:</strong> If you're between sizes, we recommend sizing up for a more comfortable fit.
                                For any questions about sizing, please{" "}
                                <a href="/contact" className="text-primary hover:underline">
                                    contact our support team
                                </a>
                                .
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default SizeGuidePage;
