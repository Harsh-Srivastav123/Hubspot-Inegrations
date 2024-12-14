import json

from utils.logger import log
from .aws_configuration import get_aws_client


def get_hubspot_secrets():
    """
    Retrieves HubSpot configuration secrets from AWS Secrets Manager.
    
    Returns:
        dict: Dictionary containing HubSpot configuration values
    """
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
            'scopes': secrets.get('HUBSPOT_SCOPES', [])
        }
    except Exception as e:
        # Log error and return empty dict if secrets can't be retrieved
        log.error(f"Error retrieving HubSpot secrets: {str(e)}")
        return {}
