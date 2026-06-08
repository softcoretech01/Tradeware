from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(
    prefix="/api/import/landed-cost",
    tags=["Import Landed Cost"]
)

class ImportLandedCostDetailCreate(BaseModel):
    item_id: str
    qty: float
    fob_val_lcy: float
    allocated_overhead: float
    total_landed_cost: float
    landed_unit_cost: float

class ImportLandedCostCreate(BaseModel):
    import_po_id: int
    duty_percent: float
    cess_percent: float
    gst_percent: float
    include_gst: bool
    sea_freight: float
    road_freight: float
    local_transport: float
    liner_charges: float
    insurance_cost: float
    handling_charges: float
    packing_charges: float
    aging_charges: float
    total_customs_duty: float
    total_freight: float
    total_port_charges: float
    total_overhead: float
    total_landed_cost: float
    is_posted: Optional[int] = 0
    details: List[ImportLandedCostDetailCreate]

@router.get("/{import_po_id}")
def get_landed_cost(import_po_id: int, db: Session = Depends(get_db)):
    try:
        header = db.execute(text("CALL SP_GetImportLandedCostHeader(:import_po_id)"), {"import_po_id": import_po_id}).fetchone()
        
        if not header:
            return None # No landed cost saved yet for this PO
            
        header_dict = dict(header._mapping)
        
        details = db.execute(text("CALL SP_GetImportLandedCostDetails(:import_landed_cost_id)"), {"import_landed_cost_id": header_dict['import_landed_cost_id']}).fetchall()
        header_dict['details'] = [dict(d._mapping) for d in details]
        
        return header_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
def save_landed_cost(payload: ImportLandedCostCreate, db: Session = Depends(get_db)):
    try:
        # Create cursor for raw connection to call SP with OUT parameter
        connection = db.connection().connection
        cursor = connection.cursor()
        
        # Define args for SP_SaveImportLandedCostHeader
        args = (
            payload.import_po_id,
            payload.duty_percent,
            payload.cess_percent,
            payload.gst_percent,
            payload.include_gst,
            payload.sea_freight,
            payload.road_freight,
            payload.local_transport,
            payload.liner_charges,
            payload.insurance_cost,
            payload.handling_charges,
            payload.packing_charges,
            payload.aging_charges,
            payload.total_customs_duty,
            payload.total_freight,
            payload.total_port_charges,
            payload.total_overhead,
            payload.total_landed_cost,
            payload.is_posted,
            0 # OUT p_landed_cost_id
        )
        
        result_args = cursor.callproc('SP_SaveImportLandedCostHeader', args)
        landed_cost_id = result_args[-1] # The OUT parameter is the last one
        
        if payload.details:
            detail_sp = "CALL SP_SaveImportLandedCostDetail(:id, :item, :qty, :fob, :alloc, :tot, :unit)"
            for d in payload.details:
                db.execute(text(detail_sp), {
                    "id": landed_cost_id,
                    "item": d.item_id,
                    "qty": d.qty,
                    "fob": d.fob_val_lcy,
                    "alloc": d.allocated_overhead,
                    "tot": d.total_landed_cost,
                    "unit": d.landed_unit_cost
                })
                
        db.commit()
        return {"message": "Landed cost saved successfully", "import_landed_cost_id": landed_cost_id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
