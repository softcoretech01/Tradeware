from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, Enum, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class InventoryBatch(Base):
    __tablename__ = "inventory_batches"

    batch_id = Column(Integer, primary_key=True, autoincrement=True)
    batch_no = Column(String(50), nullable=False, unique=True)
    item_id = Column(String(50), ForeignKey("masters.items.id"), nullable=False)
    current_qty = Column(Numeric(15, 4), nullable=False)
    mfg_date = Column(Date)
    expiry_date = Column(Date)
    landed_unit_cost = Column(Numeric(15, 4), nullable=False)
    final_selling_price = Column(Numeric(15, 4), nullable=False)
    margin_percent = Column(Numeric(5, 2), default=20.00)
    status = Column(String(50), default="Available")
    source_type = Column(Enum("Local Purchase", "Import Purchase"), nullable=False)
    po_reference = Column(String(50))
    grn_reference = Column(String(50))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
