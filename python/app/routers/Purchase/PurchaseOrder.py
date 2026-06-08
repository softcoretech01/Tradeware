import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from app.database import get_db
from app.schemas import (
    PurchaseOrderCreate, 
    PurchaseOrderUpdate, 
    PurchaseOrderResponse,
    SupplierDropdownResponse,
    PRDropdownResponse,
    PODropdownResponse
)

router = APIRouter(
    prefix="/api/purchase/orders",
    tags=["Purchase Orders"]
)

@router.get("/dropdown/suppliers", response_model=List[SupplierDropdownResponse])
def get_dropdown_suppliers(db: Session = Depends(get_db)):
    result = db.execute(text("CALL SP_GetDropdownSuppliers()")).fetchall()
    return [dict(row._mapping) for row in result]

@router.get("/dropdown/requisitions", response_model=List[PRDropdownResponse])
def get_dropdown_requisitions(db: Session = Depends(get_db)):
    result = db.execute(text("CALL SP_GetDropdownRequisitions()")).fetchall()
    prs = []
    for row in result:
        mapping = dict(row._mapping)
        mapping["items"] = json.loads(mapping["items_json"]) if mapping["items_json"] else []
        prs.append(mapping)
    return prs

@router.get("/dropdown/pos", response_model=List[PODropdownResponse])
def get_dropdown_pos(db: Session = Depends(get_db)):
    result = db.execute(text("CALL SP_GetDropdownPOs()")).fetchall()
    pos = []
    for row in result:
        mapping = dict(row._mapping)
        mapping["items"] = json.loads(mapping["items_json"]) if mapping["items_json"] else []
        pos.append(mapping)
    return pos

@router.get("/", response_model=List[PurchaseOrderResponse])
def get_purchase_orders(search: Optional[str] = None, db: Session = Depends(get_db)):
    result = db.execute(text("CALL SP_GetPurchaseOrders(:search)"), {"search": search or ""}).fetchall()
    pos = []
    for row in result:
        mapping = dict(row._mapping)
        mapping["items"] = json.loads(mapping["items_json"]) if mapping["items_json"] else []
        mapping["schedules"] = json.loads(mapping["schedules_json"]) if mapping["schedules_json"] else []
        pos.append(mapping)
    return pos

@router.post("/", response_model=PurchaseOrderResponse)
def create_purchase_order(po: PurchaseOrderCreate, db: Session = Depends(get_db)):
    items_json = json.dumps([item.dict() for item in po.items]) if po.items else "[]"
    schedules_json = json.dumps([sched.dict() for sched in (po.schedules or [])]) if po.schedules else "[]"

    try:
        result = db.execute(
            text("CALL SP_CreatePurchaseOrder(:po_number, :pr_id, :supplier_id, :po_date, :payment_terms, :sub_total, :tax_total, :grand_total, :items_json, :schedules_json)"),
            {
                "po_number": po.po_number,
                "pr_id": po.pr_id,
                "supplier_id": po.supplier_id,
                "po_date": po.po_date,
                "payment_terms": po.payment_terms,
                "sub_total": po.sub_total,
                "tax_total": po.tax_total,
                "grand_total": po.grand_total,
                "items_json": items_json,
                "schedules_json": schedules_json
            }
        ).fetchone()
        
        db.commit()
        new_po_id = result[0]
        
        # In a real scenario we'd do another fetch, but since GET /po_id is removed, 
        # and React just needs a simple response, we can just return a fake or refetched PO list 
        # But wait, POST expects PurchaseOrderResponse. Let's just fetch it by calling GetPurchaseOrders with po_number
        
        fetch_result = db.execute(text("CALL SP_GetPurchaseOrders(:search)"), {"search": po.po_number}).fetchall()
        for row in fetch_result:
            mapping = dict(row._mapping)
            if mapping["po_id"] == new_po_id:
                mapping["items"] = json.loads(mapping["items_json"]) if mapping["items_json"] else []
                mapping["schedules"] = json.loads(mapping["schedules_json"]) if mapping["schedules_json"] else []
                return mapping
                
        raise HTTPException(status_code=500, detail="Failed to retrieve created PO")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{po_id}", response_model=PurchaseOrderResponse)
def update_purchase_order(po_id: int, po_update: PurchaseOrderUpdate, db: Session = Depends(get_db)):
    items_json = json.dumps([item.dict() for item in po_update.items]) if po_update.items is not None else None
    schedules_json = json.dumps([s.dict() for s in po_update.schedules]) if po_update.schedules is not None else None

    try:
        db.execute(
            text("CALL SP_UpdatePurchaseOrder(:po_id, :po_number, :pr_id, :supplier_id, :po_date, :payment_terms, :sub_total, :tax_total, :grand_total, :items_json, :schedules_json)"),
            {
                "po_id": po_id,
                "po_number": po_update.po_number,
                "pr_id": po_update.pr_id,
                "supplier_id": po_update.supplier_id,
                "po_date": po_update.po_date,
                "payment_terms": po_update.payment_terms,
                "sub_total": po_update.sub_total,
                "tax_total": po_update.tax_total,
                "grand_total": po_update.grand_total,
                "items_json": items_json,
                "schedules_json": schedules_json
            }
        )
        db.commit()
        
        fetch_result = db.execute(text("CALL SP_GetPurchaseOrders(:search)"), {"search": ""}).fetchall()
        for row in fetch_result:
            mapping = dict(row._mapping)
            if mapping["po_id"] == po_id:
                mapping["items"] = json.loads(mapping["items_json"]) if mapping["items_json"] else []
                mapping["schedules"] = json.loads(mapping["schedules_json"]) if mapping["schedules_json"] else []
                return mapping
                
        raise HTTPException(status_code=404, detail="Purchase Order not found after update")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{po_id}")
def delete_purchase_order(po_id: int, db: Session = Depends(get_db)):
    try:
        db.execute(text("CALL SP_DeletePurchaseOrder(:po_id)"), {"po_id": po_id})
        db.commit()
        return {"detail": "Purchase Order deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
