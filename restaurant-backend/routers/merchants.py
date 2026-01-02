from fastapi import APIRouter, HTTPException
from typing import List, Optional
import traceback
import schemas
import database

router = APIRouter(prefix="/api/merchants", tags=["Merchants"])


@router.get("", response_model=List[schemas.Merchant])
def get_merchants(owner_id: Optional[str] = None):
    # If owner_id is provided, return their sub-merchants
    if owner_id:
        return database.get_merchants_by_owner(owner_id)
    return database.get_all_merchants()


@router.put("/{merchant_id}", response_model=schemas.Merchant)
def update_merchant(merchant_id: str, merchant: schemas.MerchantUpdate):
    try:
        update_data = {k: v for k, v in merchant.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        result = database.update_merchant(merchant_id, update_data)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{merchant_id}")
def delete_merchant(merchant_id: str):
    try:
        database.delete_merchant(merchant_id)
        return {"message": "Merchant deleted"}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
