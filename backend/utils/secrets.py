import json
import os
from dotenv import load_dotenv

from utils.logger import log
from .aws_configuration import get_aws_client


def get_hubspot_secrets():
    """
    Retrieves HubSpot configuration secrets from .env file first,
    then falls back to AWS Secrets Manager if not found.
    
    Returns:
        dict: Dictionary containing HubSpot configuration values
    """
    # Load environment variables
    load_dotenv()
    
    # First try to get secrets from .env
    env_secrets = {
        'client_id': os.getenv('HUBSPOT_CLIENT_ID'),
        'client_secret': os.getenv('HUBSPOT_CLIENT_SECRET'),
        'redirect_uri': os.getenv('HUBSPOT_REDIRECT_URI'),
        'auth_url': os.getenv('HUBSPOT_AUTH_URL'),
        'token_url': os.getenv('HUBSPOT_TOKEN_URL'),
        'api_base_url': os.getenv('HUBSPOT_API_BASE_URL'),
        'scopes': os.getenv('HUBSPOT_SCOPES', '[]'),
        'openai_api_key': os.getenv('OPENAI_API_KEY'),
    }
    
    # If all required secrets are in .env, return them
    if all(value for key, value in env_secrets.items() if key != 'scopes'):
        # Convert scopes string to list by splitting on commas
        scopes = env_secrets['scopes']
        if scopes.startswith('"') and scopes.endswith('"'):
            scopes = scopes[1:-1]  # Remove surrounding quotes
        env_secrets['scopes'] = scopes
        return env_secrets

    # If not all secrets are in .env, try AWS Secrets Manager
    try:
        # Get Secrets Manager client
        secrets_client = get_aws_client('secretsmanager')

        # Get HubSpot secrets
        response = secrets_client.get_secret_value(
            SecretId='hubspot-credentials'  # Adjust secret name as needed
        )

        # Parse secret string to dictionary
        secrets = json.loads(response['SecretString'])

        return {
            'client_id': secrets.get('HUBSPOT_CLIENT_ID'),
            'client_secret': secrets.get('HUBSPOT_CLIENT_SECRET'),
            'redirect_uri': secrets.get('HUBSPOT_REDIRECT_URI'),
            'auth_url': secrets.get('HUBSPOT_AUTH_URL'),
            'token_url': secrets.get('HUBSPOT_TOKEN_URL'),
            'api_base_url': secrets.get('HUBSPOT_API_BASE_URL'),
            'scopes': secrets.get('HUBSPOT_SCOPES', []),
            'openai_api_key': secrets.get('OPENAI_API_KEY'),
        }
    except Exception as e:
        # Log error and return empty dict if secrets can't be retrieved
        log.error(f"Error retrieving HubSpot secrets: {str(e)}")
        return {}
