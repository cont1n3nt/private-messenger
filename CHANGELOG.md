# Changelog

## [0.0.0] - 2026-05-03
## Added
* Added challenge-response authentication flow using Ed25519 signatures
* Added `/auth/challenge`, `/auth/verify`, `/auth/logout`, and `/auth/me` endpoints
* Added session token management with expiration support
* Added reusable API response schema (`APIResponse`)
* Added FastAPI dependency injection helpers in `deps.py`
* Added Pydantic schemas for auth, users, messages, and keys
* Added challenge expiration and invalidation logic

## Changed
* Replaced direct model imports with namespaced imports (`app.db.models`)

## [0.0.0] - 2026-05-01
## Added
- CHANGELOG.md
- requirements.txt
- .gitignore