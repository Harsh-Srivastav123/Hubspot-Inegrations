import json
import secrets
from typing import Dict, List
from urllib.parse import urlencode

import httpx
from fastapi import Request, HTTPException
from fastapi.responses import HTMLResponse
from integrations.integration_item import IntegrationItem
from redis_client import add_key_value_redis, get_value_redis, delete_key_redis, get_keys_with_prefix
from utils.logger import log
from utils.secrets import get_hubspot_secrets

# Get HubSpot configuration from secrets
hubspot_config = get_hubspot_secrets()

CLIENT_ID = hubspot_config['client_id']
CLIENT_SECRET = hubspot_config['client_secret']
REDIRECT_URI = hubspot_config['redirect_uri']
AUTH_URL = hubspot_config['auth_url']
TOKEN_URL = hubspot_config['token_url']
API_BASE_URL = hubspot_config['api_base_url']
SCOPES = hubspot_config['scopes'].split(',') if hubspot_config['scopes'] else []


async def authorize_hubspot(user_id: str, org_id: str) -> str:
    """
    Initialize OAuth flow for HubSpot integration
    """
    try:
        # Generate state for CSRF protection
        state_data = {
            'state': secrets.token_urlsafe(32),
            'user_id': user_id,
            'org_id': org_id
        }

        # Store state in Redis with expiration
        await add_key_value_redis(
            f'hubspot_state:{org_id}:{user_id}',
            json.dumps(state_data)
        )
        log.info(SCOPES)

        # Construct authorization URL
        params = {
            'client_id': CLIENT_ID,
            'redirect_uri': REDIRECT_URI,
            'scope': ' '.join(SCOPES),
            'state': state_data['state']
        }

        auth_url = f"{AUTH_URL}?{urlencode(params)}"
        return auth_url

    except Exception as e:
        log.error(f"Error authorizing HubSpot: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Authorization failed: {str(e)}")


async def oauth2callback_hubspot(request: Request) -> Dict:
    """
    Handle OAuth callback from HubSpot
    """
    try:
        # Get query parameters from callback
        params = dict(request.query_params)
        code = params.get('code')
        state = params.get('state')
        log.info(f"Received callback with code: {code} and state: {state}")

        if not code or not state:
            raise HTTPException(status_code=400, detail="Missing code or state")

        # Find stored state data
        stored_states = await get_keys_with_prefix('hubspot_state:')
        log.info(f"Retrieved stored states: {stored_states}")
        state_data = None
        for stored_state in stored_states:
            stored_state_data = json.loads(stored_state)
            if stored_state_data.get('state') == state:
                state_data = stored_state_data
                break

        if not state_data:
            raise HTTPException(status_code=400, detail="Invalid state")

        # Exchange code for access token
        token_data = {
            'grant_type': 'authorization_code',
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET,
            'redirect_uri': REDIRECT_URI,
            'code': code
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(TOKEN_URL, data=token_data)
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="Token exchange failed")

            credentials = response.json()

        # Store credentials in Redis
        await add_key_value_redis(
            f'hubspot_credentials:{state_data["org_id"]}:{state_data["user_id"]}',
            json.dumps(credentials),
            expire=credentials.get('expires_in', 3600)
        )

        # Clean up state
        await delete_key_redis(f'hubspot_state:{state_data["org_id"]}:{state_data["user_id"]}')

        close_window = """
        <html>
            <head>
                <title>HubSpot Authorization</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        background-color: #f5f5f5;
                    }
                    .container {
                        text-align: center;
                        padding: 40px;
                        background: white;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    h3 {
                        color: #2E7D32;
                        margin-bottom: 16px;
                    }
                    .checkmark {
                        color: #2E7D32;
                        font-size: 48px;
                        margin-bottom: 16px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="checkmark">✓</div>
                    <h3>Authorization Successful!</h3>
                    <p>This window will close automatically in 3 seconds...</p>
                </div>
                <script>
                    setTimeout(function() {
                        window.close();
                    }, 3000);
                </script>
            </body>
        </html>
    """

        return HTMLResponse(content=close_window)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Callback processing failed: {str(e)}")


async def get_hubspot_credentials(user_id: str, org_id: str) -> Dict:
    """
    Retrieve stored HubSpot credentials
    """
    try:
        credentials = await get_value_redis(f'hubspot_credentials:{org_id}:{user_id}')
        if not credentials:
            log.warn("No credentials found for user")
            raise HTTPException(status_code=400, detail="No credentials found")

        return json.loads(credentials)

    except Exception as e:
        log.error(f"Failed to retrieve credentials: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve credentials: {str(e)}")


async def create_integration_item_metadata_object(contact: Dict) -> Dict:
    """
    Transform HubSpot contact data into standardized metadata
    """
    return {
        "id": str(contact.get('id', '')),
        "name": f"{contact.get('properties', {}).get('firstname', '')} {contact.get('properties', {}).get('lastname', '')}",
        "email": contact.get('properties', {}).get('email', ''),
        "phone": contact.get('properties', {}).get('phone', ''),
        "company": contact.get('properties', {}).get('company', ''),
        "created_at": contact.get('properties', {}).get('createdate', ''),
        "updated_at": contact.get('properties', {}).get('lastmodifieddate', '')
    }


