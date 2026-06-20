from datetime import datetime
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.models.order import Order
from app.models.user import User

COMPANY_NAME = "GamerGrid"
COMPANY_TAGLINE = "Premium gaming peripherals"
COMPANY_EMAIL = "billing@gamergrid.com"


def _format_cad(cents: int) -> str:
    return f"${cents / 100:,.2f} CAD"


def _format_date(dt: datetime) -> str:
    if dt.tzinfo:
        dt = dt.replace(tzinfo=None)
    return dt.strftime("%B %d, %Y %H:%M")


def build_invoice_pdf(order: Order, user: User) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "InvoiceTitle",
        parent=styles["Heading1"],
        fontSize=22,
        textColor=colors.HexColor("#0891b2"),
        spaceAfter=6,
    )
    muted_style = ParagraphStyle(
        "Muted",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.grey,
    )

    story = [
        Paragraph(f"<b>{COMPANY_NAME}</b>", title_style),
        Paragraph(COMPANY_TAGLINE, muted_style),
        Paragraph(COMPANY_EMAIL, muted_style),
        Spacer(1, 0.35 * inch),
        Paragraph("<b>INVOICE</b>", styles["Heading2"]),
        Spacer(1, 0.15 * inch),
        Paragraph(f"<b>Invoice / Order #:</b> {order.id}", styles["Normal"]),
        Paragraph(f"<b>Date:</b> {_format_date(order.created_at)}", styles["Normal"]),
        Paragraph(f"<b>Status:</b> {order.status.title()}", styles["Normal"]),
        Paragraph(f"<b>Payment:</b> Account balance", styles["Normal"]),
        Spacer(1, 0.25 * inch),
        Paragraph("<b>Bill to</b>", styles["Heading3"]),
        Paragraph(user.full_name, styles["Normal"]),
        Paragraph(user.email, styles["Normal"]),
        Spacer(1, 0.3 * inch),
    ]

    table_data = [["Product", "Qty", "Unit price", "Line total"]]
    for item in order.items:
        line_total = item.price_cents * item.quantity
        table_data.append(
            [
                item.product_name,
                str(item.quantity),
                _format_cad(item.price_cents),
                _format_cad(line_total),
            ]
        )
    table_data.append(["", "", "Total", _format_cad(order.total_cents)])

    table = Table(table_data, colWidths=[3.2 * inch, 0.6 * inch, 1.1 * inch, 1.1 * inch])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 10),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
                ("TOPPADDING", (0, 0), (-1, 0), 10),
                ("BACKGROUND", (0, 1), (-1, -2), colors.HexColor("#f8fafc")),
                ("TEXTCOLOR", (0, 1), (-1, -1), colors.HexColor("#0f172a")),
                ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
                ("ALIGN", (0, 0), (0, -1), "LEFT"),
                ("GRID", (0, 0), (-1, -2), 0.5, colors.HexColor("#cbd5e1")),
                ("LINEABOVE", (0, -1), (-1, -1), 1.5, colors.HexColor("#0891b2")),
                ("TOPPADDING", (0, 1), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 1), (-1, -1), 8),
            ]
        )
    )
    story.append(table)
    story.append(Spacer(1, 0.4 * inch))
    story.append(
        Paragraph(
            "Thank you for your purchase. This invoice was generated automatically after checkout.",
            muted_style,
        )
    )

    doc.build(story)
    buffer.seek(0)
    return buffer.read()
