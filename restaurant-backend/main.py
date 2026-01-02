
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Import Routers
from routers import auth, merchants, lotteries, surveys, responses, analytics

# Force reload of .env to ensure we get the latest variables
load_dotenv(override=True)

app = FastAPI(title="Restaurant Survey & Lottery API")

# --- CORS ---
# 在前后端分离部署时（Vercel + Render），必须正确配置 CORS。
# 当 allow_credentials=True 时，不能使用 allow_origins=["*"]。
# 这里我们使用正则匹配所有 vercel.app 子域名和本地开发环境。
origin_regex = r"^https://.*\.vercel\.app$|^http://localhost:\d+$|^http://127\.0\.0\.1:\d+$"

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=origin_regex, # 允许 Vercel 和 本地调试
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Include Routers ---
app.include_router(auth.router)
app.include_router(merchants.router)
app.include_router(lotteries.router)
app.include_router(surveys.router)
app.include_router(responses.router)
app.include_router(analytics.router)

@app.get("/")
def root():
    return {"message": "Restaurant API is running (Backend Only)."}
