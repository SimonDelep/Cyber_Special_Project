import json
from datetime import datetime
from decimal import Decimal
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.models.order import Order
from app.models.user import User

BRAND_ORANGE = colors.HexColor("#c2410c")
BRAND_LIGHT = colors.HexColor("#fff7ed")


def _format_money(amount: Decimal | str | float) -> str:
    return f"${Decimal(str(amount)):,.2f} CAD"


def _customer_name(user: User) -> str:
    parts = [user.first_name, user.last_name]
    name = " ".join(p for p in parts if p)
    return name or user.username


def generate_invoice_pdf(order: Order, user: User) -> bytes:
    line_items = json.loads(order.line_items_json)
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
        "BrandTitle",
        parent=styles["Heading1"],
        textColor=BRAND_ORANGE,
        fontSize=24,
        spaceAfter=6,
    )
    subtitle_style = ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        textColor=colors.HexColor("#57534e"),
        fontSize=10,
    )

    story = []
    story.append(Paragraph("ZestZing", title_style))
    story.append(Paragraph("Small-batch gourmet · Invoice", subtitle_style))
    story.append(Spacer(1, 0.25 * inch))

    issued = order.created_at
    if issued.tzinfo:
        issued = issued.replace(tzinfo=None)
    issued_str = issued.strftime("%B %d, %Y at %H:%M")

    meta_data = [
        ["Invoice number:", order.invoice_number],
        ["Date issued:", issued_str],
        ["Payment method:", "Account balance"],
    ]
    meta_table = Table(meta_data, colWidths=[1.4 * inch, 4.5 * inch])
    meta_table.setStyle(
        TableStyle([
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#44403c")),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ])
    )
    story.append(meta_table)
    story.append(Spacer(1, 0.2 * inch))

    story.append(Paragraph("<b>Bill to</b>", styles["Normal"]))
    bill_lines = [
        _customer_name(user),
        user.email,
        f"Username: {user.username}",
    ]
    for line in bill_lines:
        story.append(Paragraph(line, subtitle_style))
    story.append(Spacer(1, 0.25 * inch))

    table_data = [["Product", "Qty", "Unit price", "Line total"]]
    for item in line_items:
        table_data.append([
            item["name"],
            str(item["quantity"]),
            _format_money(item["unit_price"]),
            _format_money(item["line_total"]),
        ])
    table_data.append(["", "", "Total", _format_money(order.total)])

    items_table = Table(
        table_data,
        colWidths=[3.2 * inch, 0.6 * inch, 1.1 * inch, 1.1 * inch],
    )
    items_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), BRAND_ORANGE),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
            ("ALIGN", (0, 0), (0, -1), "LEFT"),
            ("GRID", (0, 0), (-1, -2), 0.5, colors.HexColor("#e7e5e4")),
            ("FONTNAME", (2, -1), (-1, -1), "Helvetica-Bold"),
            ("BACKGROUND", (0, -1), (-1, -1), BRAND_LIGHT),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ])
    )
    story.append(items_table)
    story.append(Spacer(1, 0.3 * inch))

    balance_data = [
        ["Balance before purchase:", _format_money(order.previous_balance)],
        ["Amount charged:", _format_money(order.total)],
        ["Balance after purchase:", _format_money(order.new_balance)],
    ]
    balance_table = Table(balance_data, colWidths=[2.5 * inch, 2.5 * inch])
    balance_table.setStyle(
        TableStyle([
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("ALIGN", (1, 0), (1, -1), "RIGHT"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ])
    )
    story.append(balance_table)
    story.append(Spacer(1, 0.4 * inch))
    story.append(
        Paragraph(
            "Thank you for shopping with ZestZing. This invoice confirms your simulated purchase.",
            subtitle_style,
        )
    )

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
