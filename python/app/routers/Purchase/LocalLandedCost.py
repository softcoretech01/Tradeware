from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.purchase_models import (
    LocalLandedCostHeader, 
    LocalLandedCostDetail
)
from app.models.inventory_models import InventoryBatch
from app.schemas import LocalLandedCostCreateRequest

router = APIRouter(
    prefix="/api/purchase/local-landed-cost",
    tags=["Landed Cost"]
)

@router.post("/", response_model=dict)
def post_local_landed_cost(data: LocalLandedCostCreateRequest, db: Session = Depends(get_db)):
    # Check if a landed cost for this GRN already exists
    existing = db.query(LocalLandedCostHeader).filter(LocalLandedCostHeader.grn_id == data.grn_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Landed Cost for this GRN is already posted.")

    try:
        # 1. Insert Header
        header = LocalLandedCostHeader(
            grn_id=data.grn_id,
            insurance_charges=data.insurance_charges,
            handling_charges=data.handling_charges,
            packing_charges=data.packing_charges,
            aging_charges=data.aging_charges,
            total_lcy=data.total_lcy,
            total_overhead=data.total_overhead,
            total_landed_cost=data.total_landed_cost
        )
        db.add(header)
        db.flush() # get landed_cost_id

        # 2. Insert Details
        for item in data.items:
            detail = LocalLandedCostDetail(
                landed_cost_id=header.landed_cost_id,
                item_id=item.item_id,
                qty=item.qty,
                unit_price=item.unit_price,
                val_lcy=item.val_lcy,
                allocated_overhead=item.allocated_overhead,
                total_landed_cost=item.total_landed_cost,
                landed_unit_cost=item.landed_unit_cost
            )
            db.add(detail)

        # 3. Insert Batches
        for batch in data.batches:
            inv_batch = InventoryBatch(
                batch_no=batch.batch_no,
                item_id=batch.item_id,
                current_qty=batch.current_qty,
                mfg_date=batch.mfg_date,
                expiry_date=batch.expiry_date,
                landed_unit_cost=batch.landed_unit_cost,
                final_selling_price=batch.final_selling_price,
                margin_percent=batch.margin_percent,
                source_type=batch.source_type,
                po_reference=batch.po_reference,
                grn_reference=batch.grn_reference
            )
            db.add(inv_batch)

        db.commit()
        return {"status": "success", "landed_cost_id": header.landed_cost_id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
