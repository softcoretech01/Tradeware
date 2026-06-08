from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Numeric, Date, DECIMAL
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"
    __table_args__ = {'schema': 'masters'}
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100))
    role = Column(String(100))
    email = Column(String(100))
    department = Column(String(100))
    status = Column(String(50))

class Item(Base):
    __tablename__ = "items"
    __table_args__ = {'schema': 'masters'}

    id = Column(String(50), primary_key=True)
    name = Column(String(100))
    group_id = Column(Integer)
    category_id = Column(Integer)
    brand = Column(String(100))
    model = Column(String(100))
    size = Column(String(100))
    color = Column(String(100))
    uom_id = Column(Integer)
    hsnCode = Column(Integer)
    gst_percent_id = Column(Integer)
    minStock = Column(Integer)
    reorderLevel = Column(Integer)
    batchApplicable = Column(Boolean)
    serialApplicable = Column(Boolean)
    isImported = Column(Boolean)
    active = Column(Boolean)
    standardPrice = Column(DECIMAL(10, 2))
    buildersPrice = Column(DECIMAL(10, 2))
    dealersPrice = Column(DECIMAL(10, 2))
    contractorsPrice = Column(DECIMAL(10, 2))
    houseOwnersPrice = Column(DECIMAL(10, 2))
    image = Column(String(255))
    updatedBy = Column(String(100))
    updatedDate = Column(DateTime)
    modifiedBy = Column(String(100))
    modifiedDate = Column(DateTime)

class Supplier(Base):
    __tablename__ = "suppliers"
    __table_args__ = {'schema': 'masters'}

    id = Column(String(50), primary_key=True)
    name = Column(String(255))
    email = Column(String(255))
    phone = Column(String(100))
    type = Column(Integer)
    currency = Column(Integer)
    leadTime = Column(Integer)
    active = Column(Boolean)
    taxDetails = Column(Text)
    paymentTerms = Column(Integer)
    importDetails = Column(Text)
    updatedBy = Column(String(100))
    updatedDate = Column(DateTime)
    modifiedDate = Column(DateTime)
    modifiedBy = Column(String(100))


class PurchaseRequisitionHeader(Base):
    __tablename__ = "purchase_requisitions_Header"

    pr_id = Column(Integer, primary_key=True, autoincrement=True)
    pr_number = Column(String(50), unique=True, nullable=False)
    pr_date = Column(Date, nullable=False)
    required_by_date = Column(Date)
    department = Column(String(100))
    requested_by = Column(Integer, ForeignKey("masters.users.id"))
    priority = Column(String(50), default="Medium")
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    requester = relationship("User")
    items = relationship("PurchaseRequisitionDetail", back_populates="requisition", cascade="all, delete-orphan")

class PurchaseRequisitionDetail(Base):
    __tablename__ = "purchase_requisition_Details"

    pr_id = Column(Integer, ForeignKey("purchase_requisitions_Header.pr_id", ondelete="CASCADE"), primary_key=True, nullable=False)
    item_id = Column(String(50), ForeignKey("masters.items.id"), primary_key=True, nullable=False)
    requested_quantity = Column(Numeric(15, 4), nullable=False)
    unit_price = Column(Numeric(15, 2))
    total_price = Column(Numeric(15, 2), default=0.00)
    uom = Column(String(20))
    reason_for_request = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    requisition = relationship("PurchaseRequisitionHeader", back_populates="items")
    item = relationship("Item")

class PurchaseOrderHeader(Base):
    __tablename__ = "purchase_orders_Header"

    po_id = Column(Integer, primary_key=True, autoincrement=True)
    po_number = Column(String(50), unique=True, nullable=False)
    pr_id = Column(Integer, ForeignKey("purchase_requisitions_Header.pr_id"))
    supplier_id = Column(String(50), ForeignKey("masters.suppliers.id"), nullable=False)
    po_date = Column(Date, nullable=False)
    payment_terms = Column(String(100))
    sub_total = Column(Numeric(15, 2), default=0.00)
    tax_total = Column(Numeric(15, 2), default=0.00)
    grand_total = Column(Numeric(15, 2), default=0.00)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    supplier = relationship("Supplier")
    requisition = relationship("PurchaseRequisitionHeader")
    items = relationship("PurchaseOrderDetail", back_populates="order", cascade="all, delete-orphan")
    schedules = relationship("PurchaseOrderDeliverySchedule", back_populates="order", cascade="all, delete-orphan")

