import random
import string

from slugify import slugify


def generate_slug(text: str) -> str:
    base = slugify(text, allow_unicode=True)
    suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=6))
    return f"{base}-{suffix}"
