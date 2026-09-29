import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def create_omnisurv_logo():
    # 800 x 360 canvas (transparent RGBA)
    width = 800
    height = 360
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Load the base favicon emblem
    favicon_path = "s:/Omnisurv-SIH2026/pixel-perfect-render-5182/public/favicon.png"
    if os.path.exists(favicon_path):
        icon = Image.open(favicon_path).convert("RGBA")
        # Resize cleanly to 140x140
        icon_size = 140
        icon = icon.resize((icon_size, icon_size), Image.Resampling.LANCZOS)
        
        # Position icon centered horizontally at top
        icon_x = (width - icon_size) // 2
        icon_y = 24
        img.paste(icon, (icon_x, icon_y), icon)
    
    # Fonts
    font_bold = "C:/Windows/Fonts/segoeuib.ttf"
    font_semi = "C:/Windows/Fonts/segoeui.ttf"
    if not os.path.exists(font_bold):
        font_bold = "C:/Windows/Fonts/arialbd.ttf"
        font_semi = "C:/Windows/Fonts/arial.ttf"

    title_font = ImageFont.truetype(font_bold, 54)
    sub_font = ImageFont.truetype(font_bold, 18)
    tag_font = ImageFont.truetype(font_semi, 12)

    # 1. Title: "OMNISURV"
    title_text = "OMNISURV"
    # Calculate text bounding box
    bbox_title = draw.textbbox((0, 0), title_text, font=title_font)
    title_w = bbox_title[2] - bbox_title[0]
    title_x = (width - title_w) // 2
    title_y = 175

    # Draw text with subtle shadow
    draw.text((title_x + 1, title_y + 1), title_text, font=title_font, fill=(15, 23, 42, 60))
    # Draw main text: dark navy/slate (#0f172a)
    draw.text((title_x, title_y), title_text, font=title_font, fill=(15, 23, 42, 255))
    
    # Highlight "SURV" with cyber blue (#2563eb)
    omni_bbox = draw.textbbox((0, 0), "OMNI", font=title_font)
    omni_w = omni_bbox[2] - omni_bbox[0]
    draw.text((title_x + omni_w, title_y), "SURV", font=title_font, fill=(37, 99, 235, 255))

    # 2. Subtitle: "FORENSIC ANALYSIS PLATFORM" with tracking
    sub_text = "FORENSIC ANALYSIS PLATFORM"
    bbox_sub = draw.textbbox((0, 0), sub_text, font=sub_font)
    sub_w = bbox_sub[2] - bbox_sub[0]
    sub_x = (width - sub_w) // 2
    sub_y = 248
    draw.text((sub_x, sub_y), sub_text, font=sub_font, fill=(71, 85, 105, 255))

    # 3. Badges / ISO standard line: "DVR / NVR EVIDENCE RECOVERY • ISO/IEC 27037"
    badge_text = "MULTI-VENDOR DVR/NVR EVIDENCE • ISO/IEC 27037"
    bbox_badge = draw.textbbox((0, 0), badge_text, font=tag_font)
    badge_w = bbox_badge[2] - bbox_badge[0]
    badge_x = (width - badge_w) // 2
    badge_y = 285

    # Decorative line accents
    line_y = badge_y + 8
    draw.line([(badge_x - 60, line_y), (badge_x - 15, line_y)], fill=(203, 213, 225, 255), width=2)
    draw.text((badge_x, badge_y), badge_text, font=tag_font, fill=(100, 116, 139, 255))
    draw.line([(badge_x + badge_w + 15, line_y), (badge_x + badge_w + 60, line_y)], fill=(203, 213, 225, 255), width=2)

    # Save outputs
    out_paths = [
        "s:/Omnisurv-SIH2026/pixel-perfect-render-5182/public/omnisurv-logo.png",
        "s:/Omnisurv-SIH2026/pixel-perfect-render-5182/src/assets/omnisurv-logo.png",
        "s:/Omnisurv-SIH2026/pixel-perfect-render-5182/.output/public/omnisurv-logo.png",
    ]
    for p in out_paths:
        os.makedirs(os.path.dirname(p), exist_ok=True)
        img.save(p, "PNG")
        print(f"Generated logo at: {p}")

if __name__ == "__main__":
    create_omnisurv_logo()
