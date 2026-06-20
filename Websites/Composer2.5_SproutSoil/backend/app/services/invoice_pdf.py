from datetime import datetime
from decimal import Decimal

from fpdf import FPDF

from app.models.order import Order, OrderItem
from app.models.user import User


class InvoicePDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 18)
        self.set_text_color(90, 109, 71)
        self.cell(0, 10, "SproutSoil", align="L")
        self.set_font("Helvetica", "", 10)
        self.set_text_color(100, 100, 100)
        self.cell(0, 10, "Smart Indoor Gardening", align="R", new_x="LMARGIN", new_y="NEXT")
        self.ln(4)


def _fmt_money(value) -> str:
    return f"${Decimal(str(value)):,.2f}"


def _pdf_text(text: str) -> str:
    """Normalize text for Helvetica (Latin-1) PDF output."""
    if not text:
        return ""
    return (
        text.replace("\u2014", "-")
        .replace("\u2013", "-")
        .replace("\u2018", "'")
        .replace("\u2019", "'")
        .replace("\u201c", '"')
        .replace("\u201d", '"')
        .encode("latin-1", errors="replace")
        .decode("latin-1")
    )


def generate_invoice_pdf(order: Order, items: list[OrderItem], user: User) -> bytes:
    pdf = InvoicePDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    created = order.created_at
    if isinstance(created, datetime):
        date_str = created.strftime("%B %d, %Y at %H:%M")
    else:
        date_str = str(created)

    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(30, 30, 30)
    pdf.cell(0, 10, "INVOICE", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)

    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(60, 60, 60)
    pdf.cell(95, 6, _pdf_text(f"Invoice number: {order.invoice_number}"))
    pdf.cell(0, 6, _pdf_text(f"Date: {date_str}"), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 6, "Bill to:", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 5, _pdf_text(user.username), new_x="LMARGIN", new_y="NEXT")
    if user.full_name:
        pdf.cell(0, 5, _pdf_text(user.full_name), new_x="LMARGIN", new_y="NEXT")
    if user.email:
        pdf.cell(0, 5, _pdf_text(user.email), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(8)

    col_widths = [80, 25, 35, 35]
    headers = ["Product", "Qty", "Unit price", "Line total"]
    pdf.set_fill_color(232, 235, 224)
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(40, 40, 40)
    for i, header in enumerate(headers):
        pdf.cell(col_widths[i], 8, header, border=1, fill=True)
    pdf.ln()

    pdf.set_font("Helvetica", "", 9)
    for item in items:
        name = item.product_name[:38] + ("..." if len(item.product_name) > 38 else "")
        pdf.cell(col_widths[0], 7, _pdf_text(name), border=1)
        pdf.cell(col_widths[1], 7, str(item.quantity), border=1, align="C")
        pdf.cell(col_widths[2], 7, _fmt_money(item.unit_price), border=1, align="R")
        pdf.cell(col_widths[3], 7, _fmt_money(item.line_total), border=1, align="R")
        pdf.ln()

    pdf.ln(6)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(140, 8, "Total charged:", align="R")
    pdf.cell(35, 8, _fmt_money(order.total), align="R", new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("Helvetica", "", 10)
    pdf.cell(140, 7, "Account balance after purchase:", align="R")
    pdf.cell(35, 7, _fmt_money(order.balance_after), align="R", new_x="LMARGIN", new_y="NEXT")

    pdf.ln(12)
    pdf.set_font("Helvetica", "I", 9)
    pdf.set_text_color(120, 120, 120)
    pdf.multi_cell(
        0,
        5,
        "Thank you for shopping at SproutSoil! This is a simulated invoice for your "
        "indoor gardening purchase. For questions, contact support@sproutsoil.local.",
    )

    return bytes(pdf.output())
