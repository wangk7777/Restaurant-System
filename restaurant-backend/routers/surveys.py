from fastapi import APIRouter, HTTPException, Query
from typing import List
from datetime import datetime
import uuid
import traceback
import schemas
import database

router = APIRouter(prefix="/api/surveys", tags=["Surveys"])


@router.post("/", response_model=schemas.Survey)
def create_survey(survey: schemas.SurveyCreate):
    try:
        new_id = str(uuid.uuid4())
        questions_data = []
        for q in survey.questions:
            q_id = str(q.id) if q.id else str(uuid.uuid4())
            questions_data.append({
                "id": q_id,
                "text": q.text,
                "type": q.type,
                "allow_other": q.allow_other,
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


@router.put("/{survey_id}", response_model=schemas.Survey)
def update_survey(survey_id: str, survey: schemas.SurveyCreate):
    try:
        questions_data = []
        for q in survey.questions:
            # IMPORTANT: Preserve existing ID if present
            q_id = str(q.id) if q.id else str(uuid.uuid4())

            questions_data.append({
                "id": q_id,
                "text": q.text,
                "type": q.type,
                "allow_other": q.allow_other,
                "options": q.options
            })

        update_data = {
            "name": survey.name,
            "lottery_id": str(survey.lottery_id) if survey.lottery_id else None,
            "questions": questions_data,
            "merchant_id": str(survey.merchant_id)
        }

        return database.update_survey(survey_id, update_data)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{survey_id}")
def delete_survey(survey_id: str):
    try:
        database.delete_survey(survey_id)
        return {"message": "Survey deleted successfully"}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[schemas.Survey])
def get_surveys(merchant_id: str = Query(..., description="Merchant ID is required")):
    try:
        requesting_merchant = database.get_merchant_by_id(merchant_id)
        if requesting_merchant and requesting_merchant.get('username') == 'admin':
            return database.get_all_surveys_admin()
        return database.get_surveys_by_merchant(merchant_id)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
