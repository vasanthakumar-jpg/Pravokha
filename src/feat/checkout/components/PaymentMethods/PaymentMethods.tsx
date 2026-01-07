import { ChevronsUpDown, Check, Smartphone, CreditCard, Building2, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/ui/Command";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/Popover";
import { INDIAN_BANKS } from "@/data/indian-banks";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/Card";
import { RadioGroup, RadioGroupItem } from "@/ui/RadioGroup";
import { Label } from "@/ui/Label";
import { Badge } from "@/ui/Badge";
import paymentQR from "@/assets/payment-qr.png";
import { Input } from "@/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/Select";
import { ScrollArea } from "@/ui/ScrollArea";
import styles from "./PaymentMethods.module.css";

interface PaymentMethodsProps {
    value: string;
    onChange: (value: string) => void;
    details: { bankName: string; upiId: string };
    onDetailsChange: (details: any) => void;
}

export const PaymentMethods = ({ value, onChange, details, onDetailsChange }: PaymentMethodsProps) => {
    return (
        <Card className={styles.card}>
            <CardHeader className={styles.cardHeader}>
                <CardTitle className={styles.cardTitle}>Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
                <RadioGroup value={value} onValueChange={onChange} className={styles.radioGroup}>

                    {/* Credit/Debit Card - Stripe Style */}
                    <div className={cn(styles.methodContainer, value === 'card' ? styles.methodContainerSelected : styles.methodContainerHover)}>
                        <div className={styles.methodHeader} onClick={() => onChange('card')}>
                            <RadioGroupItem value="card" id="card" />
                            <Label htmlFor="card" className={styles.methodLabel}>
                                <CreditCard className={styles.methodIcon} />
                                <div className={styles.methodInfo}>
                                    <span className={styles.methodName}>Credit/Debit Card</span>
                                    <p className={styles.methodDescription}>Secure payment via Stripe</p>
                                </div>
                                <div className={styles.cardIcons}>
                                    <span className={styles.cardIcon}>VISA</span>
                                    <span className={styles.cardIcon}>MC</span>
                                </div>
                            </Label>
                        </div>

                        {value === 'card' && (
                            <div className={cn(styles.contentBody, styles.spaceY4)}>
                                <div className={styles.spaceY2}>
                                    <Label className={styles.labelSmall}>Card Number</Label>
                                    <div className={styles.inputRelative}>
                                        <Input placeholder="0000 0000 0000 0000" className={cn(styles.inputWithIcon, styles.inputMono)} />
                                        <CreditCard className={styles.inputIcon} />
                                    </div>
                                </div>
                                <div className={styles.gridCols2}>
                                    <div className={styles.spaceY2}>
                                        <Label className={styles.labelSmall}>Expiry Date</Label>
                                        <Input placeholder="MM/YY" className={cn(styles.inputMono, styles.inputCenter)} />
                                    </div>
                                    <div className={styles.spaceY2}>
                                        <Label className={styles.labelSmall}>CVC / CVV</Label>
                                        <Input placeholder="123" maxLength={4} className={cn(styles.inputMono, styles.inputCenter)} />
                                    </div>
                                </div>
                                <div className={styles.spaceY2}>
                                    <Label className={styles.labelSmall}>Cardholder Name</Label>
                                    <Input placeholder="Name on card" />
                                </div>
                                <div className={styles.secureBadge}>
                                    <div className={styles.secureDot}></div>
                                    128-bit SSL Encrypted Connection
                                </div>
                            </div>
                        )}
                    </div>

                    {/* UPI Payment */}
                    <div className={cn(styles.methodContainer, value === 'upi' ? styles.methodContainerSelected : styles.methodContainerHover)}>
                        <div className={styles.methodHeader} onClick={() => onChange('upi')}>
                            <RadioGroupItem value="upi" id="upi" />
                            <Label htmlFor="upi" className={styles.methodLabel}>
                                <Smartphone className={styles.methodIcon} />
                                <div className={styles.methodInfo}>
                                    <span className={styles.methodName}>UPI Payment</span>
                                    <p className={styles.methodDescription}>Google Pay, PhonePe, Paytm</p>
                                </div>
                                <Badge variant="secondary" className="text-xs">Fastest</Badge>
                            </Label>
                        </div>
                        {value === "upi" && (
                            <div className={cn(styles.contentBody, styles.spaceY3)}>
                                <div className={styles.inputRelative}>
                                    <Input
                                        placeholder="Enter your UPI ID (e.g. name@oksbi)"
                                        className={styles.inputWithIcon}
                                        value={details?.upiId || ''}
                                        onChange={(e) => onDetailsChange({ ...details, upiId: e.target.value })}
                                    />
                                    <Smartphone className={styles.inputIcon} />
                                </div>
                                <div className={styles.upiBadges}>
                                    {['@oksbi', '@okhdfcbank', '@okicici', '@upi'].map((suffix) => (
                                        <Badge
                                            key={suffix}
                                            variant="outline"
                                            className={styles.upiBadge}
                                            onClick={() => {
                                                const currentId = details?.upiId?.split('@')[0] || '';
                                                onDetailsChange({ ...details, upiId: `${currentId}${suffix}` });
                                            }}
                                        >
                                            {suffix}
                                        </Badge>
                                    ))}
                                </div>
                                <p className={styles.upiHelperText}>
                                    Verify on your UPI app after clicking Proceed.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Net Banking */}
                    <div className={cn(styles.methodContainer, value === 'netbanking' ? styles.methodContainerSelected : styles.methodContainerHover)}>
                        <div className={styles.methodHeader} onClick={() => onChange('netbanking')}>
                            <RadioGroupItem value="netbanking" id="netbanking" />
                            <Label htmlFor="netbanking" className={styles.methodLabel}>
                                <Building2 className={styles.methodIcon} />
                                <div className={styles.methodInfo}>
                                    <span className={styles.methodName}>Net Banking</span>
                                    <p className={styles.methodDescription}>All Indian banks supported</p>
                                </div>
                            </Label>
                        </div>
                        {value === "netbanking" && (
                            <div className={styles.contentBody}>
                                <Select
                                    value={details?.bankName}
                                    onValueChange={(value) => onDetailsChange({ ...details, bankName: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Search & Select Bank" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <div className={styles.bankSearchContainer}>
                                            <Input placeholder="Search bank..." className="h-8" />
                                        </div>
                                        <ScrollArea className={styles.scrollArea}>
                                            <div className={styles.bankGrid}>
                                                {INDIAN_BANKS.map((bank) => (
                                                    <SelectItem key={bank.value} value={bank.label}>{bank.label}</SelectItem>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    {/* QR Code */}
                    <div className={cn(styles.methodContainer, value === 'qr' ? styles.methodContainerSelected : styles.methodContainerHover)}>
                        <div className={styles.methodHeader} onClick={() => onChange('qr')}>
                            <RadioGroupItem value="qr" id="qr" />
                            <Label htmlFor="qr" className={styles.methodLabel}>
                                <QrCode className={styles.methodIcon} />
                                <div className={styles.methodInfo}>
                                    <span className={styles.methodName}>Scan QR Code</span>
                                    <p className={styles.methodDescription}>Pay via any UPI app manually</p>
                                </div>
                            </Label>
                        </div>
                    </div>

                    {/* Cash on Delivery */}
                    <div className={cn(styles.methodContainer, value === 'cod' ? styles.methodContainerSelected : styles.methodContainerHover)}>
                        <div className={styles.methodHeader} onClick={() => onChange('cod')}>
                            <RadioGroupItem value="cod" id="cod" />
                            <Label htmlFor="cod" className={styles.methodLabel}>
                                <div className={styles.codIconContainer}>
                                    <span className={styles.codSymbol}>₹</span>
                                </div>
                                <div className={styles.methodInfo}>
                                    <span className={styles.methodName}>Cash on Delivery</span>
                                    <p className={styles.methodDescription}>Pay when you receive</p>
                                </div>
                            </Label>
                        </div>
                    </div>

                </RadioGroup>

                {/* Dynamic footer info based on selection */}
                {value === "qr" && (
                    <div className={styles.qrFooter}>
                        <h4 className={styles.qrTitle}>Scan QR Code to Pay</h4>
                        <div className={styles.qrImageContainer}>
                            <img
                                src={paymentQR}
                                alt="Payment QR"
                                className={styles.qrImage}
                            />
                        </div>
                        <div className={styles.qrDetails}>
                            <p className={styles.qrMerchantName}>PR VasanthaKumar</p>
                            <p className={styles.qrUpiId}>UPI ID: vasanthakumar141099@oksbi</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
