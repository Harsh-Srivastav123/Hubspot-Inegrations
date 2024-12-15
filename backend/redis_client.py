import os

import redis.asyncio as redis
from kombu.utils.url import safequote
from utils.secrets import get_aws_client
import json

try:
    # Get Secrets Manager client
    secrets_client = get_aws_client('secretsmanager')
    response = secrets_client.get_secret_value(SecretId='redis-credentials')
    secrets = json.loads(response['SecretString'])
    redis_host = safequote(secrets.get('REDIS_HOST'))
except Exception:
    # Fall back to environment variable or localhost if secrets fail
    redis_host = safequote(os.environ.get('REDIS_HOST', 'localhost'))

redis_client = redis.Redis(host=redis_host, port=6379, db=0)


async def add_key_value_redis(key, value, expire=None):
    print(f'Adding key {key} with value {value}')
    await redis_client.set(key, value)
    if expire:
        await redis_client.expire(key, expire)


async def get_value_redis(key):
    return await redis_client.get(key)


async def delete_key_redis(key):
    await redis_client.delete(key)


async def get_keys_with_prefix(prefix):
    # Use SCAN to find keys starting with the given prefix
    cursor = 0
    matching_keys = []
    while True:
        cursor, keys = await redis_client.scan(cursor=cursor, match=f"{prefix}*")
        matching_keys.extend(keys)
        if cursor == 0:  # Scan completed
            break

    # Fetch values for the matching keys
    items = []
    for key in matching_keys:
        value = await redis_client.get(key)
        items.append(value)

    print(f"Keys matching prefix '{prefix}':")
    for key, value in zip(matching_keys, items):
        print(f"{key} -> {value}")

    return items

async def ping():
    """Check Redis connection by sending PING command"""
    return await redis_client.ping()

