# Scholar's Tea — User Guide

> Quick reference for the AI floating assistant (Hermes) and the AI Workshop.

---

## 1. Hermes Floating Assistant

Hermes is the persistent AI companion that lives in the bottom-right corner of every page.

### Open / Close

| Action | Result |
|--------|--------|
| Click the avatar | Open chat panel |
| Click outside the panel or the minimize button | Close panel |

### Move the Avatar

Drag the avatar to any position on the page. Position is saved automatically.

### Action Menu

Double-click or right-click the avatar to open a radial menu:

- **Encourage / Rest / Dance / Greet / Favorite / Study / Insight / Confused / Tea Party / Inspiration / Debate / Epiphany / Taste Tea / Random**

> Tip: Click the avatar 3 times in a row for a "happy → wave → dance" combo.

### Chat

- **Send message:** Type and press `Enter` (`Shift + Enter` for newline)
- **Upload image:** Click the `+` icon, press `Ctrl + V`, or drag-and-drop an image
- **Clear conversation:** Click the trash icon in the top-right

### Personality Modes

Open the dropdown below the avatar in the chat panel to switch personality:

| Mode | Style |
|------|-------|
| Cute | Friendly and casual |
| Technical | Direct and precise |
| Mentor | Patient and explanatory |
| Analytical | Logic-driven |
| Creative | Imaginative |
| Professor | Academic and cited |
| General | Balanced default |

> Switching personality resets the conversation.

### Admin Mode

Admins see an extra toggle at the top of the chat panel: **Community Manager** mode for community analytics.

### Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Shift + Enter` | Newline |
| `Ctrl + V` | Paste image |

---

## 2. AI Workshop

Access via the top nav **AI Workshop** or directly by URL:

| Mode | URL | Purpose |
|------|-----|---------|
| General | `/workshop?mode=general` | Everyday academic Q&A |
| Paper Assistant | `/workshop?mode=paper` | Paper analysis & abstract writing |
| Grant | `/workshop?mode=grant` | Grant proposal writing |
| Survey | `/workshop?mode=survey` | Literature review structure |
| Research | `/workshop?mode=research` | Feasibility assessment |
| Community | `/workshop?mode=community_manager` | Community analytics |
| Peer Review | `/workshop?mode=peer_review` | Paper peer review |
| Paper Generation | `/workshop?mode=paper_generation` | Full paper generation |

Switch modes via the top selector. Changing modes starts a new conversation automatically.

### Common Actions

**Send a message**
- Press `Enter` to send, `Shift + Enter` to add a new line
- Paste text or images directly into the input box

**Upload a PDF**
- Drag and drop a PDF into the chat area, or click the upload button
- Max size: 10 MB, max extracted text: ~30,000 characters
- In **Peer Review** mode, the PDF is processed in the background; other modes inject the text into your message

**Start a new conversation**
- Click **New Conversation** on the left sidebar

**Copy code**
- Hover over any code block → click the **Copy** button in the top-right corner

**Retry on error**
- If a response fails, a **Retry** button appears below the error message

### Peer Review Mode

1. Select a review focus:
   - **Full Review** (default) — area, scores, pros, issues, suggestions
   - **Methods** — methodology and experimental design
   - **Writing** — logic, language, figures
   - **Suggestions Only** — P0/P1/P2 prioritized recommendations
2. Upload a PDF or paste the paper text
3. Click **Start Review**
4. Wait 60–120 seconds for the structured review report

### Paper Generation Mode

1. Enter your research topic and background
2. Click **Start Generation** — the process runs through 5 stages:
   1. **Proposal** — research question and innovation outline
   2. **Structure** — chapter plan and logic framework
   3. **Writing** — section-by-section content
   4. **Data / Figures** — data description and chart suggestions (supports uploading your own data images for visual analysis)
   5. **Formatting** — final output in Markdown / LaTeX / plain text
3. Review each stage before proceeding to the next
4. Export the final paper

### Grant Mode

The output is presented as an 8-step wizard:
Background → Research Content → Innovation → Feasibility → Expected Outcomes → Budget → Timeline → References

Use the top progress bar or step tabs to navigate between sections.

---

## 3. Markdown Support

AI outputs in the Workshop are rendered with:

- Headers (`#` to `######`)
- Bold / italic / inline code
- Code blocks with copy button
- Bullet and numbered lists
- Task lists (`- [x]` / `- [ ]`)
- Tables
- Alert boxes (`> [!NOTE]`, `> [!WARNING]`, `> [!IMPORTANT]`, `> [!TIP]`, `> [!CAUTION]`)
- Collapsible sections (`<details>`)
- Auto-linked URLs

---

## 4. Notes

- Conversations are independent per session. Refreshing the page or clearing the chat resets the history.
- Logged-in users: conversation history is synced to the server.
- Guests: history is stored locally in the browser and will be lost if cache is cleared.
- Hermes is hidden on `/admin`, `/profile`, and `/settings` pages to avoid interference.
