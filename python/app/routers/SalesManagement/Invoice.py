from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from app.database import engine
from sqlalchemy import text

router = APIRouter(
    prefix="/api/sales/invoices",
    tags=["Sales Invoices"]
)

class InvoiceDetail(BaseModel):
    itemId: str = Field(alias="itemId")
    name: str
    orderedQty: float
    suppliedQty: float
    pendingQty: float
    unitPrice: float

class InvoiceHeader(BaseModel):
    invoiceId: Optional[str] = None
    soId: str
    cpoRef: Optional[str] = None
    customerName: str
    amount: float
    taxAmount: float
    taxType: str
    total: float
    items: List[InvoiceDetail]

def generate_invoice_id():
    with engine.connect() as con:
        res = con.execute(text("SELECT invoice_id FROM Sales_Masters.Invoice_Header WHERE invoice_id LIKE 'INV-2026-%' ORDER BY invoice_id DESC LIMIT 1")).fetchone()
        if res and res[0]:
            last_id = res[0]
            try:
                num = int(last_id.split('-')[2])
                return f"INV-2026-{num+1:03d}"
            except:
                pass
        return "INV-2026-001"

@router.get("/")
def get_invoices():
    try:
        with engine.connect() as con:
            headers = con.execute(text("SELECT * FROM Sales_Masters.Invoice_Header ORDER BY created_at DESC")).mappings().all()
            details = con.execute(text("SELECT * FROM Sales_Masters.Invoice_Details")).mappings().all()
            
            # Group details by invoice_id
            details_map = {}
            for d in details:
                inv_id = d["invoice_id"]
                if inv_id not in details_map:
                    details_map[inv_id] = []
                details_map[inv_id].append({
                    "itemId": d["item_id"],
                    "name": d["name"],
                    "orderedQty": float(d["ordered_qty"]),
                    "suppliedQty": float(d["supplied_qty"]),
                    "pendingQty": float(d["pending_qty"]),
                    "unitPrice": float(d["unit_price"])
                })
            
            results = []
            for h in headers:
                results.append({
                    "invoiceId": h["invoice_id"],
                    "soId": h["so_id"],
                    "cpoRef": h["cpo_ref"],
                    "customerName": h["customer_name"],
                    "date": str(h["created_at"]).split(' ')[0] if h.get("created_at") else "",
                    "amount": float(h["amount"]),
                    "taxAmount": float(h["tax_amount"]),
                    "taxType": h["tax_type"],
                    "total": float(h["total"]),
                    "items": details_map.get(h["invoice_id"], [])
                })
            
            return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
def create_invoice(inv: InvoiceHeader):
    try:
        with engine.begin() as con:
            new_id = generate_invoice_id()
            cpo_ref = inv.cpoRef if inv.cpoRef else ""
            
            con.execute(text("""
                INSERT INTO Sales_Masters.Invoice_Header 
                (invoice_id, so_id, cpo_ref, customer_name, amount, tax_amount, tax_type, total)
                VALUES (:invoice_id, :so_id, :cpo_ref, :customer_name, :amount, :tax_amount, :tax_type, :total)
            """), {
                "invoice_id": new_id,
                "so_id": inv.soId,
                "cpo_ref": cpo_ref,
                "customer_name": inv.customerName,
                "amount": inv.amount,
                "tax_amount": inv.taxAmount,
                "tax_type": inv.taxType,
                "total": inv.total
            })
            
            for item in inv.items:
                con.execute(text("""
                    INSERT INTO Sales_Masters.Invoice_Details
                    (invoice_id, item_id, name, ordered_qty, supplied_qty, pending_qty, unit_price)
                    VALUES (:invoice_id, :item_id, :name, :ordered_qty, :supplied_qty, :pending_qty, :unit_price)
                """), {
                    "invoice_id": new_id,
                    "item_id": item.itemId,
                    "name": item.name,
                    "ordered_qty": item.orderedQty,
                    "supplied_qty": item.suppliedQty,
                    "pending_qty": item.pendingQty,
                    "unit_price": item.unitPrice
                })
                
            # Update the Sales Order to mark it as invoiced
            con.execute(text("UPDATE Sales_Masters.SalesOrder_Header SET invoice_generated = 1 WHERE id = :so_id"), {"so_id": inv.soId})
            
            return {"message": "Invoice created successfully", "invoiceId": new_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{invoice_id}")
def update_invoice(invoice_id: str, inv: InvoiceHeader):
    try:
        with engine.begin() as con:
            cpo_ref = inv.cpoRef if inv.cpoRef else ""
            
            con.execute(text("""
                UPDATE Sales_Masters.Invoice_Header SET
                    so_id = :so_id,
                    cpo_ref = :cpo_ref,
                    customer_name = :customer_name,
                    amount = :amount,
                    tax_amount = :tax_amount,
                    tax_type = :tax_type,
                    total = :total
                WHERE invoice_id = :invoice_id
            """), {
                "invoice_id": invoice_id,
                "so_id": inv.soId,
                "cpo_ref": cpo_ref,
                "customer_name": inv.customerName,
                "amount": inv.amount,
                "tax_amount": inv.taxAmount,
                "tax_type": inv.taxType,
                "total": inv.total
            })
            
            # Clear existing items and re-insert
            con.execute(text("DELETE FROM Sales_Masters.Invoice_Details WHERE invoice_id = :id"), {"id": invoice_id})
            
            for item in inv.items:
                con.execute(text("""
                    INSERT INTO Sales_Masters.Invoice_Details
                    (invoice_id, item_id, name, ordered_qty, supplied_qty, pending_qty, unit_price)
                    VALUES (:invoice_id, :item_id, :name, :ordered_qty, :supplied_qty, :pending_qty, :unit_price)
                """), {
                    "invoice_id": invoice_id,
                    "item_id": item.itemId,
                    "name": item.name,
                    "ordered_qty": item.orderedQty,
                    "supplied_qty": item.suppliedQty,
                    "pending_qty": item.pendingQty,
                    "unit_price": item.unitPrice
                })
            return {"message": "Invoice updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{invoice_id}")
def delete_invoice(invoice_id: str):
    try:
        with engine.begin() as con:
            # Revert the SalesOrder flag if we can find it
            res_so = con.execute(text("SELECT so_id FROM Sales_Masters.Invoice_Header WHERE invoice_id = :id"), {"id": invoice_id}).fetchone()
            if res_so:
                con.execute(text("UPDATE Sales_Masters.SalesOrder_Header SET invoice_generated = 0 WHERE id = :so_id"), {"so_id": res_so[0]})
            
            res = con.execute(text("DELETE FROM Sales_Masters.Invoice_Header WHERE invoice_id = :id"), {"id": invoice_id})
            if res.rowcount == 0:
                raise HTTPException(status_code=404, detail="Invoice not found")
            return {"message": "Invoice deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
