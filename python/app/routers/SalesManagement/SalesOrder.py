from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from app.database import engine
from sqlalchemy import text

router = APIRouter(
    prefix="/api/sales/orders",
    tags=["Sales Orders"]
)

class SalesOrderDetail(BaseModel):
    itemId: str = Field(alias="itemId")
    name: str
    orderedQty: float
    suppliedQty: float
    pendingQty: float
    unitPrice: float

class SalesOrderHeader(BaseModel):
    id: Optional[str] = None
    cpoRef: Optional[str] = None
    customerName: str
    date: str
    deliverySchedule: str
    invoiceGenerated: bool = False
    items: List[SalesOrderDetail]

def generate_so_id():
    with engine.connect() as con:
        res = con.execute(text("SELECT id FROM Sales_Masters.SalesOrder_Header WHERE id LIKE 'SO2026-%' ORDER BY id DESC LIMIT 1")).fetchone()
        if res and res[0]:
            last_id = res[0]
            try:
                num = int(last_id.split('-')[1])
                return f"SO2026-{num+1:03d}"
            except:
                pass
        return "SO2026-001"

@router.get("/")
def get_sales_orders():
    try:
        with engine.connect() as con:
            headers = con.execute(text("SELECT * FROM Sales_Masters.SalesOrder_Header ORDER BY created_at DESC")).mappings().all()
            details = con.execute(text("SELECT * FROM Sales_Masters.SalesOrder_Details")).mappings().all()
            
            # Group details by SO number
            details_map = {}
            for d in details:
                so_num = d["So_number"]
                if so_num not in details_map:
                    details_map[so_num] = []
                details_map[so_num].append({
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
                    "id": h["id"],
                    "cpoRef": h["So_number"], # User mapped So_number to cpo_ref in header
                    "customerName": h["customer_name"],
                    "date": str(h["date"]),
                    "deliverySchedule": str(h["delivery_schedule"]),
                    "invoiceGenerated": bool(h["invoice_generated"]),
                    "items": details_map.get(h["id"], [])
                })
            
            return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
def create_sales_order(order: SalesOrderHeader):
    try:
        with engine.begin() as con:
            new_id = generate_so_id()
            cpo_ref = order.cpoRef if order.cpoRef else ""
            
            con.execute(text("""
                INSERT INTO Sales_Masters.SalesOrder_Header 
                (id, So_number, customer_name, date, delivery_schedule, invoice_generated)
                VALUES (:id, :So_number, :customer_name, :date, :delivery_schedule, :invoice_generated)
            """), {
                "id": new_id,
                "So_number": cpo_ref,
                "customer_name": order.customerName,
                "date": order.date,
                "delivery_schedule": order.deliverySchedule,
                "invoice_generated": int(order.invoiceGenerated)
            })
            
            for item in order.items:
                con.execute(text("""
                    INSERT INTO Sales_Masters.SalesOrder_Details
                    (So_number, item_id, name, ordered_qty, supplied_qty, pending_qty, unit_price)
                    VALUES (:So_number, :item_id, :name, :ordered_qty, :supplied_qty, :pending_qty, :unit_price)
                """), {
                    "So_number": new_id,
                    "item_id": item.itemId,
                    "name": item.name,
                    "ordered_qty": item.orderedQty,
                    "supplied_qty": item.suppliedQty,
                    "pending_qty": item.pendingQty,
                    "unit_price": item.unitPrice
                })
            return {"message": "Sales Order created successfully", "id": new_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{order_id}")
def update_sales_order(order_id: str, order: SalesOrderHeader):
    try:
        with engine.begin() as con:
            cpo_ref = order.cpoRef if order.cpoRef else ""
            
            con.execute(text("""
                UPDATE Sales_Masters.SalesOrder_Header SET
                    So_number = :So_number,
                    customer_name = :customer_name,
                    date = :date,
                    delivery_schedule = :delivery_schedule,
                    invoice_generated = :invoice_generated
                WHERE id = :id
            """), {
                "id": order_id,
                "So_number": cpo_ref,
                "customer_name": order.customerName,
                "date": order.date,
                "delivery_schedule": order.deliverySchedule,
                "invoice_generated": int(order.invoiceGenerated)
            })
            
            # Clear existing items and re-insert
            con.execute(text("DELETE FROM Sales_Masters.SalesOrder_Details WHERE So_number = :id"), {"id": order_id})
            
            for item in order.items:
                con.execute(text("""
                    INSERT INTO Sales_Masters.SalesOrder_Details
                    (So_number, item_id, name, ordered_qty, supplied_qty, pending_qty, unit_price)
                    VALUES (:So_number, :item_id, :name, :ordered_qty, :supplied_qty, :pending_qty, :unit_price)
                """), {
                    "So_number": order_id,
                    "item_id": item.itemId,
                    "name": item.name,
                    "ordered_qty": item.orderedQty,
                    "supplied_qty": item.suppliedQty,
                    "pending_qty": item.pendingQty,
                    "unit_price": item.unitPrice
                })
            return {"message": "Sales Order updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{order_id}")
def delete_sales_order(order_id: str):
    try:
        with engine.begin() as con:
            # Due to CASCADE, deleting header deletes details
            res = con.execute(text("DELETE FROM Sales_Masters.SalesOrder_Header WHERE id = :id"), {"id": order_id})
            if res.rowcount == 0:
                raise HTTPException(status_code=404, detail="Order not found")
            return {"message": "Sales Order deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/masters/customers")
def get_customers():
    try:
        with engine.connect() as con:
            customers = con.execute(text("SELECT id, name, gstDetails FROM masters.customers")).mappings().all()
            return customers
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/masters/items")
def get_items():
    try:
        with engine.connect() as con:
            items = con.execute(text("SELECT id, name, standardPrice FROM masters.items")).mappings().all()
            return items
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
