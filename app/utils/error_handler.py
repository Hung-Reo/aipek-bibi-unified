"""Secure error handling and sanitization"""
import re
import traceback
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from app.config import IS_PRODUCTION

logger = logging.getLogger(__name__)

# Patterns to redact from error messages
SENSITIVE_PATTERNS = [
    (r'sk-[a-zA-Z0-9]{32,}', '[OPENAI_KEY_REDACTED]'),  # OpenAI keys
    (r'pcsk_[a-zA-Z0-9]{32,}', '[PINECONE_KEY_REDACTED]'),  # Pinecone keys
    (r'Bearer [a-zA-Z0-9._-]+', 'Bearer [REDACTED]'),  # Bearer tokens
    (r'api[_-]?key["\']?\s*[:=]\s*["\']?([^"\'\s]+)', 'api_key=[REDACTED]'),  # API keys
    (r'/home/[^\s]+', '/app/[PATH_REDACTED]'),  # File paths
    (r'password["\']?\s*[:=]\s*["\']?([^"\'\s]+)', 'password=[REDACTED]'),  # Passwords
]

def sanitize_error_message(error_message: str) -> str:
    """
    Remove sensitive information from error message

    Args:
        error_message: Raw error message

    Returns:
        str: Sanitized error message
    """
    sanitized = error_message

    # Apply all redaction patterns
    for pattern, replacement in SENSITIVE_PATTERNS:
        sanitized = re.sub(pattern, replacement, sanitized, flags=re.IGNORECASE)

    return sanitized


def create_error_response(
    error: Exception,
    user_message: Optional[str] = None,
    include_details: bool = False
) -> Dict[str, Any]:
    """
    Create safe error response

    Args:
        error: The exception that occurred
        user_message: User-friendly message (optional)
        include_details: Include sanitized details (only in dev)

    Returns:
        Dict: Safe error response
    """
    # Log full error internally
    logger.error(f"Error occurred: {error}", exc_info=True)

    # Generic message for production
    if IS_PRODUCTION and not user_message:
        user_message = "An error occurred. Please contact support."

    # Detailed message for development
    if not user_message:
        user_message = sanitize_error_message(str(error))

    response = {
        "status": "error",
        "message": user_message,
        "timestamp": datetime.now().isoformat()
    }

    # Include details only in development
    if include_details and not IS_PRODUCTION:
        response["details"] = {
            "error_type": type(error).__name__,
            "error_message": sanitize_error_message(str(error)),
            "traceback": sanitize_error_message(traceback.format_exc())
        }

    return response


# Specific error handlers for common cases
def handle_openai_error(error: Exception) -> Dict[str, Any]:
    """Handle OpenAI API errors safely"""
    error_str = str(error).lower()

    if "rate_limit" in error_str or "rate limit" in error_str:
        return create_error_response(
            error,
            user_message="API rate limit exceeded. Please try again in a few moments."
        )
    elif "authentication" in error_str or "unauthorized" in error_str:
        return create_error_response(
            error,
            user_message="Service authentication error. Please contact support."
        )
    elif "timeout" in error_str:
        return create_error_response(
            error,
            user_message="Request timeout. Please try again."
        )
    else:
        return create_error_response(
            error,
            user_message="AI service error. Please try again."
        )


def handle_pinecone_error(error: Exception) -> Dict[str, Any]:
    """Handle Pinecone errors safely"""
    return create_error_response(
        error,
        user_message="Knowledge base error. Please try again."
    )


def handle_validation_error(error: Exception) -> Dict[str, Any]:
    """Handle validation errors"""
    return create_error_response(
        error,
        user_message=f"Invalid request: {sanitize_error_message(str(error))}"
    )
