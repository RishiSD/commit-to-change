"""
Unified recipe extraction tool for Agent V5.

Combines extraction, validation, and formatting into a single operation
with automatic follow-up link detection and recursive extraction.
"""

import re
from typing import Optional
from langchain_core.tools import tool
from langchain_core.messages import SystemMessage
import requests
from bs4 import BeautifulSoup

from .models import UnifiedRecipeResult, ValidateAndFormatOutput
from utils.retry import with_retry


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


def extract_text_from_instagram(url: str) -> tuple[str, str]:
    """
    Extract text from Instagram post/reel using instaloader.
    
    Args:
        url: Instagram URL
        
    Returns:
        Tuple of (content, title)
    """
    try:
        import instaloader
    except ImportError:
        raise ImportError(
            "instaloader is not installed. Install it with: pip install instaloader"
        )
    
    # Get shortcode from URL
    shortcode = extract_instagram_shortcode(url)
    
    # Create instaloader instance
    loader = instaloader.Instaloader()
    
    # Disable download of media files
    loader.download_pictures = False
    loader.download_videos = False
    loader.download_video_thumbnails = False
    loader.download_geotags = False
    loader.download_comments = False
    loader.save_metadata = False
    
    # Get post
    post = instaloader.Post.from_shortcode(loader.context, shortcode)
    
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
    for element in soup(['script', 'style', 'noscript', 'header', 'footer', 'nav']):
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
        if is_instagram_url(url) and ('403' in error_msg or 'Forbidden' in error_msg or 'metadata failed' in error_msg):
            enhanced_error += " (Instagram may be rate limiting or blocking access. Content may be private, restricted, or require authentication)"
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
    - Formatted markdown (if valid)
    - Follow-up URL (if invalid and URLs present)
    
    Args:
        content: Extracted text content
        url: Source URL
        depth: Current extraction depth
        
    Returns:
        ValidateAndFormatOutput with validation + formatting results
    """
    try:
        from langchain.chat_models import init_chat_model
        import os
        
        # Initialize model (same logic as other tools)
        openrouter_key = os.getenv("OPEN_ROUTER_API_KEY")
        if openrouter_key:
            model = init_chat_model(
                model="openai/gpt-oss-120b",
                model_provider="openai",
                api_key=openrouter_key,
                base_url="https://api.groq.com/openai/v1"
            )
        else:
            model = init_chat_model("google_genai:gemini-2.5-flash-lite")
        
        structured_model = model.with_structured_output(ValidateAndFormatOutput)
        
        # Truncate content to avoid token limits
        truncated_content = content #[:CONTENT_TRUNCATE_LENGTH]
        
        prompt = f"""You are a recipe validation and formatting expert. Analyze the following content and perform TWO tasks:

**TASK 1: VALIDATE**
Determine if this content contains a COMPLETE, VALID recipe.

A valid recipe MUST have BOTH:
1. Ingredients list with quantities (e.g., "2 cups flour", "1 tsp salt")
2. Step-by-step cooking/preparation instructions

BE STRICT - reject:
- Restaurant reviews or menus
- Nutrition articles without recipes
- Equipment guides
- Ingredient lists without cooking steps
- Cooking steps without ingredient lists

**TASK 2A: FORMAT (if valid recipe)**
If valid, format into clean markdown:
- # [Recipe Name]
- ## Ingredients (bulleted list with -)
- ## Instructions (numbered steps)
- ## Additional Information (if timing/tips present)

**TASK 2B: EXTRACT FOLLOW-UP URL (if invalid recipe)**
If NO valid recipe found, search the content for URLs that might contain the recipe:
- Look for HTTP/HTTPS URLs in the text
- Select the URL MOST LIKELY to contain a recipe
- Prefer URLs with: /recipe/, /recipes/, cooking/food domains
- Avoid: home pages, about pages, social media profiles
- Return null if no good candidate exists
- Provide confidence score (0.0-1.0) for the follow-up URL

**CONTENT TO ANALYZE:**
{truncated_content}

**SOURCE URL:** {url}
**CURRENT DEPTH:** {depth}

**OUTPUT REQUIREMENTS:**
Return ValidateAndFormatOutput with:
- is_valid_recipe: true/false
- recipe_markdown: formatted markdown (ONLY if valid recipe, else null)
- recipe_name: extracted name or null
- has_ingredients: true/false
- has_instructions: true/false
- follow_up_url: best URL to follow (ONLY if invalid recipe, else null)
- follow_up_confidence: 0.0-1.0 (confidence in follow-up URL)
- reason: clear explanation of your decision
- confidence: overall confidence score 0.0-1.0"""
        
        result = structured_model.invoke([SystemMessage(content=prompt)])
        return result
        
    except Exception as e:
        # Fallback to failed validation
        return ValidateAndFormatOutput(
            is_valid_recipe=False,
            recipe_markdown=None,
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
    3. If valid recipe → return formatted result
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
            recipe_markdown=None,
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
    if validate_format_result.is_valid_recipe:
        # SUCCESS! Return formatted recipe
        return UnifiedRecipeResult(
            success=True,
            recipe_markdown=validate_format_result.recipe_markdown,
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
    
    return UnifiedRecipeResult(
        success=False,
        recipe_markdown=None,
        recipe_name=validate_format_result.recipe_name,
        extraction_url=url,
        is_valid_recipe=False,
        has_ingredients=validate_format_result.has_ingredients,
        has_instructions=validate_format_result.has_instructions,
        follow_up_url=validate_format_result.follow_up_url,
        extraction_depth=current_depth,
        error=error_msg,
        confidence=validate_format_result.confidence,
        reason=validate_format_result.reason
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
    3. Formats valid recipes into clean markdown
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