async def get_items_hubspot(credentials: str) -> List[IntegrationItem]:
    """
    Fetch contacts from HubSpot and convert them to IntegrationItem objects
    """
    try:
        creds = json.loads(credentials)
        access_token = creds.get('access_token')

        if not access_token:
            log.error("Invalid credentials provided")
            raise HTTPException(status_code=400, detail="Invalid credentials")

        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }

        # Fetch contacts from HubSpot
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{API_BASE_URL}/crm/v3/objects/contacts",
                headers=headers,
                params={
                    'limit': 100,
                    'properties': 'firstname,lastname,email,phone,company,createdate,lastmodifieddate'
                }
            )

            if response.status_code != 200:
                log.error(f"Failed to fetch HubSpot contacts: {response.status_code}")
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch HubSpot contacts")

            contacts_data = response.json()

        # Transform contacts into IntegrationItem objects
        integration_items = []
        for contact in contacts_data.get('results', []):
            metadata = await create_integration_item_metadata_object(contact)

            integration_items.append(
                IntegrationItem(
                    id=metadata['id'],
                    name=metadata['name'],
                    type='contact',
                    parent_id=metadata['company'],
                    parent_path_or_name=metadata['company'],
                    visibility=True
                )
            )

        return integration_items

    except Exception as e:
        log.error(f"Failed to fetch HubSpot items: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch HubSpot items: {str(e)}")


async def logout_hubspot_account(user_id: str, org_id: str):
    try:
        # Clear credentials from Redis
        await delete_key_redis(f'hubspot_credentials:{org_id}:{user_id}')
        await delete_key_redis(f'hubspot_state:{org_id}:{user_id}')
        log.info(f"Successfully logged out user {user_id} from org {org_id}")
        return {
            "status": "success",
            "message": "Logged out successfully",
            "redirect": "/integrations/hubspot"
        }
    except Exception as e:
        log.error(f"Logout failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Logout failed: {str(e)}")


async def create_contact(credentials: str, contact_data: Dict) -> Dict:
    """Create a new HubSpot contact"""
    try:
        creds = json.loads(credentials)
        access_token = creds.get('access_token')

        if not access_token:
            log.error("No access token found in credentials")
            raise HTTPException(401, detail="Invalid credentials")

        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }

        # Ensure all property values are strings, exclude notes field
        properties = {
            "firstname": str(contact_data.get("firstname", "")),
            "lastname": str(contact_data.get("lastname", "")),
            "email": str(contact_data.get("email", "")),
            "phone": str(contact_data.get("phone", "")),
            "company": str(contact_data.get("company", ""))
        }

        # Log the request details for debugging
        log.info(f"Making request to HubSpot with properties: {properties}")

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{API_BASE_URL}/crm/v3/objects/contacts",
                headers=headers,
                json={"properties": properties}
            )

            # Log the response for debugging
            log.info(f"HubSpot response status: {response.status_code}")
            if response.status_code != 201:
                log.error(f"HubSpot error response: {response.text}")
                raise HTTPException(response.status_code, detail=f"Failed to create contact: {response.text}")

            return response.json()

    except json.JSONDecodeError as e:
        log.error(f"Failed to parse credentials: {str(e)}")
        raise HTTPException(400, detail="Invalid credentials format")
    except Exception as e:
        log.error(f"Failed to create contact: {str(e)}")
        raise HTTPException(500, detail=f"Failed to create contact: {str(e)}")


async def update_contact(credentials: str, contact_id: str,
                         contact_data: Dict) -> Dict:
    """Update an existing HubSpot contact"""
    try:
        creds = json.loads(credentials)
        access_token = creds.get('access_token')

        if not access_token:
            log.error("No access token found in credentials")
            raise HTTPException(401, detail="Invalid credentials")

        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }

        # Ensure all property values are strings, similar to create_contact
        properties = {
            "firstname": str(contact_data.get("firstname", "")),
            "lastname": str(contact_data.get("lastname", "")),
            "email": str(contact_data.get("email", "")),
            "phone": str(contact_data.get("phone", "")),
            "company": str(contact_data.get("company", ""))
        }

        # Remove empty values
        properties = {k: v for k, v in properties.items() if v}

        # Log the request details for debugging
        log.info(f"Making update request to HubSpot for contact {contact_id} with properties: {properties}")

        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{API_BASE_URL}/crm/v3/objects/contacts/{contact_id}",
                headers=headers,
                json={"properties": properties}
            )

            # Log the response for debugging
            log.info(f"HubSpot response status: {response.status_code}")
            if response.status_code != 200:
                log.error(f"HubSpot error response: {response.text}")
                raise HTTPException(response.status_code,
                                    detail=f"Failed to update contact: {response.text}")

            return response.json()

    except json.JSONDecodeError as e:
        log.error(f"Failed to parse credentials: {str(e)}")
        raise HTTPException(400, detail="Invalid credentials format")
    except Exception as e:
        log.error(f"Failed to update contact: {str(e)}")
        raise HTTPException(status_code=500,
                            detail=f"Failed to update contact: {str(e)}")


async def delete_contact(credentials: str, contact_id: str):
    """Delete a HubSpot contact"""
    try:
        creds = json.loads(credentials)
        access_token = creds.get('access_token')

        headers = {
            'Authorization': f'Bearer {access_token}',
        }

        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{API_BASE_URL}/crm/v3/objects/contacts/{contact_id}",
                headers=headers
            )

            if response.status_code != 204:
                log.error(f"Failed to delete contact: {response.status_code}")
                raise HTTPException(status_code=response.status_code,
                                    detail="Failed to delete contact")

            log.info(f"Successfully deleted contact {contact_id}")
            return {"status": "success", "message": "Contact deleted successfully"}

    except Exception as e:
        log.error(f"Failed to delete contact: {str(e)}")
        raise HTTPException(status_code=500,
                            detail=f"Failed to delete contact: {str(e)}")
