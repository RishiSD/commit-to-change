"""
Unified recipe extraction tool for Agent V5.

Combines extraction, validation, and formatting into a single operation
with automatic follow-up link detection and recursive extraction.
"""

import re
from typing import Optional
from langchain_core.tools import tool
from langchain_core.prompts import ChatPromptTemplate
import requests
from bs4 import BeautifulSoup

from .models import UnifiedRecipeResult, ValidateAndFormatOutput
from utils.retry import with_retry
from utils.model import get_model
from utils.prompts import VALIDATE_AND_FORMAT_PROMPT


# =============================================================================
# CONSTANTS
# =============================================================================

MAX_DEPTH_LIMIT = 1  # Maximum number of follow-up links to pursue
FOLLOW_UP_CONFIDENCE_THRESHOLD = 0.6  # Minimum confidence to follow a link
CONTENT_TRUNCATE_LENGTH = 4000  # Characters to send to LLM


# =============================================================================
# PLATFORM DETECTION (reuse from extraction.py)
# =============================================================================

def is_instagram_url(url: str) -> bool:
    """Check if URL is from Instagram."""
    return 'instagram.com' in url.lower()


def is_youtube_url(url: str) -> bool:
    """Check if URL is from YouTube."""
    url_lower = url.lower()
    return 'youtube.com' in url_lower or 'youtu.be' in url_lower


def is_tiktok_url(url: str) -> bool:
    """Check if URL is from TikTok."""
    return 'tiktok.com' in url.lower()


# =============================================================================
# EXTRACTION HELPERS (reuse/adapt from extraction.py)
# =============================================================================

