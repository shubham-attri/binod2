from app.api.v1 import documents

app.include_router(
    documents.router,
    prefix="/api/v1/documents",
    tags=["documents"]
) 