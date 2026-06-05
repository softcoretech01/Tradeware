from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from decimal import Decimal

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    class Config:
        from_attributes = True

class DropdownUserResponse(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True

class DropdownItemResponse(BaseModel):
    id: str
    name: str
    uom_id: Optional[int] = None
    uom_name: Optional[str] = None 
    standardPrice: Optional[Decimal] = 0.00
    available_stock: Optional[int] = 0
    class Config:
        from_attributes = True

class PurchaseRequisitionItemBase(BaseModel):
    item_id: str
    requested_quantity: Decimal
    uom: Optional[str] = None
    unit_price: Optional[Decimal] = 0.00
    total_price: Optional[Decimal] = 0.00
    reason_for_request: Optional[str] = None

class PurchaseRequisitionItemCreate(PurchaseRequisitionItemBase):
    pass

class PurchaseRequisitionItemResponse(PurchaseRequisitionItemBase):
    pr_id: int
    class Config:
        from_attributes = True

class PurchaseRequisitionBase(BaseModel):
    pr_number: str
    pr_date: date
    required_by_date: Optional[date] = None
    department: Optional[str] = None
    requested_by: Optional[int] = None
    priority: Optional[str] = "Medium"
    notes: Optional[str] = None

class PurchaseRequisitionCreate(PurchaseRequisitionBase):
    items: List[PurchaseRequisitionItemCreate]

class PurchaseRequisitionUpdate(BaseModel):
    pr_number: Optional[str] = None
    pr_date: Optional[date] = None
    required_by_date: Optional[date] = None
    department: Optional[str] = None
    requested_by: Optional[int] = None
    priority: Optional[str] = None
    notes: Optional[str] = None
    items: Optional[List[PurchaseRequisitionItemCreate]] = None

class PurchaseRequisitionResponse(PurchaseRequisitionBase):
    pr_id: int
    items: List[PurchaseRequisitionItemResponse] = []
    class Config:
        from_attributes = True

# --- Purchase Order Schemas ---

class PurchaseOrderItemBase(BaseModel):
    item_id: str
    quantity: Decimal
    uom: Optional[str] = None
    unit_price: Decimal
    tax_rate: Optional[Decimal] = 0.00
    line_total: Decimal

class PurchaseOrderItemCreate(PurchaseOrderItemBase):
    pass

class PurchaseOrderItemResponse(PurchaseOrderItemBase):
    po_item_id: int
    po_id: int
    class Config:
        from_attributes = True

class PurchaseOrderDeliveryScheduleBase(BaseModel):
    expected_delivery_date: date
    target_quantity: Decimal

class PurchaseOrderDeliveryScheduleCreate(PurchaseOrderDeliveryScheduleBase):
    pass

class PurchaseOrderDeliveryScheduleResponse(PurchaseOrderDeliveryScheduleBase):
    schedule_id: int
    po_id: int
    class Config:
        from_attributes = True

class PurchaseOrderBase(BaseModel):
    po_number: str
    pr_id: Optional[int] = None
    supplier_id: str
    po_date: date
    payment_terms: Optional[str] = None
    sub_total: Optional[Decimal] = 0.00
    tax_total: Optional[Decimal] = 0.00
    grand_total: Optional[Decimal] = 0.00

class PurchaseOrderCreate(PurchaseOrderBase):
    items: List[PurchaseOrderItemCreate]
    schedules: Optional[List[PurchaseOrderDeliveryScheduleCreate]] = []

class PurchaseOrderUpdate(BaseModel):
    po_number: Optional[str] = None
    pr_id: Optional[int] = None
    supplier_id: Optional[str] = None
    po_date: Optional[date] = None
    payment_terms: Optional[str] = None
    sub_total: Optional[Decimal] = None
    tax_total: Optional[Decimal] = None
    grand_total: Optional[Decimal] = None
    items: Optional[List[PurchaseOrderItemCreate]] = None
    schedules: Optional[List[PurchaseOrderDeliveryScheduleCreate]] = None

class PurchaseOrderResponse(PurchaseOrderBase):
    po_id: int
    items: List[PurchaseOrderItemResponse] = []
    schedules: List[PurchaseOrderDeliveryScheduleResponse] = []
    class Config:
        from_attributes = True

class SupplierDropdownResponse(BaseModel):
    id: str
    name: str
    class Config:
        from_attributes = True

class PRDropdownResponse(BaseModel):
    pr_id: int
    pr_number: str
    items: List[PurchaseRequisitionItemResponse] = []
    class Config:
        from_attributes = True

class PODropdownItemResponse(BaseModel):
    item_id: str
    item_name: str
    quantity: Decimal
    class Config:
        from_attributes = True

class PODropdownResponse(BaseModel):
    po_id: int
    po_number: str
    supplier_id: str
    supplier_name: str
    items: List[PODropdownItemResponse] = []
    class Config:
        from_attributes = True

class GRNItemBase(BaseModel):
    item_id: str
    po_qty: Decimal
    received_qty: Decimal
    batch_lot_number: Optional[str] = None
    mfg_date: Optional[date] = None
    expiry_date: Optional[date] = None

class GRNItemCreate(GRNItemBase):
    pass

class GRNItemResponse(GRNItemBase):
    grn_item_id: int
    grn_id: int
    item_name: Optional[str] = None
    class Config:
        from_attributes = True

class GRNBase(BaseModel):
    grn_number: str
    po_id: Optional[int] = None
    supplier_id: str
    grn_date: date

class GRNCreate(GRNBase):
    items: List[GRNItemCreate]

class GRNUpdate(BaseModel):
    grn_number: Optional[str] = None
    po_id: Optional[int] = None
    supplier_id: Optional[str] = None
    grn_date: Optional[date] = None
    items: Optional[List[GRNItemCreate]] = None

class GRNResponse(GRNBase):
    grn_id: int
    po_number: Optional[str] = None
    supplier_name: Optional[str] = None
    items: List[GRNItemResponse] = []
    class Config:
        from_attributes = True

class GRNDropdownItemResponse(BaseModel):
    item_id: str
    item_name: str
    received_qty: Decimal
    unit_price: Decimal
    class Config:
        from_attributes = True

class GRNDropdownResponse(BaseModel):
    grn_id: int
    grn_number: str
    supplier_id: str
    supplier_name: str
    po_number: Optional[str] = None
    items: List[GRNDropdownItemResponse] = []
    class Config:
        from_attributes = True

class PurchaseReturnItemBase(BaseModel):
    item_id: str
    inwarded_qty: Decimal
    return_qty: Decimal
    return_reason: Optional[str] = None

class PurchaseReturnItemCreate(PurchaseReturnItemBase):
    pass

class PurchaseReturnItemResponse(PurchaseReturnItemBase):
    return_item_id: int
    return_id: int
    item_name: Optional[str] = None
    class Config:
        from_attributes = True

class PurchaseReturnBase(BaseModel):
    return_number: str
    grn_id: int
    supplier_id: str
    return_date: date
    debit_note_status: Optional[str] = "Pending"
    refund_total: Optional[Decimal] = 0.00

class PurchaseReturnCreate(PurchaseReturnBase):
    items: List[PurchaseReturnItemCreate]

class PurchaseReturnUpdate(BaseModel):
    return_number: Optional[str] = None
    grn_id: Optional[int] = None
    supplier_id: Optional[str] = None
    return_date: Optional[date] = None
    debit_note_status: Optional[str] = None
    refund_total: Optional[Decimal] = None
    items: Optional[List[PurchaseReturnItemCreate]] = None

class PurchaseReturnResponse(PurchaseReturnBase):
    return_id: int
    grn_number: Optional[str] = None
    supplier_name: Optional[str] = None
    items: List[PurchaseReturnItemResponse] = []
    class Config:
        from_attributes = True

class InventoryBatchCreate(BaseModel):
    batch_no: str
    item_id: str
    current_qty: Decimal
    mfg_date: Optional[date] = None
    expiry_date: Optional[date] = None
    landed_unit_cost: Decimal
    final_selling_price: Decimal
    margin_percent: Optional[Decimal] = 20.00
    source_type: str
    po_reference: Optional[str] = None
    grn_reference: Optional[str] = None

class LocalLandedCostDetailCreate(BaseModel):
    item_id: str
    qty: Decimal
    unit_price: Decimal
    val_lcy: Decimal
    allocated_overhead: Decimal
    total_landed_cost: Decimal
    landed_unit_cost: Decimal

class LocalLandedCostCreateRequest(BaseModel):
    grn_id: int
    insurance_charges: Decimal
    handling_charges: Decimal
    packing_charges: Decimal
    aging_charges: Decimal
    total_lcy: Decimal
    total_overhead: Decimal
    total_landed_cost: Decimal
    items: List[LocalLandedCostDetailCreate]
    batches: List[InventoryBatchCreate]
