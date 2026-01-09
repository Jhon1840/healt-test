from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import WebDriverException
import sys

URL = "https://intramax.bo"

options = Options()
options.add_argument("--headless")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")

try:
    driver = webdriver.Chrome(options=options)
    driver.set_page_load_timeout(15)
    driver.get(URL)

    print("OK - Sitio accesible")
    print("Título:", driver.title)

    driver.quit()
    sys.exit(0)

except WebDriverException as e:
    print("ERROR - Sitio no disponible")
    print(str(e))
    sys.exit(1)
