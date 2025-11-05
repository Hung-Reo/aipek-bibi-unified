#!/usr/bin/env python3
"""Generate secure API key for BiBi API authentication"""
import secrets
import hashlib
from datetime import datetime


def generate_api_key():
    """Generate cryptographically secure API key"""
    # Generate 32 bytes random
    random_bytes = secrets.token_bytes(32)

    # Hash with timestamp for uniqueness
    timestamp = str(datetime.now().timestamp()).encode()
    combined = random_bytes + timestamp

    # Create API key with prefix
    api_key = f"bibi_{secrets.token_urlsafe(32)}"

    # Create hash for storage (sha256)
    key_hash = hashlib.sha256(api_key.encode()).hexdigest()

    return api_key, key_hash


if __name__ == "__main__":
    api_key, key_hash = generate_api_key()

    print("=" * 70)
    print("🔑 BiBi API Key Generated")
    print("=" * 70)
    print(f"\n📋 API Key (add to .env file):")
    print(f"   API_SECRET_KEY={api_key}")
    print(f"\n🔐 Hash (for verification/storage):")
    print(f"   {key_hash}")
    print(f"\n⚠️  IMPORTANT INSTRUCTIONS:")
    print(f"   1. Copy the line above and add to your .env file")
    print(f"   2. Never commit .env to git (already in .gitignore)")
    print(f"   3. Share key securely with frontend team (encrypted)")
    print(f"   4. In production, use environment variables on Render.com")
    print(f"   5. Keep backup of this key in secure password manager")
    print("=" * 70)
    print(f"\n💡 Usage in API requests:")
    print(f'   curl -H "X-API-Key: {api_key}" http://localhost:8000/api/health')
    print("=" * 70)
