import json
import os
import re
import time
from playwright.sync_api import sync_playwright

BASE_URL='https://qurantales.up.railway.app'
START_URL=BASE_URL+'/#/quran/1'
SCRIPT_DIR=os.path.dirname(os.path.abspath(__file__))
OUT_DIR=os.path.join(SCRIPT_DIR,'results','live'); os.makedirs(OUT_DIR, exist_ok=True)
VIEWPORTS=[('iphone13',390,844),('pixel7',412,915)]
PAGES=[('stories','Stories','قصص'),('quran','The Quran','القرآن'),('live','Learn with Soso','اتعلم مع سوسو'),('kids','Kids','الأطفال'),('library','Library','المكتبة'),('tools','Tools','أدوات')]

PAGE_PROBES={
  'stories': {'hash': ['#/story/'], 'markers_en': ['Choose a Prophet', 'Begin Journey', 'Quick Pick'], 'markers_ar': ['اختر نبيًا', 'ابدأ الرحلة', 'اختيار سريع']},
  'quran': {'hash': ['#/quran', '#/verse/'], 'markers_en': ['The Noble Quran', 'Search Surahs'], 'markers_ar': ['القرآن الكريم', 'ابحث في السور']},
  'live': {'hash': [], 'markers_en': ['Personal Tutor', 'Choose Your Learning Guide', 'Start General Session'], 'markers_ar': ['المعلّم الشخصي', 'اختر معلّمك', 'ابدأ جلسة']},
  'kids': {'hash': ['#/kids'], 'markers_en': ['What do you want to learn today?', 'Prophet Stories', 'Arabic Letters'], 'markers_ar': ['عايز تتعلم إيه النهاردة؟', 'قصص الأنبياء', 'الحروف']},
  'library': {'hash': [], 'markers_en': ['Prophet Stories Library', 'Read Full Story'], 'markers_ar': ['مكتبة قصص الأنبياء', 'اقرأ القصة كاملة']},
  'tools': {
    'hash': [],
    'markers_en': ['Islamic Tools', 'Prayer Times', 'Qibla', 'Location Required', 'Getting your location...', 'Try Again'],
    'markers_ar': ['أدوات إسلامية', 'مواقيت الصلاة', 'القبلة', 'الموقع مطلوب', 'جاري تحديد موقعك...', 'حاول مرة أخرى'],
  },
}


def click_first_visible(locator, timeout=2500):
  c=locator.count()
  for i in range(c):
    el=locator.nth(i)
    try:
      if el.is_visible():
        el.click(timeout=timeout)
        return True
    except Exception:
      pass
  return False


def close_popups(page):
  for lbl in ['Not now','ليس الآن','Got it!','تمام!']:
    click_first_visible(page.get_by_role('button', name=lbl), timeout=1200)


def is_mobile_nav_open(page):
  labels=['Egyptian Arabic','العربية المصرية','English','الإنجليزية']
  for lbl in labels:
    try:
      if page.get_by_role('button', name=lbl).first.is_visible(timeout=250):
        return True
    except Exception:
      pass
  return False


def open_menu(page):
  if is_mobile_nav_open(page):
    return True
  b=page.get_by_role('button', name=re.compile(r'Toggle menu|فتح القائمة', re.I))
  if click_first_visible(b):
    page.wait_for_timeout(250)
    return is_mobile_nav_open(page)
  return False


def click_nav_target(page,en,ar):
  live_patterns=[]
  if en=='Learn with Soso':
    live_patterns=[re.compile(r'Learn\s+with\s+Soso', re.I), re.compile(r'اتعلم\s*مع\s*سوسو')]

  candidates=[
    page.get_by_role('button', name=en),
    page.get_by_role('button', name=ar),
    page.get_by_role('button', name=re.compile(rf'^\s*{re.escape(en)}\s*$', re.I)),
    page.get_by_role('button', name=re.compile(rf'^\s*{re.escape(ar)}\s*$')),
    page.locator('button', has_text=re.compile(rf'^\s*{re.escape(en)}\s*$', re.I)),
    page.locator('button', has_text=re.compile(rf'^\s*{re.escape(ar)}\s*$')),
  ]
  for pat in live_patterns:
    candidates.append(page.get_by_role('button', name=pat))
    candidates.append(page.locator('button', has_text=pat))

  for c in candidates:
    if click_first_visible(c):
      page.wait_for_timeout(900)
      close_popups(page)
      return True
  return False


