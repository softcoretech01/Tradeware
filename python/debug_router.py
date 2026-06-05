from app.database import SessionLocal
from app.routers.Purchase.PurchaseRequisition import get_requisitions

db = SessionLocal()
try:
    print("Fetching requisitions...")
    prs = get_requisitions(0, 100, db)
    print(f"Found {len(prs)} PRs")
    for pr in prs:
        print(pr.pr_number)
        for item in pr.items:
            print(f"  {item.item_id}: {item.total_price}")
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
