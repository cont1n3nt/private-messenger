# Changelog

## [0.0.0] - 2026-05-05 - 2026-05-06
## Added
* Added new endpoints
* Added websocker manager 
## Changed
* Refactor all project structure
* Simple changes of object types in `models.py`

## Fixed
* Fixed all datetime issues in `models.py` and `deps.py`

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

## Fixed
* get_active_challenge() in crud

## [0.0.0] - 2026-05-01
## Added
- CHANGELOG.md
- requirements.txt
- .gitignore