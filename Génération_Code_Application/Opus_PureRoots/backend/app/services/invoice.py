from datetime import datetime, timezone
from decimal import Decimal
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.models.order import Order
from app.models.user import User

COMPANY_NAME = "PureRoots"
COMPANY_TAGLINE = "Sustainable e-commerce"
COMPANY_ADDRESS = "Chicoutimi, QC, Canada"


def _money(value: Decimal | str | float) -> str:
    amount = Decimal(str(value))
    return f"${amount:,.2f}"


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
        textColor=colors.HexColor("#1a4d2e"),
        spaceAfter=4,
    )
    muted = ParagraphStyle("Muted", parent=styles["Normal"], fontSize=10, textColor=colors.grey)

    created = order.created_at
    if created.tzinfo is None:
        created = created.replace(tzinfo=timezone.utc)
    date_str = created.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    bill_name = user.full_name or user.username
    story = [
        Paragraph(COMPANY_NAME, title_style),
        Paragraph(COMPANY_TAGLINE, muted),
        Paragraph(COMPANY_ADDRESS, muted),
        Spacer(1, 0.35 * inch),
        Paragraph(f"<b>INVOICE</b> #{order.id}", styles["Heading2"]),
        Paragraph(f"Date: {date_str}", styles["Normal"]),
        Paragraph("Payment: Account balance (simulated)", muted),
        Spacer(1, 0.25 * inch),
        Paragraph("<b>Bill to</b>", styles["Normal"]),
        Paragraph(bill_name, styles["Normal"]),
        Paragraph(user.email, muted),
        Paragraph(f"@{user.username}", muted),
        Spacer(1, 0.3 * inch),
    ]

    table_data = [["Product", "Qty", "Unit price", "Line total"]]
    for item in order.items:
        table_data.append(
            [
                item.product_name,
                str(item.quantity),
                _money(item.unit_price),
                _money(item.line_total),
            ]
        )
    table_data.append(["", "", "Total", _money(order.total)])

    table = Table(table_data, colWidths=[3.2 * inch, 0.6 * inch, 1.1 * inch, 1.1 * inch])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e8f5e9")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#1a4d2e")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
                ("TOPPADDING", (0, 0), (-1, 0), 8),
                ("GRID", (0, 0), (-1, len(table_data) - 2), 0.5, colors.HexColor("#c8e6c9")),
                ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
                ("ALIGN", (0, 1), (0, -1), "LEFT"),
                ("FONTNAME", (2, -1), (-1, -1), "Helvetica-Bold"),
                ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#f1f8f4")),
            ]
        )
    )
    story.append(table)
    story.append(Spacer(1, 0.4 * inch))
    story.append(
        Paragraph(
            "Thank you for shopping with PureRoots. This invoice confirms your simulated purchase.",
            muted,
        )
    )

    doc.build(story)
    return buffer.getvalue()
