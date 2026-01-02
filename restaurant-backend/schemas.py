
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime

# --- 0. 商户 (Merchant) ---
class MerchantBase(BaseModel):
    restaurant_name: str
    username: str
    role: str = "manager" # 'owner', 'manager'
    owner_id: Optional[UUID] = None

class MerchantRegister(MerchantBase):
    password: str

class MerchantUpdate(BaseModel):
    restaurant_name: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None

class MerchantLogin(BaseModel):
    username: str
    password: str

class Merchant(MerchantBase):
    id: UUID
    password: Optional[str] = None
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
    id: Optional[UUID] = None # Allow passing existing ID to preserve history

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

# --- 7. 数据看板 (Dashboard) ---
class TodayStats(BaseModel):
    today_count: int
    yesterday_count: int
    diff: int
    growth_pct: float

class DashboardStats(BaseModel):
    total_restaurants: int
    total_surveys: int
    total_responses: int
    total_owners: Optional[int] = None # Admin only
    today_data: Optional[TodayStats] = None

class ChartPoint(BaseModel):
    label: str # Date string or Month string
    value: int
    full_date: Optional[str] = None # For tooltip

class GrowthStats(BaseModel):
    today_count: int
    yesterday_count: int
    daily_growth_pct: float
    month_count: int
    last_month_count: int
    monthly_growth_pct: float

class DashboardTrends(BaseModel):
    stats: GrowthStats
    chart_data: List[ChartPoint]
