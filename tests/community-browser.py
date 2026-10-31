"""Comment moderation, editable profiles/services, header and feed refresh on disposable fixture."""
import json
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright, expect
BASE='http://localhost:3100'
OUT=Path('evidence/upgrade')
creds=json.loads(Path('/tmp/grow-browser-tests/credentials.json').read_text())
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/google-chrome')
 context=b.new_context(viewport={'width':1440,'height':1000});page=context.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE);page.wait_for_load_state('networkidle');page.get_by_role('button',name='Reject optional').click()
 assert page.locator('.header-home .brand img').bounding_box()['width']==128
 page.evaluate('window.scrollTo(0,1000)');page.wait_for_timeout(400)
 expect(page.locator('.smart-header')).to_have_class('header-shell smart-header header-home-past header-hidden header-scrolled')
 page.evaluate('window.scrollBy(0,-2)');page.wait_for_timeout(350)
 assert 'header-hidden' not in page.locator('.smart-header').get_attribute('class')
 assert 'header-shell' in page.locator('.smart-header').get_attribute('class')
 page.set_viewport_size({'width':390,'height':844});page.evaluate('window.scrollTo(0,0)');page.wait_for_timeout(300)
 assert page.locator('.header-home .brand img').bounding_box()['width']==112
 page.set_viewport_size({'width':1440,'height':1000});print('PASS: compact desktop/mobile hero logo and post-hero scroll header',flush=True)
 page.goto(BASE+'/about');page.wait_for_load_state('networkidle');expect(page.locator('.team-card')).to_have_count(6)
 link=page.get_by_role('link',name='Ijtiba Rana on LinkedIn (opens in a new tab)')
 expect(link).to_have_attribute('href','https://www.linkedin.com/in/ijtibarana/');assert link.locator('.social-logo').count()==1
 print('PASS: six team members and supplied LinkedIn URL/logo',flush=True)
 page.goto(BASE+'/blog/seo-foundations-for-service-businesses');page.wait_for_load_state('networkidle')
 panel=page.locator('.comment-panel');confirm=panel.get_by_role('checkbox');submit=panel.get_by_role('button',name='Send for approval')
 expect(confirm).to_be_disabled();expect(submit).to_be_disabled()
 # Intercept explicit social clicks so this test neither loads nor interacts with third-party accounts.
 def social_page(route):
  if urlparse(route.request.url).netloc != 'localhost:3100': route.fulfill(status=200,body='<title>Social profile test destination</title>')
  else: route.continue_()
 context.route('**/*',social_page)
 follow=panel.locator('.comment-follow-links a');assert follow.count()==5
 for link in follow.all():
  target=link.get_attribute('href')
  with page.expect_popup() as pop:link.click()
  popup=pop.value;popup.wait_for_url(lambda url: url != 'about:blank');popup.wait_for_load_state('domcontentloaded');assert popup.url.rstrip('/')==target.rstrip('/'),(popup.url,target);popup.close()
 expect(confirm).to_be_enabled();confirm.check()
 panel.get_by_label('Your name').fill('Community Browser Reader')
 panel.get_by_label('Email address').fill('community-browser@example.com')
 panel.get_by_label('Your comment').fill('Please visit https://example.com for more information.')
 submit.click();expect(panel.get_by_role('alert')).to_contain_text('Please remove links')
 panel.get_by_label('Your comment').fill('This helped me plan a clearer brief. What would you recommend doing first with a small team?')
 submit.click();expect(panel.get_by_role('status')).to_contain_text('waiting for approval')
 expect(page.locator('.published-comments article')).to_have_count(0)
 print('PASS: five explicit new-tab links, self-confirmation, no-link validation and pending submission',flush=True)
 admin=context.new_page();admin.goto(BASE+'/admin');admin.get_by_label('Email address').fill(creds['email']);admin.get_by_label('Password',exact=True).fill(creds['password']);admin.get_by_role('button',name='Sign in securely').click()
 nav=admin.get_by_role('navigation',name='Admin navigation')
 nav.get_by_role('button',name='Blog comments',exact=True).click();admin.get_by_role('button',name='Community Browser Reader',exact=True).click()
 expect(admin.get_by_role('combobox',name='Moderation',exact=True)).to_have_value('pending')
 assert admin.get_by_role('combobox',name='Article *',exact=True).input_value()
 admin.get_by_role('combobox',name='Moderation',exact=True).select_option('approved');admin.get_by_role('button',name='Save changes',exact=True).click()
 expect(admin.get_by_role('button',name='Community Browser Reader',exact=True)).to_be_visible()
 page.reload();expect(page.locator('.published-comments article')).to_have_count(1);expect(page.locator('.published-comments')).to_contain_text('Community Browser Reader')
 assert 'community-browser@example.com' not in page.content()
 print('PASS: CMS approval publishes comment with email kept private',flush=True)
 nav.get_by_role('button',name='Our team',exact=True).click();admin.get_by_role('button',name='Ijtiba Rana',exact=True).click()
 admin.get_by_label('LinkedIn profile',exact=True).fill('https://www.linkedin.com/in/fixture-team-profile/')
 admin.get_by_role('button',name='Save changes',exact=True).click();expect(admin.get_by_role('button',name='Ijtiba Rana',exact=True)).to_be_visible()
 page.goto(BASE+'/about');expect(page.get_by_role('link',name='Ijtiba Rana on LinkedIn (opens in a new tab)')).to_have_attribute('href','https://www.linkedin.com/in/fixture-team-profile/')
 print('PASS: CMS social link changes appear on About',flush=True)
 nav.get_by_role('button',name='Services',exact=True).click();admin.get_by_role('button',name='Technical SEO',exact=True).click()
 steps=admin.get_by_role('group',name='Delivery steps',exact=True);steps.get_by_label('Description or answer').first.fill('A browser-tested technical audit that starts with crawl access.')
 questions=admin.get_by_role('group',name='Service questions',exact=True);questions.get_by_label('Description or answer').first.fill('A browser-tested answer for a useful service question.')
 admin.get_by_role('button',name='Save changes',exact=True).click();expect(admin.get_by_role('button',name='Technical SEO',exact=True)).to_be_visible()
 page.goto(BASE+'/services/technical-seo');expect(page.get_by_text('A browser-tested technical audit that starts with crawl access.',exact=True)).to_be_visible()
 page.locator('.service-questions summary').first.click();expect(page.get_by_text('A browser-tested answer for a useful service question.',exact=True)).to_be_visible()
 print('PASS: editable service steps/FAQs publish and expand',flush=True)
 # Browser clock makes the existing sixty-second update interval deterministic.
 page.clock.install();count=[0]
 def feed(route):
  count[0]+=1
  route.fulfill(json={'instagram':{'status':'connected','posts':[{'id':str(count[0]),'text':'Feed update '+str(count[0]),'kind':'post','url':'https://www.instagram.com/example/'}]}})
 page.route('**/api/social',feed);page.goto(BASE);page.wait_for_load_state('networkidle');expect(page.locator('.social-card p').filter(has_text='Feed update 1')).to_be_visible()
 page.clock.fast_forward(61000);expect(page.locator('.social-card p').filter(has_text='Feed update 2')).to_be_visible()
 print('PASS: foreground homepage refreshes social posts after sixty seconds',flush=True)
 assert not errors,errors
 print('PASS: no browser JavaScript errors',flush=True);b.close()
