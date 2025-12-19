import os
from supabase import create_client, Client
from typing import List, Optional, Dict
from dotenv import load_dotenv

# 加载 .env 文件中的环境变量
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Warning: SUPABASE_URL or SUPABASE_KEY not found in environment variables.")

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


def get_merchant_by_id(merchant_id: str):
    response = supabase.table('merchants').select("*").eq('id', merchant_id).execute()
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


def get_all_surveys_admin():
    # Admin gets everything
    response = supabase.table('surveys').select("*").order('created_at', desc=True).execute()
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


def get_all_lotteries_admin():
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
    # Added .limit(1000) to ensure we get a list of historical data,
    # overriding any potential default limit of 1.
    if survey_id:
        response = supabase.table('responses').select("*").eq('survey_id', survey_id).order('submitted_at',
                                                                                            desc=True).limit(
            1000).execute()
    else:
        response = supabase.table('responses').select("*").order('submitted_at', desc=True).limit(1000).execute()

    return response.data