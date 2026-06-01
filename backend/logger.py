#logger.py

import logging
import logging.handlers
import os

os.makedirs('logs', exist_ok=True)

def get_logger(name, log_file, level=logging.INFO):
    logger = logging.getLogger(name)
    logger.setLevel(level)

    # Format: timestamp | level | message
    formatter = logging.Formatter(
        '%(asctime)s | %(levelname)s | %(message)s'
    )


    # Rotating file - create new file after 5MB, keeps last 5 files
    handler = logging.handlers.RotatingFileHandler(
        f'logs/{log_file}',
        maxBytes=5*1024*1024,   #5MB
        backupCount = 5
    )

    handler.setFormatter(formatter)
    logger.addHandler(handler)
    return logger


auth_logger = get_logger('auth', 'auth.log')
api_logger = get_logger('api', 'api.log')
error_logger = get_logger('error', 'error.log')


