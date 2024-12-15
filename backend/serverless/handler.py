import asyncio
import json
import os
from typing import Dict, Any

import httpx
from aws_lambda_powertools import Logger
from aws_lambda_powertools.utilities.typing import LambdaContext

# Initialize logger
logger = Logger()

# Configuration
ALB_ENDPOINT = os.environ.get('ALB_ENDPOINT', 'http://vector-shift-alb-861076819.ap-south-1.elb.amazonaws.com')
DEFAULT_TIMEOUT = 30.0  # seconds

# CORS headers
CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE,PATCH'
}


def create_error_response(status_code: int, message: str) -> Dict[str, Any]:
    """Create a standardized error response"""
    return {
        'statusCode': status_code,
        'body': json.dumps({'error': message}),
        'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'}
    }


def create_success_response(status_code: int, body: str, content_type: str = 'application/json') -> Dict[str, Any]:
    """Create a standardized success response"""
    return {
        'statusCode': status_code,
        'body': body,
        'headers': {**CORS_HEADERS, 'Content-Type': content_type}
    }


@logger.inject_lambda_context
async def make_request(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """
    Handle the API Gateway request and proxy it to the ALB
    """
    try:
        # Extract request details
        path = event.get('path', '')
        query_params = event.get('queryStringParameters', {}) or {}
        http_method = event.get('httpMethod', 'GET')
        headers = event.get('headers', {}) or {}
        body = event.get('body', '')
        is_base64_encoded = event.get('isBase64Encoded', False)

        # Handle multipart form data
        content_type = headers.get('content-type', '').lower()
        is_multipart = 'multipart/form-data' in content_type

        # Construct target URL
        target_url = f"{ALB_ENDPOINT}{path}"
        if query_params:
            query_string = '&'.join([f"{k}={v}" for k, v in query_params.items()])
            target_url = f"{target_url}?{query_string}"

        logger.info({
            'message': 'Proxying request',
            'url': target_url,
            'method': http_method,
            'content_type': content_type
        })

        # Configure client timeout and follow redirects
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT, follow_redirects=True) as client:
            # Prepare headers (exclude specific headers)
            request_headers = {
                k: v for k, v in headers.items()
                if k.lower() not in ['host', 'content-length', 'connection']
            }

            # Make the request
            response = await client.request(
                method=http_method,
                url=target_url,
                headers=request_headers,
                content=body,
            )

            # Log response details
            logger.info({
                'message': 'Response received',
                'status_code': response.status_code,
                'response_content_type': response.headers.get('content-type')
            })

            return create_success_response(
                status_code=response.status_code,
                body=response.text,
                content_type=response.headers.get('content-type', 'application/json')
            )

    except httpx.TimeoutException as e:
        logger.error(f"Request timed out: {str(e)}")
        return create_error_response(504, "Request timed out")

    except httpx.RequestError as e:
        logger.error(f"Request failed: {str(e)}")
        return create_error_response(502, f"Request failed: {str(e)}")

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return create_error_response(500, f"Internal server error: {str(e)}")


def handle_options_request(event: Dict[str, Any]) -> Dict[str, Any]:
    """Handle OPTIONS requests for CORS preflight"""
    return {
        'statusCode': 200,
        'body': '',
        'headers': CORS_HEADERS
    }


@logger.inject_lambda_context
def proxy(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """
    Main Lambda handler function
    """
    try:
        # Log incoming request
        logger.info({
            'message': 'Received request',
            'method': event.get('httpMethod'),
            'path': event.get('path'),
            'query': event.get('queryStringParameters')
        })

        # Handle OPTIONS requests
        if event.get('httpMethod') == 'OPTIONS':
            return handle_options_request(event)

        # Process the request
        return asyncio.run(make_request(event, context))

    except Exception as e:
        logger.error(f"Handler error: {str(e)}", exc_info=True)
        return create_error_response(500, f"Handler error: {str(e)}")
