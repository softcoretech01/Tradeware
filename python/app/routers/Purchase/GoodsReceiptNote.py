import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from app.database import get_db
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
    result = db.execute(text("CALL SP_GetDropdownGRNs()")).fetchall()
    grns = []
    for row in result:
        mapping = dict(row._mapping)
        mapping["items"] = json.loads(mapping["items_json"]) if mapping["items_json"] else []
        grns.append(mapping)
    return grns

@router.get("/", response_model=List[GRNResponse])
def get_grns(db: Session = Depends(get_db)):
    result = db.execute(text("CALL SP_GetGRNs()")).fetchall()
    grns = []
    for row in result:
        mapping = dict(row._mapping)
        mapping["items"] = json.loads(mapping["items_json"]) if mapping["items_json"] else []
        grns.append(mapping)
    return grns

@router.post("/", response_model=dict)
def create_grn(grn: GRNCreate, db: Session = Depends(get_db)):
    items_json = json.dumps([item.dict() for item in grn.items]) if grn.items else "[]"

    try:
        result = db.execute(
            text("CALL SP_CreateGRN(:grn_number, :po_id, :supplier_id, :grn_date, :items_json)"),
            {
                "grn_number": grn.grn_number,
                "po_id": grn.po_id,
                "supplier_id": grn.supplier_id,
                "grn_date": grn.grn_date,
                "items_json": items_json
            }
        ).fetchone()
        
        db.commit()
        return {"status": "success", "grn_id": result[0]}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{grn_id}", response_model=dict)
def update_grn(grn_id: int, grn: GRNUpdate, db: Session = Depends(get_db)):
    items_json = json.dumps([item.dict() for item in grn.items]) if grn.items is not None else None

    try:
        db.execute(
            text("CALL SP_UpdateGRN(:grn_id, :grn_number, :po_id, :supplier_id, :grn_date, :items_json)"),
            {
                "grn_id": grn_id,
                "grn_number": grn.grn_number,
                "po_id": grn.po_id,
                "supplier_id": grn.supplier_id,
                "grn_date": grn.grn_date,
                "items_json": items_json
            }
        )
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{grn_id}", response_model=dict)
def delete_grn(grn_id: int, db: Session = Depends(get_db)):
    try:
        db.execute(text("CALL SP_DeleteGRN(:grn_id)"), {"grn_id": grn_id})
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