def page_state(page):
  return page.evaluate('''() => {
    const hash = window.location.hash || '';
    const text = (document.body?.innerText || '').replace(/\\s+/g,' ').trim();
    const lang = (document.documentElement.lang || '').toLowerCase();
    return { hash, text: text.slice(0, 12000), lang };
  }''')


def page_matches(page, key, locale):
  st=page_state(page)
  probes=PAGE_PROBES[key]

  if probes['hash']:
    for prefix in probes['hash']:
      if st['hash'].startswith(prefix):
        return True, f'hash:{prefix}'

  markers=(probes['markers_ar'] if locale=='ar' else probes['markers_en']) + probes['markers_en'] + probes['markers_ar']
  hit=[m for m in markers if m and m in st['text']]
  if hit:
    return True, f'marker:{hit[0]}'

  return False, f'no-marker hash={st["hash"]}'


def wait_for_page(page, key, locale, timeout_ms=3200):
  deadline=time.time() + timeout_ms/1000.0
  last_reason='timeout'
  while time.time() < deadline:
    ok,reason=page_matches(page,key,locale)
    if ok:
      return True,reason
    last_reason=reason
    page.wait_for_timeout(180)
  return False,last_reason


def nav(page,key,en,ar,locale):
  ok,reason=wait_for_page(page,key,locale,timeout_ms=400)
  if ok:
    return True,f'already:{reason}'

  if not open_menu(page):
    return False,'menu button not found'

  if not click_nav_target(page,en,ar):
    return False,f'view button not found {en}/{ar}'

  ok,reason=wait_for_page(page,key,locale)
  if ok:
    return True,f'ok-menu:{reason}'
  return False,f'clicked-but-not-on-target:{reason}'


def detect_locale(page):
  st=page_state(page)
  if st['lang'].startswith('ar'):
    return 'ar'
  if any(x in st['text'] for x in ['القرآن','قصص','الأطفال','اتعلم مع سوسو','أدوات']):
    return 'ar'
  return 'en'


def toggle_lang(page, target='ar'):
  def click_lang_option():
    if target=='ar':
      options=['Egyptian Arabic','العربية المصرية']
    else:
      options=['English','الإنجليزية']
    for name in options:
      if click_first_visible(page.get_by_role('button', name=name)):
        page.wait_for_timeout(1100)
        close_popups(page)
        return True,f'clicked {name}'
    return False,'language option not found'

  if detect_locale(page)==target:
    return True,'already-target-locale'

  if not open_menu(page):
    return False,'menu button not found'
  ok,msg=click_lang_option()
  if ok and detect_locale(page)==target:
    return True,msg+'-menu'
  return False,'locale did not change'


