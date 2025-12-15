import os
from supabase import create_client, Client
from typing import List, Optional, Dict

SUPABASE_URL = "https://itxjtrxdstphodoaiolk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0eGp0cnhkc3RwaG9kb2Fpb2xrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMjkxMTEsImV4cCI6MjA4MDgwNTExMX0.MsWaNZ1REpAXvgh7LxmX4MQVRHvi951lZJuZLLspl1I"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# ==========================================
# 👤 商户 (Merchants)
# ==========================================
def register_merchant(merchant_data: dict):
    # 检查 username 是否存在
    exist = supabase.table('merchants').select('id').eq('username', merchant_data['username']).execute()
    if exist.data:
        raise ValueError("Username already exists")

    response = supabase.table('merchants').insert(merchant_data).execute()
    return response.data[0]


def login_merchant(username: str):
    response = supabase.table('merchants').select("*").eq('username', username).execute()
    if response.data:
        return response.data[0]
    return None


def get_all_merchants():
    response = supabase.table('merchants').select("id, restaurant_name, username").execute()
    return response.data


# ==========================================
# 📋 问卷 (Surveys)
# ==========================================

def insert_survey(survey_data: dict):
    response = supabase.table('surveys').insert(survey_data).execute()
    return response.data[0]


def update_survey(survey_id: str, survey_data: dict):
    response = supabase.table('surveys').update(survey_data).eq('id', survey_id).execute()
    if response.data:
        return response.data[0]
    return None


def delete_survey(survey_id: str):
    response = supabase.table('surveys').delete().eq('id', survey_id).execute()
    return response


def get_surveys_by_merchant(merchant_id: str):
    response = supabase.table('surveys').select("*").eq('merchant_id', merchant_id).order('created_at',
                                                                                          desc=True).execute()
    return response.data


def get_survey_by_id(survey_id: str):
    response = supabase.table('surveys').select("*").eq('id', survey_id).execute()
    if response.data:
        return response.data[0]
    return None


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


def delete_lottery(lottery_id: str):
    response = supabase.table('lotteries').delete().eq('id', lottery_id).execute()
    return response


def get_lotteries_by_merchant(merchant_id: str):
    response = supabase.table('lotteries').select("*").eq('merchant_id', merchant_id).execute()
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