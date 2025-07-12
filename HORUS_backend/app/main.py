from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from contextlib import asynccontextmanager
from app.database import init_db
import app.api.routes.auth as auth
from app.api.routes.detection import router as detection_router


# Define lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup code - runs when the application starts
    await init_db()  # Initialize Beanie and database connection
    yield
    # Shutdown code - runs when the application stops
    # Add any cleanup code here if needed

# Use lifespan parameter when creating the app
app = FastAPI(title="Horus API", 
    lifespan=lifespan, # Add security scheme definition for Swagger UI
    swagger_ui_init_oauth={
        "usePkceWithAuthorizationCodeGrant": True,
    })

# Define the security scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/signin")

# CORS (Cross-Origin Resource Sharing)
# Adjust origins as needed for your frontend URL
origins = [
    "http://localhost:5173", # Assuming Vite dev server runs here
    "http://127.0.0.1:5173",
    # Add your production frontend URL here
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)

@app.get("/")
async def root():
    return {"message": "Welcome to Horus!"}

# To run this app (from the HORUS_Signup directory):
# uvicorn backend.main:app --reload --port 8000

app.include_router(detection_router, prefix="/api", tags=["Detection"])