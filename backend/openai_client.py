from openai import OpenAI
from fastapi import HTTPException

from utils.logger import log
from utils.secrets import get_hubspot_secrets

# Get OpenAI API key from secrets and create client
openai_config = get_hubspot_secrets()
client = OpenAI(api_key=openai_config.get('openai_api_key'))


async def summarize_contact_ai(contact_data: dict) -> str:
    """
    Generate a summary of contact information using OpenAI's GPT model
    """
    try:
        # Format contact data into a readable string
        contact_info = f"""
        Name: {contact_data.get('name', 'N/A')}
        Email: {contact_data.get('email', 'N/A')}
        Phone: {contact_data.get('phone', 'N/A')}
        Company: {contact_data.get('company', 'N/A')}
        Created: {contact_data.get('created_at', 'N/A')}
        Last Modified: {contact_data.get('updated_at', 'N/A')}
        Additional Info: {contact_data.get('additional_info', 'N/A')}
        """

        # Call OpenAI API
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system",
                 "content": "You are a helpful assistant that summarizes contact information concisely."},
                {"role": "user",
                 "content": f"Please provide a brief, professional summary of this contact: {contact_info}"}
            ],
            max_tokens=150,
            temperature=0.7,
        )

        summary = response.choices[0].message.content.strip()
        return summary

    except Exception as e:
        log.error(f"Failed to generate contact summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {str(e)}")
