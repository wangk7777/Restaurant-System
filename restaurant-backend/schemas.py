from pydantic import BaseModel
from typing import List, Optional, Dict
from uuid import UUID
from datetime import datetime


# --- 1. 奖品 (Prize) ---
class PrizeBase(BaseModel):
    name: str
    probability: float  # 概率 0-100


class PrizeCreate(PrizeBase):
    pass


class Prize(PrizeBase):
    id: UUID

    class Config:
        from_attributes = True


# --- 2. 抽奖活动 (Lottery) ---
class LotteryBase(BaseModel):
    name: str


class LotteryCreate(LotteryBase):
    # 创建抽奖时，我们要同时把奖品列表传进来
    prizes: List[PrizeCreate]


class Lottery(LotteryBase):
    id: UUID
    prizes: List[Prize]

    class Config:
        from_attributes = True


# --- 3. 问卷问题 (Question) ---
class QuestionBase(BaseModel):
    text: str
    options: List[str]  # 比如 ["好", "一般", "差"]


class QuestionCreate(QuestionBase):
    pass


class Question(QuestionBase):
    id: UUID

    class Config:
        from_attributes = True


# --- 4. 问卷 (Survey) ---
class SurveyBase(BaseModel):
    name: str
    active: bool = False
    lottery_id: Optional[UUID] = None  # 这个问卷关联哪个抽奖活动 ID


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
    customer_id: UUID  # 前端生成的随机顾客ID
    answers: Dict[str, str]  # { "问题ID": "选项内容" }


class SurveyResponseCreate(SurveyResponseBase):
    pass


class SurveyResponse(SurveyResponseBase):
    id: UUID
    submitted_at: datetime

    class Config:
        from_attributes = True


# --- 6. 抽奖结果 (抽奖后返回给前端的数据) ---
class LotteryResult(BaseModel):
    won: bool
    prize: Optional[Prize]
    message: str