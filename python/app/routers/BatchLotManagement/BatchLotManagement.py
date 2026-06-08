from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any, Optional
from app.database import get_db
from pydantic import BaseModel

class BatchCreate(BaseModel):
    batch_no: str
    item_id: str
    current_qty: float
    mfg_date: str
    expiry_date: str
    landed_unit_cost: float
    final_selling_price: float
    margin_percent: float
    status: str
    source_type: str
    po_reference: Optional[str] = None
    grn_reference: Optional[str] = None
    IPO_reference: Optional[str] = None

class BatchPricingUpdate(BaseModel):
    final_selling_price: float
    margin_percent: float

router = APIRouter(
    prefix="/api/purchase/batches",
    tags=["Batch Lot Management"]
)

@router.get("/", response_model=List[Dict[str, Any]])
def get_batches(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("CALL SP_GetBatches()")).fetchall()
        return [dict(row._mapping) for row in result]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/aging", response_model=List[Dict[str, Any]])
def get_batch_aging(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("CALL SP_GetBatchAgingAnalysis()")).fetchall()
        return [dict(row._mapping) for row in result]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("")
def save_batches(batches: List[BatchCreate], db: Session = Depends(get_db)):
    try:
        count_query = "SELECT COUNT(*) FROM Purchase_Masters.inventory_batches"
        count = db.execute(text(count_query)).scalar()
        
        for idx, batch in enumerate(batches):
            if batch.batch_no.startswith("B2026-"):
                batch.batch_no = f"B2026-{str(count + idx + 1).zfill(3)}"
                
        query = """
            INSERT INTO Purchase_Masters.inventory_batches (
                batch_no, item_id, current_qty, mfg_date, expiry_date,
                landed_unit_cost, final_selling_price, margin_percent,
                status, source_type, po_reference, grn_reference, IPO_reference, is_posted
            ) VALUES (
                :batch_no, :item_id, :current_qty, :mfg_date, :expiry_date,
                :landed_unit_cost, :final_selling_price, :margin_percent,
                :status, :source_type, :po_reference, :grn_reference, :IPO_reference, 1
            )
            ON DUPLICATE KEY UPDATE
                item_id=VALUES(item_id),
                current_qty=VALUES(current_qty),
                mfg_date=VALUES(mfg_date),
                expiry_date=VALUES(expiry_date),
                landed_unit_cost=VALUES(landed_unit_cost),
                final_selling_price=VALUES(final_selling_price),
                margin_percent=VALUES(margin_percent),
                status=VALUES(status),
                source_type=VALUES(source_type),
                po_reference=VALUES(po_reference),
                grn_reference=VALUES(grn_reference),
                IPO_reference=VALUES(IPO_reference),
                is_posted=1
        """
        for batch in batches:
            db.execute(text(query), batch.dict())
        db.commit()
        return {"message": f"{len(batches)} batches saved successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{batch_no}/pricing")
def update_batch_pricing(batch_no: str, data: BatchPricingUpdate, db: Session = Depends(get_db)):
    try:
        query = "CALL SP_UpdateBatchPricing(:batch_no, :price, :margin)"
        db.execute(text(query), {
            "batch_no": batch_no,
            "price": data.final_selling_price,
            "margin": data.margin_percent
        })
        db.commit()
        return {"message": "Selling price updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
