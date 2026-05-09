from PIL import Image
import os

img = Image.open(r"Z:\321\DHL\Scholar's_Tea\public\hermes\memes.png")
w, h = img.size
print(f"memes.png size: {w}x{h}")

# 4 columns x 3 rows grid
# Remove ~10px border from each edge
border = 10

# Calculate cell dimensions
col_width = w // 4
row_height = h // 3

print(f"Approx cell size: {col_width}x{row_height}")

# Cell naming based on visual inspection
# Row 0 (top): gewu, thinking, sleepy, insight
# Row 1 (mid): studying, confused, tea_time, inspired  
# Row 2 (bot): debate, eureka-ish, eureka, tea_sipping

sticker_names = [
    # Row 0
    'gewu-zhixin', 'thinking', 'tired', 'insight',
    # Row 1
    'keep-going', 'confused', 'tea-welcome', 'inspired',
    # Row 2
    'debate', 'continue-study', 'eureka', 'tea-sip',
]

# Hermes mood names for mapping
hermes_mood_names = [
    'happy', 'thinking', 'sleepy', 'insight',
    'studying', 'confused', 'tea_time', 'inspired',
    'debate', 'studying', 'eureka', 'tea_sipping',
]

out_dir_stickers = r"Z:\321\DHL\Scholar's_Tea\public\stickers"
out_dir_hermes = r"Z:\321\DHL\Scholar's_Tea\public\hermes"
os.makedirs(out_dir_stickers, exist_ok=True)

for row in range(3):
    for col in range(4):
        idx = row * 4 + col
        left = col * col_width + border
        right = (col + 1) * col_width - border
        top = row * row_height + border
        bottom = (row + 1) * row_height - border

        cell = img.crop((left, top, right, bottom))
        print(f"Cell {idx}: {left},{top}-{right},{bottom} = {cell.size}")

        # Save as sticker
        sticker_name = sticker_names[idx]
        sticker_path = os.path.join(out_dir_stickers, f"{sticker_name}.png")
        cell.save(sticker_path)
        print(f"  -> sticker: {sticker_path}")

print("\nDone! Extracted 12 stickers.")
