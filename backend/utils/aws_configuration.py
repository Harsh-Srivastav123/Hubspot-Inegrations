import os

import boto3
from botocore.config import Config
from dotenv import load_dotenv


def get_aws_client(service_name):
    """
    Creates and returns a boto3 client for the specified AWS service.
    Uses IAM role credentials when deployed, falls back to local credentials for development.
    
    Args:
        service_name (str): Name of the AWS service (e.g. 's3', 'dynamodb', 'lambda')
        
    Returns:
        boto3.client: Configured boto3 client for the requested service
    """
    config = Config(
        region_name='ap-south-1',
        retries=dict(
            max_attempts=3
        )
    )

    # Try to create client without explicit credentials first (for IAM role)
    try:
        client = boto3.client(
            service_name,
            config=config
        )
        # Test the client works
        client.get_caller_identity()
        return client
    except:
        # Fall back to local credentials if IAM role not available
        load_dotenv()
        client = boto3.client(
            service_name,
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name='ap-south-1',
            config=config
        )
        return client
