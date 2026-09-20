#!/usr/bin/env python3
"""Generate public browser and social assets from the preserved logo masters."""

from PIL import Image
from pathlib import Path
import colorsys


def resize_square(img: Image.Image, size: int) -> Image.Image:
    """Resize square image to target size with LANCZOS resampling."""
    return img.resize((size, size), Image.Resampling.LANCZOS)


def hsl_to_rgb(h: float, s: float, l: float) -> tuple[int, int, int]:
    """Convert HSL (CSS format: h=degrees, s=percent, l=percent) to RGB (0-255)."""
    r, g, b = colorsys.hls_to_rgb(h / 360, l / 100, s / 100)
    return int(r * 255), int(g * 255), int(b * 255)


def main():
    root = Path(__file__).parent.parent
    public = root / "public"
    public.mkdir(exist_ok=True)

    # Load single source image (transparent background)
    logo = Image.open(root / "logo.png").convert("RGBA")
    print(f"Source logo: {logo.size}")

    square = Image.open(root / "assets/brand/icon.png").convert("RGBA")
    rounded = Image.open(root / "assets/brand/icon-rounded.png").convert("RGBA")

    # === public/ — Only <img> referenced assets ===

    # Sidebar logo (24x24)
    sidebar = resize_square(logo, 24)
    sidebar.save(public / "logo-24.png")
    print(f"  public/logo-24.png: {sidebar.size}")

    # Login/loading page logo (80x80)
    login = resize_square(logo, 80)
    login.save(public / "logo-80.png")
    print(f"  public/logo-80.png: {login.size}")

    # === public/ — Static browser metadata assets ===

    # icon.png (32x32) — linked from index.html
    icon = resize_square(logo, 32)
    icon.save(public / "icon.png")
    print(f"  public/icon.png: {icon.size}")

    # apple-icon.png (180x180) — linked from index.html
    apple = resize_square(square, 180).convert("RGB")
    apple.save(public / "apple-icon.png")
    print(f"  public/apple-icon.png: {apple.size}")

    # favicon.ico (multi-size: 16+32) — broad browser compat
    logo.save(public / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32)])
    print(f"  public/favicon.ico: 16x16 + 32x32")

    # opengraph-image.png (1200x630) — linked from index.html
    # Dark background matching wooly dark theme: HSL 0 0% 9% (#171717)
    brand_color = hsl_to_rgb(0, 0, 9)
    og_width, og_height = 1200, 630

    # Create RGB canvas with dark background (social platforms don't support alpha)
    og = Image.new("RGB", (og_width, og_height), brand_color)

    # Center logo at ~40% canvas height
    logo_size = min(og_width, og_height) * 55 // 100  # ~55% of shorter dimension
    logo_resized = resize_square(rounded, logo_size)

    # Convert RGBA logo to paste with alpha mask
    x = (og_width - logo_size) // 2
    y = int(og_height * 0.40) - logo_size // 2
    og.paste(logo_resized, (x, y), logo_resized)  # 3rd arg = alpha mask

    og.save(public / "opengraph-image.png")
    print(f"  public/opengraph-image.png: {og.size}")

    print("\nDone! Foreground and presentation roles preserved.")


if __name__ == "__main__":
    main()
