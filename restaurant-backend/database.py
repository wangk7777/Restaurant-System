import os
from supabase import create_client, Client
from typing import List, Optional, Dict

# ==========================================
# ⚡️ 配置区域 (请填入你的 Supabase 信息)
# ==========================================
SUPABASE_URL = "https://itxjtrxdstphodoaiolk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0eGp0cnhkc3RwaG9kb2Fpb2xrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMjkxMTEsImV4cCI6MjA4MDgwNTExMX0.MsWaNZ1REpAXvgh7LxmX4MQVRHvi951lZJuZLLspl1I"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ==========================================
# 📋 问卷 (Surveys)
# ==========================================

def insert_survey(survey_data: dict):
    response = supabase.table('surveys').insert(survey_data).execute()
    return response.data[0]

def update_survey(survey_id: str, survey_data: dict):
    # 更新指定 ID 的问卷
    response = supabase.table('surveys').update(survey_data).eq('id', survey_id).execute()
    if response.data:
        return response.data[0]
    return None

def get_all_surveys():
    response = supabase.table('surveys').select("*").order('created_at', desc=True).execute()
    return response.data

def get_survey_by_id(survey_id: str):
    response = supabase.table('surveys').select("*").eq('id', survey_id).execute()
    if response.data:
        return response.data[0]
    return None

def get_active_survey():
    response = supabase.table('surveys').select("*").eq('active', True).limit(1).execute()
    if response.data:
        return response.data[0]
    return None

def reset_all_surveys_inactive():
    # 简单粗暴：把所有问卷的 active 都设为 False
    # 注意：Supabase 需要一个过滤条件才能 update all，我们用 id 不等于 '0'
    try:
        supabase.table('surveys').update({"active": False}).neq("id", "0").execute()
    except Exception as e:
        print(f"Warning: Resetting active status failed (maybe table empty): {e}")

# ==========================================
# 🎁 抽奖 (Lotteries)
# ==========================================

def insert_lottery(lottery_data: dict):
    response = supabase.table('lotteries').insert(lottery_data).execute()
    return response.data[0]

def update_lottery(lottery_id: str, lottery_data: dict):
    response = supabase.table('lotteries').update(lottery_data).eq('id', lottery_id).execute()
    if response.data:
        return response.data[0]
    return None

def get_all_lotteries():
    response = supabase.table('lotteries').select("*").execute()
    return response.data

def get_lottery_by_id(lottery_id: str):
    response = supabase.table('lotteries').select("*").eq('id', lottery_id).execute()
    if response.data:
        return response.data[0]
    return None

# ==========================================
# 📝 回复 (Responses)
# ==========================================

def insert_response(response_data: dict):
    response = supabase.table('responses').insert(response_data).execute()
    return response.data[0]

def get_responses(survey_id: Optional[str] = None):
    query = supabase.table('responses').select("*").order('submitted_at', desc=True)
    if survey_id:
        query = query.eq('survey_id', survey_id)
    response = query.execute()
    return response.data