def extract_instagram_shortcode(url: str) -> str:
    """
    Extract shortcode from Instagram URL.
    
    Examples:
        https://www.instagram.com/reel/DCR9-Y8Sdga -> DCR9-Y8Sdga
        https://www.instagram.com/p/ABC123/ -> ABC123
    """
    patterns = [
        r'instagram\.com/(?:reel|p|tv)/([A-Za-z0-9_-]+)',
        r'instagram\.com/([A-Za-z0-9_-]+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    raise ValueError(f"Could not extract shortcode from Instagram URL: {url}")


# Instagram session cache (singleton pattern)
_instagram_loader_cache = {"loader": None, "authenticated": False, "last_attempt": None}


def get_authenticated_instagram_loader():
    """
    Get an Instaloader instance, authenticated if credentials available.
    
    Returns:
        Tuple of (loader_instance, is_authenticated)
        
    Implementation:
    - Checks environment for INSTAGRAM_USERNAME and INSTAGRAM_PASSWORD
    - Caches successful login to avoid re-authenticating on every call
    - Falls back to anonymous loader if login fails or no credentials
    - Thread-safe via module-level caching
    """
    import instaloader
    import os
    import time
    
    # Check cache first (avoid re-login on every call)
    cache_ttl = 3600  # 1 hour cache
    if _instagram_loader_cache["loader"] is not None:
        if _instagram_loader_cache["last_attempt"] and \
           (time.time() - _instagram_loader_cache["last_attempt"]) < cache_ttl:
            return _instagram_loader_cache["loader"], _instagram_loader_cache["authenticated"]
    
    # Create new loader
    loader = instaloader.Instaloader()
    
    # Disable downloads (we only need metadata)
    loader.download_pictures = False
    loader.download_videos = False
    loader.download_video_thumbnails = False
    loader.download_geotags = False
    loader.download_comments = False
    loader.save_metadata = False
    
    # Attempt authentication
    username = os.getenv("INSTAGRAM_USERNAME")
    password = os.getenv("INSTAGRAM_PASSWORD")
    
    authenticated = False
    if username and password:
        try:
            print(f"Attempting Instagram login for user: {username}")
            loader.login(username, password)
            authenticated = True
            print("Instagram login successful")
        except instaloader.exceptions.BadCredentialsException:
            print(f"WARNING: Instagram login failed - invalid credentials for {username}")
        except instaloader.exceptions.ConnectionException as e:
            print(f"WARNING: Instagram login failed - connection error: {e}")
        except Exception as e:
            print(f"WARNING: Instagram login failed - {type(e).__name__}: {e}")
    else:
        print("INFO: No Instagram credentials found in environment, using anonymous access")
    
    # Cache result
    _instagram_loader_cache["loader"] = loader
    _instagram_loader_cache["authenticated"] = authenticated
    _instagram_loader_cache["last_attempt"] = time.time()
    
    return loader, authenticated


def extract_instagram_with_html(url: str) -> tuple[str, str]:
    """
    Extract Instagram content using HTML meta tags (PRIMARY METHOD).
    
    Extracts content from meta tags in fallback order:
    1. <meta name="description" content="...">
    2. <meta property="og:title" content="...">
    3. <meta property="og:description" content="...">
    
    Returns the first non-empty meta tag found.
    
    Args:
        url: Instagram URL
        
    Returns:
        Tuple of (content, title)
        
    Raises:
        ValueError: If no meta tag data is found
    """
    try:
        # Fetch HTML using existing utility
        html = fetch_html(url)
        soup = BeautifulSoup(html, 'lxml')
        
        # Try meta tags in fallback order
        content = None
        title = "Instagram Post"
        
        # 1. Try <meta name="description">
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc and meta_desc.get('content', '').strip():
            content = meta_desc['content'].strip()
            title = content[:100] + '...' if len(content) > 100 else content
            return content, title
        
        # 2. Try <meta property="og:title">
        og_title = soup.find('meta', property='og:title')
        if og_title and og_title.get('content', '').strip():
            content = og_title['content'].strip()
            title = content
            return content, title
        
        # 3. Try <meta property="og:description">
        og_desc = soup.find('meta', property='og:description')
        if og_desc and og_desc.get('content', '').strip():
            content = og_desc['content'].strip()
            title = content[:100] + '...' if len(content) > 100 else content
            return content, title
        
        # No meta tags found
        raise ValueError("No content found in HTML meta tags")
        
    except requests.exceptions.RequestException as e:
        raise Exception(f"Failed to fetch Instagram HTML: {str(e)}")
    except Exception as e:
        raise Exception(f"HTML extraction failed: {str(e)}")


def extract_instagram_with_instaloader(url: str) -> tuple[str, str]:
    """
    Extract Instagram content using instaloader (FALLBACK METHOD).
    
    This method requires authentication and may fail with 401 errors
    from cloud/datacenter IPs. Used as fallback when yt-dlp fails.
    
    Args:
        url: Instagram URL
        
    Returns:
        Tuple of (content, title)
        
    Notes:
        - Uses authenticated access if INSTAGRAM_USERNAME/PASSWORD are set
        - Falls back to anonymous access if authentication fails
        - Anonymous access may fail with 401 in cloud environments
    """
    try:
        import instaloader
    except ImportError:
        raise ImportError(
            "instaloader is not installed. Install it with: pip install instaloader"
        )
    
    # Get shortcode from URL
    shortcode = extract_instagram_shortcode(url)
    
    # Get authenticated or anonymous loader
    loader, authenticated = get_authenticated_instagram_loader()
    
    # Get post
    try:
        post = instaloader.Post.from_shortcode(loader.context, shortcode)
    except instaloader.exceptions.LoginRequiredException:
        if authenticated:
            # Should not happen if we logged in successfully
            raise ValueError("Instagram login required but authentication failed")
        else:
            raise ValueError(
                "Instagram requires authentication to access this content. "
                "Please set INSTAGRAM_USERNAME and INSTAGRAM_PASSWORD environment variables."
            )
    except instaloader.exceptions.QueryReturnedNotFoundException:
        raise ValueError(f"Instagram post not found: {url}")
    
    # Extract text content
    text_parts = []
    title = "Instagram Post"
    
    # Add title if available
    if post.title:
        title = post.title
        text_parts.append(f"Title: {post.title}")
    
    # Add caption
    if post.caption:
        text_parts.append(f"Caption: {post.caption}")
    
    # Add other metadata as text
    if post.owner_username:
        text_parts.append(f"Posted by: @{post.owner_username}")
    
    if post.date:
        text_parts.append(f"Date: {post.date}")
    
    if post.likes:
        text_parts.append(f"Likes: {post.likes}")
    
    # Combine all text
    content = '\n\n'.join(text_parts) if text_parts else "No text content found"
    return content, title


def extract_text_from_instagram(url: str) -> tuple[str, str]:
    """
    Extract text from Instagram post/reel using multiple extraction methods.
    
    Strategy (tries in order):
    1. HTML meta tags (PRIMARY) - Simple, fast, no external API dependencies
    2. instaloader (FALLBACK) - Requires authentication, may fail on cloud IPs
    
    Args:
        url: Instagram URL
        
    Returns:
        Tuple of (content, title)
        
    Raises:
        ValueError: If all extraction methods fail, with detailed error info
    """
    errors = []
    
    # PRIMARY: Try HTML meta tags first (simple and fast)
    try:
        print(f"Attempting Instagram extraction with HTML meta tags (primary method)...")
        return extract_instagram_with_html(url)
    except Exception as e:
        error_msg = str(e)
        errors.append(f"HTML meta tags: {error_msg}")
        print(f"HTML extraction failed: {error_msg}")
    
    # FALLBACK: Try instaloader with authentication
    try:
        print(f"Attempting Instagram extraction with instaloader (fallback method)...")
        return extract_instagram_with_instaloader(url)
    except Exception as e:
        error_msg = str(e)
        errors.append(f"instaloader: {error_msg}")
        print(f"instaloader extraction failed: {error_msg}")
    
    # Both methods failed - provide comprehensive error
    error_details = "\n".join(f"  • {err}" for err in errors)
    raise ValueError(
        f"Failed to extract Instagram content using all available methods:\n{error_details}\n\n"
        f"Possible solutions:\n"
        f"  1. Verify the post is public and the URL is correct\n"
        f"  2. Set INSTAGRAM_USERNAME and INSTAGRAM_PASSWORD environment variables for authenticated access\n"
        f"  3. If on cloud/datacenter IP, Instagram may be blocking requests (try residential proxy)\n"
        f"  4. Check if the Instagram post has meta tags in its HTML"
    )


def extract_text_from_youtube(url: str) -> tuple[str, str]:
    """
    Extract text from YouTube video using yt-dlp.
    Extracts title, description, and captions/subtitles.
    
    Args:
        url: YouTube URL (regular video or Shorts)
        
    Returns:
        Tuple of (content, title)
    """
    try:
        import yt_dlp
    except ImportError:
        raise ImportError(
            "yt-dlp is not installed. Install it with: pip install yt-dlp"
        )
    
    # Configure yt-dlp options
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'skip_download': True,
        'writesubtitles': True,
        'writeautomaticsub': True,
        'subtitleslangs': ['en', 'en-US', 'en-GB'],
        'subtitlesformat': 'vtt',
    }
    
    text_parts = []
    title = "YouTube Video"
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Extract video info
            info = ydl.extract_info(url, download=False)
            
            # Extract title
            if info.get('title'):
                title = info['title']
                text_parts.append(f"Title: {info['title']}")
            
            # Extract description
            if info.get('description'):
                text_parts.append(f"\nDescription: {info['description']}")
            
            # Extract uploader
            if info.get('uploader'):
                text_parts.append(f"\nChannel: {info['uploader']}")
            
            # Extract captions/subtitles
            subtitles = info.get('subtitles') or {}
            automatic_captions = info.get('automatic_captions') or {}
            
            # Try manual subtitles first, then automatic
            all_subs = {**automatic_captions, **subtitles}
            
            caption_text = None
            for lang in ['en', 'en-US', 'en-GB']:
                if lang in all_subs:
                    # Get the subtitle data
                    sub_data = all_subs[lang]
                    if sub_data:
                        # yt-dlp provides subtitle data, we just note it's available
                        caption_text = "(Captions available but not extracted - yt-dlp would need to download them)"
                        break
            
            if caption_text:
                text_parts.append(f"\nCaptions: {caption_text}")
            
            # Add view count if available
            if info.get('view_count'):
                text_parts.append(f"\nViews: {info['view_count']:,}")
            
            # Add upload date if available
            if info.get('upload_date'):
                date_str = info['upload_date']
                # Format: YYYYMMDD -> YYYY-MM-DD
                formatted_date = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:]}"
                text_parts.append(f"\nUploaded: {formatted_date}")
    
    except Exception as e:
        raise Exception(f"Failed to extract YouTube video info: {str(e)}")
    
    content = '\n'.join(text_parts) if text_parts else "No text content found"
    return content, title


