from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
OUT = PUBLIC / "social"
W, H = 1200, 630

INK = (29, 35, 56)
MUTED = (87, 94, 116)
VIOLET = (92, 75, 231)
VIOLET_SOFT = (235, 232, 255, 255)
MINT_SOFT = (224, 246, 238, 255)
CHAMPAGNE = (239, 222, 184, 255)
PEARL = (248, 249, 252, 255)
WHITE = (255, 255, 255, 255)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Helvetica.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for candidate in candidates:
        if candidate and Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


def text_width(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.ImageFont) -> int:
    left, _top, right, _bottom = draw.textbbox((0, 0), text, font=fnt)
    return right - left


def wrap(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.ImageFont, max_width: int) -> list[str]:
    lines: list[str] = []
    current = ""
    for word in text.split():
        trial = f"{current} {word}".strip()
        if text_width(draw, trial, fnt) <= max_width:
            current = trial
            continue
        if current:
            lines.append(current)
        current = word
    if current:
        lines.append(current)
    return lines


def draw_wrapped(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    text: str,
    fnt: ImageFont.ImageFont,
    fill: tuple[int, int, int],
    max_width: int,
    gap: int,
) -> int:
    x, y = xy
    for line in wrap(draw, text, fnt, max_width):
        draw.text((x, y), line, font=fnt, fill=fill)
        box = draw.textbbox((x, y), line, font=fnt)
        y += box[3] - box[1] + gap
    return y


def shadowed_card(base: Image.Image, rect: tuple[int, int, int, int], radius: int = 34) -> None:
    x1, y1, x2, y2 = rect
    shadow = Image.new("RGBA", base.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((x1 + 10, y1 + 18, x2 + 10, y2 + 18), radius=radius, fill=(46, 54, 96, 35))
    base.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(18)))
    ImageDraw.Draw(base).rounded_rectangle(rect, radius=radius, fill=WHITE, outline=(229, 222, 203), width=2)


def paste_fit(base: Image.Image, src: Image.Image, box: tuple[int, int, int, int], radius: int = 28) -> None:
    x1, y1, x2, y2 = box
    target_w, target_h = x2 - x1, y2 - y1
    image = src.convert("RGBA")
    image.thumbnail((target_w, target_h), Image.Resampling.LANCZOS)
    layer = Image.new("RGBA", (target_w, target_h), (255, 255, 255, 0))
    layer.paste(image, ((target_w - image.width) // 2, (target_h - image.height) // 2), image)
    mask = Image.new("L", (target_w, target_h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, target_w, target_h), radius=radius, fill=255)
    base.paste(layer, (x1, y1), mask)


def ui_crop(name: str) -> Image.Image:
    img = Image.open(PUBLIC / "for-business" / name).convert("RGBA")
    w, h = img.size
    return img.crop((118, 0, w - 360, h - 12))


def draw_logo(base: Image.Image, x: int, y: int) -> None:
    logo = Image.open(PUBLIC / "brand" / "timviz-logo-web.png").convert("RGBA")
    logo.thumbnail((250, 100), Image.Resampling.LANCZOS)
    base.alpha_composite(logo, (x, y))


def make_card(output: str, headline: str, body: str, button: str, screenshot: str) -> None:
    base = Image.new("RGBA", (W, H), PEARL)
    draw = ImageDraw.Draw(base)

    draw.rectangle((0, 0, W, 126), fill=(239, 241, 250, 255))
    draw.ellipse((835, -170, 1320, 315), fill=MINT_SOFT)
    draw.ellipse((945, 78, 1185, 318), fill=CHAMPAGNE)
    draw.ellipse((-150, 410, 260, 820), fill=VIOLET_SOFT)

    draw_logo(base, 62, 46)
    draw_wrapped(draw, (64, 170), headline, font(54, True), INK, 520, 8)
    draw_wrapped(draw, (66, 328), body, font(26), MUTED, 520, 8)

    button_font = font(27, True)
    button_box = draw.textbbox((0, 0), button, font=button_font)
    button_w = button_box[2] - button_box[0] + 48
    draw.rounded_rectangle((66, 488, 66 + button_w, 552), radius=25, fill=VIOLET)
    draw.text((90, 506), button, font=button_font, fill=WHITE)
    draw.text((66, 574), "timviz.com", font=font(23), fill=MUTED)

    shadowed_card(base, (642, 135, 1138, 520), radius=34)
    paste_fit(base, ui_crop(screenshot), (674, 168, 1106, 486), radius=22)
    draw.rounded_rectangle((662, 150, 1122, 504), radius=28, outline=(228, 220, 199), width=3)

    base.convert("RGB").save(OUT / output, quality=94)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    make_card(
        "timviz-business-og.png",
        "Онлайн-запись без переписок",
        "Клиенты выбирают услугу и свободное время сами. Timviz собирает заявки, календарь и уведомления в одном месте.",
        "Создать профиль",
        "ru-day.png",
    )
    make_card(
        "timviz-signup-og.png",
        "Создайте кабинет Timviz",
        "Бесплатный старт для мастера или салона: услуги, график, календарь и ссылка для клиентов.",
        "Начать бесплатно",
        "ru-week.png",
    )


if __name__ == "__main__":
    main()
