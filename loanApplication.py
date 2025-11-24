import json
import os
import time
import random
import traceback 
import sys 
from datetime import datetime, timedelta
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import TimeoutException, WebDriverException
from webdriver_manager.chrome import ChromeDriverManager
# Keys needed for clearing inputs during 'Thrashing'
from selenium.webdriver.common.keys import Keys 

# --- CONFIGURATION ---
TARGET_URL = "http://localhost:5173" 
DB_FILE = "simulations.json"
HEADLESS = True 

STATUS_DISQUALIFIED = 'disqualified'

DELAYS = {
    "application": {"value": 1, "unit": "minutes"},
    "documents": {"value": 2, "unit": "minutes"},
    "underwriting": {"value": 5, "unit": "minutes"},
    "approval_offer": {"value": 1, "unit": "minutes"},
}

class LifecycleManager:
    def __init__(self):
        self.data = self.load_db()
        self.driver = None 
        self.wait = None

    def load_db(self):
        if not os.path.exists(DB_FILE):
            return []
        try:
            with open(DB_FILE, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError:
            return []

    def save_db(self):
        with open(DB_FILE, 'w') as f:
            json.dump(self.data, f, indent=2)

    def get_due_time(self, stage):
        delay = DELAYS.get(stage, {"value": 1, "unit": "minutes"})
        delta = timedelta(**{delay['unit']: delay['value']})
        return (datetime.now() + delta).isoformat()

    # --- CHAOS HELPERS (Simulating bad user behavior) ---

    def rage_click(self, elem_id, times=5):
        """Clicks an element rapidly multiple times to simulate frustration."""
        print(f"    [CHAOS] Rage clicking {elem_id} {times} times...")
        try:
            el = self.wait.until(EC.element_to_be_clickable((By.ID, elem_id)))
            for i in range(times):
                print(f"      -> Rapid Click {i+1}/{times} on {elem_id}")
                el.click()
                time.sleep(0.1) # Very fast clicks
        except Exception as e:
            print(f"    [CHAOS] Rage click failed: {e}")

    def dead_click(self, elem_id):
        """Clicks a non-interactive element."""
        print(f"    [CHAOS] Moving mouse to dead element: {elem_id}...")
        try:
            el = self.wait.until(EC.visibility_of_element_located((By.ID, elem_id)))
            print(f"    [CHAOS] Clicking non-interactive element: {elem_id}")
            ActionChains(self.driver).move_to_element(el).click().perform()
            time.sleep(0.5)
        except:
            pass

    def thrash_input(self, elem_id, bad_text, correct_text):
        """Types bad text, pauses, deletes it, then types correct text (Hesitation)."""
        print(f"    [CHAOS] Moving mouse to thrash input: {elem_id}...")
        try:
            el = self.wait.until(EC.presence_of_element_located((By.ID, elem_id)))
            ActionChains(self.driver).move_to_element(el).click().perform()
            el.clear()
            
            # Type bad
            print(f"    [CHAOS] Typing bad text '{bad_text}' into {elem_id}...")
            el.send_keys(bad_text)
            time.sleep(1.5) # Hesitate
            
            # Clear (Select all + Delete is safer than clear() sometimes)
            print(f"    [CHAOS] Deleting text in {elem_id}...")
            el.send_keys(Keys.COMMAND + "a")
            el.send_keys(Keys.DELETE)
            time.sleep(0.5)
            
            # Type correct
            print(f"    [CHAOS] Typing correct text into {elem_id}...")
            el.send_keys(correct_text)
        except Exception as e:
            print(f"    [CHAOS] Thrashing failed: {e}")

    # --- BROWSER HELPERS ---
    
    def clear_browser_cache(self):
        if self.driver:
            self.driver.delete_all_cookies()
            self.driver.execute_script("window.localStorage.clear();")
            print("    -> Cleared browser cookies and local storage.")


    def navigate_to_app(self):
        print(f"    -> Navigating to {TARGET_URL}...")
        try:
            self.driver.get(TARGET_URL)
            return True
        except TimeoutException:
            print(f"\n[ERROR] Connection Timed Out! Is the React app running at {TARGET_URL}?")
            return False
        except WebDriverException as e:
            print(f"\n[ERROR] Could not connect to {TARGET_URL}.")
            print(f"Details: {e}")
            return False

    def inject_state(self, state_obj):
        print(f"    -> Injecting state for {state_obj.get('id')}...")
        if not self.navigate_to_app(): return
        
        state_str = json.dumps(state_obj)
        script = f"window.localStorage.setItem('swiftloan_demo_state', '{state_str}');"
        self.driver.execute_script(script)
        self.driver.refresh()
        time.sleep(1) 

    def extract_state(self):
        try:
            state = self.driver.execute_script("return window.localStorage.getItem('swiftloan_demo_state');")
            return json.loads(state) if state else None
        except:
            return None

    def click(self, elem_id):
        try:
            el = self.wait.until(EC.element_to_be_clickable((By.ID, elem_id)))
            actions = ActionChains(self.driver)
            
            print(f"    -> Moving mouse to element: {elem_id}")
            actions.move_to_element(el)
            actions.pause(random.uniform(0.5, 1.5)) 
            
            print(f"    -> Clicking element: {elem_id}")
            actions.click()
            actions.perform()
            return True
        except Exception as e:
            print(f"    [Warning] Could not click {elem_id}: {e}")
            return False

    def type_text(self, elem_id, text):
        try:
            el = self.wait.until(EC.presence_of_element_located((By.ID, elem_id)))
            actions = ActionChains(self.driver)
            
            print(f"    -> Moving mouse to input: {elem_id}")
            actions.move_to_element(el)
            actions.pause(random.uniform(0.5, 1.5))
            
            print(f"    -> Clicking to focus input: {elem_id}")
            actions.click()
            actions.perform()
            
            el.clear()
            print(f"    -> Typing text into: {elem_id}")
            el.send_keys(text)
        except Exception as e:
             print(f"    [Warning] Could not type in {elem_id}: {e}")

    # --- STAGE HANDLERS ---

    def handle_new_user(self):
        print(">>> Spawning NEW User with CHAOS...")
        if not self.navigate_to_app(): return

        self.driver.execute_script("window.localStorage.clear();")
        self.driver.refresh()

        # 1. Chaos: Dead Click on Help Icon (50% chance)
        if random.random() < 0.5:
            self.dead_click("dead-click-help")

        # 2. Chaos: Thrash Income Input (30% chance)
        if random.random() < 0.3:
            self.thrash_input("income", "100", "75000")
        else:
            self.type_text("income", "75000")

        self.type_text("applicantName", f"Auto User {random.randint(1000, 9999)}")

        # 3. Chaos: Validation Error Loop (30% chance)
        # Enter bad email, click submit, get error, wait, fix email
        if random.random() < 0.3:
            print("    [CHAOS] Triggering Validation Error...")
            self.type_text("email", "invalid-email-format") # Missing @
            self.type_text("loanAmount", "20000")
            self.click("btn-submit-application") # This will trigger the Red Error
            time.sleep(2) # User "reads" the error
            self.type_text("email", f"auto{random.randint(1000,9999)}@test.com") # Fix it
        else:
             self.type_text("email", f"auto{random.randint(1000,9999)}@test.com")
             self.type_text("loanAmount", "20000")

        # 4. Chaos: Rage Click Submit (30% chance)
        if random.random() < 0.3:
            self.rage_click("btn-submit-application")
        else:
            self.click("btn-submit-application")
        
        time.sleep(2) 
        
        state = self.extract_state()
        if state and state['status'] != 'application': # Ensure we actually moved forward
            new_record = {
                "id": state['id'],
                "status": "pre_approval",
                "next_action_due": self.get_due_time("application"),
                "state_data": state
            }
            self.data.append(new_record)
            print(f"    Created User {state['id']}")
        else:
            print("    User failed to progress past application (likely validation stuck).")

    def handle_documents(self, record):
        print(f">>> Processing Documents for {record['id']}")
        self.inject_state(record['state_data'])
        
        if self.click("btn-upload-docs"):
            time.sleep(5) 
            new_state = self.extract_state()
            record['state_data'] = new_state
            record['status'] = new_state['status']
            record['next_action_due'] = self.get_due_time("documents")
            print(f"    Moved to {record['status']}")

    def handle_underwriting(self, record):
        print(f">>> Processing Underwriting for {record['id']}")
        self.inject_state(record['state_data'])

        if random.random() < 0.10: 
            print(f"    DISQUALIFIED: User {record['id']} failed underwriting.")
            record['status'] = STATUS_DISQUALIFIED
            record['next_action_due'] = "DONE (Disqualified)"
            self.driver.execute_script(f"window.localStorage.setItem('swiftloan_demo_state', JSON.stringify({{...JSON.parse(window.localStorage.getItem('swiftloan_demo_state')), status: '{STATUS_DISQUALIFIED}'}}));")
            time.sleep(2)
            return

        try:
            btn = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Force: Server Approves')]")
            actions = ActionChains(self.driver)
            
            print("    -> Moving mouse to 'Force: Server Approves' button")
            actions.move_to_element(btn)
            actions.pause(1.5)
            
            print("    -> Clicking 'Force: Server Approves'")
            actions.click()
            actions.perform()
            time.sleep(2)
            
            new_state = self.extract_state()
            record['state_data'] = new_state
            record['status'] = new_state['status']
            record['next_action_due'] = self.get_due_time("underwriting")
            print(f"    Approved! Moved to {record['status']}")
        except Exception as e:
            print(f"    Failed to force approval: {e}")

    def handle_closing(self, record):
        print(f">>> Closing Loan for {record['id']}")
        self.inject_state(record['state_data'])

        if self.click("btn-accept-offer"):
            time.sleep(1)
            checkboxes = self.driver.find_elements(By.CSS_SELECTOR, "input[type='checkbox']")
            actions = ActionChains(self.driver)
            for i, cb in enumerate(checkboxes):
                print(f"    -> Moving mouse to checkbox {i+1}...")
                actions.move_to_element(cb)
                actions.pause(random.uniform(0.5, 1.0))
                print(f"    -> Clicking checkbox {i+1}...")
                actions.click()
                actions.perform()
            
            self.click("btn-sign-close")
            time.sleep(2)
            print(f"    LOAN DISBURSED. Archiving.")
            record['status'] = 'disbursed'
            record['next_action_due'] = "DONE (Disbursed)"

    # --- MAIN LOOP ---

    def run(self):
        try:
            options = webdriver.ChromeOptions()
            options.add_argument("--remote-allow-origins=*")
            if HEADLESS:
                options.add_argument('--headless')
                options.add_argument('--window-size=1920,1080')
                options.add_argument('--no-sandbox')
                options.add_argument('--disable-dev-shm-usage')
            
            service = Service(ChromeDriverManager().install())
            
            print(">>> Initializing Chrome Driver...")
            self.driver = webdriver.Chrome(service=service, options=options)
            self.driver.set_page_load_timeout(30)
            self.wait = WebDriverWait(self.driver, 10)

            now = datetime.now().isoformat()
            
            active_users = [
                u for u in self.data 
                if u['status'] != 'disbursed' and 
                   u['status'] != STATUS_DISQUALIFIED and 
                   u['next_action_due'] != "DONE (Disbursed)" and 
                   u['next_action_due'] != "DONE (Disqualified)"
            ]
            
            print(f"--- Run Start: {len(active_users)} active users in DB ---")
            action_taken = False

            for user in active_users:
                if user['next_action_due'] < now:
                    action_taken = True
                    stage = user['state_data']['status']
                    
                    if stage in ['application', 'pre_approval']:
                        user['state_data']['status'] = 'documents'
                        self.handle_documents(user)
                    elif stage == 'documents':
                         self.handle_documents(user)
                    elif stage == 'underwriting':
                        self.handle_underwriting(user)
                    elif stage == 'approval_offer':
                        self.handle_closing(user)

            should_create_new = len(active_users) == 0 or (len(active_users) < 5 and random.random() < 0.5)
            
            if should_create_new:
                self.handle_new_user()
                action_taken = True
            
            if not action_taken:
                print("--- No actions due and no new user created ---")

            self.save_db()

        except Exception as e:
            print(f"CRITICAL ERROR: {e}")
            traceback.print_exc() 
        finally:
            self.clear_browser_cache()
            print("Closing session...")
            if self.driver:
                self.driver.quit()

if __name__ == "__main__":
    manager = LifecycleManager()
    manager.run()