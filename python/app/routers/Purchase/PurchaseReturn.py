from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.purchase_models import (
    PurchaseReturnHeader, 
    PurchaseReturnDetail
)
from app.schemas import (
    PurchaseReturnCreate, 
    PurchaseReturnUpdate, 
    PurchaseReturnResponse
)

router = APIRouter(
    prefix="/api/purchase/returns",
    tags=["Purchase Returns"]
)

@router.get("/", response_model=List[PurchaseReturnResponse])
def get_purchase_returns(db: Session = Depends(get_db)):
    returns = db.query(PurchaseReturnHeader).all()
    result = []
    for ret in returns:
        grn_number = ret.grn.grn_number if ret.grn else str(ret.grn_id)
        supplier_name = ret.supplier.name if ret.supplier else ret.supplier_id
        
        items_res = []
        for item in ret.items:
            items_res.append({
                "return_item_id": item.return_item_id,
                "return_id": item.return_id,
                "item_id": item.item_id,
                "item_name": item.item.name if item.item else item.item_id,
                "inwarded_qty": item.inwarded_qty,
                "return_qty": item.return_qty,
                "return_reason": item.return_reason
            })
            
        result.append({
            "return_id": ret.return_id,
            "return_number": ret.return_number,
            "grn_id": ret.grn_id,
            "grn_number": grn_number,
            "supplier_id": ret.supplier_id,
            "supplier_name": supplier_name,
            "return_date": ret.return_date,
            "debit_note_status": ret.debit_note_status,
            "refund_total": ret.refund_total,
            "items": items_res
        })
    return result

@router.post("/", response_model=dict)
def create_purchase_return(ret_data: PurchaseReturnCreate, db: Session = Depends(get_db)):
    db_ret = PurchaseReturnHeader(
        return_number=ret_data.return_number,
        grn_id=ret_data.grn_id,
        supplier_id=ret_data.supplier_id,
        return_date=ret_data.return_date,
        debit_note_status=ret_data.debit_note_status,
        refund_total=ret_data.refund_total
    )
    db.add(db_ret)
    db.flush() # To get return_id
    
    for item in ret_data.items:
        db_item = PurchaseReturnDetail(
            return_id=db_ret.return_id,
            item_id=item.item_id,
            inwarded_qty=item.inwarded_qty,
            return_qty=item.return_qty,
            return_reason=item.return_reason
        )
        db.add(db_item)
        
    db.commit()
    db.refresh(db_ret)
    return {"status": "success", "return_id": db_ret.return_id}

@router.put("/{return_id}", response_model=dict)
def update_purchase_return(return_id: int, ret_data: PurchaseReturnUpdate, db: Session = Depends(get_db)):
    db_ret = db.query(PurchaseReturnHeader).filter(PurchaseReturnHeader.return_id == return_id).first()
    if not db_ret:
        raise HTTPException(status_code=404, detail="Purchase Return not found")
        
    if ret_data.return_number is not None:
        db_ret.return_number = ret_data.return_number
    if ret_data.grn_id is not None:
        db_ret.grn_id = ret_data.grn_id
    if ret_data.supplier_id is not None:
        db_ret.supplier_id = ret_data.supplier_id
    if ret_data.return_date is not None:
        db_ret.return_date = ret_data.return_date
    if ret_data.debit_note_status is not None:
        db_ret.debit_note_status = ret_data.debit_note_status
    if ret_data.refund_total is not None:
        db_ret.refund_total = ret_data.refund_total
        
    if ret_data.items is not None:
        db.query(PurchaseReturnDetail).filter(PurchaseReturnDetail.return_id == return_id).delete()
        for item in ret_data.items:
            db_item = PurchaseReturnDetail(
                return_id=db_ret.return_id,
                item_id=item.item_id,
                inwarded_qty=item.inwarded_qty,
                return_qty=item.return_qty,
                return_reason=item.return_reason
            )
            db.add(db_item)
            
    db.commit()
    return {"status": "success"}

@router.delete("/{return_id}", response_model=dict)
def delete_purchase_return(return_id: int, db: Session = Depends(get_db)):
    db_ret = db.query(PurchaseReturnHeader).filter(PurchaseReturnHeader.return_id == return_id).first()
    if not db_ret:
        raise HTTPException(status_code=404, detail="Purchase Return not found")
        
    db.delete(db_ret)
    db.commit()
    return {"status": "success"}
