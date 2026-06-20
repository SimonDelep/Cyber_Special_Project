from datetime import UTC
from io import BytesIO

from fpdf import FPDF

from app.models.order import Order
from app.models.user import User


def _format_money(value) -> str:
    return f"${float(value):,.2f}"


def _customer_name(user: User) -> str:
    parts = [user.first_name, user.last_name]
    name = " ".join(p for p in parts if p)
    return name or user.username


class InvoicePDF(FPDF):
    def header(self) -> None:
        self.set_font("Helvetica", "B", 20)
        self.set_text_color(30, 30, 30)
        self.cell(0, 12, "AuraWear", ln=True)
        self.set_font("Helvetica", "", 10)
        self.set_text_color(90, 90, 90)
        self.cell(0, 6, "Simulated purchase invoice", ln=True)
        self.ln(4)


def generate_invoice_pdf(order: Order, user: User) -> bytes:
    pdf = InvoicePDF()
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.add_page()

    created = order.created_at
    if created.tzinfo is None:
        created_label = created.strftime("%Y-%m-%d %H:%M UTC")
    else:
        created_label = created.astimezone(UTC).strftime("%Y-%m-%d %H:%M UTC")

    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(30, 30, 30)
    pdf.cell(0, 8, f"Invoice {order.invoice_number}", ln=True)

    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(60, 60, 60)
    pdf.cell(0, 6, f"Date: {created_label}", ln=True)
    pdf.cell(0, 6, f"Order ID: {order.id}", ln=True)
    pdf.ln(6)

    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(30, 30, 30)
    pdf.cell(0, 7, "Bill to", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(60, 60, 60)
    pdf.cell(0, 6, _customer_name(user), ln=True)
    pdf.cell(0, 6, user.email, ln=True)
    pdf.cell(0, 6, f"@{user.username}", ln=True)
    pdf.ln(8)

    col_widths = (78, 22, 32, 32)
    headers = ("Item", "Qty", "Unit price", "Line total")
    pdf.set_fill_color(240, 240, 240)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(30, 30, 30)
    for header, width in zip(headers, col_widths):
        pdf.cell(width, 8, header, border=1, fill=True)
    pdf.ln()

    pdf.set_font("Helvetica", "", 10)
    for item in order.items:
        name = item.product_name[:42] + ("…" if len(item.product_name) > 42 else "")
        pdf.cell(col_widths[0], 8, name, border=1)
        pdf.cell(col_widths[1], 8, str(item.quantity), border=1, align="C")
        pdf.cell(col_widths[2], 8, _format_money(item.unit_price), border=1, align="R")
        pdf.cell(col_widths[3], 8, _format_money(item.line_total), border=1, align="R")
        pdf.ln()

    pdf.ln(6)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(132, 8, "Total charged", align="R")
    pdf.cell(32, 8, _format_money(order.total), align="R", ln=True)

    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(60, 60, 60)
    pdf.cell(132, 7, "Payment method", align="R")
    pdf.cell(32, 7, "Wallet balance", align="R", ln=True)
    pdf.cell(132, 7, "Balance after purchase", align="R")
    pdf.cell(32, 7, _format_money(order.balance_after), align="R", ln=True)

    pdf.ln(10)
    pdf.set_font("Helvetica", "I", 9)
    pdf.multi_cell(
        0,
        5,
        "This is a simulated invoice for the AuraWear demo store. "
        "No real payment was processed.",
    )

    buffer = BytesIO()
    pdf.output(buffer)
    return buffer.getvalue()
