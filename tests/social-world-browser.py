"""Reference social layout: isolated UI tests with deterministic provider items."""
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright,expect
BASE='http://localhost:4173'
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/google-chrome');context=b.new_context(viewport={'width':1672,'height':1100});page=context.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 def feed(route):
  data={}
  for channel in ['facebook','instagram','youtube']:
   items=[]
   for i in range(6):
    video=channel=='youtube' or i>=3
    items.append({'id':channel+str(i),'text':f'{channel.title()} '+('video' if video else 'post')+f' {i+1}','url':f'https://www.{channel}.com/'+('watch?v=abcdefghijk' if channel=='youtube' else f'growintek/{i}/'),'image':BASE+'/images/blog-seo-foundations-for-service-businesses.webp','date':f'2026-10-{30-i:02d}T12:00:00Z','kind':'video' if channel=='youtube' else 'reel' if video else 'post',**({'embedId':'abcdefghijk'} if channel=='youtube' else {})})
   data[channel]={'status':'connected','posts':items}
  route.fulfill(json=data)
 page.route('**/api/social',feed)
 page.goto(BASE);page.wait_for_load_state('networkidle');page.get_by_role('button',name='Reject optional').click()
 expect(page.get_by_role('heading',name='Our Social Posts',exact=True)).to_be_visible();expect(page.get_by_role('heading',name='Our Videos & Shorts',exact=True)).to_be_visible()
 expect(page.locator('.sw-post-card')).to_have_count(6);expect(page.locator('.sw-video-card')).to_have_count(12)
 assert page.locator('.sw-preview>img').count()==0;assert page.locator('iframe').count()==0
 posts=page.get_by_role('group',name='Filter posts by platform');videos=page.get_by_role('group',name='Filter videos by platform')
 posts.get_by_role('button',name='Facebook',exact=True).click();expect(page.locator('.sw-post-card')).to_have_count(3);expect(page.locator('.sw-video-card')).to_have_count(12)
 videos.get_by_role('button',name='YouTube',exact=True).click();expect(page.locator('.sw-video-card')).to_have_count(6)
 rail=page.locator('.sw-videos .sw-card-rail');page.get_by_role('button',name='Next videos',exact=True).click();page.wait_for_timeout(550);assert rail.evaluate('(e)=>e.scrollLeft')>20
 page.get_by_role('button',name='Previous videos',exact=True).click();page.wait_for_timeout(550);assert rail.evaluate('(e)=>e.scrollLeft')<10
 print('PASS: separate panels, independent filters, video carousel and opt-in media',flush=True)
 # All artwork targets and subscription open the configured external URL immediately.
 context.route('https://www.youtube-nocookie.com/**',lambda r:r.fulfill(body='<title>Isolated video player</title>'))
 def external(route):
  if urlparse(route.request.url).netloc not in ['localhost:4173','www.youtube-nocookie.com']:route.fulfill(body='<title>Social destination</title>')
  else:route.fallback()
 context.route('**/*',external)
 for width in [1672,1440,1024,768,390,320]:
  page.set_viewport_size({'width':width,'height':1000});page.wait_for_timeout(150)
  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),width
  for link in page.locator('.sw-art-link').all():
   link.scroll_into_view_if_needed()
   box=link.bounding_box();assert box['x']>=0 and box['x']+box['width']<=width,(width,box)
   with page.expect_popup() as pop:link.click()
   popup=pop.value;popup.wait_for_url(lambda url:url!='about:blank');assert popup.url.rstrip('/')==link.get_attribute('href').rstrip('/');popup.close()
 print('PASS: mapped artwork opens all three configured social URLs at six widths',flush=True)
 page.set_viewport_size({'width':1440,'height':1000});page.locator('.sw-enable-media').first.click()
 page.get_by_label('Allow external social media content').check();page.get_by_role('button',name='Save without analytics').click()
 expect(page.locator('.sw-preview>img').first).to_be_visible();assert page.locator('iframe').count()==0
 play=page.get_by_role('button',name='Play Youtube video 1',exact=True);play.click()
 dialog=page.get_by_role('dialog');expect(dialog).to_be_visible();expect(dialog.locator('iframe')).to_have_attribute('src','https://www.youtube-nocookie.com/embed/abcdefghijk?autoplay=1')
 page.keyboard.press('Escape');expect(dialog).not_to_be_visible();assert page.locator('iframe').count()==0;expect(play).to_be_focused()
 print('PASS: consent-gated YouTube playback, Escape, focus return and player cleanup',flush=True)
 page.clock.install();calls=[0]
 def updated_feed(route):
  calls[0]+=1
  route.fulfill(json={'instagram':{'status':'connected','posts':[{'id':str(calls[0]),'text':'Fresh social update '+str(calls[0]),'kind':'post','url':'https://www.instagram.com/growintek/','date':'2026-10-31'}]}})
 page.route('**/api/social',updated_feed);page.goto(BASE);page.wait_for_load_state('networkidle')
 expect(page.locator('.sw-post-copy>p')).to_have_text('Fresh social update 1')
 page.clock.fast_forward(61000);expect(page.locator('.sw-post-copy>p')).to_have_text('Fresh social update 2')
 print('PASS: separate-panel layout retains automatic sixty-second feed refresh',flush=True)
 assert not errors,errors
 print('PASS: no browser JavaScript errors',flush=True);b.close()
