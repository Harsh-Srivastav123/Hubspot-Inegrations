import logging
import sys
from typing import Optional

# Configure the logger
logger = logging.getLogger('custom_logger')
logger.setLevel(logging.INFO)

# Create console handler with formatting
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(logging.INFO)

# Create formatter
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
console_handler.setFormatter(formatter)

# Add handler to logger
logger.addHandler(console_handler)


class Log:
    @staticmethod
    def info(message: str, extra: Optional[dict] = None):
        """Log info level message"""
        logger.info(message, extra=extra)

    @staticmethod
    def warn(message: str, extra: Optional[dict] = None):
        """Log warning level message"""
        logger.warning(message, extra=extra)

    @staticmethod
    def error(message: str, extra: Optional[dict] = None):
        """Log error level message"""
        logger.error(message, extra=extra)


log = Log()
