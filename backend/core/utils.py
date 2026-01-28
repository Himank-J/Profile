def truncate_description(description: str, limit: int = 200) -> str:
    if not description:
        return ""
    if len(description) <= limit:
        return description
    # Truncate to limit and add ...Show more
    return description[:limit] + "...Show more"
