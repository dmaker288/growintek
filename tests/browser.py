import json, os, time
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
BASE=os.environ.get('TEST_BASE_URL','http://localhost:3100')
creds=json.loads(Path('/tmp/grow-browser-tests/credentials.json').read_text())
out=Path('evidence/upgrade');out.mkdir(parents=True,exist_ok=True)
results=[]; errors=[]
def mark(name):
 results.append(name);print('PASS:',name,flush=True)
def scroll_images(page):
 page.evaluate("document.querySelectorAll('img[loading=lazy]').forEach(i=>i.loading='eager')")
 page.locator('img').evaluate_all('(images)=>Promise.all(images.map(i=>i.decode().catch(()=>{})))')
 page.evaluate('window.scrollTo(0,0)');page.wait_for_timeout(200)
def no_overflow(page):
 assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'), page.url+' overflows'
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/google-chrome')
 context=browser.new_context(viewport={'width':1440,'height':1000},device_scale_factor=1)
 page=context.new_page()
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE);page.wait_for_load_state('networkidle')
 expect(page.get_by_role('heading',level=1)).to_be_visible()
 page.get_by_role('button',name='Reject optional').click()
 seed=json.loads(Path('shared/seed.json').read_text())
 routes=['/','/about','/services','/seo','/portfolio','/blog','/contact']
 for kind,prefix in [('services','services'),('portfolio','portfolio'),('posts','blog')]:
  routes.extend('/'+prefix+'/'+d['slug'] for d in seed[kind] if d.get('status')=='published')
 routes.extend('/'+d['slug'] for d in seed['pages'] if d.get('status')=='published' and '/'+d['slug'] not in routes and d['slug']!='home')
 for path in routes:
  response=page.goto(BASE+path);page.wait_for_load_state('networkidle');assert response.status==200,path
  assert page.locator('h1').count()==1,path
  assert '\\n' not in page.locator('h1').inner_text(),path
  scroll_images(page)
  broken=page.evaluate("Array.from(document.images).filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.src)")
  assert not broken,str(broken)
  no_overflow(page)
  if path in ['/','/contact','/portfolio','/blog']:page.screenshot(path=str(out/f"{path.strip('/') or 'home'}-desktop.png"),full_page=True)
 mark(f'{len(routes)} public routes: HTTP 200, one H1, loaded images, no desktop overflow')
 response=page.goto(BASE+'/blog/not-a-real-article');assert response.status==404
 expect(page.get_by_role('heading',name='This page has moved out of view.')).to_be_visible();mark('Unknown page returns a real 404')
 page.goto(BASE+'/portfolio');page.get_by_role('button',name='E-commerce Platform',exact=True).click();expect(page.locator('.work-card')).to_have_count(1);mark('Portfolio category filter')
 page.goto(BASE+'/blog');page.get_by_role('textbox',name='Search insights').fill('automation');assert page.locator('.post-card').count()>=1
 page.get_by_role('textbox',name='Search insights').fill('zzzz-no-result');expect(page.get_by_role('heading',name='No matching insights yet.')).to_be_visible();page.get_by_role('button',name='Show all insights').click();expect(page.locator('.post-card')).to_have_count(3);mark('Blog search, empty state and reset')
 page.goto(BASE+'/contact?service=Web%20Development');expect(page.get_by_label('What can we help with?')).to_have_value('Web Development')
 page.get_by_label('Your name').fill('Browser Test Lead');page.get_by_label('Email address').fill('browser-lead@example.com');page.get_by_label('Company',exact=True).fill('Test Studio');page.get_by_label('Tell us about your project').fill('We need a responsive website with a clear services section and inquiry workflow.');page.get_by_label('I agree to the').check();page.get_by_role('button',name='Send Your Inquiry').click();expect(page.get_by_role('heading',name='We have your idea.')).to_be_visible();mark('Contact form persists lead and confirms success')
 for width in [320,390,768,1024]:
  page.set_viewport_size({'width':width,'height':900})
  for route in ['/','/about','/services','/services/technical-seo','/portfolio','/blog','/blog/seo-foundations-for-service-businesses','/contact']:
   page.goto(BASE+route);page.wait_for_load_state('networkidle');scroll_images(page);no_overflow(page)
   if width==390 and route in ['/','/contact']:page.screenshot(path=str(out/f"{route.strip('/') or 'home'}-mobile.png"),full_page=True)
  if width<=768:
   page.get_by_role('button',name='Open navigation').click();expect(page.get_by_role('navigation',name='Main navigation')).to_be_visible();page.keyboard.press('Escape');expect(page.get_by_role('button',name='Open navigation')).to_be_focused()
 mark('Responsive public routes at 320, 390, 768 and 1024 pixels; mobile menu Escape')
 page.close();page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.set_viewport_size({'width':1440,'height':1000});page.goto(BASE+'/admin');page.wait_for_load_state('networkidle');expect(page.get_by_role('heading',name='Welcome back.')).to_be_visible();page.screenshot(path=str(out/'admin-login.png'),full_page=True)
 page.get_by_label('Email address').fill(creds['email']);page.get_by_label('Password',exact=True).fill(creds['password']);page.get_by_role('button',name='Sign in securely').click();expect(page.get_by_role('heading',name='Let’s move your business forward.')).to_be_visible();page.screenshot(path=str(out/'admin-overview.png'),full_page=True);mark('Secure admin sign-in')
 def nav(name):
  page.get_by_role('navigation',name='Admin navigation').get_by_role('button',name=name,exact=True).click();page.wait_for_load_state('networkidle')
 nav('Leads');expect(page.get_by_role('button',name='Browser Test Lead',exact=True).first).to_be_visible();mark('Submitted lead appears in admin')
 nav('Blog posts');page.get_by_role('button',name='+ Create post').click();page.locator('#field-title').fill('Browser-tested editorial draft');page.get_by_role('button',name='Generate from title').click();page.locator('#field-content').fill('## A useful idea\n\nThis is a browser test of the content editor and preview. '+('A practical sentence about the reader and their needs. '*10));page.get_by_role('button',name='Preview',exact=True).click();expect(page.get_by_role('heading',name='A useful idea')).to_be_visible();page.get_by_role('button',name='Save changes',exact=True).click();expect(page.get_by_role('button',name='Browser-tested editorial draft',exact=True)).to_be_visible();mark('CMS creates a persistent draft and renders Markdown preview')
 page.reload();expect(page.get_by_role('heading',name='Let’s move your business forward.')).to_be_visible();nav('Blog posts');expect(page.get_by_role('button',name='Browser-tested editorial draft',exact=True)).to_be_visible()
 page.get_by_role('button',name='Browser-tested editorial draft',exact=True).click();page.get_by_label('Publication status').select_option('published');page.get_by_role('button',name='Save changes',exact=True).click();expect(page.get_by_role('button',name='Browser-tested editorial draft',exact=True)).to_be_visible()
 public=context.new_page();response=public.goto(BASE+'/blog/browser-tested-editorial-draft');assert response.status==200;expect(public.get_by_role('heading',level=1)).to_have_text('Browser-tested editorial draft');public.close();mark('Saved content survives reload and publishes to a crawlable URL')
 nav('Clients');page.get_by_role('button',name='+ Create client').click();page.locator('#field-name').fill('Browser Test Client');page.locator('#field-email').fill('browser-client@example.com');page.get_by_label('Company',exact=True).fill('Browser Studio');page.get_by_role('button',name='Save changes',exact=True).click();expect(page.get_by_role('button',name='Browser Test Client',exact=True)).to_be_visible()
 nav('Invoices');page.get_by_role('button',name='+ Create invoice').click();page.locator('#field-clientId').select_option(label='Browser Studio — browser-client@example.com');page.get_by_label('Description',exact=True).fill('Website discovery');page.get_by_label('Quantity').fill('2');page.get_by_label('Unit price').fill('250');page.get_by_label('Tax rate (%)').fill('10');expect(page.locator('.invoice-total strong')).to_have_text('Total $550.00');page.get_by_role('button',name='Save changes',exact=True).click();page.get_by_role('button',name='Print',exact=True).first.click();expect(page.get_by_role('dialog',name='Invoice print preview')).to_be_visible();expect(page.locator('.invoice-total strong')).to_have_text('Total due $550.00');page.screenshot(path=str(out/'invoice-preview.png'),full_page=True);page.get_by_role('button',name='Close preview').click();mark('Client creation, invoice line totals and print preview')
 for tab in ['Pages','Services','Portfolio','Analytics','SEO health','Keyword research','AI publishing','Integrations','Site settings']:
  nav(tab);no_overflow(page)
  if tab == 'Analytics':
   expect(page.locator('.admin-error')).to_contain_text('Set GA4_PROPERTY_ID')
  else:
   assert page.locator('.admin-error').count()==0,tab
  if tab in ['AI publishing','Integrations','SEO health']:page.screenshot(path=str(out/f"admin-{tab.lower().replace(' ','-')}.png"),full_page=True)
 mark('All admin sections load with real data and honest connection states')
 nav('Homepage sections');page.get_by_role('button',name='+ Create section').click();page.locator('#field-title').fill('A browser-verified question?');page.locator('#field-description').fill('This question is managed from the CMS and appears on the homepage.');page.locator('#field-group').select_option('faq');page.get_by_role('button',name='Save changes',exact=True).click();expect(page.get_by_role('button',name='A browser-verified question?',exact=True)).to_be_visible()
 public=context.new_page();public.goto(BASE);expect(public.locator('summary').filter(has_text='A browser-verified question?')).to_be_visible();public.close();mark('CMS homepage sections update the public homepage')
 nav('Funds ledger');page.get_by_role('button',name='+ Create transaction').click();page.locator('#field-title').fill('Browser verified payment');page.locator('#field-type').select_option('income');page.locator('#field-amount').fill('1250.50');page.locator('#field-currency').select_option('PKR');page.get_by_role('button',name='Save changes',exact=True).click();expect(page.get_by_role('button',name='Browser verified payment',exact=True)).to_be_visible();nav('Funds');expect(page.locator('.funds-currencies')).to_contain_text('1,250.50');page.screenshot(path=str(out/'funds-desktop.png'),full_page=True);mark('Funds ledger persists PKR and displays separate balances')
 public=context.new_page();public.goto(BASE);public.locator('.social-channels').get_by_role('button',name='Instagram').click();public.locator('.social-filters').get_by_role('button',name='Reels',exact=True).click();expect(public.locator('.social-card')).to_have_count(1);expect(public.locator('.social-card-reel')).to_be_visible();assert public.locator('.social-card-art img').count()==0
 public.locator('.social-channels').get_by_role('button',name='YouTube').click();expect(public.locator('.social-card-video')).to_have_count(6);assert public.locator('iframe').count()==0;mark('Social channel/type filters and media consent boundaries')
 public.goto(BASE+'/blog/seo-foundations-for-service-businesses');public.wait_for_load_state('networkidle');headings=public.locator('.article-body .prose h2').all_inner_texts();assert len(headings)==5 and all(len(x)<70 for x in headings),headings
 public.get_by_role('navigation',name='Article contents').get_by_role('link').first.click();assert '#section-' in public.url;public.screenshot(path=str(out/'article-desktop.png'),full_page=True);public.set_viewport_size({'width':390,'height':844});no_overflow(public);public.screenshot(path=str(out/'article-mobile.png'),full_page=True);public.close();mark('Article headings, contents navigation and mobile reading layout')

 page.set_viewport_size({'width':390,'height':844});page.get_by_role('button',name='Toggle admin navigation').click();nav('Overview');no_overflow(page);page.wait_for_timeout(300);page.screenshot(path=str(out/'admin-mobile.png'),full_page=True);mark('Responsive admin navigation and dashboard')
 assert not errors,errors
 mark('No browser JavaScript errors')
 browser.close()
Path('evidence/upgrade/browser-results.json').write_text(json.dumps({'checks':results,'errors':errors},indent=2))
