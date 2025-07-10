from motor.motor_asyncio import AsyncIOMotorClient
import os
from beanie import init_beanie
import os
from dotenv import load_dotenv
import sys
from app.models.user import User


# Connect to MongoDB
# Load environment variables from parent directory's .env file
load_dotenv()
MONGODB_URL = os.getenv("MONGODB_URL")

if not MONGODB_URL:
	print("Error: MONGODB_URL environment variable not set.", file=sys.stderr)
	sys.exit(1)


try:
	client = AsyncIOMotorClient(MONGODB_URL)
except Exception as e:
	print(f"Error connecting to MongoDB: {e}", file=sys.stderr)
	sys.exit(1)
	
# Database
privileged_database = client.privileged_database
modules_collection = privileged_database["tracking_modules"]
users_collection = privileged_database["users"]

async def init_db():
    """Initializes the Beanie ODM with MongoDB."""
    await init_beanie(database=privileged_database, document_models=[User])

