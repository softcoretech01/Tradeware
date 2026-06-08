from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.models import purchase_models as models
from app import schemas
from app.database import get_db

import json
from sqlalchemy import text

router = APIRouter(
    prefix="/api/purchase/requisitions",
    tags=["Purchase Requisition"]
)

# --- Master Dropdown APIs ---

@router.get("/dropdown/users", response_model=List[schemas.DropdownUserResponse])
def get_dropdown_users(db: Session = Depends(get_db)):
    result = db.execute(text("CALL SP_GetDropdownUsers()")).fetchall()
    return [dict(row._mapping) for row in result]

@router.get("/dropdown/items", response_model=List[schemas.DropdownItemResponse])
def get_dropdown_items(db: Session = Depends(get_db)):
    result = db.execute(text("CALL SP_GetDropdownItems()")).fetchall()
    items = []
    for row in result:
        mapping = dict(row._mapping)
        mapping["available_stock"] = 0 # Defaulting for UI
        items.append(mapping)
    return items

# --- CRUD APIs ---

@router.post("/", response_model=schemas.PurchaseRequisitionResponse)
def create_requisition(pr: schemas.PurchaseRequisitionCreate, db: Session = Depends(get_db)):
    items_json = json.dumps([item.dict() for item in pr.items])
    
    result = db.execute(
        text("CALL SP_CreatePurchaseRequisition(:pr_number, :pr_date, :required_by_date, :department, :requested_by, :priority, :notes, :items_json)"),
        {
            "pr_number": pr.pr_number,
            "pr_date": pr.pr_date,
            "required_by_date": pr.required_by_date,
            "department": pr.department,
            "requested_by": pr.requested_by,
            "priority": pr.priority,
            "notes": pr.notes,
            "items_json": items_json
        }
    ).fetchone()
    
    db.commit()
    new_pr_id = result[0]
    
    # Fetch the created PR using the get SP
    return get_requisition(pr_id=new_pr_id, db=db)

@router.get("/", response_model=List[schemas.PurchaseRequisitionResponse])
def get_requisitions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    result = db.execute(text("CALL SP_GetPurchaseRequisitions(:skip, :limit)"), {"skip": skip, "limit": limit}).fetchall()
    prs = []
    for row in result:
        pr_data = dict(row._mapping)
        pr_data["items"] = [] # Detail items are typically not returned in the list view to save bandwidth
        prs.append(pr_data)
    return prs

@router.get("/{pr_id}", response_model=schemas.PurchaseRequisitionResponse)
def get_requisition(pr_id: int, db: Session = Depends(get_db)):
    header_result = db.execute(text("CALL SP_GetPurchaseRequisitionHeaderById(:pr_id)"), {"pr_id": pr_id}).fetchone()
    if not header_result:
        raise HTTPException(status_code=404, detail="Purchase Requisition not found")
        
    pr_data = dict(header_result._mapping)
    
    details_result = db.execute(text("CALL SP_GetPurchaseRequisitionDetailsById(:pr_id)"), {"pr_id": pr_id}).fetchall()
    pr_data["items"] = [dict(row._mapping) for row in details_result]
    
    return pr_data

@router.put("/{pr_id}", response_model=schemas.PurchaseRequisitionResponse)
def update_requisition(pr_id: int, pr_update: schemas.PurchaseRequisitionUpdate, db: Session = Depends(get_db)):
    # Verify existence
    header_result = db.execute(text("CALL SP_GetPurchaseRequisitionHeaderById(:pr_id)"), {"pr_id": pr_id}).fetchone()
    if not header_result:
        raise HTTPException(status_code=404, detail="Purchase Requisition not found")
    
    existing_data = dict(header_result._mapping)
    
    # Prepare update data
    update_data = pr_update.dict(exclude_unset=True)
    items_data = update_data.pop("items", None)
    
    items_json = json.dumps(items_data) if items_data is not None else None
    
    db.execute(
        text("CALL SP_UpdatePurchaseRequisition(:pr_id, :pr_number, :pr_date, :required_by_date, :department, :requested_by, :priority, :notes, :items_json)"),
        {
            "pr_id": pr_id,
            "pr_number": update_data.get("pr_number"),
            "pr_date": update_data.get("pr_date"),
            "required_by_date": update_data.get("required_by_date"),
            "department": update_data.get("department"),
            "requested_by": update_data.get("requested_by"),
            "priority": update_data.get("priority"),
            "notes": update_data.get("notes"),
            "items_json": items_json
        }
    )
    db.commit()
    
    return get_requisition(pr_id=pr_id, db=db)

@router.delete("/{pr_id}")
def delete_requisition(pr_id: int, db: Session = Depends(get_db)):
    # Verify existence
    header_result = db.execute(text("CALL SP_GetPurchaseRequisitionHeaderById(:pr_id)"), {"pr_id": pr_id}).fetchone()
    if not header_result:
        raise HTTPException(status_code=404, detail="Purchase Requisition not found")
        
    db.execute(text("CALL SP_DeletePurchaseRequisition(:pr_id)"), {"pr_id": pr_id})
    db.commit()
    
    return {"message": "Purchase Requisition deleted successfully"}