def extract_text_from_tiktok(url: str) -> tuple[str, str]:
    """
    Extract text from TikTok video using yt-dlp.
    Extracts title, description, and metadata.
    
    Args:
        url: TikTok URL
        
    Returns:
        Tuple of (content, title)
    """
    try:
        import yt_dlp
    except ImportError:
        raise ImportError(
            "yt-dlp is not installed. Install it with: pip install yt-dlp"
        )
    
    # Configure yt-dlp options for TikTok
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'skip_download': True,
    }
    
    text_parts = []
    title = "TikTok Video"
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Extract video info
            info = ydl.extract_info(url, download=False)
            
            # Extract title/description (TikTok often combines these)
            if info.get('title'):
                title = info['title']
                text_parts.append(f"Title: {info['title']}")
            
            # Extract description if separate
            if info.get('description') and info['description'] != info.get('title'):
                text_parts.append(f"\nDescription: {info['description']}")
            
            # Extract uploader/creator
            if info.get('uploader') or info.get('creator'):
                uploader = info.get('uploader') or info.get('creator')
                text_parts.append(f"\nCreator: @{uploader}")
            
            # Add view count if available
            if info.get('view_count'):
                text_parts.append(f"\nViews: {info['view_count']:,}")
            
            # Add like count if available
            if info.get('like_count'):
                text_parts.append(f"\nLikes: {info['like_count']:,}")
            
            # Add upload date if available
            if info.get('upload_date'):
                date_str = info['upload_date']
                # Format: YYYYMMDD -> YYYY-MM-DD
                formatted_date = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:]}"
                text_parts.append(f"\nUploaded: {formatted_date}")
            
            # Add duration if available
            if info.get('duration'):
                text_parts.append(f"\nDuration: {info['duration']} seconds")
    
    except Exception as e:
        raise Exception(f"Failed to extract TikTok video info: {str(e)}")
    
    content = '\n'.join(text_parts) if text_parts else "No text content found"
    return content, title


