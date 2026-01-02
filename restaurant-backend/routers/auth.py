from fastapi import APIRouter, HTTPException
import uuid
import traceback
import schemas
import database

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/register", response_model=schemas.Merchant)
def register(merchant: schemas.MerchantRegister):
    try:
        new_data = {
            "id": str(uuid.uuid4()),
            "restaurant_name": merchant.restaurant_name,
            "username": merchant.username,
            "password": merchant.password,
            "role": merchant.role,
            "owner_id": str(merchant.owner_id) if merchant.owner_id else None
        }
        return database.register_merchant(new_data)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/login", response_model=schemas.Merchant)
def login(creds: schemas.MerchantLogin):
    user = database.login_merchant(creds.username)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if user['password'] != creds.password:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    return user
