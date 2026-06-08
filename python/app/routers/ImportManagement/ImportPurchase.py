import json
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from pydantic import BaseModel
from datetime import date, datetime

router = APIRouter(
    prefix="/api/import",
    tags=["Import Purchase Management"]
)

class ImportPODetailCreate(BaseModel):
    itemCode: str
    currency_id: int
    qty: float
    fcyUnitPrice: float

class ImportPOCreate(BaseModel):
    id: Optional[str] = None
    supplierName: str # supplier_id on backend
    po_date: Optional[date] = None
    currency_id: int
    exchangeRate: float
    paymentTerms: Optional[str] = None
    totalFCY: float
    totalLCY: float
    status: str = "Ordered"
    items: List[ImportPODetailCreate]

# --- Dropdowns ---

@router.get("/dropdown/overseas-suppliers", response_model=List[Dict[str, Any]])
def get_overseas_suppliers(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("CALL SP_GetOverseasSuppliers()")).fetchall()
        return [dict(row._mapping) for row in result]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/dropdown/payment-terms", response_model=List[Dict[str, Any]])
def get_payment_terms(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("CALL SP_GetPaymentTerms()")).fetchall()
        return [dict(row._mapping) for row in result]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/dropdown/items", response_model=List[Dict[str, Any]])
def get_items(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("CALL SP_GetActiveItems()")).fetchall()
        return [dict(row._mapping) for row in result]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/dropdown/currencies", response_model=List[Dict[str, Any]])
def get_currencies(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("CALL SP_GetCurrencies()")).fetchall()
        return [dict(row._mapping) for row in result]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- CRUD Operations ---

@router.get("/orders", response_model=List[Dict[str, Any]])
def get_import_pos(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("CALL SP_GetImportPOs()")).fetchall()
        pos = []
        for row in result:
            row_dict = dict(row._mapping)
            if row_dict['items']:
                try:
                    row_dict['items'] = json.loads(row_dict['items'])
                except:
                    row_dict['items'] = []
            else:
                row_dict['items'] = []
            pos.append(row_dict)
        return pos
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/orders")
def create_import_po(po: ImportPOCreate, db: Session = Depends(get_db)):
    try:
        items_json = json.dumps([item.dict() for item in po.items])
        # Auto generate PO number if not provided
        import_po_number = po.id
        if not import_po_number:
            import_po_number = f"IPO-2026-{int(datetime.now().timestamp())}"
            
        po_date = po.po_date or date.today()
        
        db.execute(text("""
            CALL SP_CreateImportPO(
                :import_po_number, :supplier_id, :po_date, :currency_id, 
                :exchange_rate, :payment_terms, :total_fcy, :total_lcy, 
                :status, :items_json
            )
        """), {
            "import_po_number": import_po_number,
            "supplier_id": po.supplierName,
            "po_date": po_date,
            "currency_id": po.currency_id,
            "exchange_rate": po.exchangeRate,
            "payment_terms": po.paymentTerms,
            "total_fcy": po.totalFCY,
            "total_lcy": po.totalLCY,
            "status": po.status,
            "items_json": items_json
        })
        db.commit()
        return {"message": "Import PO Created Successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/orders/{po_id}")
def update_import_po(po_id: int, po: ImportPOCreate, db: Session = Depends(get_db)):
    try:
        items_json = json.dumps([item.dict() for item in po.items])
        po_date = po.po_date or date.today()
        
        db.execute(text("""
            CALL SP_UpdateImportPO(
                :import_po_id, :supplier_id, :po_date, :currency_id, 
                :exchange_rate, :payment_terms, :total_fcy, :total_lcy, 
                :status, :items_json
            )
        """), {
            "import_po_id": po_id,
            "supplier_id": po.supplierName,
            "po_date": po_date,
            "currency_id": po.currency_id,
            "exchange_rate": po.exchangeRate,
            "payment_terms": po.paymentTerms,
            "total_fcy": po.totalFCY,
            "total_lcy": po.totalLCY,
            "status": po.status,
            "items_json": items_json
        })
        db.commit()
        return {"message": "Import PO Updated Successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/orders/{po_id}")
def delete_import_po(po_id: int, db: Session = Depends(get_db)):
    try:
        db.execute(text("CALL SP_DeleteImportPO(:import_po_id)"), {"import_po_id": po_id})
        db.commit()
        return {"message": "Import PO Deleted Successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
