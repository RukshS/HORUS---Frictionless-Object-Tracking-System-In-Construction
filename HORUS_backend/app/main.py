from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from contextlib import asynccontextmanager
from app.database import init_db
import app.api.routes.auth as auth
import app.api.routes.face_recognition as face_recognition
import HORUS_backend.app.api.websockets.websocket as websocket
from app.chatagent.main import app as chatagent_app


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
# Allow mobile and local network access
origins = [
    "http://localhost:5173", # Vite dev server
    "http://127.0.0.1:5173",
    "http://localhost:3000", # Mobile server
    "http://127.0.0.1:3000",
    "http://192.168.*.*:*",  # Local network access for mobile
    "http://10.*.*.*:*",     # Private network access
    "*"  # For development - remove in production
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(face_recognition.router)
app.include_router(websocket.router)

# Mount the chatagent sub-application
app.mount("/chatagent", chatagent_app)

@app.get("/")
async def root():
    return {"message": "Welcome to Horus!"}