def audit(page):
  return page.evaluate('''() => {
    const doc=document.scrollingElement||document.documentElement;
    const docOv=doc.scrollHeight-doc.clientHeight;
    const before=doc.scrollTop; doc.scrollTop=Math.min(Math.max(0,docOv), before+320); const after=doc.scrollTop; doc.scrollTop=before;
    const moved=after!==before;
    const scrollables=[...document.querySelectorAll('body *')].filter(el=>{const oy=getComputedStyle(el).overflowY; return (oy==='auto'||oy==='scroll'||oy==='overlay')&&el.scrollHeight-el.clientHeight>20&&el.clientHeight>80;});
    scrollables.sort((a,b)=>b.clientHeight*b.clientWidth-a.clientHeight*a.clientWidth);
    let bestOv=0,bestMoved=false;
    if(scrollables[0]){const el=scrollables[0];bestOv=el.scrollHeight-el.clientHeight;const b=el.scrollTop;el.scrollTop=Math.min(Math.max(0,bestOv),b+320);const a=el.scrollTop;el.scrollTop=b;bestMoved=a!==b;}
    const hasH=Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)>window.innerWidth+1;
    const req=docOv>20||bestOv>20;
    return {url:location.href, docOverflow:docOv,bestOverflow:bestOv,requiresVerticalScroll:req,verticalScrollWorks:(!req)||moved||bestMoved,hasHorizontalOverflow:hasH,dir:document.querySelector('[dir]')?.getAttribute('dir')||null};
  }''')


all_results=[]; all_errors=[]
with sync_playwright() as p:
  browser=p.chromium.launch(headless=True)
  for vp,w,h in VIEWPORTS:
    ctx=browser.new_context(viewport={'width':w,'height':h},locale='en-US')
    ctx.add_init_script("localStorage.setItem('alayasoad_language_selected','true'); localStorage.setItem('alayasoad_language','en'); localStorage.removeItem('alayasoad_parent_token'); localStorage.removeItem('alayasoad_parent_name');")
    page=ctx.new_page()
    page.on('console', lambda msg,vp=vp: all_errors.append({'viewport':vp,'error':f'console:{msg.type}:{msg.text}'}) if msg.type=='error' else None)
    page.on('pageerror', lambda err,vp=vp: all_errors.append({'viewport':vp,'error':f'pageerror:{err}'}))
    page.goto(START_URL, wait_until='domcontentloaded', timeout=60000); page.wait_for_timeout(2600); close_popups(page)

    for key,en,ar in PAGES:
      ok,msg=nav(page,key,en,ar,'en')
      a=audit(page)
      shot=f'{OUT_DIR}/{vp}_en_{key}.png'; page.screenshot(path=shot, full_page=True)
      all_results.append({'viewport':vp,'locale':'en','page':key,'nav_ok':ok,'nav_msg':msg,'audit':a,'screenshot':shot})

    ok,msg=toggle_lang(page,target='ar'); loc=detect_locale(page)
    all_results.append({'viewport':vp,'locale':'meta','page':'language_toggle','nav_ok':ok,'nav_msg':msg,'audit':{'detected_locale_after_toggle':loc},'screenshot':None})

    for key,en,ar in PAGES:
      ok,msg=nav(page,key,en,ar,'ar')
      a=audit(page)
      shot=f'{OUT_DIR}/{vp}_ar_{key}.png'; page.screenshot(path=shot, full_page=True)
      all_results.append({'viewport':vp,'locale':'ar','page':key,'nav_ok':ok,'nav_msg':msg,'audit':a,'screenshot':shot})

    ctx.close()
  browser.close()

issues=[]
for it in all_results:
  if it['locale']=='meta':
    if (not it['nav_ok']) or it['audit'].get('detected_locale_after_toggle')!='ar': issues.append({'type':'language_toggle','item':it})
    continue
  if not it['nav_ok']:
    issues.append({'type':'navigation','item':it})
    continue
  a=it['audit']
  if a.get('requiresVerticalScroll') and not a.get('verticalScrollWorks'): issues.append({'type':'scroll','item':it})
  if a.get('hasHorizontalOverflow'): issues.append({'type':'horizontal_overflow','item':it})

report={'timestamp':time.time(),'base_url':BASE_URL,'results':all_results,'console_errors':all_errors,'issues':issues}
path=f'{OUT_DIR}/qa_report.json'; open(path,'w',encoding='utf-8').write(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({'total_checks':len(all_results),'issues_count':len(issues),'console_error_count':len(all_errors),'report_file':path,'screenshots_dir':OUT_DIR},ensure_ascii=False,indent=2))
