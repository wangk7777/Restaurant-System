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


def update_merchant(merchant_id: str, update_data: dict):
    # 检查 username 冲突 (如果修改了 username)
    if 'username' in update_data:
        exist = supabase.table('merchants').select('id').eq('username', update_data['username']).neq('id',
                                                                                                     merchant_id).execute()
        if exist.data:
            raise ValueError("Username already exists")

    response = supabase.table('merchants').update(update_data).eq('id', merchant_id).execute()
    if response.data:
        return response.data[0]
    return None


def delete_merchant(merchant_id: str):
    response = supabase.table('merchants').delete().eq('id', merchant_id).execute()
    return response


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
    response = supabase.table('merchants').select("*").execute()
    return response.data


def get_merchants_by_owner(owner_id: str):
    response = supabase.table('merchants').select("*").eq('owner_id', owner_id).execute()
    return response.data


def get_owner_count():
    response = supabase.table('merchants').select("id", count='exact').eq('role', 'owner').execute()
    return response.count


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
    # Check if this merchant is an owner
    merchant = get_merchant_by_id(merchant_id)

    if merchant and merchant.get('role') == 'owner':
        # Fetch surveys for self AND all owned sub-merchants
        # 1. Get sub merchant IDs
        subs = get_merchants_by_owner(merchant_id)
        ids = [merchant_id] + [m['id'] for m in subs]
        response = supabase.table('surveys').select("*").in_('merchant_id', ids).order('created_at',
                                                                                       desc=True).execute()
    else:
        # Regular fetch
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


def get_survey_ids_by_merchant(merchant_id: str):
    """ Optimized fetch for just IDs """
    data = get_surveys_by_merchant(merchant_id)
    return [s['id'] for s in data]


def get_all_survey_ids():
    response = supabase.table('surveys').select("id").execute()
    return [s['id'] for s in response.data]


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
    merchant = get_merchant_by_id(merchant_id)

    if not merchant:
        return []

    if merchant.get('role') == 'owner':
        # Owner sees their own (shared) + all sub-merchants' lotteries
        subs = get_merchants_by_owner(merchant_id)
        ids = [merchant_id] + [m['id'] for m in subs]
        response = supabase.table('lotteries').select("*").in_('merchant_id', ids).execute()
    else:
        # Regular Manager sees their own + their Owner's (Shared) lotteries
        ids = [merchant_id]
        if merchant.get('owner_id'):
            ids.append(merchant['owner_id'])

        response = supabase.table('lotteries').select("*").in_('merchant_id', ids).execute()

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
    # Fix: Implement Pagination Loop to bypass Supabase default 1000 row limit
    # We will fetch up to 10,000 detailed responses for Analytics
    all_responses = []
    batch_size = 1000
    start = 0
    max_limit = 10000

    while True:
        end = start + batch_size - 1
        query = supabase.table('responses').select("*")

        if survey_id:
            query = query.eq('survey_id', survey_id)

        # Use range to paginate: 0-999, 1000-1999, etc.
        response = query.order('submitted_at', desc=True).range(start, end).execute()
        data = response.data

        if not data:
            break

        all_responses.extend(data)

        # Stop if we fetched fewer than batch_size (end of data) or reached our safety cap
        if len(data) < batch_size or len(all_responses) >= max_limit:
            break

        start += batch_size

    return all_responses


def get_response_timestamps(survey_ids: List[str]):
    """
    Optimized for Analytics: Only fetch submitted_at field.
    Fix: Implement Pagination Loop to fetch up to 100,000 timestamps for Charts
    """
    if not survey_ids:
        return []

    all_timestamps = []
    batch_size = 1000
    start = 0
    max_limit = 100000

    while True:
        end = start + batch_size - 1
        response = supabase.table('responses').select("submitted_at") \
            .in_('survey_id', survey_ids) \
            .range(start, end) \
            .execute()

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
    # count='exact' works correctly even with large datasets without needing pagination loop
    response = supabase.table('responses').select("id", count='exact').in_('survey_id', survey_ids).execute()
    return response.count
