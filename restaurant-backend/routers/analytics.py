from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import datetime, timedelta, date
import traceback
from collections import defaultdict
import calendar
import schemas
import database
from services import ai_service

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/dashboard-stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(merchant_id: str, filter_merchant_id: Optional[str] = None):
    try:
        merchant = database.get_merchant_by_id(merchant_id)
        if not merchant:
            raise HTTPException(status_code=404, detail="Merchant not found")

        isAdmin = merchant.get('username') == 'admin'

        # 1. Determine Scope for Totals (Overview Section)
        if isAdmin:
            account_survey_ids = database.get_all_survey_ids()
            all_m = database.get_all_merchants()
            total_restaurants = len(all_m)
            total_owners = database.get_owner_count()
        elif merchant.get('role') == 'owner':
            account_survey_ids = database.get_survey_ids_by_merchant(merchant_id)
            subs = database.get_merchants_by_owner(merchant_id)
            total_restaurants = len(subs)
            total_owners = None
        else:
            # Manager
            account_survey_ids = database.get_survey_ids_by_merchant(merchant_id)
            total_restaurants = 1
            total_owners = None

        total_surveys = len(account_survey_ids)
        total_responses = database.count_responses_by_surveys(account_survey_ids)

        # 2. Determine Scope for Today's Stats
        if filter_merchant_id:
            filtered_survey_ids = database.get_survey_ids_by_merchant(filter_merchant_id)
        else:
            filtered_survey_ids = account_survey_ids

        # 3. Get Timestamps
        timestamps = database.get_response_timestamps(filtered_survey_ids)

        now = datetime.now()
        today_date = now.date()
        yesterday_date = today_date - timedelta(days=1)

        today_count = 0
        yesterday_count = 0

        for ts_str in timestamps:
            dt = datetime.fromisoformat(ts_str)
            d = dt.date()
            if d == today_date:
                today_count += 1
            elif d == yesterday_date:
                yesterday_count += 1

        diff = today_count - yesterday_count

        if yesterday_count == 0:
            growth_pct = float(today_count * 100) if today_count > 0 else 0.0
        else:
            growth_pct = round((diff / yesterday_count) * 100, 1)

        return {
            "total_restaurants": total_restaurants,
            "total_surveys": total_surveys,
            "total_responses": total_responses,
            "total_owners": total_owners,
            "today_data": {
                "today_count": today_count,
                "yesterday_count": yesterday_count,
                "diff": diff,
                "growth_pct": growth_pct
            }
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trends", response_model=schemas.DashboardTrends)
def get_dashboard_trends(
        merchant_id: str,
        filter_merchant_id: Optional[str] = None,
        view_mode: str = 'month',  # 'month' or 'year'
        target_date: Optional[str] = None  # 'YYYY-MM' or 'YYYY'
):
    try:
        # 1. Determine Scope
        merchant = database.get_merchant_by_id(merchant_id)
        if not merchant:
            raise HTTPException(status_code=404, detail="Merchant not found")
        isAdmin = merchant.get('username') == 'admin'

        target_merchant_id = merchant_id
        if (isAdmin or merchant.get('role') == 'owner') and filter_merchant_id:
            target_merchant_id = filter_merchant_id
            survey_ids = database.get_survey_ids_by_merchant(target_merchant_id)
        else:
            if isAdmin:
                survey_ids = database.get_all_survey_ids()
            else:
                survey_ids = database.get_survey_ids_by_merchant(merchant_id)

        # 2. Fetch Timestamps
        timestamps = database.get_response_timestamps(survey_ids)

        # 3. Process Dates
        now = datetime.now()
        chart_start_date = None
        chart_end_date = None
        prev_period_start = None
        prev_period_end = None

        if view_mode == 'month':
            if target_date:
                parts = target_date.split('-')
                selected_year = int(parts[0])
                selected_month = int(parts[1])
            else:
                selected_year = now.year
                selected_month = now.month

            _, num_days = calendar.monthrange(selected_year, selected_month)
            chart_start_date = date(selected_year, selected_month, 1)
            chart_end_date = date(selected_year, selected_month, num_days)

            prev_month_end = chart_start_date - timedelta(days=1)
            prev_period_start = prev_month_end.replace(day=1)
            prev_period_end = prev_month_end

        else:
            # Year Mode
            if target_date:
                selected_year = int(target_date)
            else:
                selected_year = now.year

            chart_start_date = date(selected_year, 1, 1)
            chart_end_date = date(selected_year, 12, 31)

            prev_period_start = date(selected_year - 1, 1, 1)
            prev_period_end = date(selected_year - 1, 12, 31)

        # 4. Aggregation
        current_period_count = 0
        prev_period_count = 0
        chart_map = defaultdict(int)

        for ts_str in timestamps:
            dt = datetime.fromisoformat(ts_str)
            d = dt.date()

            if d >= chart_start_date and d <= chart_end_date:
                current_period_count += 1
                if view_mode == 'month':
                    chart_map[str(d.day)] += 1
                else:
                    chart_map[str(d.month)] += 1
            elif d >= prev_period_start and d <= prev_period_end:
                prev_period_count += 1

        # 5. Fill Missing Chart Data
        chart_data = []
        if view_mode == 'month':
            days_in_month = (chart_end_date - chart_start_date).days + 1
            for day in range(1, days_in_month + 1):
                key = str(day)
                val = chart_map.get(key, 0)
                try:
                    full_date_obj = date(chart_start_date.year, chart_start_date.month, day)
                    full_date_str = full_date_obj.strftime("%Y-%m-%d")
                    chart_data.append({
                        "label": f"{day}日",
                        "value": val,
                        "full_date": full_date_str
                    })
                except ValueError:
                    continue
        else:
            for m in range(1, 13):
                key = str(m)
                val = chart_map.get(key, 0)
                chart_data.append({
                    "label": f"{m}月",
                    "value": val,
                    "full_date": f"{chart_start_date.year}-{m}"
                })

        # 6. Calc Growth
        def calc_growth(current, previous):
            if previous == 0:
                if current == 0: return 0.0
                return float(current * 100)
            diff = current - previous
            return round((diff / previous) * 100, 1)

        period_growth = calc_growth(current_period_count, prev_period_count)

        return {
            "stats": {
                "today_count": 0,
                "yesterday_count": 0,
                "daily_growth_pct": 0,
                "month_count": current_period_count,
                "last_month_count": prev_period_count,
                "monthly_growth_pct": period_growth
            },
            "chart_data": chart_data
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze")
def analyze_survey_with_ai(survey_id: str = Query(...), language: str = Query("en")):
    # Call the Service Layer
    result_text = ai_service.analyze_survey(survey_id, language)
    return {"analysis": result_text}