class PurchaseOrderDetail(Base):
    __tablename__ = "purchase_order_Details"

    po_item_id = Column(Integer, primary_key=True, autoincrement=True)
    po_id = Column(Integer, ForeignKey("purchase_orders_Header.po_id", ondelete="CASCADE"), nullable=False)
    item_id = Column(String(50), ForeignKey("masters.items.id"), nullable=False)
    quantity = Column(Numeric(15, 4), nullable=False)
    uom = Column(String(20))
    unit_price = Column(Numeric(15, 2), nullable=False)
    tax_rate = Column(Numeric(5, 2), default=0.00)
    line_total = Column(Numeric(15, 2), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    order = relationship("PurchaseOrderHeader", back_populates="items")
    item = relationship("Item")

class PurchaseOrderDeliverySchedule(Base):
    __tablename__ = "purchase_order_delivery_schedules"

    schedule_id = Column(Integer, primary_key=True, autoincrement=True)
    po_id = Column(Integer, ForeignKey("purchase_orders_Header.po_id", ondelete="CASCADE"), nullable=False)
    expected_delivery_date = Column(Date, nullable=False)
    target_quantity = Column(Numeric(15, 4), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    order = relationship("PurchaseOrderHeader", back_populates="schedules")

class GRNHeader(Base):
    __tablename__ = "grn_Header"

    grn_id = Column(Integer, primary_key=True, autoincrement=True)
    grn_number = Column(String(50), unique=True, nullable=False)
    po_id = Column(Integer, ForeignKey("purchase_orders_Header.po_id"))
    supplier_id = Column(String(50), ForeignKey("masters.suppliers.id"), nullable=False)
    grn_date = Column(Date, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    order = relationship("PurchaseOrderHeader")
    supplier = relationship("Supplier")
    items = relationship("GRNDetail", back_populates="grn", cascade="all, delete-orphan")

class GRNDetail(Base):
    __tablename__ = "grn_Details"

    grn_item_id = Column(Integer, primary_key=True, autoincrement=True)
    grn_id = Column(Integer, ForeignKey("grn_Header.grn_id", ondelete="CASCADE"), nullable=False)
    item_id = Column(String(50), ForeignKey("masters.items.id"), nullable=False)
    po_qty = Column(Numeric(15, 4), nullable=False)
    received_qty = Column(Numeric(15, 4), nullable=False)
    batch_lot_number = Column(String(100))
    mfg_date = Column(Date)
    expiry_date = Column(Date)
    created_at = Column(DateTime, server_default=func.now())

    grn = relationship("GRNHeader", back_populates="items")
    item = relationship("Item")

class PurchaseReturnHeader(Base):
    __tablename__ = "purchase_return_Header"

    return_id = Column(Integer, primary_key=True, autoincrement=True)
    return_number = Column(String(50), unique=True, nullable=False)
    grn_id = Column(Integer, ForeignKey("grn_Header.grn_id"))
    supplier_id = Column(String(50), ForeignKey("masters.suppliers.id"), nullable=False)
    return_date = Column(Date, nullable=False)
    debit_note_status = Column(String(50), default="Pending")
    refund_total = Column(Numeric(15, 2), default=0.00)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    grn = relationship("GRNHeader")
    supplier = relationship("Supplier")
    items = relationship("PurchaseReturnDetail", back_populates="return_header", cascade="all, delete-orphan")

class PurchaseReturnDetail(Base):
    __tablename__ = "purchase_return_Details"

    return_item_id = Column(Integer, primary_key=True, autoincrement=True)
    return_id = Column(Integer, ForeignKey("purchase_return_Header.return_id", ondelete="CASCADE"), nullable=False)
    item_id = Column(String(50), ForeignKey("masters.items.id"), nullable=False)
    inwarded_qty = Column(Numeric(15, 4), nullable=False)
    return_qty = Column(Numeric(15, 4), nullable=False)
    return_reason = Column(String(255))
    created_at = Column(DateTime, server_default=func.now())

    return_header = relationship("PurchaseReturnHeader", back_populates="items")
    item = relationship("Item")

class LocalLandedCostHeader(Base):
    __tablename__ = "local_landed_cost_Header"

    landed_cost_id = Column(Integer, primary_key=True, autoincrement=True)
    grn_id = Column(Integer, ForeignKey("grn_Header.grn_id"), nullable=False, unique=True)
    insurance_charges = Column(Numeric(15, 2), default=0.00)
    handling_charges = Column(Numeric(15, 2), default=0.00)
    packing_charges = Column(Numeric(15, 2), default=0.00)
    aging_charges = Column(Numeric(15, 2), default=0.00)
    total_lcy = Column(Numeric(15, 2), nullable=False)
    total_overhead = Column(Numeric(15, 2), nullable=False)
    total_landed_cost = Column(Numeric(15, 2), nullable=False)
    is_posted = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    details = relationship("LocalLandedCostDetail", back_populates="header", cascade="all, delete-orphan")

class LocalLandedCostDetail(Base):
    __tablename__ = "local_landed_cost_Details"

    landed_cost_item_id = Column(Integer, primary_key=True, autoincrement=True)
    landed_cost_id = Column(Integer, ForeignKey("local_landed_cost_Header.landed_cost_id", ondelete="CASCADE"), nullable=False)
    item_id = Column(String(50), ForeignKey("masters.items.id"), nullable=False)
    qty = Column(Numeric(15, 4), nullable=False)
    unit_price = Column(Numeric(15, 4), nullable=False)
    val_lcy = Column(Numeric(15, 2), nullable=False)
    allocated_overhead = Column(Numeric(15, 2), nullable=False)
    total_landed_cost = Column(Numeric(15, 2), nullable=False)
    landed_unit_cost = Column(Numeric(15, 4), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    header = relationship("LocalLandedCostHeader", back_populates="details")
