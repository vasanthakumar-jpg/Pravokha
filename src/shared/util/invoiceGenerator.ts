import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InvoiceData {
    orderNumber: string;
    orderDate: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingAddress: string;
    shippingCity: string;
    shippingPincode: string;
    items: {
        title: string;
        quantity: number;
        price: number;
        colorName?: string;
        size?: string;
    }[];
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
    paymentMethod: string;
    paymentStatus: string;
}

// Premium Color Palette
const COLORS = {
    darkTeal: { r: 14, g: 98, b: 81 },      // #0E6251
    gold: { r: 244, g: 197, b: 66 },         // #F4C542
    dark: { r: 17, g: 24, b: 39 },           // Dark text
    gray: { r: 107, g: 114, b: 128 },        // Muted text
    lightGray: { r: 249, g: 250, b: 251 },   // Background
    tableHeader: { r: 243, g: 244, b: 246 }, // Table header bg
    white: { r: 255, g: 255, b: 255 }
};

// Company Info
const COMPANY = {
    tagline: 'Premium Quality T-Shirts & Apparel',
    gstin: '33AABCU9603R1ZM',
    website: 'www.pravokha.com',
    email: 'support@pravokha.com',
    phone: '+91 73392 32817'
};

// Format currency with Rs. prefix (avoids font encoding issues with ₹)
function formatCurrency(amount: number): string {
    return `Rs. ${amount.toLocaleString('en-IN')}`;
}

