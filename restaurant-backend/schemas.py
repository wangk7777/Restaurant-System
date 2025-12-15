from pydantic import BaseModel
from typing import List, Optional, Dict
from uuid import UUID
from datetime import datetime

# --- 0. 商户 (Merchant) ---
class MerchantBase(BaseModel):
    restaurant_name: str
    username: str

class MerchantRegister(MerchantBase):
    password: str

class MerchantLogin(BaseModel):
    username: str
    password: str

class Merchant(MerchantBase):
    id: UUID
    class Config:
        from_attributes = True

# --- 1. 奖品 (Prize) ---
class PrizeBase(BaseModel):
    name: str
    probability: float

class PrizeCreate(PrizeBase):
    pass

class Prize(PrizeBase):
    id: UUID
    class Config:
        from_attributes = True

# --- 2. 抽奖活动 (Lottery) ---
class LotteryBase(BaseModel):
    name: str
    merchant_id: UUID

class LotteryCreate(LotteryBase):
    prizes: List[PrizeCreate]

class Lottery(LotteryBase):
    id: UUID
    prizes: List[Prize]
    class Config:
        from_attributes = True

# --- 3. 问卷问题 (Question) ---
class QuestionBase(BaseModel):
    text: str
    type: str = "choice" # 'choice' or 'text'
    allow_other: bool = False # New field for choice questions
    options: List[str] = []

class QuestionCreate(QuestionBase):
    pass

class Question(QuestionBase):
    id: UUID
    class Config:
        from_attributes = True

# --- 4. 问卷 (Survey) ---
class SurveyBase(BaseModel):
    name: str
    merchant_id: UUID
    lottery_id: Optional[UUID] = None

class SurveyCreate(SurveyBase):
    questions: List[QuestionCreate]

class Survey(SurveyBase):
    id: UUID
    created_at: datetime
    questions: List[Question]
    class Config:
        from_attributes = True

# --- 5. 顾客回答 (Response) ---
class SurveyResponseBase(BaseModel):
    survey_id: UUID
    customer_id: UUID
    answers: Dict[str, str]

class SurveyResponseCreate(SurveyResponseBase):
    pass

class SurveyResponse(SurveyResponseBase):
    id: UUID
    submitted_at: datetime
    class Config:
        from_attributes = True

# --- 6. 抽奖结果 ---
class LotteryResult(BaseModel):
    won: bool
    prize: Optional[Prize]
    message: str