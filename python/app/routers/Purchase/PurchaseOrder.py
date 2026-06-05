from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from sqlalchemy import or_
from app.database import get_db
from app.models.purchase_models import (
    Supplier, 
    PurchaseOrderHeader, 
    PurchaseOrderDetail, 
    PurchaseOrderDeliverySchedule,
    PurchaseRequisitionHeader
)
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
    suppliers = db.query(Supplier).filter(Supplier.active == True).all()
    return suppliers

@router.get("/dropdown/requisitions", response_model=List[PRDropdownResponse])
def get_dropdown_requisitions(db: Session = Depends(get_db)):
    # Returns approved or pending PRs to be converted into POs
    prs = db.query(PurchaseRequisitionHeader).all()
    return prs

@router.get("/dropdown/pos", response_model=List[PODropdownResponse])
def get_dropdown_pos(db: Session = Depends(get_db)):
    # Returns approved POs (or all POs for now)
    pos = db.query(PurchaseOrderHeader).all()
    result = []
    for po in pos:
        items = []
        for item in po.items:
            items.append({
                "item_id": item.item_id,
                "item_name": item.item.name if item.item else item.item_id,
                "quantity": item.quantity
            })
        result.append({
            "po_id": po.po_id,
            "po_number": po.po_number,
            "supplier_id": po.supplier_id,
            "supplier_name": po.supplier.name if po.supplier else po.supplier_id,
            "items": items
        })
    return result

@router.get("/", response_model=List[PurchaseOrderResponse])
def get_purchase_orders(search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(PurchaseOrderHeader)
    if search:
        query = query.join(Supplier, PurchaseOrderHeader.supplier_id == Supplier.id, isouter=True)
        query = query.filter(
            or_(
                PurchaseOrderHeader.po_number.ilike(f"%{search}%"),
                Supplier.name.ilike(f"%{search}%")
            )
        )
    return query.all()

@router.get("/{po_id}", response_model=PurchaseOrderResponse)
def get_purchase_order(po_id: int, db: Session = Depends(get_db)):
    po = db.query(PurchaseOrderHeader).filter(PurchaseOrderHeader.po_id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
    return po

@router.post("/", response_model=PurchaseOrderResponse)
def create_purchase_order(po: PurchaseOrderCreate, db: Session = Depends(get_db)):
    # Create Header
    db_po = PurchaseOrderHeader(
        po_number=po.po_number,
        pr_id=po.pr_id,
        supplier_id=po.supplier_id,
        po_date=po.po_date,
        payment_terms=po.payment_terms,
        sub_total=po.sub_total,
        tax_total=po.tax_total,
        grand_total=po.grand_total
    )
    db.add(db_po)
    db.flush() # flush to get po_id

    # Create Items
    if po.items:
        for item in po.items:
            db_item = PurchaseOrderDetail(
                po_id=db_po.po_id,
                item_id=item.item_id,
                quantity=item.quantity,
                uom=item.uom,
                unit_price=item.unit_price,
                tax_rate=item.tax_rate,
                line_total=item.line_total
            )
            db.add(db_item)

    # Create Schedules
    if po.schedules:
        for sched in po.schedules:
            db_sched = PurchaseOrderDeliverySchedule(
                po_id=db_po.po_id,
                expected_delivery_date=sched.expected_delivery_date,
                target_quantity=sched.target_quantity
            )
            db.add(db_sched)

    try:
        db.commit()
        db.refresh(db_po)
        return db_po
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{po_id}", response_model=PurchaseOrderResponse)
def update_purchase_order(po_id: int, po_update: PurchaseOrderUpdate, db: Session = Depends(get_db)):
    db_po = db.query(PurchaseOrderHeader).filter(PurchaseOrderHeader.po_id == po_id).first()
    if not db_po:
        raise HTTPException(status_code=404, detail="Purchase Order not found")

    # Update header fields
    update_data = po_update.dict(exclude_unset=True, exclude={"items", "schedules"})
    for key, value in update_data.items():
        setattr(db_po, key, value)

    # Update items if provided
    if po_update.items is not None:
        db.query(PurchaseOrderDetail).filter(PurchaseOrderDetail.po_id == po_id).delete()
        for item in po_update.items:
            db_item = PurchaseOrderDetail(
                po_id=db_po.po_id,
                item_id=item.item_id,
                quantity=item.quantity,
                uom=item.uom,
                unit_price=item.unit_price,
                tax_rate=item.tax_rate,
                line_total=item.line_total
            )
            db.add(db_item)

    # Update schedules if provided
    if po_update.schedules is not None:
        db.query(PurchaseOrderDeliverySchedule).filter(PurchaseOrderDeliverySchedule.po_id == po_id).delete()
        for sched in po_update.schedules:
            db_sched = PurchaseOrderDeliverySchedule(
                po_id=db_po.po_id,
                expected_delivery_date=sched.expected_delivery_date,
                target_quantity=sched.target_quantity
            )
            db.add(db_sched)

    try:
        db.commit()
        db.refresh(db_po)
        return db_po
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{po_id}")
def delete_purchase_order(po_id: int, db: Session = Depends(get_db)):
    db_po = db.query(PurchaseOrderHeader).filter(PurchaseOrderHeader.po_id == po_id).first()
    if not db_po:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
    
    try:
        db.delete(db_po)
        db.commit()
        return {"detail": "Purchase Order deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
