from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import ask, feedback, admin, embed

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "API running"}

app.include_router(ask.router)
app.include_router(feedback.router)
app.include_router(admin.router)
app.include_router(embed.router)
