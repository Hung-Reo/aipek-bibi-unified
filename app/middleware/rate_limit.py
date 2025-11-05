"""Rate limiting middleware using slowapi"""
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse
from app.config import IS_PRODUCTION
import logging

logger = logging.getLogger(__name__)


def get_rate_limit_key(request: Request) -> str:
    """
    Get unique key for rate limiting
    Uses API key if available, otherwise IP address

    Args:
        request: FastAPI request object

    Returns:
        str: Unique key for rate limiting
    """
    # Try to get API key from header (will be available after implementing auth)
    api_key = request.headers.get("X-API-Key")
    if api_key and api_key != "dev-bypass":
        # Rate limit by API key (more lenient for authenticated users)
        logger.debug(f"Rate limiting by API key: {api_key[:10]}...")
        return f"apikey:{api_key}"

    # Fallback to IP address (stricter for unauthenticated)
    ip = get_remote_address(request)
    logger.debug(f"Rate limiting by IP: {ip}")
    return f"ip:{ip}"


# Create limiter instance
limiter = Limiter(
    key_func=get_rate_limit_key,
    default_limits=["100/hour"] if IS_PRODUCTION else ["1000/hour"],  # Global limit
    storage_uri="memory://",  # Use in-memory storage (upgrade to Redis for production scale)
)


async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """
    Custom handler for rate limit exceeded
    Returns user-friendly JSON response

    Args:
        request: FastAPI request object
        exc: RateLimitExceeded exception

    Returns:
        JSONResponse: Error response with retry information
    """
    logger.warning(f"Rate limit exceeded for {get_rate_limit_key(request)}")

    # Extract retry time from exception message if available
    retry_after = "60"
    if "Retry after" in str(exc.detail):
        try:
            retry_after = str(exc.detail).split("Retry after ")[1].split(" ")[0]
        except:
            pass

    return JSONResponse(
        status_code=429,
        content={
            "status": "error",
            "message": "Rate limit exceeded. Please try again later.",
            "retry_after_seconds": retry_after
        },
        headers={
            "Retry-After": retry_after,
            "X-RateLimit-Limit": "Per endpoint - see docs",
            "X-RateLimit-Remaining": "0"
        }
    )
