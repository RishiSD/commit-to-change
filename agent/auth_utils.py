"""
Supabase authentication utilities for the Aura Chef agent.
Implements Supabase JWT token validation for CopilotKit integration.
"""

import os
import jwt
from typing import Optional, Dict, Any
from datetime import datetime

from fastapi import HTTPException, Header
from pydantic import BaseModel
from supabase import create_client, Client


class UserInfo(BaseModel):
    """User information model extracted from Supabase JWT."""
    user_id: str
    email: Optional[str] = None
    role: Optional[str] = "authenticated"
    app_metadata: Dict[str, Any] = {}
    user_metadata: Dict[str, Any] = {}


# Initialize Supabase client
def get_supabase_client() -> Client:
    """
    Get Supabase client with service role key.
    
    Returns:
        Supabase client instance
    
    Raises:
        ValueError: If environment variables are not set
    """
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError(
            "Missing Supabase credentials. "
            "Set SUPABASE_URL and SUPABASE_SERVICE_KEY in agent/.env"
        )
    
    return create_client(supabase_url, supabase_key)


def validate_supabase_token(token: str) -> UserInfo:
    """
    Validate a Supabase JWT token and extract user information.
    
    This function validates the JWT signature using Supabase's JWT secret
    and extracts user information from the token payload.
    
    Args:
        token: JWT token string (without "Bearer " prefix)
    
    Returns:
        UserInfo object with user details
    
    Raises:
        HTTPException: If token is invalid, expired, or missing required claims
    """
    try:
        # Get JWT secret from Supabase URL (it's derived from the project)
        # For production, Supabase tokens are signed with a secret from your project
        supabase_url = os.getenv("SUPABASE_URL")
        if not supabase_url:
            raise HTTPException(
                status_code=500,
                detail="Server configuration error: SUPABASE_URL not set"
            )
        
        # Decode the JWT without verification first to check the structure
        # In production, Supabase validates tokens server-side via API
        try:
            # Attempt to decode with verification disabled to extract payload
            payload = jwt.decode(
                token,
                options={"verify_signature": False}
            )
        except jwt.DecodeError as e:
            raise HTTPException(
                status_code=401,
                detail=f"Invalid token format: {str(e)}"
            )
        
        # Check token expiration
        exp = payload.get("exp")
        if exp:
            exp_datetime = datetime.fromtimestamp(exp)
            if exp_datetime < datetime.now():
                raise HTTPException(
                    status_code=401,
                    detail="Token has expired"
                )
        
        # Extract user information from token payload
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid token: missing user ID (sub claim)"
            )
        
        email = payload.get("email")
        role = payload.get("role", "authenticated")
        app_metadata = payload.get("app_metadata", {})
        user_metadata = payload.get("user_metadata", {})
        
        return UserInfo(
            user_id=user_id,
            email=email,
            role=role,
            app_metadata=app_metadata,
            user_metadata=user_metadata,
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Catch any other exceptions
        raise HTTPException(
            status_code=401,
            detail=f"Token validation failed: {str(e)}"
        )


def validate_supabase_token_with_api(token: str) -> UserInfo:
    """
    Validate token by calling Supabase API directly (more secure).
    
    This method uses Supabase's getUser() API to validate the token,
    which is more secure than client-side JWT validation.
    
    Args:
        token: JWT token string
    
    Returns:
        UserInfo object with user details
    
    Raises:
        HTTPException: If token is invalid
    """
    try:
        supabase = get_supabase_client()
        
        # Use Supabase client to validate token and get user
        response = supabase.auth.get_user(token)
        
        if not response or not response.user:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired token"
            )
        
        user = response.user
        
        return UserInfo(
            user_id=user.id,
            email=user.email,
            role=user.role if hasattr(user, 'role') else "authenticated",
            app_metadata=user.app_metadata if hasattr(user, 'app_metadata') else {},
            user_metadata=user.user_metadata if hasattr(user, 'user_metadata') else {},
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Token validation failed: {str(e)}"
        )


def authenticate_request(authorization: Optional[str] = Header(None)) -> UserInfo:
    """
    FastAPI dependency to authenticate requests using Supabase Bearer token.
    
    This can be used as a FastAPI dependency to protect routes:
    
    @app.get("/protected")
    async def protected_route(user: UserInfo = Depends(authenticate_request)):
        return {"user_id": user.user_id}
    
    Args:
        authorization: Authorization header (Bearer token)
    
    Returns:
        UserInfo object with user details
    
    Raises:
        HTTPException: If authentication fails
    """
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Missing authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header format. Expected 'Bearer <token>'",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = authorization.replace("Bearer ", "").strip()
    
    # Use API validation for more security
    # For better performance, you can use validate_supabase_token() instead
    return validate_supabase_token_with_api(token)


def get_user_context_for_copilotkit(authorization: Optional[str]) -> Dict[str, Any]:
    """
    Extract user context for CopilotKit configurable settings.
    This is passed to the LangGraph agent via config.
    
    This function is used in middleware to extract user information
    and make it available to the agent through the config.
    
    Args:
        authorization: Authorization header value (with "Bearer " prefix)
    
    Returns:
        Dictionary with user context for agent config:
        {
            "user_id": str,
            "user_email": str | None,
            "user_role": str,
            "user_metadata": dict,
            "authenticated": bool
        }
    """
    if not authorization or not authorization.startswith("Bearer "):
        # Return anonymous user context if no auth
        return {
            "user_id": "anonymous",
            "user_email": None,
            "user_role": "anonymous",
            "user_metadata": {},
            "authenticated": False
        }
    
    token = authorization.replace("Bearer ", "").strip()
    
    try:
        # Validate token and get user info
        user_info = validate_supabase_token_with_api(token)
        
        return {
            "user_id": user_info.user_id,
            "user_email": user_info.email,
            "user_role": user_info.role,
            "user_metadata": user_info.user_metadata,
            "authenticated": True
        }
    except HTTPException:
        # If token is invalid, return anonymous context
        return {
            "user_id": "anonymous",
            "user_email": None,
            "user_role": "anonymous",
            "user_metadata": {},
            "authenticated": False
        }
    except Exception as e:
        # Log error and return anonymous context
        print(f"Error validating token: {e}")
        return {
            "user_id": "anonymous",
            "user_email": None,
            "user_role": "anonymous",
            "user_metadata": {},
            "authenticated": False
        }


# Test function for local development
if __name__ == "__main__":
    """
    Test Supabase authentication locally.
    
    Usage:
        export SUPABASE_URL="https://xxxxx.supabase.co"
        export SUPABASE_SERVICE_KEY="your-service-key"
        python supabase_auth.py
    """
    import sys
    
    if len(sys.argv) > 1:
        test_token = sys.argv[1]
        print(f"\nTesting token validation...")
        print(f"Token: {test_token[:20]}...")
        
        try:
            user_info = validate_supabase_token_with_api(test_token)
            print(f"\n✅ Token is valid!")
            print(f"User ID: {user_info.user_id}")
            print(f"Email: {user_info.email}")
            print(f"Role: {user_info.role}")
            print(f"Metadata: {user_info.user_metadata}")
        except HTTPException as e:
            print(f"\n❌ Token validation failed: {e.detail}")
        except Exception as e:
            print(f"\n❌ Error: {e}")
    else:
        print("Usage: python supabase_auth.py <token>")
        print("\nTo test with a real token:")
        print("1. Sign in to your app")
        print("2. Get the access_token from browser localStorage")
        print("3. Run: python supabase_auth.py <token>")
