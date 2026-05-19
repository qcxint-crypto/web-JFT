import asyncio
import os
import shutil
import time
import json
import hashlib
import logging
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from playwright.async_api import async_playwright
from db_manager import DBManager
from image_processor import ImageProcessor
from git_helper import GitHelper

BASE_DIR = Path(__file__).resolve().parent
WEBSITE_DIR = BASE_DIR / "website"
WEBSITE_OUTPUT_DIR = WEBSITE_DIR / "output"
WEBSITE_IMAGES_DIR = WEBSITE_DIR / "public" / "images"
WEBSITE_AUDIO_DIR = WEBSITE_DIR / "public" / "audio"
LOG_DIR = BASE_DIR / "logs"
SESSION_DIR = BASE_DIR / "session" / "google_auth"
CREDENTIALS_HASH_FILE = BASE_DIR / ".env_credentials_hash"

# Load environment variables
load_dotenv(BASE_DIR / ".env")


def _compute_credentials_hash() -> str:
    email = os.getenv("EMAIL_GOOGLE", "")
    password = os.getenv("PASSWORD_EMAIL", "")
    return hashlib.sha256(f"{email}:{password}".encode()).hexdigest()


def check_and_clear_on_credential_change():
    """
    If EMAIL_GOOGLE or PASSWORD_EMAIL changed since last run, wipe all cached
    data — session, audio, images, and question database — so the scraper
    starts completely fresh for the new account.
    """
    current_hash = _compute_credentials_hash()

    if CREDENTIALS_HASH_FILE.exists():
        stored_hash = CREDENTIALS_HASH_FILE.read_text().strip()
        if stored_hash == current_hash:
            return  # Credentials unchanged, nothing to do

    logging.warning("Credentials changed (or first run). Clearing all cached data...")

    # Clear browser session
    if SESSION_DIR.exists():
        shutil.rmtree(SESSION_DIR, ignore_errors=True)
        logging.info(f"Cleared session: {SESSION_DIR}")

    # Clear audio files
    if WEBSITE_AUDIO_DIR.exists():
        for f in WEBSITE_AUDIO_DIR.iterdir():
            if f.is_file():
                f.unlink()
        logging.info(f"Cleared audio files in {WEBSITE_AUDIO_DIR}")

    # Clear image files
    if WEBSITE_IMAGES_DIR.exists():
        for f in WEBSITE_IMAGES_DIR.iterdir():
            if f.is_file():
                f.unlink()
        logging.info(f"Cleared image files in {WEBSITE_IMAGES_DIR}")

    # Reset question database
    db_dir = BASE_DIR / "database"
    for db_file in ["processed_questions.json", "processed_images.json"]:
        db_path = db_dir / db_file
        if db_path.exists():
            db_path.write_text("{}")
            logging.info(f"Reset database: {db_path}")

    # Clear output JSON
    output_json = WEBSITE_OUTPUT_DIR / "all_questions.json"
    if output_json.exists():
        output_json.unlink()
        logging.info(f"Removed output: {output_json}")

    # Clear per-form JSON files
    if WEBSITE_OUTPUT_DIR.exists():
        for f in WEBSITE_OUTPUT_DIR.glob("*.json"):
            f.unlink()
        logging.info("Cleared per-form JSON output files")

    # Clear database cache directory if it exists
    cache_dir = db_dir / "cache"
    if cache_dir.exists():
        shutil.rmtree(cache_dir, ignore_errors=True)
        logging.info("Cleared database cache")

    # Store new hash
    CREDENTIALS_HASH_FILE.write_text(current_hash)
    logging.info("Credential hash updated. Starting fresh scrape.")

# Setup Logging
os.makedirs(LOG_DIR, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_DIR / "scraper.log"),
        logging.StreamHandler()
    ]
)

