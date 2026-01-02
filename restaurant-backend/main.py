
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Import Routers
from routers import auth, merchants, lotteries, surveys, responses, analytics

# Force reload of .env to ensure we get the latest variables
load_dotenv(override=True)

app = FastAPI(title="Restaurant Survey & Lottery API")

# --- CORS ---
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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
    return {"message": "Restaurant API is running."}
