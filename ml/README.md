# Tuda ML — monument recognition (SigLIP2, zero-shot)

`POST /recognize` (multipart: `image`, optional `lang`) → `{recognized, id, name, confidence, margin, top[], ms}`.
`id` matches monument ids in `backend/data` (e.g. `volgograd_02`). `GET /health`.

## Setup
```powershell
cd ml
py -3.13 -m venv .venv
.\.venv\Scripts\python.exe -m pip install torch -r requirements.txt
.\run.ps1          # http://0.0.0.0:8001, first start downloads the model (~400 MB)
```
Frontend: set `EXPO_PUBLIC_ML_URL=http://<laptop-LAN-IP>:8001` in `frontend/.env`.

## Tuning
- `data/prompts.json` — visual English prompts per monument. `"enabled": false` removes a class
  (vague classes steal frames from good ones). Keep only recognisable objects for the fair.
- `refs/<monument_id>/*.jpg` — 3–10 real photos per monument are blended into the class
  prototype (few-shot, no training). Biggest accuracy gain for the least work.
- `TUDA_THRESHOLD` (default 0.45) / `TUDA_MARGIN` (0.15) — confidence and gap to 2nd place.
- `TUDA_MODEL` — e.g. `google/siglip2-so400m-patch14-384` (slower, more accurate).
- Negative classes in `prompts.json` keep faces / rooms / random objects from matching a monument.

When not recognised, the app shows the top candidates to pick from.
