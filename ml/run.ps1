# Starts the ML service on all interfaces so a phone can reach it.
Set-Location $PSScriptRoot
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8001
