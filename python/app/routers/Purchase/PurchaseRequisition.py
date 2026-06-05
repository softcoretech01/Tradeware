from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.models import purchase_models as models
from app import schemas
from app.database import get_db

router = APIRouter(
    prefix="/api/purchase/requisitions",
    tags=["Purchase Requisition"]
)

# --- Master Dropdown APIs ---

@router.get("/dropdown/users", response_model=List[schemas.DropdownUserResponse])
def get_dropdown_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return users

@router.get("/dropdown/items", response_model=List[schemas.DropdownItemResponse])
def get_dropdown_items(db: Session = Depends(get_db)):
    items = db.query(models.Item).filter(models.Item.active == True).all()
    result = []
    for item in items:
        result.append({
            "id": item.id,
            "name": item.name,
            "uom_id": None,
            "uom_name": None,
            "standardPrice": item.standardPrice,
            "available_stock": 0 # Defaulting for UI
        })
    return result

# --- CRUD APIs ---

@router.post("/", response_model=schemas.PurchaseRequisitionResponse)
def create_requisition(pr: schemas.PurchaseRequisitionCreate, db: Session = Depends(get_db)):
    db_pr = models.PurchaseRequisitionHeader(
        pr_number=pr.pr_number,
        pr_date=pr.pr_date,
        required_by_date=pr.required_by_date,
        department=pr.department,
        requested_by=pr.requested_by,
        priority=pr.priority,
        notes=pr.notes
    )
    db.add(db_pr)
    db.commit()
    db.refresh(db_pr)
    
    for item in pr.items:
        db_item = models.PurchaseRequisitionDetail(
            pr_id=db_pr.pr_id,
            **item.dict()
        )
        db.add(db_item)
    
    db.commit()
    db.refresh(db_pr)
    return db_pr

@router.get("/", response_model=List[schemas.PurchaseRequisitionResponse])
def get_requisitions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    prs = db.query(models.PurchaseRequisitionHeader).offset(skip).limit(limit).all()
    return prs

@router.get("/{pr_id}", response_model=schemas.PurchaseRequisitionResponse)
def get_requisition(pr_id: int, db: Session = Depends(get_db)):
    pr = db.query(models.PurchaseRequisitionHeader).filter(models.PurchaseRequisitionHeader.pr_id == pr_id).first()
    if not pr:
        raise HTTPException(status_code=404, detail="Purchase Requisition not found")
    return pr

@router.put("/{pr_id}", response_model=schemas.PurchaseRequisitionResponse)
def update_requisition(pr_id: int, pr_update: schemas.PurchaseRequisitionUpdate, db: Session = Depends(get_db)):
    db_pr = db.query(models.PurchaseRequisitionHeader).filter(models.PurchaseRequisitionHeader.pr_id == pr_id).first()
    if not db_pr:
        raise HTTPException(status_code=404, detail="Purchase Requisition not found")
    
    # Update Header
    update_data = pr_update.dict(exclude_unset=True)
    items_data = update_data.pop("items", None)

    for key, value in update_data.items():
        setattr(db_pr, key, value)
    
    # Update Items if provided
    if items_data is not None:
        # Delete existing items
        db.query(models.PurchaseRequisitionDetail).filter(models.PurchaseRequisitionDetail.pr_id == pr_id).delete()
        # Add new items
        for item in items_data:
            db_item = models.PurchaseRequisitionDetail(
                pr_id=pr_id,
                **item
            )
            db.add(db_item)

    db.commit()
    db.refresh(db_pr)
    return db_pr

@router.delete("/{pr_id}")
def delete_requisition(pr_id: int, db: Session = Depends(get_db)):
    db_pr = db.query(models.PurchaseRequisitionHeader).filter(models.PurchaseRequisitionHeader.pr_id == pr_id).first()
    if not db_pr:
        raise HTTPException(status_code=404, detail="Purchase Requisition not found")
    
    db.delete(db_pr)
    db.commit()
    return {"message": "Purchase Requisition deleted successfully"}
