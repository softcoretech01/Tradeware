from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine
from app.models import purchase_models
from app.routers.Purchase import PurchaseRequisition, PurchaseOrder, GoodsReceiptNote, PurchaseReturn, LocalLandedCost

# Create all tables in the database (if they don't exist)
purchase_models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Trade Wave Purchase API",
    description="API for managing Purchase Requisitions and Orders",
    version="1.0.0"
)

# Configure CORS for React Frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Change this to your React app's URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(PurchaseRequisition.router)
app.include_router(PurchaseOrder.router)
app.include_router(GoodsReceiptNote.router)
app.include_router(PurchaseReturn.router)
app.include_router(LocalLandedCost.router)

@app.get("/")
def root():
    return {"message": "Welcome to Trade Wave Purchase API. Visit /docs for Swagger documentation."}
