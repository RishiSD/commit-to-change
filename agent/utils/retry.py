"""
Retry utilities for handling transient failures in tools.

Provides decorators for automatic retry with exponential backoff on
network-related errors like timeouts and connection failures.
"""

import time
import logging
from functools import wraps
from typing import Callable, Type, Tuple

# Import common network exceptions
try:
    from requests.exceptions import Timeout, ConnectionError, RequestException
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False
    # Define placeholder types if requests not installed
    Timeout = Exception
    ConnectionError = Exception
    RequestException = Exception

logger = logging.getLogger(__name__)

# Transient errors that should be retried
RETRIABLE_EXCEPTIONS: Tuple[Type[Exception], ...] = (
    Timeout,
    ConnectionError,
)


def with_retry(
    max_attempts: int = 3,
    backoff_factor: float = 1.0,
    retriable_exceptions: Tuple[Type[Exception], ...] = RETRIABLE_EXCEPTIONS
):
    """
    Decorator to retry function calls on transient errors.
    
    Implements exponential backoff: wait_time = backoff_factor * (2 ^ attempt)
    
    Args:
        max_attempts: Maximum number of retry attempts (default: 3)
        backoff_factor: Base multiplier for exponential backoff in seconds (default: 1.0)
        retriable_exceptions: Tuple of exception types to retry on (default: Timeout, ConnectionError)
        
    Returns:
        Decorated function with retry logic
        
    Example:
        ```python
        @with_retry(max_attempts=3, backoff_factor=2.0)
        def fetch_data(url):
            response = requests.get(url, timeout=10)
            return response.text
        
        # Will retry up to 3 times with delays: 2s, 4s, 8s
        result = fetch_data("https://example.com")
        ```
        
    Behavior:
        - Retries only on specified retriable exceptions
        - Non-retriable exceptions fail immediately
        - Logs warnings on retry attempts
        - Logs errors on final failure
        - Re-raises the last exception if all attempts fail
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            
            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                    
                except retriable_exceptions as e:
                    last_exception = e
                    
                    if attempt == max_attempts:
                        # Final attempt failed
                        logger.error(
                            f"{func.__name__} failed after {max_attempts} attempts: {e}"
                        )
                        raise
                    
                    # Calculate exponential backoff
                    wait_time = backoff_factor * (2 ** (attempt - 1))
                    
                    logger.warning(
                        f"{func.__name__} attempt {attempt}/{max_attempts} failed: {e}. "
                        f"Retrying in {wait_time:.1f}s..."
                    )
                    
                    time.sleep(wait_time)
                    
                except Exception as e:
                    # Non-retriable exception, fail immediately
                    logger.error(
                        f"{func.__name__} failed with non-retriable error: {e}"
                    )
                    raise
            
            # Should never reach here, but just in case
            if last_exception:
                raise last_exception
                
        return wrapper
    return decorator


def with_simple_retry(max_attempts: int = 2):
    """
    Simplified retry decorator with no backoff, for quick retries.
    
    Useful for operations that typically succeed on immediate retry
    (e.g., temporary network glitches).
    
    Args:
        max_attempts: Maximum number of attempts (default: 2)
        
    Returns:
        Decorated function with simple retry logic
        
    Example:
        ```python
        @with_simple_retry(max_attempts=2)
        def quick_check(url):
            return requests.head(url, timeout=5)
        ```
    """
    return with_retry(
        max_attempts=max_attempts,
        backoff_factor=0.5,  # Minimal delay
        retriable_exceptions=RETRIABLE_EXCEPTIONS
    )