class GoogleFormScraper:
    def __init__(self):
        self.db = DBManager()
        self.email = os.getenv("EMAIL_GOOGLE")
        self.password = os.getenv("PASSWORD_EMAIL")
        self.name = os.getenv("NAME", "Respondent")
        self.playwright = None
        self.context = None
        self.page = None
        self.session_dir = str(SESSION_DIR)

        os.makedirs(WEBSITE_OUTPUT_DIR, exist_ok=True)
        os.makedirs(WEBSITE_IMAGES_DIR, exist_ok=True)
        os.makedirs(WEBSITE_AUDIO_DIR, exist_ok=True)

    async def init_browser(self):
        self.playwright = await async_playwright().start()
        # Point to system chromium for Termux compatibility
        executable_path = "/usr/bin/chromium-browser" if os.path.exists("/usr/bin/chromium-browser") else None
        
        # Check if headless mode should be disabled for manual login
        headless = os.getenv("HEADLESS", "true").lower() == "true"

        logging.info(f"Using session directory: {self.session_dir}")
        os.makedirs(self.session_dir, exist_ok=True)

        # Use persistent context to save session
        self.context = await self.playwright.chromium.launch_persistent_context(
            user_data_dir=self.session_dir,
            headless=headless,
            executable_path=executable_path,
            viewport={'width': 1280, 'height': 800},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            args=[
                '--no-sandbox', 
                '--disable-setuid-sandbox', 
                '--disable-blink-features=AutomationControlled',
                '--disable-infobars',
                '--no-first-run'
            ]
        )
        self.page = self.context.pages[0] if self.context.pages else await self.context.new_page()

    async def login_google(self):
        logging.info("Checking Google Login status...")
        try:
            # First, try to visit a Google service to see if we are already logged in
            await self.page.goto("https://myaccount.google.com/?hl=en")
            await asyncio.sleep(2)
            
            if "signin" not in self.page.url:
                logging.info("Resumed existing session (Already logged in).")
                return True

            logging.info("Session expired or not found. Performing fresh login...")
            await self.page.goto("https://accounts.google.com/ServiceLogin")
            await self.page.fill('input[type="email"]', self.email)
            await self.page.click('#identifierNext')
            
            # Wait for password field
            await self.page.wait_for_selector('input[type="password"]', timeout=15000)
            await asyncio.sleep(1)
            
            await self.page.fill('input[type="password"]', self.password)
            await self.page.click('#passwordNext')
            
            # Wait for redirect or challenge
            await self.page.wait_for_load_state("networkidle")
            
            if "challenge" in self.page.url:
                logging.warning("2-Step Verification detected!")
                await self._handle_2fa_challenge()

            if "signin/identifier" in self.page.url:
                logging.warning("Login failed or still on login page. Screenshot saved.")
                await self.page.screenshot(path=str(LOG_DIR / "login_state.png"))
                return False
            
            logging.info("Login Successful.")
            return True
        except Exception as e:
            logging.error(f"Login Failed: {e}")
            await self.page.screenshot(path=str(LOG_DIR / "login_error.png"))
            return False

    async def scrape_form(self, form_url, form_name):
        logging.info(f"Scraping form: {form_name} ({form_url})")
        try:
            await self.page.goto(form_url, wait_until="networkidle", timeout=60000)
        except:
            await self.page.goto(form_url)
        
        await asyncio.sleep(5)

        # Handle Intro/Gatekeeper pages
        await self._handle_intro_pages()

        results = []
        page_num = 0
        total_questions_extracted = 0
        previous_page_hashes = set()
        max_pages = 10
        
        while page_num < max_pages:
            page_num += 1
            logging.info(f"Processing page {page_num} of form {form_name}...")
            await asyncio.sleep(4)

            page_audio_candidates = []
            seen_audio_candidates = set()

            # Scroll through the page to trigger lazy-loaded iframes/embeds
            try:
                await self.page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
                await asyncio.sleep(2)
                await self.page.evaluate('window.scrollTo(0, 0)')
                await asyncio.sleep(1)
            except Exception:
                pass

            try:
                global_media = await self.page.query_selector_all('audio, video, source, iframe, embed, a, button')
                for media_elem in global_media:
                    candidate_url = (
                        await media_elem.get_attribute('src')
                        or await media_elem.get_attribute('href')
                        or await media_elem.get_attribute('data-src')
                        or await media_elem.get_attribute('data-url')
                        or ""
                    )
                    candidate_text = ""
                    try:
                        candidate_text = (await media_elem.inner_text()).strip().lower()
                    except:
                        candidate_text = ""

                    if not candidate_url:
                        continue

                    if (
                        "drive.google.com" in candidate_url
                        or any(ext in candidate_url.lower() for ext in ['.mp3', '.wav', '.m4a', '.ogg', '.webm', '.aac', '.mp4'])
                        or any(kw in candidate_text for kw in ['audio', 'dengar', 'listen', 'suara', 'klik', 'click', 'putar'])
                    ):
                        if candidate_url not in seen_audio_candidates:
                            seen_audio_candidates.add(candidate_url)
                            page_audio_candidates.append(candidate_url)
            except Exception as page_audio_error:
                logging.warning(f"Audio candidate scan failed: {page_audio_error}")

            # Additional: scan all frames (including Drive audio iframes)
            try:
                import re as _re_frames
                for frame in self.page.frames:
                    furl = frame.url
                    if furl and "drive.google.com" in furl and furl not in seen_audio_candidates:
                        seen_audio_candidates.add(furl)
                        page_audio_candidates.append(furl)
                        logging.info(f"Found Drive frame: {furl[:80]}")
            except Exception as frame_err:
                logging.warning(f"Frame scan failed: {frame_err}")

            # Additional: regex scan of page HTML for Drive file URLs
            try:
                import re as _re_html
                page_html = await self.page.content()
                drive_matches = _re_html.findall(
                    r'https://drive\.google\.com/file/d/[a-zA-Z0-9_-]+(?:/[a-zA-Z0-9_?=&%-]*)?',
                    page_html
                )
                for dm in drive_matches:
                    dm_clean = dm.split('"')[0].split("'")[0].split('\\')[0]
                    if dm_clean not in seen_audio_candidates:
                        seen_audio_candidates.add(dm_clean)
                        page_audio_candidates.append(dm_clean)
                        logging.info(f"Found Drive URL via HTML scan: {dm_clean[:80]}")
            except Exception as html_scan_err:
                logging.warning(f"HTML Drive scan failed: {html_scan_err}")

            logging.info(f"Page {page_num}: found {len(page_audio_candidates)} audio candidates: {page_audio_candidates[:3]}")

            questions = await self.page.query_selector_all('div[role="listitem"], div[data-item-id]')
            seen_ids = set()
            unique_questions = []
            current_page_hashes = []
            active_page_audio = page_audio_candidates[0] if page_audio_candidates else ""
            consumed_page_audio = set()
            current_passage_images = []  # Track image-only "passage" questions for propagation
            pending_audio_from_skipped = ""  # Audio found in a no-choice block to pass to next question
            prev_lead_number = None  # Track leading question numbers to detect new choukai groups

            for q in questions:
                item_id = await q.get_attribute('data-item-id') or await q.get_attribute('data-params')
                if item_id:
                    if item_id not in seen_ids:
                        seen_ids.add(item_id); unique_questions.append(q)
                else: unique_questions.append(q)

            if not unique_questions: break

            import re as _re_lead

            for idx, q_elem in enumerate(unique_questions):
                try:
                    q_text = ""
                    q_header = await q_elem.query_selector('div[role="heading"]')
                    if q_header: q_text = await q_header.inner_text()
                    if not q_text:
                        text_divs = await q_elem.query_selector_all('div[dir="auto"]')
                        for td in text_divs:
                            if not await td.evaluate('el => el.closest("label") !== null'):
                                txt = await td.inner_text()
                                if txt and len(txt.strip()) > 1 and txt.strip() != "Required":
                                    q_text = txt.strip(); break
                    q_text = q_text.strip().replace("*", "").strip()
                    q_text, q_context = self._extract_clean_question_text(q_text)

                    choices = []
                    choice_labels = await q_elem.query_selector_all('label')
                    for c_idx, label in enumerate(choice_labels):
                        c_text = ""
                        c_image_data = None
                        text_elem = await label.query_selector('div[dir="auto"], span')
                        if text_elem: c_text = await text_elem.inner_text()
                        if not c_text or not c_text.strip():
                            all_label_text = await label.inner_text()
                            lines = [l.strip() for l in all_label_text.split('\n') if l.strip() and l.strip() != "Required"]
                            if lines: c_text = lines[0]
                        c_text = c_text.strip() if c_text else ""
                        img_elem = await label.query_selector('img')
                        if img_elem:
                            img_url = await img_elem.get_attribute('src')
                            if img_url and not img_url.startswith('data:'):
                                img_path = await self._handle_image(img_url, f"choice_{total_questions_extracted}_{c_idx}")
                                if img_path: c_image_data = {"url": img_url, "path": img_path}
                        if c_text or c_image_data: choices.append({"text": c_text, "image": c_image_data})

                    # Before skipping invalid blocks, extract any audio URL from them.
                    # In JFT forms, audio lives in a "no-choice" header block above the actual questions.
                    if not self._is_valid_question(q_text, choices):
                        skip_audio_candidates = await q_elem.query_selector_all('audio, video, source, iframe, embed, a')
                        for smedia in skip_audio_candidates:
                            surl = (
                                await smedia.get_attribute('src')
                                or await smedia.get_attribute('href')
                                or await smedia.get_attribute('data-src')
                                or await smedia.get_attribute('data-url')
                                or ""
                            )
                            if surl and (
                                "drive.google.com" in surl
                                or any(ext in surl.lower() for ext in ['.mp3', '.wav', '.m4a', '.ogg', '.webm', '.aac', '.mp4'])
                            ):
                                pending_audio_from_skipped = surl
                                logging.info(f"Captured audio from skipped block: {surl[:60]}")
                                break
                        # Also scan HTML of the skipped element
                        if not pending_audio_from_skipped:
                            try:
                                elem_html = await q_elem.inner_html()
                                drive_hits = _re_lead.findall(
                                    r'https://drive\.google\.com/file/d/[a-zA-Z0-9_-]+', elem_html
                                )
                                if drive_hits:
                                    pending_audio_from_skipped = drive_hits[0]
                                    logging.info(f"Captured Drive URL from skipped block HTML: {pending_audio_from_skipped[:60]}")
                            except Exception:
                                pass
                        continue

                    all_imgs = await q_elem.query_selector_all('img')
                    question_images = []
                    for img_idx, img_elem in enumerate(all_imgs):
                        if not await img_elem.evaluate('el => el.closest("label") !== null'):
                            img_url = await img_elem.get_attribute('src')
                            if img_url and not img_url.startswith('data:'):
                                img_path = await self._handle_image(img_url, f"q_{total_questions_extracted}_{img_idx}")
                                if img_path: question_images.append({"url": img_url, "path": img_path, "index": img_idx})

                    # Passage image propagation for dokkai/reading sets:
                    # An image-only question (text ≈ just "3.") is a passage → share with next questions.
                    # Questions with substantial text have their own context — reset propagation.
                    stripped_q = _re_lead.sub(r'^\s*\d+\s*[.．]?\s*', '', q_text).strip()
                    if question_images:
                        if len(stripped_q) < 5:
                            # Image-only passage → propagate to subsequent questions on same page
                            current_passage_images = list(question_images)
                        else:
                            # Question has own text + image (kaiwa illustration etc.) → don't share
                            current_passage_images = []
                    elif not question_images and current_passage_images:
                        # Inherit passage image for this dependent question
                        question_images = list(current_passage_images)

                    page_hash = self.db.get_hash(f"{q_text}_{''.join([c['text'] for c in choices])}")
                    current_page_hashes.append(page_hash)

                    hash_input = f"{form_name}_{q_text}"
                    if len(q_text) < 10 and question_images:
                        hash_input += f"_{'_'.join([img['path'] for img in question_images])}"
                    hash_input += f"_{''.join([c['text'] for c in choices])}"
                    global_q_hash = self.db.get_hash(hash_input)

                    if self.db.is_question_processed(global_q_hash):
                        # Re-process choukai questions that were cached without audio,
                        # so the improved audio detection gets a chance to find their files.
                        cached_q = self.db.load_questions().get(global_q_hash, {})
                        needs_audio_retry = (
                            page_num == 3
                            and not cached_q.get('audio')
                            and not cached_q.get('audio_url')
                        )
                        if needs_audio_retry:
                            logging.info(f"Re-processing choukai (no audio) cached: {global_q_hash}")
                        else:
                            logging.info(f"Skipping cached: {global_q_hash}")
                            total_questions_extracted += 1
                            if choice_labels:
                                try:
                                    import random
                                    await random.choice(choice_labels).click()
                                except: pass
                            continue

                    # --- Audio detection ---
                    audio_url = ""

                    # 1. Direct audio element within this question block
                    audio_candidates = await q_elem.query_selector_all('audio, video, source, iframe, embed, a')
                    for media_elem in audio_candidates:
                        candidate_url = (
                            await media_elem.get_attribute('src')
                            or await media_elem.get_attribute('href')
                            or await media_elem.get_attribute('data-src')
                            or await media_elem.get_attribute('data-url')
                            or ""
                        )

                        candidate_text = ""
                        try:
                            candidate_text = (await media_elem.inner_text()).strip().lower()
                        except:
                            candidate_text = ""

                        if candidate_url and (
                            "drive.google.com" in candidate_url
                            or any(ext in candidate_url.lower() for ext in ['.mp3', '.wav', '.m4a', '.ogg', '.webm', '.aac', '.mp4'])
                            or any(kw in candidate_text for kw in ['audio', 'dengar', 'listen', 'suara', 'klik', 'click'])
                        ):
                            audio_url = candidate_url
                            break

                    # 2. HTML regex fallback within element
                    if not audio_url:
                        try:
                            elem_html = await q_elem.inner_html()
                            elem_drives = _re_lead.findall(
                                r'https://drive\.google\.com/file/d/[a-zA-Z0-9_-]+', elem_html
                            )
                            if elem_drives:
                                audio_url = elem_drives[0]
                        except Exception:
                            pass

                    # 3. Pick up audio left behind by a preceding skipped (no-choice) block
                    if not audio_url and pending_audio_from_skipped:
                        audio_url = pending_audio_from_skipped
                        pending_audio_from_skipped = ""
                        logging.info(f"Assigned pending audio to question: {q_text[:50]}")

                    # 4. Page-level audio pool fallback
                    if not audio_url and active_page_audio:
                        question_audio_hint = any(
                            keyword in q_text.lower()
                            for keyword in ['audio', 'listen', 'dengar', 'suara', 'putar', 'choukai', 'cokai']
                        )
                        # Choukai page (page 3) always gets audio; other pages only if keyword found
                        is_choukai_page = (page_num == 3)

                        if question_audio_hint or is_choukai_page:
                            # Detect if we've moved to a new numbered group (e.g., 1. → 2.)
                            # If so, advance to the next audio candidate
                            lead_match = _re_lead.match(r'^\s*(\d+)\s*[.．]', q_text)
                            current_lead = int(lead_match.group(1)) if lead_match else None
                            if (
                                current_lead is not None
                                and prev_lead_number is not None
                                and current_lead > prev_lead_number
                            ):
                                remaining = [a for a in page_audio_candidates if a not in consumed_page_audio]
                                if remaining:
                                    active_page_audio = remaining[0]
                                    logging.info(f"Advanced audio to group {current_lead}: {active_page_audio[:60]}")

                            audio_url = active_page_audio
                            consumed_page_audio.add(active_page_audio)
                            remaining_audio = [a for a in page_audio_candidates if a not in consumed_page_audio]
                            if remaining_audio:
                                active_page_audio = remaining_audio[0]

                        # Update lead number tracker
                        lead_match2 = _re_lead.match(r'^\s*(\d+)\s*[.．]', q_text)
                        if lead_match2:
                            prev_lead_number = int(lead_match2.group(1))

                    audio_path = await self._handle_audio(audio_url, global_q_hash) if audio_url else ""

                    data = {
                        "question_id": f"{form_name}_{total_questions_extracted}_{int(time.time())}",
                        "form_name": form_name,
                        "page_number": page_num,
                        "category": self._detect_category(page_num, q_text, form_name, audio_url),
                        "question_type": self._detect_question_type(q_text, question_images, choices, audio_url),
                        "question": q_text,
                        "context": q_context,
                        "choices": choices,
                        "images": question_images,
                        "audio_url": audio_url,
                        "audio": audio_path,
                        "hash": global_q_hash,
                        "created_at": datetime.now().isoformat()
                    }

                    results.append(data)
                    logging.info(f"Extracted: {global_q_hash}")
                    total_questions_extracted += 1

                    if choice_labels:
                        import random
                        await random.choice(choice_labels).click()
                        await asyncio.sleep(0.3)

                except Exception as e:
                    logging.error(f"Error processing question {idx}: {e}")

            if page_num > 1 and set(current_page_hashes).issubset(previous_page_hashes) and current_page_hashes:
                break
            previous_page_hashes = set(current_page_hashes)

            buttons = await self.page.query_selector_all('div[role="button"]')
            next_btn = None; submit_btn = None
            for btn in buttons:
                txt = (await btn.inner_text()).lower()
                if await btn.get_attribute('aria-disabled') != "true":
                    if "next" in txt or "berikutnya" in txt: next_btn = btn; break
                    if "submit" in txt or "kirim" in txt: submit_btn = btn; break
            
            if next_btn:
                await next_btn.click(); await asyncio.sleep(5)
            elif submit_btn:
                logging.info("Submitting form to get correct answers...")
                await submit_btn.click(); await asyncio.sleep(5); break
            else: break

        # Scrape Answers
        try:
            view_score_btn = await self.page.query_selector('a:has-text("View score"), a:has-text("Lihat skor")')
            if view_score_btn:
                async with self.context.expect_page() as new_page_info:
                    await view_score_btn.click()
                score_page = await new_page_info.value
                await score_page.wait_for_load_state("networkidle"); await asyncio.sleep(3)
                score_questions = await score_page.query_selector_all('div[role="listitem"]')
                answers_map = {}
                for sq in score_questions:
                    try:
                        stext = ""
                        st_elem = await sq.query_selector('div[role="heading"]')
                        if st_elem: stext = (await st_elem.inner_text()).strip().replace("*", "").strip()
                        ans_elem = await sq.query_selector('div:has-text("Correct answer"), div:has-text("Jawaban yang benar")')
                        if ans_elem:
                            ans_text = await ans_elem.inner_text()
                            for prefix in ["Correct answer", "Jawaban yang benar", "Correct answers", "Jawaban yang benar:"]:
                                if prefix in ans_text: ans_text = ans_text.split(prefix)[-1].strip(": \n")
                            if stext and ans_text: answers_map[stext] = ans_text
                    except: continue
                for r in results:
                    if r['question'] in answers_map: r['correctAnswer'] = answers_map[r['question']]
                await score_page.close()
        except Exception as e: logging.error(f"Failed to scrape answers: {e}")

        # Save and return
        for r in results: self.db.save_question(r['hash'], r)
        output_file = WEBSITE_OUTPUT_DIR / f"{form_name.lower()}.json"
        with open(output_file, "w") as f:
            json.dump(results, f, indent=4)
        logging.info(f"Form {form_name} finished. Extracted {len(results)} questions.")
        return results

    async def _handle_2fa_challenge(self):
        """Handle all Google 2FA challenge types: TOTP, SMS, phone tap."""
        await asyncio.sleep(2)
        current_url = self.page.url

        # --- Type 1: Code input (TOTP authenticator app or SMS) ---
        code_input = await self.page.query_selector(
            'input[type="tel"], input[autocomplete="one-time-code"], '
            'input[name="totpPin"], input[name="idvPreregisteredPhonePin"]'
        )
        if code_input:
            if "totp" in current_url.lower():
                label = "Authenticator App (Google Auth, Authy, dll)"
            elif any(k in current_url.lower() for k in ["ipp", "phone", "sms"]):
                label = "SMS / Telepon"
            else:
                label = "Authenticator / SMS"

            print("\n" + "="*55)
            print(" GOOGLE 2FA — MASUKKAN KODE ")
            print("="*55)
            print(f"Sumber: {label}")
            print("Ketik kode 6-digit lalu tekan Enter:")
            try:
                code = input("Kode 2FA: ").strip()
            except EOFError:
                logging.warning("Tidak bisa baca input 2FA (non-interactive). Screenshot disimpan.")
                await self.page.screenshot(path=str(LOG_DIR / "2fa_input_needed.png"))
                return
            await code_input.fill(code)
            await self.page.keyboard.press("Enter")
            try:
                await self.page.wait_for_load_state("networkidle", timeout=15000)
            except Exception:
                pass
            logging.info("2FA code submitted.")
            return

        # --- Type 2: Phone tap (Google shows number, user taps on phone) ---
        try:
            code_elem = await self.page.query_selector('div[data-value]')
            if not code_elem:
                code_elem = await self.page.query_selector('span#number, div.sfS4qc')

            tap_code = await code_elem.inner_text() if code_elem else "[Unknown]"
            device_elem = await self.page.query_selector('div.v7S67d, b')
            device_info = await device_elem.inner_text() if device_elem else "your phone"

            print("\n" + "="*55)
            print(" GOOGLE 2FA — KETUK ANGKA DI HP ")
            print("="*55)
            print(f"Perangkat: {device_info}")
            print(f"KETUK ANGKA: {tap_code}")
            print("="*55 + "\n")
            logging.info(f"Waiting for phone tap (code: {tap_code})...")

            for _ in range(18):  # up to 90 seconds
                await asyncio.sleep(5)
                if "challenge" not in self.page.url and "signin/identifier" not in self.page.url:
                    logging.info("Phone tap confirmed.")
                    return

            logging.warning("Timeout waiting for phone tap.")
            await self.page.screenshot(path=str(LOG_DIR / "2fa_timeout.png"))
        except Exception as e:
            logging.error(f"2FA handler error: {e}")
            await self.page.screenshot(path=str(LOG_DIR / "2fa_error.png"))

    async def _handle_intro_pages(self):
        """Proceed through intro pages that ask for Name, ID, etc."""
        max_attempts = 3
        for attempt in range(max_attempts):
            inputs = await self.page.query_selector_all('input[type="text"], textarea')
            if not inputs:
                # Check if there's just a Next button
                next_button = await self.page.query_selector('div[role="button"]:has-text("Next"), div[role="button"]:has-text("Berikutnya")')
                if next_button:
                    await next_button.click()
                    await asyncio.sleep(2)
                    continue
                else:
                    break

            logging.info(f"Filling {len(inputs)} intro fields...")
            for i_elem in inputs:
                if await i_elem.is_visible():
                    await i_elem.fill(self.name)
            
            next_button = await self.page.query_selector('div[role="button"]:has-text("Next"), div[role="button"]:has-text("Berikutnya")')
            if next_button:
                await next_button.click()
                await asyncio.sleep(3)
            else:
                break

    async def _handle_image(self, url, q_hash):
        try:
            response = await self.page.request.get(url)
            img_data = await response.body()
            temp_path = WEBSITE_IMAGES_DIR / f"temp_{q_hash}.png"
            with open(temp_path, "wb") as f:
                f.write(img_data)
            img_hash = self.db.get_file_hash(temp_path)
            final_path = WEBSITE_IMAGES_DIR / f"{img_hash}.png"
            os.rename(temp_path, final_path)
            return f"images/{img_hash}.png"
        except Exception as e:
            logging.error(f"Image Download Error: {e}")
            return None

    async def _handle_audio(self, url, q_hash):
        try:
            if not url: return None

            import re as _re

            if "drive.google.com" in url:
                file_id = None
                m1 = _re.search(r"/file/d/([a-zA-Z0-9_-]+)", url)
                m2 = _re.search(r"id=([a-zA-Z0-9_-]+)", url)
                if m1: file_id = m1.group(1)
                elif m2: file_id = m2.group(1)
                if file_id:
                    # confirm=1 bypasses Google's virus-scan warning page for larger files
                    url = f"https://drive.google.com/uc?export=download&id={file_id}&confirm=1"
                    logging.info(f"Downloading from Drive: id={file_id}")

            audio_data = None

            # Primary: Playwright request (inherits Google session cookies)
            try:
                response = await self.page.request.get(url, timeout=60000)
                if response.status == 200:
                    ct = response.headers.get("content-type", "")
                    if "text/html" in ct:
                        raise Exception(f"Drive returned HTML (confirmation page)")
                    audio_data = await response.body()
                else:
                    raise Exception(f"HTTP {response.status}")
            except Exception as e:
                logging.warning(f"Primary audio download failed: {e}. Trying requests fallback...")

            # Fallback: requests library with session cookies
            if not audio_data:
                try:
                    import requests as _req
                    cookies = {c['name']: c['value'] for c in await self.context.cookies()}
                    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
                    resp = _req.get(url, cookies=cookies, headers=headers, timeout=60, allow_redirects=True)
                    ct = resp.headers.get("content-type", "")
                    if resp.status_code == 200 and "text/html" not in ct:
                        audio_data = resp.content
                    else:
                        logging.error(f"Requests fallback: status={resp.status_code} ct={ct}")
                        return None
                except Exception as e2:
                    logging.error(f"Both download methods failed: {e2}")
                    return None

            # Validate: reject HTML content disguised as audio
            if not audio_data or len(audio_data) < 512:
                logging.warning("Audio data too small or empty — skipping.")
                return None
            html_signatures = (b'<!doc', b'<html', b'<?xml', b'<!DOC', b'<HTML')
            if audio_data[:5].lower() in [s.lower() for s in html_signatures]:
                logging.warning("Downloaded file is HTML (not audio) — skipping.")
                return None

            ext = self._get_file_extension(url)
            temp_path = WEBSITE_AUDIO_DIR / f"temp_{q_hash}{ext}"
            with open(temp_path, "wb") as f:
                f.write(audio_data)

            audio_hash = self.db.get_file_hash(temp_path)
            final_path = WEBSITE_AUDIO_DIR / f"{audio_hash}{ext}"
            if os.path.exists(final_path):
                os.remove(temp_path)
                return f"audio/{audio_hash}{ext}"
            os.rename(temp_path, final_path)
            logging.info(f"Audio saved: {final_path.name} ({len(audio_data)//1024} KB)")
            return f"audio/{audio_hash}{ext}"
        except Exception as e:
            logging.error(f"Audio Download Error for {url[:60]}: {e}")
            return None

    def _get_file_extension(self, url):
        for ext in ['.mp3', '.wav', '.m4a', '.ogg', '.webm', '.mp4']:
            if ext in url.lower(): return ext
        return '.mp3'

    def _validate_and_cleanup_database(self):
        db_path = "database/processed_questions.json"
        if not os.path.exists(db_path): return
        try:
            with open(db_path, 'r') as f: all_questions = json.load(f)
            valid_questions = {}
            for q_hash, q_data in all_questions.items():
                if self._is_valid_question(q_data.get("question", ""), q_data.get("choices", [])):
                    valid_questions[q_hash] = q_data
            with open(db_path, 'w') as f: json.dump(valid_questions, f, indent=4)
        except Exception as e: logging.error(f"Cleanup Error: {e}")

    def _is_valid_question(self, question_text, choices):
        if not choices or len(choices) < 2: return False
        q_lower = question_text.lower().strip() if question_text else ""
        invalid = ["bagian tanpa judul", "sesi ", "session ", "part ", "bagian ", "halaman ", "page ", "untitled", "no title", "question_", "informasi pribadi", "identitas", "biodata", "nama lengkap", "nomor absen", "kelas"]
        if any(p in q_lower for p in invalid): return False
        return True

    def _extract_clean_question_text(self, raw_text):
        """
        Parse merged question text from Google Forms headings.
        Returns (question_text, context_text).

        Google Forms sometimes puts context/example sentences and the actual question
        in the same heading element (e.g., "13. example sentence 12. fill-in-blank___").
        This method separates the actual question from its context.
        """
        import re
        if not raw_text:
            return "", ""

        text = raw_text.strip().replace("*", "").strip()

        # Split on numbered items: "12. ", "13. " etc. (full/half-width digits + period)
        # Lookahead prevents splitting mid-number (e.g., "12.5")
        split_pattern = r'(?<!\d)(?=\d{1,2}\s*[．\.]\s)'
        parts = re.split(split_pattern, text)
        parts = [p.strip() for p in parts if p.strip()]

        if len(parts) <= 1:
            return text, ""

        # Blank patterns indicate fill-in-the-blank question
        blank_patterns = ['___', '＿＿', '_____', '＿', '（　）', '(   )', '＿＿＿']

        question_part = ""
        context_parts = []

        for part in parts:
            if any(bp in part for bp in blank_patterns):
                if not question_part:
                    question_part = part
                else:
                    context_parts.append(part)
            else:
                context_parts.append(part)

        if question_part:
            return question_part.strip(), " | ".join(context_parts)

        # No blank found → last numbered item is the question, rest is context
        return parts[-1].strip(), " | ".join(parts[:-1])

    def _detect_question_type(self, question_text, question_images, choices, audio_url):
        """
        Classify question into one of 4 types:
        1. text_only       - text question, no image, no audio
        2. text_image      - text question with accompanying image
        3. image_only      - question presented as image (minimal/no text)
        4. chokai          - listening question with audio from Google Drive or direct link
        """
        has_text = bool(question_text and len(question_text.strip()) > 5)
        has_image = bool(question_images)
        has_audio = bool(audio_url)

        if has_audio:
            return "chokai"
        if has_image and has_text:
            return "text_image"
        if has_image and not has_text:
            return "image_only"
        return "text_only"

    def _detect_category(self, page_number, text, form_name, audio_url=""):
        combined = (text.lower() + " " + form_name.lower()).strip()

        if audio_url or any(keyword in combined for keyword in ["choukai", "chokai", "audio", "dengar", "listen"]):
            return "choukai"

        if page_number == 1:
            return "moji_goi"
        if page_number == 2:
            return "kaiwa_hyougen"
        if page_number == 3:
            return "choukai"
        if page_number >= 4:
            return "dokkai"

        if any(keyword in combined for keyword in ["dokkai", "bacaan", "reading"]):
            return "dokkai"
        if any(keyword in combined for keyword in ["moji", "goi", "kosakata"]):
            return "moji_goi"
        if any(keyword in combined for keyword in ["kaiwa", "hyougen", "ungkapan", "percakapan"]):
            return "kaiwa_hyougen"

        return "general"

    async def run(self):
        try:
            check_and_clear_on_credential_change()
            await self.init_browser()
            if await self.login_google():
                self._validate_and_cleanup_database()
                with open("forms.txt", "r") as f:
                    lines = [l.strip() for l in f.readlines() if l.strip()]
                all_data = []
                for i in range(0, len(lines), 2):
                    form_data = await self.scrape_form(lines[i+1], lines[i])
                    all_data.extend(form_data)
                
                # Merge with existing data for overall output
                final_questions = list(self.db.load_questions().values())
                with open(WEBSITE_OUTPUT_DIR / "all_questions.json", "w") as f:
                    json.dump(final_questions, f, indent=4)
                
                logging.info(f"Scraping Completed. Total questions in database: {len(final_questions)}")
                push_ok = GitHelper.commit_and_push()
                if not push_ok:
                    logging.warning("Auto push ke GitHub gagal. Data scraper tetap tersimpan lokal.")
        except Exception as e: logging.error(f"Run Error: {e}")
        finally:
            if self.context: await self.context.close()
            if self.playwright: await self.playwright.stop()

if __name__ == "__main__":
    scraper = GoogleFormScraper()
    asyncio.run(scraper.run())
