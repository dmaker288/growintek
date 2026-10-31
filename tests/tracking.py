"""Exercise GA consent and production-origin gating without contacting Google."""
import json, os, re
from playwright.sync_api import sync_playwright
BASE=os.environ.get('TEST_BASE_URL','http://127.0.0.1:3100')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/google-chrome')
 for consent,canonical,path,expected in [(False,BASE,'/',0),(True,'https://growintek.example','/',0),(True,BASE,'/',1),(True,BASE,'/admin',0)]:
  context=browser.new_context()
  context.add_init_script('localStorage.setItem("grow-consent-v1",'+json.dumps(json.dumps({'analytics':consent,'media':False}))+')')
  calls=[]
  def stub_google(route):
   calls.append(route.request.url);route.fulfill(status=200,content_type='text/javascript',body='/* isolated GA transport fixture */')
  context.route('https://www.googletagmanager.com/**',stub_google)
  context.route('https://**google-analytics.com/**',lambda route: route.abort())
  def site_fixture(route):
   response=route.fetch();html=response.text();match=re.search(r'(<script id="grow-data" type="application/json">)(.*?)(</script>)',html)
   payload=json.loads(match.group(2));payload['data']['settings']['siteUrl']=canonical;payload['data']['settings']['gaId']='G-TEST123'
   html=html[:match.start(2)]+json.dumps(payload).replace('<','\\u003c')+html[match.end(2):]
   route.fulfill(response=response,body=html)
  context.route(BASE+path,site_fixture)
  page=context.new_page();page.goto(BASE+path);page.wait_for_load_state('networkidle')
  assert len(calls)==expected,(consent,canonical,path,calls)
  if expected:
   commands=page.evaluate('Array.from(window.dataLayer||[],x=>Array.from(x))')
   assert any(c[:2]==['config','G-TEST123'] for c in commands)
  context.close()
 print('PASS: GA loads only with consent on the canonical public origin; no Google traffic sent.')
 browser.close()
