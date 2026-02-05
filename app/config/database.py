from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional
from app.config.settings import settings


class Database:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None
    
    @classmethod
    async def connect(cls) -> None:
        """Connect to MongoDB"""
        cls.client = AsyncIOMotorClient(settings.MONGODB_URL)
        cls.db = cls.client[settings.MONGODB_DB_NAME]
        
        # Create indexes for better performance
        await cls._create_indexes()
        
    @classmethod
    async def disconnect(cls) -> None:
        """Disconnect from MongoDB"""
        if cls.client:
            cls.client.close()
            cls.client = None
            cls.db = None
    
    @classmethod
    async def _create_indexes(cls) -> None:
        """Create database indexes"""
        if cls.db:
            # Users collection indexes
            await cls.db.users.create_index("email", unique=True)
            await cls.db.users.create_index("created_at")
            
            # Trips collection indexes
            await cls.db.trips.create_index("user_id")
            await cls.db.trips.create_index("status")
            await cls.db.trips.create_index([("user_id", 1), ("status", 1)])
            
            # Safety checks indexes
            await cls.db.safety_checks.create_index("user_id")
            await cls.db.safety_checks.create_index("trip_id")
            
            # Emergencies indexes
            await cls.db.emergencies.create_index("user_id")
            await cls.db.emergencies.create_index("status")
            await cls.db.emergencies.create_index("created_at")
    
    @classmethod
    def get_db(cls) -> AsyncIOMotorDatabase:
        """Get database instance"""
        if cls.db is None:
            raise RuntimeError("Database not connected. Call Database.connect() first.")
        return cls.db
    
    @classmethod
    def get_collection(cls, collection_name: str):
        """Get a collection by name"""
        db = cls.get_db()
        return db[collection_name]


# Database instance
db = Database()
