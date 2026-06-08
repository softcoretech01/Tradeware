import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from app.database import get_db
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
    result = db.execute(text("CALL SP_GetPurchaseReturns()")).fetchall()
    returns = []
    for row in result:
        mapping = dict(row._mapping)
        mapping["items"] = json.loads(mapping["items_json"]) if mapping["items_json"] else []
        returns.append(mapping)
    return returns

@router.post("/", response_model=dict)
def create_purchase_return(ret_data: PurchaseReturnCreate, db: Session = Depends(get_db)):
    items_json = json.dumps([item.dict() for item in ret_data.items]) if ret_data.items else "[]"

    try:
        result = db.execute(
            text("CALL SP_CreatePurchaseReturn(:return_number, :grn_id, :supplier_id, :return_date, :debit_note_status, :refund_total, :items_json)"),
            {
                "return_number": ret_data.return_number,
                "grn_id": ret_data.grn_id,
                "supplier_id": ret_data.supplier_id,
                "return_date": ret_data.return_date,
                "debit_note_status": ret_data.debit_note_status,
                "refund_total": ret_data.refund_total,
                "items_json": items_json
            }
        ).fetchone()
        
        db.commit()
        return {"status": "success", "return_id": result[0]}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{return_id}", response_model=dict)
def update_purchase_return(return_id: int, ret_data: PurchaseReturnUpdate, db: Session = Depends(get_db)):
    items_json = json.dumps([item.dict() for item in ret_data.items]) if ret_data.items is not None else None

    try:
        db.execute(
            text("CALL SP_UpdatePurchaseReturn(:return_id, :return_number, :grn_id, :supplier_id, :return_date, :debit_note_status, :refund_total, :items_json)"),
            {
                "return_id": return_id,
                "return_number": ret_data.return_number,
                "grn_id": ret_data.grn_id,
                "supplier_id": ret_data.supplier_id,
                "return_date": ret_data.return_date,
                "debit_note_status": ret_data.debit_note_status,
                "refund_total": ret_data.refund_total,
                "items_json": items_json
            }
        )
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{return_id}", response_model=dict)
def delete_purchase_return(return_id: int, db: Session = Depends(get_db)):
    try:
        db.execute(text("CALL SP_DeletePurchaseReturn(:return_id)"), {"return_id": return_id})
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
