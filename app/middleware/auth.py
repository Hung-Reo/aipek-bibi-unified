"""API Authentication middleware"""
from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader
from app.config import API_SECRET_KEY, IS_PRODUCTION
import logging

logger = logging.getLogger(__name__)

# Define API Key header
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(api_key: str = Security(api_key_header)) -> str:
    """
    Verify API key from X-API-Key header

    Args:
        api_key: API key from request header

    Returns:
        str: Validated API key

    Raises:
        HTTPException: If API key is invalid or missing
    """
    # Allow bypass in development mode if no key configured
    if not IS_PRODUCTION and not API_SECRET_KEY:
        logger.warning("⚠️ API key check bypassed (development mode, no key configured)")
        logger.warning("⚠️ Run 'python scripts/generate_api_key.py' to generate a key")
        return "dev-bypass"

    # Check if API key provided
    if not api_key:
        logger.warning("❌ Missing API key in request")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API key. Include 'X-API-Key' header in your request.",
            headers={"WWW-Authenticate": "ApiKey"},
        )

    # Validate API key
    if api_key != API_SECRET_KEY:
        logger.warning(f"❌ Invalid API key attempt: {api_key[:10]}...")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key. Please check your credentials.",
        )

    logger.debug(f"✅ API key validated successfully: {api_key[:10]}...")
    return api_key


async def verify_api_key_optional(api_key: str = Security(api_key_header)) -> str:
    """
    Optional API key verification (for public endpoints)
    Returns None if no key provided, validates if key is provided

    Args:
        api_key: API key from request header

    Returns:
        str: Validated API key or None

    Raises:
        HTTPException: If API key is provided but invalid
    """
    if not api_key:
        return None

    # If key is provided, validate it
    if api_key != API_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key",
        )

    return api_key
