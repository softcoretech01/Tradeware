from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.purchase_models import (
    GRNHeader, 
    GRNDetail,
    PurchaseOrderHeader,
    Supplier
)
from app.schemas import (
    GRNCreate, 
    GRNUpdate, 
    GRNResponse,
    GRNDropdownResponse
)

router = APIRouter(
    prefix="/api/purchase/grns",
    tags=["Goods Receipt Notes"]
)

@router.get("/dropdown/grns", response_model=List[GRNDropdownResponse])
def get_dropdown_grns(db: Session = Depends(get_db)):
    grns = db.query(GRNHeader).all()
    result = []
    for grn in grns:
        items = []
        for item in grn.items:
            # fetch unit_price from po_details
            po_item = None
            if grn.order:
                po_item = next((pi for pi in grn.order.items if pi.item_id == item.item_id), None)
            
            unit_price = po_item.unit_price if po_item else 0.00
            
            items.append({
                "item_id": item.item_id,
                "item_name": item.item.name if item.item else item.item_id,
                "received_qty": item.received_qty,
                "unit_price": unit_price
            })
        result.append({
            "grn_id": grn.grn_id,
            "grn_number": grn.grn_number,
            "supplier_id": grn.supplier_id,
            "supplier_name": grn.supplier.name if grn.supplier else grn.supplier_id,
            "po_number": grn.order.po_number if grn.order else None,
            "items": items
        })
    return result

@router.get("/", response_model=List[GRNResponse])
def get_grns(db: Session = Depends(get_db)):
    grns = db.query(GRNHeader).all()
    result = []
    for grn in grns:
        po_number = grn.order.po_number if grn.order else None
        supplier_name = grn.supplier.name if grn.supplier else grn.supplier_id
        
        items_res = []
        for item in grn.items:
            items_res.append({
                "grn_item_id": item.grn_item_id,
                "grn_id": item.grn_id,
                "item_id": item.item_id,
                "item_name": item.item.name if item.item else item.item_id,
                "po_qty": item.po_qty,
                "received_qty": item.received_qty,
                "batch_lot_number": item.batch_lot_number,
                "mfg_date": item.mfg_date,
                "expiry_date": item.expiry_date
            })
            
        result.append({
            "grn_id": grn.grn_id,
            "grn_number": grn.grn_number,
            "po_id": grn.po_id,
            "po_number": po_number,
            "supplier_id": grn.supplier_id,
            "supplier_name": supplier_name,
            "grn_date": grn.grn_date,
            "items": items_res
        })
    return result

@router.post("/", response_model=dict)
def create_grn(grn: GRNCreate, db: Session = Depends(get_db)):
    db_grn = GRNHeader(
        grn_number=grn.grn_number,
        po_id=grn.po_id,
        supplier_id=grn.supplier_id,
        grn_date=grn.grn_date
    )
    db.add(db_grn)
    db.flush() # To get grn_id
    
    for item in grn.items:
        db_item = GRNDetail(
            grn_id=db_grn.grn_id,
            item_id=item.item_id,
            po_qty=item.po_qty,
            received_qty=item.received_qty,
            batch_lot_number=item.batch_lot_number,
            mfg_date=item.mfg_date,
            expiry_date=item.expiry_date
        )
        db.add(db_item)
        
    db.commit()
    db.refresh(db_grn)
    return {"status": "success", "grn_id": db_grn.grn_id}

@router.put("/{grn_id}", response_model=dict)
def update_grn(grn_id: int, grn: GRNUpdate, db: Session = Depends(get_db)):
    db_grn = db.query(GRNHeader).filter(GRNHeader.grn_id == grn_id).first()
    if not db_grn:
        raise HTTPException(status_code=404, detail="GRN not found")
        
    if grn.grn_number is not None:
        db_grn.grn_number = grn.grn_number
    if grn.po_id is not None:
        db_grn.po_id = grn.po_id
    if grn.supplier_id is not None:
        db_grn.supplier_id = grn.supplier_id
    if grn.grn_date is not None:
        db_grn.grn_date = grn.grn_date
        
    if grn.items is not None:
        db.query(GRNDetail).filter(GRNDetail.grn_id == grn_id).delete()
        for item in grn.items:
            db_item = GRNDetail(
                grn_id=db_grn.grn_id,
                item_id=item.item_id,
                po_qty=item.po_qty,
                received_qty=item.received_qty,
                batch_lot_number=item.batch_lot_number,
                mfg_date=item.mfg_date,
                expiry_date=item.expiry_date
            )
            db.add(db_item)
            
    db.commit()
    return {"status": "success"}

@router.delete("/{grn_id}", response_model=dict)
def delete_grn(grn_id: int, db: Session = Depends(get_db)):
    db_grn = db.query(GRNHeader).filter(GRNHeader.grn_id == grn_id).first()
    if not db_grn:
        raise HTTPException(status_code=404, detail="GRN not found")
        
    db.delete(db_grn)
    db.commit()
    return {"status": "success"}
