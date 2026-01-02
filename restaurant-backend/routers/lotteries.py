from fastapi import APIRouter, HTTPException, Query
from typing import List
import uuid
import traceback
import schemas
import database

router = APIRouter(prefix="/api/lotteries", tags=["Lotteries"])


@router.post("/", response_model=schemas.Lottery)
def create_lottery(lottery: schemas.LotteryCreate):
    try:
        new_id = str(uuid.uuid4())
        prizes_data = []
        for p in lottery.prizes:
            prizes_data.append({
                "id": str(uuid.uuid4()),
                "name": p.name,
                "probability": p.probability
            })

        new_lottery_data = {
            "id": new_id,
            "merchant_id": str(lottery.merchant_id),
            "name": lottery.name,
            "prizes": prizes_data
        }
        return database.insert_lottery(new_lottery_data)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{lottery_id}", response_model=schemas.Lottery)
def update_lottery(lottery_id: str, lottery: schemas.LotteryCreate):
    try:
        prizes_data = []
        for p in lottery.prizes:
            prizes_data.append({
                "id": str(uuid.uuid4()),
                "name": p.name,
                "probability": p.probability
            })

        update_data = {
            "name": lottery.name,
            "prizes": prizes_data
        }
        return database.update_lottery(lottery_id, update_data)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{lottery_id}")
def delete_lottery(lottery_id: str):
    try:
        database.delete_lottery(lottery_id)
        return {"message": "Lottery deleted successfully"}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[schemas.Lottery])
def get_lotteries(merchant_id: str = Query(..., description="Merchant ID is required")):
    try:
        requesting_merchant = database.get_merchant_by_id(merchant_id)
        # Admin check
        if requesting_merchant and requesting_merchant.get('username') == 'admin':
            return database.get_all_lotteries_admin()

        # Hierarchy check happens inside get_lotteries_by_merchant now
        return database.get_lotteries_by_merchant(merchant_id)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
