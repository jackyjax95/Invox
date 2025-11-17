import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import jsPDF from 'jspdf';

interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
}

interface InvoiceData {
  client_name: string;
  client_email?: string;
  items: InvoiceItem[];
  total: number;
  created_at: any;
  due_date: any;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id;

    // Fetch invoice from Firestore
    const invoiceRef = doc(db, 'invoices', invoiceId);
    const invoiceSnap = await getDoc(invoiceRef);

    if (!invoiceSnap.exists()) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoice = invoiceSnap.data() as InvoiceData;

    // Create PDF
    const pdfDoc = new jsPDF();

    // Header
    pdfDoc.setFontSize(20);
    pdfDoc.text('INVOICE', 20, 30);

    // Company info (placeholder)
    pdfDoc.setFontSize(12);
    pdfDoc.text('Your Company Name', 20, 50);
    pdfDoc.text('123 Business St', 20, 60);
    pdfDoc.text('City, State 12345', 20, 70);
    pdfDoc.text('Phone: (123) 456-7890', 20, 80);

    // Invoice details
    pdfDoc.text(`Invoice ID: ${invoiceId}`, 120, 50);
    pdfDoc.text(`Date: ${invoice.created_at?.toDate()?.toLocaleDateString('en-GB') || 'N/A'}`, 120, 60);
    pdfDoc.text(`Due Date: ${invoice.due_date?.toDate()?.toLocaleDateString('en-GB') || 'N/A'}`, 120, 70);

    // Client info
    pdfDoc.text('Bill To:', 20, 100);
    pdfDoc.text(invoice.client_name, 20, 110);
    if (invoice.client_email) {
      pdfDoc.text(invoice.client_email, 20, 120);
    }

    // Items table
    let yPos = 140;
    pdfDoc.text('Description', 20, yPos);
    pdfDoc.text('Qty', 120, yPos);
    pdfDoc.text('Price', 150, yPos);
    pdfDoc.text('Total', 180, yPos);

    yPos += 10;
    pdfDoc.line(20, yPos, 190, yPos);
    yPos += 10;

    invoice.items.forEach((item: InvoiceItem) => {
      pdfDoc.text(item.description, 20, yPos);
      pdfDoc.text(item.quantity.toString(), 120, yPos);
      pdfDoc.text(`R${item.price.toFixed(2)}`, 150, yPos);
      pdfDoc.text(`R${(item.quantity * item.price).toFixed(2)}`, 180, yPos);
      yPos += 10;
    });

    // Total
    yPos += 10;
    pdfDoc.setFontSize(14);
    pdfDoc.text(`Total: R${invoice.total.toFixed(2)}`, 150, yPos);

    // Footer
    yPos = 270;
    pdfDoc.setFontSize(10);
    pdfDoc.text('Thank you for your business!', 20, yPos);

    // Convert to buffer
    const pdfBuffer = pdfDoc.output('arraybuffer');

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoiceId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}