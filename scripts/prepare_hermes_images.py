from PIL import Image
import os
import shutil

base = r"Z:\321\DHL\Scholar's_Tea"
hermes_dir = os.path.join(base, "public", "hermes")
stickers_dir = os.path.join(base, "public", "stickers")

# === 1. Process panda.png -> idle.png (square crop + resize) ===
panda = Image.open(os.path.join(hermes_dir, "panda.png"))
pw, ph = panda.size
print(f"panda.png: {pw}x{ph}")

# Crop to square from center, focusing on panda's face
# The panda face is in the upper-middle area
# Let's crop a square that captures the main panda figure
square_size = min(pw, ph)  # 1536
left = (pw - square_size) // 2  # 609
top = 0  # Start from top to include hat
right = left + square_size
bottom = top + square_size

idle_img = panda.crop((left, top, right, bottom))
idle_img = idle_img.resize((400, 400), Image.LANCZOS)
idle_path = os.path.join(hermes_dir, "idle.png")
idle_img.save(idle_path, "PNG", optimize=True)
print(f"Created idle.png: {idle_img.size} ({os.path.getsize(idle_path)//1024}KB)")

# === 2. Copy sticker cells to hermes/ as mood images ===
# Mapping: (sticker_name, hermes_mood_name)
mood_mapping = [
    ("gewu-zhixin", "happy"),
    ("thinking", "thinking"),
    ("tired", "sleepy"),
    ("insight", "insight"),
    ("keep-going", "surprised"),   # 罗盘/地球仪，有点惊喜感
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
    # Resize to 400x400 for avatar use (aspect ratio preserved via thumbnail)
    img.thumbnail((400, 400), Image.LANCZOS)
    # Create a 400x400 canvas and center the image
    canvas = Image.new("RGBA", (400, 400), (255, 255, 255, 0))
    # Paste centered
    ox = (400 - img.width) // 2
    oy = (400 - img.height) // 2
    canvas.paste(img, (ox, oy))
    
    dst = os.path.join(hermes_dir, f"{mood_name}.png")
    canvas.save(dst, "PNG", optimize=True)
    print(f"Created {mood_name}.png from {sticker_name}.png ({os.path.getsize(dst)//1024}KB)")

# === 3. Create aliases for moods that share images ===
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

# === 4. Clean up original large files ===
# Keep memes.png and panda.png as source, but they shouldn't be served directly
# Move them to a source directory
source_dir = os.path.join(base, "public", "hermes", "_source")
os.makedirs(source_dir, exist_ok=True)
for fname in ["memes.png", "panda.png"]:
    src = os.path.join(hermes_dir, fname)
    if os.path.exists(src):
        shutil.move(src, os.path.join(source_dir, fname))
        print(f"Moved {fname} to _source/")

print("\n=== Hermes image preparation complete ===")
print(f"Files in {hermes_dir}:")
for f in sorted(os.listdir(hermes_dir)):
    fp = os.path.join(hermes_dir, f)
    if os.path.isfile(fp):
        print(f"  {f}: {os.path.getsize(fp)//1024}KB")
