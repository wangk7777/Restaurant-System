
from fastapi import APIRouter, HTTPException
from typing import Optional, List
from datetime import datetime
import uuid
import traceback
import schemas
import database
from services import lottery_service

router = APIRouter(prefix="/api/responses", tags=["Responses"])

@router.post("/", response_model=schemas.LotteryResult)
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
            # Use Service
            won_prize = lottery_service.run_lottery_algorithm(lottery_id)
            if won_prize:
                return {"won": True, "prize": won_prize, "message": f"恭喜！你获得了 {won_prize['name']}"}
            else:
                return {"won": False, "prize": None, "message": "很遗憾，这次没有中奖。"}
        return {"won": False, "prize": None, "message": "感谢您的反馈！"}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
def get_responses(survey_id: Optional[str] = None):
    return database.get_responses(survey_id)
