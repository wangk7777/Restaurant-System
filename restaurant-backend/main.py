from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import uuid
from datetime import datetime
import random
import schemas
import database
import traceback

app = FastAPI(title="Restaurant Survey & Lottery API")

# --- CORS ---
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def run_lottery_algorithm(lottery_id: str):
    try:
        lottery = database.get_lottery_by_id(lottery_id)
        if not lottery or not lottery.get("prizes"):
            return None
        lucky_number = random.uniform(0, 100)
        current_probability = 0
        for prize in lottery["prizes"]:
            current_probability += prize["probability"]
            if lucky_number <= current_probability:
                return prize
        return None
    except Exception as e:
        print(f"Algorithm Error: {e}")
        return None


# =================================================================
# 👤 认证与商户 (Auth & Merchants)
# =================================================================

@app.post("/api/auth/register", response_model=schemas.Merchant)
def register(merchant: schemas.MerchantRegister):
    try:
        new_data = {
            "id": str(uuid.uuid4()),
            "restaurant_name": merchant.restaurant_name,
            "username": merchant.username,
            "password": merchant.password  # 明文存储
        }
        return database.register_merchant(new_data)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/auth/login", response_model=schemas.Merchant)
def login(creds: schemas.MerchantLogin):
    user = database.login_merchant(creds.username)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if user['password'] != creds.password:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    return user


@app.get("/api/merchants", response_model=List[schemas.Merchant])
def get_merchants():
    return database.get_all_merchants()


# =================================================================
# 🛍️ 抽奖管理 (Lotteries) - 需要 merchant_id
# =================================================================

@app.post("/api/lotteries/", response_model=schemas.Lottery)
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


@app.put("/api/lotteries/{lottery_id}", response_model=schemas.Lottery)
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


@app.delete("/api/lotteries/{lottery_id}")
def delete_lottery(lottery_id: str):
    try:
        database.delete_lottery(lottery_id)
        return {"message": "Lottery deleted successfully"}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/lotteries/", response_model=List[schemas.Lottery])
def get_lotteries(merchant_id: str = Query(..., description="Merchant ID is required")):
    try:
        requesting_merchant = database.get_merchant_by_id(merchant_id)
        if requesting_merchant and requesting_merchant.get('username') == 'admin':
            return database.get_all_lotteries_admin()
        return database.get_lotteries_by_merchant(merchant_id)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# =================================================================
# 📋 问卷管理 (Surveys) - 需要 merchant_id
# =================================================================

@app.post("/api/surveys/", response_model=schemas.Survey)
def create_survey(survey: schemas.SurveyCreate):
    try:
        new_id = str(uuid.uuid4())
        questions_data = []
        for q in survey.questions:
            questions_data.append({
                "id": str(uuid.uuid4()),
                "text": q.text,
                "type": q.type,
                "allow_other": q.allow_other,  # Fixed: Include allow_other
                "options": q.options
            })

        new_survey_data = {
            "id": new_id,
            "merchant_id": str(survey.merchant_id),
            "name": survey.name,
            "lottery_id": str(survey.lottery_id) if survey.lottery_id else None,
            "created_at": datetime.now().isoformat(),
            "questions": questions_data
        }

        return database.insert_survey(new_survey_data)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Database Error: {str(e)}")


@app.put("/api/surveys/{survey_id}", response_model=schemas.Survey)
def update_survey(survey_id: str, survey: schemas.SurveyCreate):
    try:
        questions_data = []
        for q in survey.questions:
            questions_data.append({
                "id": str(uuid.uuid4()),
                "text": q.text,
                "type": q.type,
                "allow_other": q.allow_other,  # Fixed: Include allow_other
                "options": q.options
            })

        update_data = {
            "name": survey.name,
            "lottery_id": str(survey.lottery_id) if survey.lottery_id else None,
            "questions": questions_data
        }

        return database.update_survey(survey_id, update_data)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/surveys/{survey_id}")
def delete_survey(survey_id: str):
    try:
        database.delete_survey(survey_id)
        return {"message": "Survey deleted successfully"}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/surveys/", response_model=List[schemas.Survey])
def get_surveys(merchant_id: str = Query(..., description="Merchant ID is required")):
    try:
        requesting_merchant = database.get_merchant_by_id(merchant_id)
        if requesting_merchant and requesting_merchant.get('username') == 'admin':
            return database.get_all_surveys_admin()
        return database.get_surveys_by_merchant(merchant_id)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# =================================================================
# 📝 顾客提交
# =================================================================

@app.post("/api/responses/", response_model=schemas.LotteryResult)
def submit_response(response: schemas.SurveyResponseCreate):
    try:
        new_response_data = {
            "id": str(uuid.uuid4()),
            "survey_id": str(response.survey_id),
            "customer_id": str(response.customer_id),
            "answers": response.answers,
            "submitted_at": datetime.now().isoformat()
        }
        database.insert_response(new_response_data)

        current_survey = database.get_survey_by_id(str(response.survey_id))
        if current_survey and current_survey.get("lottery_id"):
            lottery_id = current_survey["lottery_id"]
            won_prize = run_lottery_algorithm(lottery_id)
            if won_prize:
                return {"won": True, "prize": won_prize, "message": f"恭喜！你获得了 {won_prize['name']}"}
            else:
                return {"won": False, "prize": None, "message": "很遗憾，这次没有中奖。"}
        return {"won": False, "prize": None, "message": "感谢您的反馈！"}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/responses/")
def get_responses(survey_id: Optional[str] = None):
    return database.get_responses(survey_id)