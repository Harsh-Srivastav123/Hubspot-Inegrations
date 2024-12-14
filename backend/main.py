import json
from http.client import HTTPException

import uvicorn
from fastapi import FastAPI, Form, Request
from fastapi.middleware.cors import CORSMiddleware

from redis_client import redis_client
from utils.logger import log
from integrations.airtable import authorize_airtable, get_items_airtable, oauth2callback_airtable, \
    get_airtable_credentials
from integrations.hubspot import authorize_hubspot, get_hubspot_credentials, get_items_hubspot, oauth2callback_hubspot, \
    logout_hubspot_account, delete_contact, update_contact, create_contact
from integrations.notion import authorize_notion, get_items_notion, oauth2callback_notion, get_notion_credentials

app = FastAPI()

origins = [
    "http://localhost:3000",  # React app address
    "http://127.0.0.1:3000"
    "http://vector-hubspot.s3-website.ap-south-1.amazonaws.com",  # React app address
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get('/')
def read_root():
    return {'Ping': 'Pong'}


# Airtable
@app.post('/integrations/airtable/authorize')
async def authorize_airtable_integration(user_id: str = Form(...), org_id: str = Form(...)):
    return await authorize_airtable(user_id, org_id)


@app.get('/integrations/airtable/oauth2callback')
async def oauth2callback_airtable_integration(request: Request):
    return await oauth2callback_airtable(request)


@app.post('/integrations/airtable/credentials')
async def get_airtable_credentials_integration(user_id: str = Form(...), org_id: str = Form(...)):
    return await get_airtable_credentials(user_id, org_id)


@app.post('/integrations/airtable/load')
async def get_airtable_items(credentials: str = Form(...)):
    return await get_items_airtable(credentials)


# Notion
@app.post('/integrations/notion/authorize')
async def authorize_notion_integration(user_id: str = Form(...), org_id: str = Form(...)):
    return await authorize_notion(user_id, org_id)


@app.get('/integrations/notion/oauth2callback')
async def oauth2callback_notion_integration(request: Request):
    return await oauth2callback_notion(request)


@app.post('/integrations/notion/credentials')
async def get_notion_credentials_integration(user_id: str = Form(...), org_id: str = Form(...)):
    return await get_notion_credentials(user_id, org_id)


@app.post('/integrations/notion/load')
async def get_notion_items(credentials: str = Form(...)):
    return await get_items_notion(credentials)


# HubSpot
@app.post('/integrations/hubspot/authorize')
async def authorize_hubspot_integration(user_id: str = Form(...), org_id: str = Form(...)):
    return await authorize_hubspot(user_id, org_id)


@app.get('/integrations/hubspot/oauth2callback')
async def oauth2callback_hubspot_integration(request: Request):
    return await oauth2callback_hubspot(request)


@app.post('/integrations/hubspot/credentials')
async def get_hubspot_credentials_integration(user_id: str = Form(...), org_id: str = Form(...)):
    return await get_hubspot_credentials(user_id, org_id)


@app.post('/integrations/hubspot/logout')
async def logout_hubspot_integration(user_id: str = Form(...), org_id: str = Form(...)):
    return await logout_hubspot_account(user_id, org_id)


@app.post('/integrations/hubspot/load')
async def load_hubspot_data_integration(
        credentials: str = Form(...)
):
    return await get_items_hubspot(credentials)


# Enhancements
@app.post('/integrations/hubspot/contacts')
async def create_hubspot_contact(
        credentials: str = Form(...),
        contact_data: str = Form(...)
):
    try:
        # Parse the contact_data string into a dictionary
        contact_dict = json.loads(contact_data)
        # Log the incoming data for debugging
        log.info(f"Creating contact with data: {contact_dict}")
        return await create_contact(credentials, contact_dict)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid contact data format: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create contact: {str(e)}")


@app.patch('/integrations/hubspot/contacts/{contact_id}')
async def update_hubspot_contact(
        contact_id: str,
        credentials: str = Form(...),
        contact_data: str = Form(...)
):
    return await update_contact(credentials, contact_id, json.loads(contact_data))


@app.delete('/integrations/hubspot/contacts/{contact_id}')
async def delete_hubspot_contact(
        contact_id: str,
        credentials: str = Form(...)
):
    return await delete_contact(credentials, contact_id)


@app.get("/health")
async def health_check():
    try:
        # Check Redis connection
        await redis_client.ping()
        return {"status": "healthy", "redis": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