// Helper to load image as base64
async function loadImageAsBase64(url: string): Promise<string | null> {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

export async function generateInvoicePDF(data: InvoiceData) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;

    // Load logo
    let logoBase64: string | null = null;
    try {
        logoBase64 = await loadImageAsBase64('/pravokha-logo.png');
    } catch (e) {
        console.warn('Could not load logo:', e);
    }

    // ===== COMPACT HEADER =====
    // Soft background strip
    doc.setFillColor(COLORS.lightGray.r, COLORS.lightGray.g, COLORS.lightGray.b);
    doc.rect(0, 0, pageWidth, 42, 'F');

    // Gold accent line at bottom of header
    doc.setFillColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
    doc.rect(0, 42, pageWidth, 2, 'F');

    // Logo (includes PRAVOKHA text, so no need to add text separately)
    if (logoBase64) {
        try {
            doc.addImage(logoBase64, 'PNG', margin, 4, 35, 35);
        } catch (e) {
            console.warn('Error adding logo:', e);
        }
    }

    // Company details next to logo
    const companyX = margin + 40;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
    doc.text(COMPANY.tagline, companyX, 18);
    doc.text(`GSTIN: ${COMPANY.gstin}`, companyX, 25);
    doc.text(`${COMPANY.email} | ${COMPANY.phone}`, companyX, 32);

    // Invoice Info (Right side)
    const rightX = pageWidth - margin;

    // Invoice Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
    doc.text('TAX INVOICE', rightX, 14, { align: 'right' });

    // Invoice Number and Date
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
    doc.text(`Invoice: #${data.orderNumber}`, rightX, 22, { align: 'right' });
    doc.text(`Date: ${data.orderDate}`, rightX, 29, { align: 'right' });

    // Payment Status Badge
    const status = (data.paymentStatus || 'pending').toUpperCase();
    const isPaid = status === 'PAID';

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    if (isPaid) {
        doc.setFillColor(22, 163, 74); // Green
        doc.setTextColor(255, 255, 255);
    } else {
        doc.setFillColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
        doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
    }
    const statusWidth = doc.getTextWidth(status) + 12;
    const badgeX = rightX - statusWidth;
    const badgeY = 33;
    doc.roundedRect(badgeX, badgeY, statusWidth, 8, 2, 2, 'F');
    // Center text in badge: badge center = badgeX + statusWidth/2
    doc.text(status, badgeX + statusWidth / 2, badgeY + 5.5, { align: 'center' });

    // ===== BILLING & SHIPPING SECTION =====
    let yPos = 52;
    const boxWidth = (pageWidth - margin * 2 - 10) / 2;
    const boxHeight = 38;

    // Bill To Box
    doc.setDrawColor(COLORS.darkTeal.r, COLORS.darkTeal.g, COLORS.darkTeal.b);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, yPos, boxWidth, boxHeight, 2, 2, 'S');

    // Bill To Header
    doc.setFillColor(COLORS.darkTeal.r, COLORS.darkTeal.g, COLORS.darkTeal.b);
    doc.roundedRect(margin, yPos, boxWidth, 7, 2, 2, 'F');
    doc.rect(margin, yPos + 5, boxWidth, 2, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('BILL TO', margin + 4, yPos + 5);

    // Bill To Content
    doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
    doc.setFontSize(10);
    doc.text(data.customerName || 'Customer', margin + 4, yPos + 14);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);

    let billY = yPos + 20;
    if (data.customerEmail && data.customerEmail !== 'N/A') {
        doc.text(data.customerEmail, margin + 4, billY);
        billY += 5;
    }
    if (data.customerPhone && data.customerPhone !== 'N/A') {
        doc.text(`Ph: ${data.customerPhone}`, margin + 4, billY);
    }

    // Ship To Box
    const shipX = margin + boxWidth + 10;
    doc.setDrawColor(COLORS.darkTeal.r, COLORS.darkTeal.g, COLORS.darkTeal.b);
    doc.roundedRect(shipX, yPos, boxWidth, boxHeight, 2, 2, 'S');

    // Ship To Header
    doc.setFillColor(COLORS.darkTeal.r, COLORS.darkTeal.g, COLORS.darkTeal.b);
    doc.roundedRect(shipX, yPos, boxWidth, 7, 2, 2, 'F');
    doc.rect(shipX, yPos + 5, boxWidth, 2, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('SHIP TO', shipX + 4, yPos + 5);

    // Ship To Content
    doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
    doc.setFontSize(10);
    doc.text(data.customerName || 'Customer', shipX + 4, yPos + 14);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);

    // Limit address to fit in box
    const maxAddrWidth = boxWidth - 10;
    const addressText = data.shippingAddress || '';
    const addressLines = doc.splitTextToSize(addressText, maxAddrWidth);
    doc.text(addressLines.slice(0, 2), shipX + 4, yPos + 20); // Max 2 lines

    const cityLine = `${data.shippingCity || ''} ${data.shippingPincode ? '- ' + data.shippingPincode : ''}`.trim();
    doc.text(cityLine, shipX + 4, yPos + 32);

    // ===== ITEMS TABLE =====
    yPos = yPos + boxHeight + 8;

    const tableData = data.items.map((item, idx) => {
        const variant = [item.colorName, item.size].filter(Boolean).join(' | ') || '-';
        const productName = (item.title || 'Product').substring(0, 30); // Limit product name length
        return [
            (idx + 1).toString(),
            productName,
            variant.substring(0, 15), // Limit variant length
            item.quantity.toString(),
            formatCurrency(item.price || 0),
            formatCurrency((item.price || 0) * (item.quantity || 1))
        ];
    });

    autoTable(doc, {
        startY: yPos,
        head: [['#', 'Product', 'Variant', 'Qty', 'Unit Price', 'Amount']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: [COLORS.darkTeal.r, COLORS.darkTeal.g, COLORS.darkTeal.b],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8,
            cellPadding: 3,
            halign: 'center'
        },
        bodyStyles: {
            fontSize: 8,
            cellPadding: 3,
            textColor: [COLORS.dark.r, COLORS.dark.g, COLORS.dark.b],
            overflow: 'ellipsize'
        },
        alternateRowStyles: {
            fillColor: [COLORS.lightGray.r, COLORS.lightGray.g, COLORS.lightGray.b]
        },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 50, halign: 'center' },
            2: { cellWidth: 28, halign: 'center' },
            3: { cellWidth: 15, halign: 'center' },
            4: { cellWidth: 32, halign: 'center' },
            5: { cellWidth: 35, halign: 'center' }
        },
        margin: { left: margin, right: margin },
        tableWidth: pageWidth - margin * 2
    });

    // Get final Y position after table
    yPos = (doc as any).lastAutoTable.finalY + 12;

    // ===== PAYMENT INFO & ORDER SUMMARY SIDE BY SIDE =====
    const leftBoxWidth = 75;
    const rightBoxWidth = 85;
    const summaryX = pageWidth - margin - rightBoxWidth;

    // Payment Details Box (Left)
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, yPos, leftBoxWidth, 30, 2, 2, 'S');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.darkTeal.r, COLORS.darkTeal.g, COLORS.darkTeal.b);
    doc.text('PAYMENT DETAILS', margin + 4, yPos + 7);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
    doc.text(`Method: ${(data.paymentMethod || 'N/A').toUpperCase()}`, margin + 4, yPos + 15);
    doc.text(`Status: ${(data.paymentStatus || 'Pending').toUpperCase()}`, margin + 4, yPos + 22);

    // Order Summary Box (Right)
    doc.setDrawColor(COLORS.darkTeal.r, COLORS.darkTeal.g, COLORS.darkTeal.b);
    doc.setLineWidth(0.5);
    doc.roundedRect(summaryX, yPos, rightBoxWidth, 50, 2, 2, 'S');

    // Summary Header
    doc.setFillColor(COLORS.darkTeal.r, COLORS.darkTeal.g, COLORS.darkTeal.b);
    doc.roundedRect(summaryX, yPos, rightBoxWidth, 8, 2, 2, 'F');
    doc.rect(summaryX, yPos + 5, rightBoxWidth, 3, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('ORDER SUMMARY', summaryX + rightBoxWidth / 2, yPos + 5.5, { align: 'center' });

    // Summary Content
    const sumLabelX = summaryX + 5;
    const sumValueX = summaryX + rightBoxWidth - 5;
    let sumY = yPos + 16;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);

    doc.text('Subtotal', sumLabelX, sumY);
    doc.text(formatCurrency(data.subtotal), sumValueX, sumY, { align: 'right' });

    sumY += 7;
    doc.text('Tax (GST 18%)', sumLabelX, sumY);
    doc.text(formatCurrency(data.tax), sumValueX, sumY, { align: 'right' });

    sumY += 7;
    doc.text('Shipping', sumLabelX, sumY);
    doc.text(data.shipping > 0 ? formatCurrency(data.shipping) : 'FREE', sumValueX, sumY, { align: 'right' });

    // Gold divider line
    sumY += 4;
    doc.setDrawColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
    doc.setLineWidth(1);
    doc.line(sumLabelX, sumY, sumValueX, sumY);

    // Total
    sumY += 7;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(COLORS.darkTeal.r, COLORS.darkTeal.g, COLORS.darkTeal.b);
    doc.text('TOTAL', sumLabelX, sumY);
    doc.text(formatCurrency(data.total), sumValueX, sumY, { align: 'right' });

    // ===== RETURN POLICY =====
    yPos = yPos + 55;
    doc.setFillColor(COLORS.lightGray.r, COLORS.lightGray.g, COLORS.lightGray.b);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 16, 2, 2, 'F');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.darkTeal.r, COLORS.darkTeal.g, COLORS.darkTeal.b);
    doc.text('RETURN & REFUND POLICY', margin + 4, yPos + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
    doc.setFontSize(6);
    doc.text('Easy 7-day returns on all products. Refunds are processed within 5-7 business days after pickup.', margin + 4, yPos + 10);
    doc.text(`For assistance, contact ${COMPANY.email} or call ${COMPANY.phone}.`, margin + 4, yPos + 14);

    // ===== FOOTER =====
    // Gold line
    doc.setFillColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
    doc.rect(0, pageHeight - 22, pageWidth, 1.5, 'F');

    // Footer content
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.darkTeal.r, COLORS.darkTeal.g, COLORS.darkTeal.b);
    doc.text('Thank you for shopping with Pravokha!', pageWidth / 2, pageHeight - 15, { align: 'center' });

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
    doc.text(`${COMPANY.website} | ${COMPANY.email} | ${COMPANY.phone}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text('This is a computer-generated invoice and does not require a signature.', pageWidth / 2, pageHeight - 5, { align: 'center' });

    // Download
    doc.save(`Invoice_${data.orderNumber}.pdf`);
}
