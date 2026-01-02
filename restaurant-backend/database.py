import os
import time
from supabase import create_client, Client
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv

# 加载 .env 文件中的环境变量
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Warning: SUPABASE_URL or SUPABASE_KEY not found in environment variables.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# ==========================================
# 🛡️ Safe Execute Wrapper (Retry Logic)
# ==========================================
def execute_safe(query_builder: Any, retries: int = 3, delay: int = 1):
    """
    Wraps Supabase execute calls with retry logic to handle cold starts or network blips.
    """
    last_exception = None
    for i in range(retries):
        try:
            return query_builder.execute()
        except Exception as e:
            print(f"⚠️ DB Query failed (Attempt {i + 1}/{retries}): {e}")
            last_exception = e
            time.sleep(delay)
    # If all retries fail, raise the last exception
    raise last_exception


# ==========================================
# 👤 商户 (Merchants)
# ==========================================
def register_merchant(merchant_data: dict):
    # 检查 username 是否存在
    exist = execute_safe(supabase.table('merchants').select('id').eq('username', merchant_data['username']))
    if exist.data:
        raise ValueError("Username already exists")

    response = execute_safe(supabase.table('merchants').insert(merchant_data))
    return response.data[0]


def update_merchant(merchant_id: str, update_data: dict):
    if 'username' in update_data:
        exist = execute_safe(
            supabase.table('merchants').select('id').eq('username', update_data['username']).neq('id', merchant_id))
        if exist.data:
            raise ValueError("Username already exists")

    response = execute_safe(supabase.table('merchants').update(update_data).eq('id', merchant_id))
    if response.data:
        return response.data[0]
    return None


def delete_merchant(merchant_id: str):
    response = execute_safe(supabase.table('merchants').delete().eq('id', merchant_id))
    return response


def login_merchant(username: str):
    response = execute_safe(supabase.table('merchants').select("*").eq('username', username))
    if response.data:
        return response.data[0]
    return None


def get_merchant_by_id(merchant_id: str):
    response = execute_safe(supabase.table('merchants').select("*").eq('id', merchant_id))
    if response.data:
        return response.data[0]
    return None


def get_all_merchants():
    response = execute_safe(supabase.table('merchants').select("*"))
    return response.data


def get_merchants_by_owner(owner_id: str):
    response = execute_safe(supabase.table('merchants').select("*").eq('owner_id', owner_id))
    return response.data


def get_owner_count():
    response = execute_safe(supabase.table('merchants').select("id", count='exact').eq('role', 'owner'))
    return response.count


# ==========================================
# 📋 问卷 (Surveys)
# ==========================================

def insert_survey(survey_data: dict):
    response = execute_safe(supabase.table('surveys').insert(survey_data))
    return response.data[0]


def update_survey(survey_id: str, survey_data: dict):
    response = execute_safe(supabase.table('surveys').update(survey_data).eq('id', survey_id))
    if response.data:
        return response.data[0]
    return None


def delete_survey(survey_id: str):
    response = execute_safe(supabase.table('surveys').delete().eq('id', survey_id))
    return response


def get_surveys_by_merchant(merchant_id: str):
    merchant = get_merchant_by_id(merchant_id)

    if merchant and merchant.get('role') == 'owner':
        subs = get_merchants_by_owner(merchant_id)
        ids = [merchant_id] + [m['id'] for m in subs]
        response = execute_safe(
            supabase.table('surveys').select("*").in_('merchant_id', ids).order('created_at', desc=True))
    else:
        response = execute_safe(
            supabase.table('surveys').select("*").eq('merchant_id', merchant_id).order('created_at', desc=True))

    return response.data


def get_all_surveys_admin():
    response = execute_safe(supabase.table('surveys').select("*").order('created_at', desc=True))
    return response.data


def get_survey_by_id(survey_id: str):
    response = execute_safe(supabase.table('surveys').select("*").eq('id', survey_id))
    if response.data:
        return response.data[0]
    return None


def get_survey_ids_by_merchant(merchant_id: str):
    data = get_surveys_by_merchant(merchant_id)
    return [s['id'] for s in data]


def get_all_survey_ids():
    response = execute_safe(supabase.table('surveys').select("id"))
    return [s['id'] for s in response.data]


# ==========================================
# 🎁 抽奖 (Lotteries)
# ==========================================

def insert_lottery(lottery_data: dict):
    response = execute_safe(supabase.table('lotteries').insert(lottery_data))
    return response.data[0]


def update_lottery(lottery_id: str, lottery_data: dict):
    response = execute_safe(supabase.table('lotteries').update(lottery_data).eq('id', lottery_id))
    if response.data:
        return response.data[0]
    return None


def delete_lottery(lottery_id: str):
    response = execute_safe(supabase.table('lotteries').delete().eq('id', lottery_id))
    return response


def get_lotteries_by_merchant(merchant_id: str):
    merchant = get_merchant_by_id(merchant_id)

    if not merchant:
        return []

    if merchant.get('role') == 'owner':
        subs = get_merchants_by_owner(merchant_id)
        ids = [merchant_id] + [m['id'] for m in subs]
        response = execute_safe(supabase.table('lotteries').select("*").in_('merchant_id', ids))
    else:
        ids = [merchant_id]
        if merchant.get('owner_id'):
            ids.append(merchant['owner_id'])
        response = execute_safe(supabase.table('lotteries').select("*").in_('merchant_id', ids))

    return response.data


def get_all_lotteries_admin():
    response = execute_safe(supabase.table('lotteries').select("*"))
    return response.data


def get_lottery_by_id(lottery_id: str):
    response = execute_safe(supabase.table('lotteries').select("*").eq('id', lottery_id))
    if response.data:
        return response.data[0]
    return None


# ==========================================
# 📝 回复 (Responses)
# ==========================================

def insert_response(response_data: dict):
    response = execute_safe(supabase.table('responses').insert(response_data))
    return response.data[0]


def get_responses(survey_id: Optional[str] = None):
    all_responses = []
    batch_size = 1000
    start = 0
    max_limit = 10000

    while True:
        end = start + batch_size - 1
        query = supabase.table('responses').select("*")

        if survey_id:
            query = query.eq('survey_id', survey_id)

        # Wrap query in execute_safe
        response = execute_safe(query.order('submitted_at', desc=True).range(start, end))
        data = response.data

        if not data:
            break

        all_responses.extend(data)

        if len(data) < batch_size or len(all_responses) >= max_limit:
            break

        start += batch_size

    return all_responses


def get_response_timestamps(survey_ids: List[str]):
    if not survey_ids:
        return []

    all_timestamps = []
    batch_size = 1000
    start = 0
    max_limit = 100000

    while True:
        end = start + batch_size - 1
        # Wrap query in execute_safe
        response = execute_safe(supabase.table('responses').select("submitted_at") \
                                .in_('survey_id', survey_ids) \
                                .range(start, end))

        data = response.data

        if not data:
            break

        for r in data:
            all_timestamps.append(r['submitted_at'])

        if len(data) < batch_size or len(all_timestamps) >= max_limit:
            break

        start += batch_size

    return all_timestamps


def count_responses_by_surveys(survey_ids: List[str]):
    if not survey_ids:
        return 0
    response = execute_safe(supabase.table('responses').select("id", count='exact').in_('survey_id', survey_ids))
    return response.count