@with_retry(max_attempts=3, backoff_factor=1.0)
def fetch_html(url: str, timeout: int = 10) -> str:
    """
    Fetch HTML content from a URL with automatic retry on transient errors.
    
    Args:
        url: The URL to fetch
        timeout: Request timeout in seconds
        
    Returns:
        HTML content as string
        
    Raises:
        requests.exceptions.RequestException: For network-related errors
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    }
    
    if not url.startswith(('https://')):
        raise ValueError("URL must start with 'https://'")
    response = requests.get(url, headers=headers, timeout=timeout, allow_redirects=True)
    response.raise_for_status()
    
    return response.text


def extract_text_from_html(html: str) -> str:
    """
    Extract all visible text from HTML content.
    
    Args:
        html: Raw HTML content
        
    Returns:
        Extracted text content with whitespace normalized
    """
    soup = BeautifulSoup(html, 'lxml')
    
    # Remove script, style, and other non-visible elements
    for element in soup(['script', 'style', 'noscript']):
        element.decompose()
    # Get all text
    text = soup.get_text(separator=' ', strip=True)
    
    # Normalize whitespace
    text = ' '.join(text.split())
    
    return text


def extract_html_title(html: str) -> str:
    """
    Extract <title> tag from HTML.
    
    Args:
        html: Raw HTML content
        
    Returns:
        Title text or "Web Page" if not found
    """
    try:
        soup = BeautifulSoup(html, 'lxml')
        title_tag = soup.find('title')
        return title_tag.get_text().strip() if title_tag else "Web Page"
    except Exception:
        return "Web Page"


# =============================================================================
# INTERNAL EXTRACTION LOGIC
# =============================================================================

class SimpleExtractionResult:
    """Internal lightweight extraction result."""
    def __init__(self, content: str, title: str, success: bool, error: Optional[str] = None):
        self.content = content
        self.title = title
        self.success = success
        self.error = error


def _extract_content(url: str) -> SimpleExtractionResult:
    """
    Extract content from URL using platform-specific extractors.
    Internal function - reuses existing extraction logic.
    
    Returns:
        SimpleExtractionResult with content or error
    """
    try:
        # Route to platform-specific extractors
        if is_instagram_url(url):
            content, title = extract_text_from_instagram(url)
        elif is_youtube_url(url):
            content, title = extract_text_from_youtube(url)
        elif is_tiktok_url(url):
            content, title = extract_text_from_tiktok(url)
        else:
            # Generic HTML extraction
            html = fetch_html(url)
            content = extract_text_from_html(html)
            title = extract_html_title(html)
        
        return SimpleExtractionResult(
            content=content,
            title=title,
            success=True
        )
        
    except ImportError as e:
        return SimpleExtractionResult(
            content="",
            title="",
            success=False,
            error=f"Missing dependency: {str(e)}"
        )
    except ValueError as e:
        return SimpleExtractionResult(
            content="",
            title="",
            success=False,
            error=f"Invalid URL format: {str(e)}"
        )
    except requests.exceptions.Timeout:
        return SimpleExtractionResult(
            content="",
            title="",
            success=False,
            error=f"Request timed out while fetching {url}"
        )
    except requests.exceptions.HTTPError as e:
        return SimpleExtractionResult(
            content="",
            title="",
            success=False,
            error=f"HTTP {e.response.status_code} error while fetching {url}"
        )
    except requests.exceptions.RequestException as e:
        return SimpleExtractionResult(
            content="",
            title="",
            success=False,
            error=f"Network error: {str(e)}"
        )
    except Exception as e:
        error_msg = str(e)
        enhanced_error = error_msg
        
        # Add helpful context for common platform-specific errors
        if is_instagram_url(url) and ('403' in error_msg or 'Forbidden' in error_msg or 'metadata failed' in error_msg or '401' in error_msg):
            enhanced_error += (
                "\n\nInstagram extraction failed with authentication error. This tool tried:\n"
                "  1. yt-dlp extraction (primary method) - failed\n"
                "  2. instaloader with authentication (fallback) - failed\n\n"
                "Solutions:\n"
                "  • Verify the post is public and the URL is correct\n"
                "  • Set INSTAGRAM_USERNAME and INSTAGRAM_PASSWORD environment variables\n"
                "  • If on cloud/datacenter IP, consider using a residential proxy\n"
                "  • Update yt-dlp: pip install -U yt-dlp"
            )
        elif is_tiktok_url(url) and ('blocked' in error_msg.lower() or 'ip address' in error_msg.lower()):
            enhanced_error += " (TikTok is blocking this request. Content may be geo-restricted or blocked from your IP)"
        
        return SimpleExtractionResult(
            content="",
            title="",
            success=False,
            error=f"Failed to extract content: {enhanced_error}"
        )


# =============================================================================
# VALIDATION + FORMATTING (COMBINED LLM CALL)
# =============================================================================

def _validate_and_format_combined(
    content: str,
    url: str,
    depth: int
) -> ValidateAndFormatOutput:
    """
    Validate and format recipe content in a single LLM call.
    
    Uses structured output to get:
    - Validation result (is_valid_recipe, has_ingredients, has_instructions)
    - Structured JSON recipe data (if valid)
    - Follow-up URL (if invalid and URLs present)
    
    Args:
        content: Extracted text content
        url: Source URL
        depth: Current extraction depth
        
    Returns:
        ValidateAndFormatOutput with validation + JSON formatting results
    """
    try:
        model = get_model()
        
        structured_model = model.with_structured_output(ValidateAndFormatOutput)
        
        # Truncate content to avoid token limits
        truncated_content = content #[:CONTENT_TRUNCATE_LENGTH]
        
        prompt_template = ChatPromptTemplate.from_messages([
            (
                "system",
                VALIDATE_AND_FORMAT_PROMPT,
            )
        ])

        prompt_messages = prompt_template.format_messages(
            content=truncated_content,
            url=url,
            depth=depth,
        )

        result = structured_model.invoke(prompt_messages)
        # Ensure we return a ValidateAndFormatOutput instance
        if isinstance(result, dict):
            return ValidateAndFormatOutput(**result)
        return result
        
    except Exception as e:
        # Fallback to failed validation
        return ValidateAndFormatOutput(
            is_valid_recipe=False,
            recipe_data=None,
            recipe_name=None,
            has_ingredients=False,
            has_instructions=False,
            follow_up_url=None,
            follow_up_confidence=0.0,
            reason=f"Validation/formatting failed: {str(e)}",
            confidence=0.0
        )


# =============================================================================
# RECURSIVE EXTRACTION LOGIC
# =============================================================================

def _extract_recursive(
    url: str,
    current_depth: int,
    max_depth: int
) -> dict:
    """
    Internal recursive function to extract and process recipe.
    
    Flow:
    1. Extract content from URL
    2. Validate + format in single LLM call
    3. If valid recipe → return formatted JSON result
    4. If invalid but has follow-up URL with confidence >= threshold:
       → Recursively call with follow-up URL (if depth allows)
    5. Otherwise → return failure with details
    
    Args:
        url: URL to extract from
        current_depth: Current recursion depth (0 = initial)
        max_depth: Maximum allowed depth
        
    Returns:
        dict representation of UnifiedRecipeResult
    """
    # STEP 1: Extract content
    extraction_result = _extract_content(url)
    
    if not extraction_result.success:
        return UnifiedRecipeResult(
            success=False,
            recipe_json=None,
            recipe_name=None,
            extraction_url=url,
            is_valid_recipe=False,
            has_ingredients=False,
            has_instructions=False,
            follow_up_url=None,
            extraction_depth=current_depth,
            error=extraction_result.error,
            confidence=0.0,
            reason="Content extraction failed"
        ).model_dump()
    
    # STEP 2: Validate + format in single LLM call
    validate_format_result = _validate_and_format_combined(
        content=extraction_result.content,
        url=url,
        depth=current_depth
    )
    
    # STEP 3: Check if we have a valid recipe
    if validate_format_result.is_valid_recipe and validate_format_result.recipe_data:
        # SUCCESS! Convert recipe_data to RecipeJSON and add metadata
        from .models import RecipeJSON
        
        # Convert RecipeDataForLLM model to dict
        recipe_data_dict = validate_format_result.recipe_data.model_dump()
        # Add source URL to the recipe data
        recipe_data_dict['source_url'] = url
        
        # Create RecipeJSON instance (this will generate id and created_at)
        recipe_json = RecipeJSON(**recipe_data_dict)
        
        return UnifiedRecipeResult(
            success=True,
            recipe_json=recipe_json.model_dump(),
            recipe_name=validate_format_result.recipe_name,
            extraction_url=url,
            is_valid_recipe=True,
            has_ingredients=validate_format_result.has_ingredients,
            has_instructions=validate_format_result.has_instructions,
            follow_up_url=None,
            extraction_depth=current_depth,
            error=None,
            confidence=validate_format_result.confidence,
            reason=validate_format_result.reason
        ).model_dump()
    
    # STEP 4: Recipe not found - check for follow-up URL
    has_follow_up = (
        validate_format_result.follow_up_url is not None and
        validate_format_result.follow_up_confidence >= FOLLOW_UP_CONFIDENCE_THRESHOLD
    )
    
    if has_follow_up and current_depth < max_depth:
        # Recursively extract from follow-up URL
        return _extract_recursive(
            url=validate_format_result.follow_up_url,
            current_depth=current_depth + 1,
            max_depth=max_depth
        )
    
    # STEP 5: No valid recipe and no viable follow-up options
    error_msg = "No valid recipe found"
    if current_depth >= max_depth and validate_format_result.follow_up_url:
        error_msg += f" and depth limit reached (max: {max_depth})"
    elif validate_format_result.follow_up_url and validate_format_result.follow_up_confidence < FOLLOW_UP_CONFIDENCE_THRESHOLD:
        error_msg += f" and follow-up URL confidence too low ({validate_format_result.follow_up_confidence:.2f} < {FOLLOW_UP_CONFIDENCE_THRESHOLD})"
    
    # Store extracted content if we have partial data (ingredients or instructions found)
    extracted_content = None
    partial_recipe_data = None
    if validate_format_result.has_ingredients or validate_format_result.has_instructions:
        extracted_content = extraction_result.content
        # Store partial structured data if available
        if validate_format_result.partial_recipe_data:
            partial_recipe_data = validate_format_result.partial_recipe_data.model_dump()
    
    return UnifiedRecipeResult(
        success=False,
        recipe_json=None,
        recipe_name=validate_format_result.recipe_name,
        extraction_url=url,
        is_valid_recipe=False,
        has_ingredients=validate_format_result.has_ingredients,
        has_instructions=validate_format_result.has_instructions,
        follow_up_url=validate_format_result.follow_up_url,
        extraction_depth=current_depth,
        error=error_msg,
        confidence=validate_format_result.confidence,
        reason=validate_format_result.reason,
        extracted_content=extracted_content,
        partial_recipe_data=partial_recipe_data
    ).model_dump()


# =============================================================================
# PUBLIC TOOL INTERFACE
# =============================================================================

@tool
def extract_and_process_recipe(url: str) -> dict:
    """
    Extract, validate, and format recipe from URL in a unified operation.
    
    This is the V5 unified tool that combines extraction, validation, and
    formatting into a single operation with automatic follow-up link handling.
    
    **What this tool does:**
    1. Extracts content from the provided URL (supports websites, Instagram, YouTube, TikTok)
    2. Validates if content contains a complete recipe (ingredients + instructions)
    3. Formats valid recipes into structured JSON
    4. Detects follow-up URLs if no recipe found
    5. Automatically follows promising links (up to 1 additional URL)
    
    **Advantages over separate tools:**
    - Single tool call instead of 3-4 separate calls
    - Faster response time (combined LLM operations)
    - Automatic follow-up handling (no manual depth tracking needed)
    - Cleaner agent workflow
    
    **Use this tool when:**
    - User provides a URL to extract a recipe from
    - You need to get a formatted recipe from any web source
    
    **Follow-up link behavior:**
    - If no recipe is found but a promising URL is detected (confidence >= 0.6)
    - Automatically extracts from that URL (max depth = 1)
    - Prevents infinite loops with depth limiting
    
    Args:
        url: The URL to extract recipe from (HTTP/HTTPS)
        
    Returns:
        UnifiedRecipeResult with:
        - success (bool): True if recipe was extracted and formatted
        - recipe_markdown (str | None): Formatted recipe in markdown
        - recipe_name (str | None): Extracted recipe name
        - extraction_url (str): Final URL extracted from
        - is_valid_recipe (bool): Validation result
        - has_ingredients (bool): Whether ingredients found
        - has_instructions (bool): Whether instructions found
        - follow_up_url (str | None): Potential URL to follow (if depth exceeded)
        - extraction_depth (int): Number of URLs followed (0 or 1)
        - error (str | None): Error message if failed
        - confidence (float): Confidence score 0.0-1.0
        - reason (str): Explanation of outcome
        
    **Examples:**
    
    Success case:
    ```python
    result = extract_and_process_recipe("https://example.com/recipe")
    # result['success'] = True
    # result['recipe_markdown'] = "# Chocolate Chip Cookies\\n\\n## Ingredients..."
    ```
    
    Follow-up case:
    ```python
    result = extract_and_process_recipe("https://instagram.com/post/...")
    # Initial URL has no recipe but contains link to recipe site
    # Tool automatically follows link and extracts recipe
    # result['extraction_depth'] = 1
    ```
    
    Failure case:
    ```python
    result = extract_and_process_recipe("https://example.com/no-recipe")
    # result['success'] = False
    # result['error'] = "No valid recipe found"
    # result['follow_up_url'] = "https://..." (if available)
    ```
    """
    return _extract_recursive(
        url=url,
        current_depth=0,
        max_depth=MAX_DEPTH_LIMIT
    )
