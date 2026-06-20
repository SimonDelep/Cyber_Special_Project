from datetime import datetime
from decimal import Decimal
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

from app.models.order import Order, OrderLine
from app.models.user import User


def _money(value: Decimal | float) -> str:
    return f"${Decimal(str(value)):.2f}"


def build_invoice_pdf(order: Order, lines: list[OrderLine], user: User) -> bytes:
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    y = height - inch

    pdf.setFont("Helvetica-Bold", 22)
    pdf.drawString(inch, y, "VistaCanvas")
    y -= 0.28 * inch
    pdf.setFont("Helvetica", 10)
    pdf.setFillColor(colors.grey)
    pdf.drawString(inch, y, "Print-on-demand landscape wall art")
    pdf.setFillColor(colors.black)

    y -= 0.55 * inch
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(inch, y, "INVOICE")
    y -= 0.35 * inch
    pdf.setFont("Helvetica", 11)
    pdf.drawString(inch, y, f"Invoice #: {order.invoice_number}")
    y -= 0.2 * inch
    created = order.created_at
    if created.tzinfo:
        created = created.replace(tzinfo=None)
    pdf.drawString(inch, y, f"Date: {created.strftime('%B %d, %Y %H:%M')}")
    y -= 0.2 * inch
    pdf.drawString(inch, y, "Payment: Account balance (simulated)")

    y -= 0.45 * inch
    pdf.setFont("Helvetica-Bold", 11)
    pdf.drawString(inch, y, "Bill to")
    y -= 0.22 * inch
    pdf.setFont("Helvetica", 11)
    pdf.drawString(inch, y, user.username)
    y -= 0.2 * inch
    pdf.drawString(inch, y, user.email)
    if user.full_name:
        y -= 0.2 * inch
        pdf.drawString(inch, y, user.full_name)

    y -= 0.5 * inch
    pdf.setFont("Helvetica-Bold", 10)
    col_name = inch
    col_qty = width - 3.2 * inch
    col_unit = width - 2.2 * inch
    col_total = width - 1.2 * inch
    pdf.drawString(col_name, y, "Item")
    pdf.drawRightString(col_qty + 0.4 * inch, y, "Qty")
    pdf.drawRightString(col_unit, y, "Unit")
    pdf.drawRightString(col_total, y, "Total")
    y -= 0.15 * inch
    pdf.line(inch, y, width - inch, y)
    y -= 0.25 * inch

    pdf.setFont("Helvetica", 10)
    for line in lines:
        if y < inch * 1.5:
            pdf.showPage()
            y = height - inch
            pdf.setFont("Helvetica", 10)
        name = line.product_name
        if len(name) > 48:
            name = name[:45] + "..."
        pdf.drawString(col_name, y, name)
        pdf.drawRightString(col_qty + 0.4 * inch, y, str(line.quantity))
        pdf.drawRightString(col_unit, y, _money(line.unit_price))
        pdf.drawRightString(col_total, y, _money(line.line_total))
        y -= 0.22 * inch

    y -= 0.2 * inch
    pdf.line(col_unit - 0.5 * inch, y, width - inch, y)
    y -= 0.3 * inch
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawRightString(col_unit, y, "Total charged:")
    pdf.drawRightString(col_total, y, _money(order.total_charged))
    y -= 0.25 * inch
    pdf.setFont("Helvetica", 10)
    pdf.drawRightString(col_total, y, f"Balance after: {_money(order.balance_after)}")

    y -= 0.6 * inch
    pdf.setFont("Helvetica-Oblique", 9)
    pdf.setFillColor(colors.grey)
    pdf.drawString(
        inch,
        y,
        "This is a simulated purchase invoice for the VistaCanvas school project.",
    )
    pdf.setFillColor(colors.black)

    pdf.save()
    buffer.seek(0)
    return buffer.read()
