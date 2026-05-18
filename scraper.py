import asyncio
import os
import time
import json
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
WEBSITE_IMAGES_DIR = WEBSITE_DIR / "images"
WEBSITE_AUDIO_DIR = WEBSITE_DIR / "audio"
LOG_DIR = BASE_DIR / "logs"
SESSION_DIR = BASE_DIR / "session" / "google_auth"

# Load environment variables
load_dotenv(BASE_DIR / ".env")

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
                
                # Detect the code to tap on phone
                try:
                    # The number is often in a div with a specific data-value or just large text
                    code_elem = await self.page.query_selector('div[data-value]')
                    if not code_elem:
                        # Fallback to finding the large number text
                        code_elem = await self.page.query_selector('span#number, div.sfS4qc')
                    
                    code = await code_elem.inner_text() if code_elem else "[Unknown]"
                    
                    # Detect device info
                    device_elem = await self.page.query_selector('div.v7S67d, b')
                    device_info = await device_elem.inner_text() if device_elem else "your phone"
                    
                    print("\n" + "="*50)
                    print(f" GOOGLE 2-STEP VERIFICATION ")
                    print("="*50)
                    print(f"Silakan buka HP: {device_info}")
                    print(f"TEKAN ANGKA: {code}")
                    print("="*50 + "\n")
                    
                    logging.info(f"Waiting for manual confirmation on phone (Code: {code})...")
                    
                    # Wait for redirect or timeout
                    for _ in range(12): # Wait up to 60 seconds
                        if "signin/identifier" not in self.page.url and "challenge" not in self.page.url:
                            logging.info("Verification confirmed via phone.")
                            return True
                        await asyncio.sleep(5)
                        
                    print("Timeout menunggu verifikasi HP. Mencoba simpan screenshot...")
                    await self.page.screenshot(path=str(LOG_DIR / "2fa_timeout.png"))
                except Exception as challenge_e:
                    logging.error(f"Error reading challenge info: {challenge_e}")
                    await self.page.screenshot(path=str(LOG_DIR / "2fa_error.png"))

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
            
            questions = await self.page.query_selector_all('div[role="listitem"], div[data-item-id]')
            seen_ids = set()
            unique_questions = []
            current_page_hashes = []
            
            for q in questions:
                item_id = await q.get_attribute('data-item-id') or await q.get_attribute('data-params')
                if item_id:
                    if item_id not in seen_ids:
                        seen_ids.add(item_id); unique_questions.append(q)
                else: unique_questions.append(q)

            if not unique_questions: break

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

                    if not self._is_valid_question(q_text, choices): continue

                    all_imgs = await q_elem.query_selector_all('img')
                    question_images = []
                    for img_idx, img_elem in enumerate(all_imgs):
                        if not await img_elem.evaluate('el => el.closest("label") !== null'):
                            img_url = await img_elem.get_attribute('src')
                            if img_url and not img_url.startswith('data:'):
                                img_path = await self._handle_image(img_url, f"q_{total_questions_extracted}_{img_idx}")
                                if img_path: question_images.append({"url": img_url, "path": img_path, "index": img_idx})

                    page_hash = self.db.get_hash(f"{q_text}_{''.join([c['text'] for c in choices])}")
                    current_page_hashes.append(page_hash)

                    hash_input = f"{form_name}_{q_text}"
                    if len(q_text) < 10 and question_images:
                        hash_input += f"_{'_'.join([img['path'] for img in question_images])}"
                    hash_input += f"_{''.join([c['text'] for c in choices])}"
                    global_q_hash = self.db.get_hash(hash_input)

                    if self.db.is_question_processed(global_q_hash):
                        logging.info(f"Skipping cached: {global_q_hash}")
                        total_questions_extracted += 1
                        if choice_labels:
                            try:
                                import random
                                await random.choice(choice_labels).click()
                            except: pass
                        continue

                    audio_url = ""
                    all_links = await q_elem.query_selector_all('a')
                    for link_elem in all_links:
                        href = await link_elem.get_attribute('href')
                        link_text = await link_elem.inner_text()
                        if href and ("drive.google.com" in href or any(ext in href.lower() for ext in ['.mp3', '.wav', '.m4a', '.ogg', '.webm', '.aac', '.mp4']) or any(kw in (link_text.lower() or "") for kw in ['audio', 'dengar', 'listen', 'suara', 'klik', 'click'])):
                            audio_url = href; break
                    
                    audio_path = await self._handle_audio(audio_url, global_q_hash) if audio_url else ""

                    data = {
                        "question_id": f"{form_name}_{total_questions_extracted}_{int(time.time())}",
                        "form_name": form_name,
                        "page_number": page_num,
                        "category": self._detect_category(page_num, q_text, form_name, audio_url),
                        "question": q_text,
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
            
            # More robust Google Drive download URL conversion
            if "drive.google.com" in url:
                file_id = None
                import re
                # Pattern 1: /file/d/ID/view
                match1 = re.search(r"/file/d/([a-zA-Z0-9_-]+)", url)
                # Pattern 2: id=ID
                match2 = re.search(r"id=([a-zA-Z0-9_-]+)", url)
                
                if match1: file_id = match1.group(1)
                elif match2: file_id = match2.group(1)
                
                if file_id:
                    url = f"https://drive.google.com/uc?export=download&id={file_id}"
                    logging.info(f"Downloading from Drive: {url}")

            # Try downloading using page context (inherits session/auth)
            try:
                response = await self.page.request.get(url, timeout=45000)
                if response.status == 200:
                    audio_data = await response.body()
                else:
                    raise Exception(f"Playwright request failed with status {response.status}")
            except Exception as e:
                logging.warning(f"Primary audio download failed ({e}). Trying fallback...")
                # Fallback: using requests library
                import requests
                # Get cookies from playwright to maintain session
                cookies = {c['name']: c['value'] for c in await self.context.cookies()}
                headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
                resp = requests.get(url, cookies=cookies, headers=headers, timeout=45)
                if resp.status_code == 200:
                    audio_data = resp.content
                else:
                    logging.error(f"Fallback download failed with status {resp.status_code}")
                    return None

            if not audio_data: return None

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
            logging.info(f"Successfully saved audio to {final_path}")
            return f"audio/{audio_hash}{ext}"
        except Exception as e:
            logging.error(f"Audio Download Error for {url[:50]}... : {e}")
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
