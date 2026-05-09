from PIL import Image
import os
import shutil

base = r"Z:\321\DHL\Scholar's_Tea"
hermes_dir = os.path.join(base, "public", "hermes")
stickers_dir = os.path.join(base, "public", "stickers")
source_dir = os.path.join(hermes_dir, "_source")

# === Fix sticker-derived avatars: crop to square, center on panda face ===
# Mapping: (sticker_name, hermes_mood_name)
mood_mapping = [
    ("gewu-zhixin", "happy"),
    ("thinking", "thinking"),
    ("tired", "sleepy"),
    ("insight", "insight"),
    ("keep-going", "surprised"),
    ("confused", "confused"),
    ("tea-welcome", "tea_time"),
    ("inspired", "inspired"),
    ("debate", "debate"),
    ("continue-study", "studying"),
    ("eureka", "eureka"),
    ("tea-sip", "tea_sipping"),
]

for sticker_name, mood_name in mood_mapping:
    src = os.path.join(stickers_dir, f"{sticker_name}.png")
    if not os.path.exists(src):
        print(f"WARNING: {src} not found")
        continue

    img = Image.open(src)
    w, h = img.size

    # Crop to square from center (focus on panda face in upper portion)
    # Panda face is typically in the upper-middle area
    # Use a square size = min(w, h), but slightly favor the top for face
    square_size = min(w, h)
    left = (w - square_size) // 2
    # For face-focused crop, shift up slightly (face is in upper half)
    top = max(0, int((h - square_size) * 0.3))  # bias toward top
    right = left + square_size
    bottom = top + square_size

    # Ensure we don't go out of bounds
    if bottom > h:
        bottom = h
        top = h - square_size
    if right > w:
        right = w
        left = w - square_size

    square_img = img.crop((left, top, right, bottom))
    square_img = square_img.resize((400, 400), Image.LANCZOS)

    dst = os.path.join(hermes_dir, f"{mood_name}.png")
    square_img.save(dst, "PNG", optimize=True)
    print(f"Fixed {mood_name}.png: {square_img.size} from {sticker_name}.png crop({left},{top}-{right},{bottom})")

# === Recreate aliases ===
aliases = {
    "dancing": "happy",
    "waving": "happy",
    "curious": "thinking",
    "love": "tea_sipping",
    "angry": "debate",
    "shy": "tea_sipping",
    "dizzy": "sleepy",
    "bored": "sleepy",
}

for alias_mood, source_mood in aliases.items():
    src = os.path.join(hermes_dir, f"{source_mood}.png")
    dst = os.path.join(hermes_dir, f"{alias_mood}.png")
    if os.path.exists(src):
        shutil.copy2(src, dst)
        print(f"Created {alias_mood}.png (alias of {source_mood}.png)")

print("\n=== Fix complete ===")
for f in sorted(os.listdir(hermes_dir)):
    fp = os.path.join(hermes_dir, f)
    if os.path.isfile(fp):
        print(f"  {f}: {os.path.getsize(fp)//1024}KB")
