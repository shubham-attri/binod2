from typing import Optional, List, Dict
from app.services.supabase import get_supabase_client
from app.models.database import Case, CaseActivity, CaseStatus, ActivityType
import uuid
from datetime import datetime

class CaseService:
    def __init__(self):
        self.supabase = get_supabase_client()

    async def create_case(
        self,
        user_id: str,
        title: str,
        description: str,
        metadata: Optional[Dict] = None
    ) -> Case:
        """Create new case"""
        case = Case(
            id=uuid.uuid4(),
            user_id=user_id,
            title=title,
            description=description,
            status=CaseStatus.ACTIVE,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            metadata=metadata
        )
        
        await self.supabase.table("cases").insert(case.dict())
        
        # Log creation activity
        await self.add_activity(
            case.id,
            ActivityType.CREATED,
            "Case created"
        )
        
        return case

    async def get_case(self, case_id: str) -> Optional[Case]:
        """Get case by ID"""
        result = await self.supabase.table("cases").select("*").eq("id", case_id).single()
        return Case(**result) if result else None

    async def update_case(
        self,
        case_id: str,
        title: Optional[str] = None,
        description: Optional[str] = None,
        status: Optional[CaseStatus] = None,
        metadata: Optional[Dict] = None
    ) -> Case:
        """Update case details"""
        updates = {"updated_at": datetime.utcnow().isoformat()}
        
        if title is not None:
            updates["title"] = title
        if description is not None:
            updates["description"] = description
        if status is not None:
            updates["status"] = status
        if metadata is not None:
            updates["metadata"] = metadata
            
        result = await self.supabase.table("cases").update(updates).eq("id", case_id).single()
        case = Case(**result)
        
        # Log update activity
        await self.add_activity(
            case_id,
            ActivityType.UPDATED,
            f"Case updated: {', '.join(updates.keys())}"
        )
        
        return case

    async def add_activity(
        self,
        case_id: str,
        activity_type: ActivityType,
        description: str,
        metadata: Optional[Dict] = None
    ) -> CaseActivity:
        """Add activity to case"""
        activity = CaseActivity(
            id=uuid.uuid4(),
            case_id=case_id,
            activity_type=activity_type,
            description=description,
            created_at=datetime.utcnow(),
            metadata=metadata
        )
        
        await self.supabase.table("case_activities").insert(activity.dict())
        return activity

    async def get_case_activities(
        self,
        case_id: str,
        limit: int = 50,
        before_id: Optional[str] = None
    ) -> List[CaseActivity]:
        """Get activities for case with pagination"""
        query = self.supabase.table("case_activities").select("*").eq("case_id", case_id)
        
        if before_id:
            query = query.lt("id", before_id)
            
        query = query.order("created_at", desc=True).limit(limit)
        result = await query.execute()
        
        return [CaseActivity(**activity) for activity in result.data]

    async def get_user_cases(
        self,
        user_id: str,
        status: Optional[CaseStatus] = None,
        limit: int = 10
    ) -> List[Case]:
        """Get cases for user"""
        query = self.supabase.table("cases").select("*").eq("user_id", user_id)
        
        if status:
            query = query.eq("status", status)
            
        query = query.order("updated_at", desc=True).limit(limit)
        result = await query.execute()
        
        return [Case(**case) for case in result.data]

    async def archive_case(self, case_id: str) -> Case:
        """Archive a case"""
        return await self.update_case(
            case_id,
            status=CaseStatus.ARCHIVED
        ) 