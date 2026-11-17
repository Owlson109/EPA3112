"""Build a searchable evidence reader from the editable local source data."""
from html import escape as esc
import re

def build_research(root,read,sources,reader,table):
    status=read('research_status.json');stats=status['stats'];audit=read('claim_audit.json')
    stats={**stats,'claims':len(audit),'document_entries':sum(s['id'].startswith('D') for s in sources)}
    def links(ids):return ' · '.join('<a href="appendix.html#'+sid+'">'+sid+'</a>' for sid in ids.split())
    body='<section class="research-stats">'+''.join(f'<div><b>{stats[key]}</b><span>{label}</span></div>' for key,label in [('document_entries','公開文件／網頁條目'),('retrieved_document_entries','已保存原文'),('reviewed_document_entries','已核相關頁'),('claims','主張核證項目')])+'</section>'
    body+='<section class="callout"><strong>檢索範圍與完成程度</strong><p>'+esc(status['scope'])+'</p><p>'+esc(status['limit'])+'</p><p class="meta">相對交接目錄新增'+str(stats.get('new_document_entries',0))+'項文件線索；包括本輪D100立法會會議紀錄及D101港專運動教育文章。目錄含中英文版本、索引及院校原文，條目數不是獨立政策數。O09是使用者於2026年11月17日提供的上司說明及補充，另列為轉述來源，不計入公開文件數。1986、2000等歷史全文已保存，未核讀者如實列作候選。</p><p><a href="data/sources.csv">來源目錄 CSV</a> · <a href="data/claim_audit.csv">主張核證 CSV</a> · <a href="data/search_log.json">檢索記錄 JSON</a> · <a href="data/timeline.csv">時間線 CSV</a></p></section>'
    body+='<section><div class="mini-toc"><a href="#findings">補證重點</a><a href="#cohorts">屆別及模式</a><a href="#numbers">統計口徑</a><a href="#catalog">文件目錄</a><a href="#audit">主張核證</a><a href="#gaps">待核文件</a></div></section>'
    findings=[
      ('本科教育目的已有直接依據','2016–18概覽與2016評審所載課程目標，均說明透過運動實踐連結基礎知識、培養興趣及職業相關能力；概覽亦明確連結升學、就業與終身學習。這回答教育用意，仍不是2014立項決策的逐項紀錄。','D12 D41'),
      ('2015：可引用的課程取捨考慮','職教報告§2.5及註3提到學生興趣與需要，並將本科列入新增及修訂科目。立法會會議紀錄§34、39記錄教育局說明課程組合會按持份者期望及社會經濟需要檢視。一般政策背景不能證明港專承接教院，或浸大特定屆別未供應的原因。','D09 D100 D05'),
      ('2000–2006：制度前史','2009原版指引將2000教育改革、2001學會學習、2003試點及2005／2006文件連在一起。2006報告§2.19明訂由2006–08試點屆別起使用「應用學習」名稱。','D64 D35'),
      ('2014–2016：供應與考試數據','課程名單可以證明各校供應屆別；2016考評局統計另提供本科報考與符合出席要求考生人數。這些不同口徑不構成接辦或畢業率證據。','D05 D06 D87'),
      ('2015–2017：資助有連續文件可追','2015報告§6.39提出100%學校津貼；2016施政報告接納方向；同年預算答覆明列2016/17開始；2017文件回顧已實施。','D09 D10 D11 D68'),
      ('2018以後：評級與QF分開','2017更新指引載明2018 DSE起的三個匯報級別。2025考評簡介及2026-11-16查閱的教育局現行頁面仍列三個級別；2025政府回覆表示正在探討優化匯報。研究報告提出5**不代表政策已實施。','D56 D86 D52 D31'),
      ('2020–2023：由建議追到落實','兩份2020報告提供不同建議；118/2021通函列行政安排。2023政府進度報告§16確認中四開課、第四選修資助、延伸及初中導引等措施已落實並恆常化。','D17 D57 D20 D95'),
      ('場地與升學：能定位文件，不能倒推首次','2016–18概覽的模式一場地列何文田及馬鞍山兩校園，2019–21概覽已只列馬鞍山兩校園。D101解釋後期運動學士課程及獎學金的路徑理念，可以補充後續選擇；不能倒推為2014年ApL開辦原因。','D12 D15 D101'),
      ('2025–2029：保留課綱原稱','2025–27概覽列瑜伽，2026–28概覽列運動伸展，2026–28課綱及2027–29概覽列伸展運動。新舊總課時同為180，結構由八部分變七部分。','D91 D90 D36 D73'),
      ('改為運動伸展：上司說明經Nelson轉述','Nelson於2026年11月17日補充，上司解釋調整旨在配合學校及市場需要，考慮學生對瑜伽名稱的接受程度及宗教因素，並讓名稱更清楚連結運動應用與技能。這是具來源的間接說明；沒有取得上司直接訪談、正式修訂通知或學生調查。','O09'),
      ('合理推論：調整亦涉及課程定位的表達','把文件中的名稱變化與O09所述考慮合看，可合理理解為課程嘗試用更清晰的運動用途回應學校及學生需要。這是本組的綜合推論，並非官方成效結論；不能據此斷定學生接受度或運動表現已改善。','D25 D36 D44 O09'),
      ('2025模式一：概覽月份與具體日期不同','2025–27概覽曾列中五2025年9月開課；2025年5月更新的具體模式一開課表列10月4日。Nelson的9月授課屬模式二，須分開記錄。','D91 D81 O04'),
      ('2026：最新整體資料的適用範圍','EDB154回覆交代報考人次、持續課程檢視機制，以及未統計升讀相關專上課程比例。它可以說明整體制度，不能用來宣稱674的就業成效。','D79'),
    ]
    body+='<section id="findings"><h2>本次補證重點</h2>'+''.join('<article class="finding"><h3>'+esc(title)+'</h3><p>'+esc(txt)+'</p><p class="meta">'+links(ids)+'</p></article>' for title,txt,ids in findings)+'</section>'
    body+='<section id="cohorts"><h2>入讀年級、模式及DSE屆別對照</h2><p>Nelson於2026年11月16日直接確認：2025年新班包括中四及中五；主要任教模式二，9月已開課。以下DSE對照按通函的一般修讀安排，並非查閱個別學籍。</p>'+table(['入讀時間／年級','模式','課程年度／DSE','可確認內容','依據'],[
      ['2025.09／中四','模式二，本人任教','2026–28／2028 DSE','新班改教伸展；9月授課為本人經驗',links('O04 D69 D80')],
      ['2025.09／中五','模式二，本人任教','2025–27／2027 DSE','新班改教伸展；9月授課為本人經驗',links('O04 D70 D81')],
      ['2025.10.04／中四','模式一，官方TA／TB班','2026–28／2028 DSE','官方表列開課日及馬鞍山場地；不載瑜伽／伸展內容',links('D80')],
      ['2025.10.04／中五','模式一，官方SA–SF班','2025–27／2027 DSE','官方表列開課日及馬鞍山場地；不載瑜伽／伸展內容',links('D81')],
      ['2024.09.28／中四','模式一，官方SK班','2025–27／2027 DSE','與2025中五入讀同屆DSE；入讀年份不同',links('D82')],
      ['2024年入讀／年級未另確認','本人提及的舊班','須按原入讀年級對照','仍修瑜伽；不把此口述自動套用上列SK班',links('O04')],
    ])+'<p class="meta">同一2027 DSE屆別可包括2024中四入讀及2025中五入讀。課綱須用入讀年、年級、模式及版本共同識別。模式二由學校與機構議定時間及場地（D69／70，p2§8）。</p></section>'
    body+='<section id="numbers"><h2>2016本科數據：先對齊人群和分母</h2>'+table(['統計項目','數值','原文口徑及定位'],[
      ['2014–16修讀','164人次','D06 印刷2／PDF3；修讀人次，不是畢業人數'],
      ['2016全體考生','報考134；符合出席要求101','D87 表7f；印刷120／PDF19'],
      ['2016全體考生成績','達標或以上85.1%','分母為101名符合出席要求考生'],
      ['2016日校考生','報考129；符合出席要求97','D87 表7e；印刷114／PDF13'],
      ['2016日校考生成績','達標或以上85.6%','分母為97名符合出席要求考生'],
    ])+'<p class="limit">不能用164、134與101直接相減推算退學率；沒有逐人追蹤和統一母體。2026預算答覆的全體ApL「報考人次」亦與2025政府答覆的「報考人數」分開保留。</p></section>'
    docs=[s for s in sources if s['id'].startswith('D')]
    def year(s):
        m=re.search(r'(?:19|20)\d{2}',s.get('document_date_or_version','')+' '+s['title'])
        return m.group(0) if m else '9999'
    docs.sort(key=lambda s:(year(s),s['id']))
    options=lambda labels:''.join('<option>'+esc(x)+'</option>' for x in sorted(labels))
    body+='<section id="catalog"><h2>公開文件目錄</h2><p>按文件標示的年份大致排序；精確發布日、課程屆別及認可期見各條目。可用「674」「瑜伽」「2016」等搜尋。</p><div class="research-filters"><label>關鍵字<input id="source-search" type="search" placeholder="名稱、年份、來源ID或內容"></label><label>來源<select id="source-group"><option value="">全部來源</option>'+options({s['source_group'] for s in docs})+'</select></label><label>核讀狀態<select id="source-state"><option value="">全部狀態</option>'+options({s['review_state'] for s in docs})+'</select></label><button id="source-reset" type="button">重設</button></div><p id="source-count" class="meta" aria-live="polite"></p><div id="research-catalog">'
    for s in docs:
        fields=[('日期／適用版本',s.get('document_date_or_version','')),('核讀定位',s.get('locator','')),('可支持的內容',s.get('supports','')),('引用限制',s.get('limits','')),('取檔／核讀狀態',s.get('retrieval_status','本次未另取檔')+'；'+s.get('verification_status',''))]
        detail='<dl>'+''.join('<dt>'+esc(k)+'</dt><dd>'+esc(v)+'</dd>' for k,v in fields)+'</dl>'
        if s.get('url','').startswith('http'):
            label='原網址（原件未取得）' if s.get('retrieval_status')=='未能取得原件' else '開啟公開原文'
            detail+='<p><a href="'+esc(s['url'],quote=True)+'" target="_blank" rel="noopener">'+label+'</a> · <a href="appendix.html#'+s['id']+'">完整來源條目</a></p><p class="source-url">'+esc(s['url'])+'</p>'
        if s.get('download_sha256') and s.get('retrieval_status')=='已保存原文':detail+='<p class="hash">SHA-256：'+s['download_sha256']+'</p>'
        body+='<details class="source-record" id="research-'+s['id']+'" data-group="'+esc(s['source_group'],quote=True)+'" data-state="'+esc(s['review_state'],quote=True)+'"><summary><span class="badge">'+s['id']+'</span>'+esc(s['title'])+' <small>｜'+esc(s['review_state'])+'</small></summary>'+detail+'</details>'
    body+='</div></section><section id="audit"><h2>逐項主張核證</h2><p>每項列出投影片位置、證據性質、來源頁碼及不可推出的結論。<a href="data/claim_audit.csv">下載CSV</a></p>'
    for a in audit:
        loc='附錄' if a['slide']=='附錄' else '第'+a['slide']+'頁'
        body+='<details class="claim-record"><summary><span class="badge">'+a['id']+'</span>'+loc+'：'+esc(a['claim'])+'</summary><dl><dt>證據性質</dt><dd>'+esc(a['evidence_type'])+'／'+esc(a['status'])+'</dd><dt>來源</dt><dd>'+links(' '.join(a['source_ids']))+'</dd><dt>定位</dt><dd>'+esc(a['locators'])+'</dd><dt>限制</dt><dd>'+esc(a['limits'])+'</dd></dl></details>'
    body+='</section><section id="gaps"><h2>尚待補充的直接文件</h2><ul>'+''.join('<li>'+esc(g)+'</li>' for g in status['gaps'])+'</ul><p>教育目的與政策背景已有依據；O09提供較完整的調整理由轉述。其餘缺口按問題保留，合理推論交代前提及性質，不把時間先後、研究建議或未經評估的成效主張寫成確定結論。原件取檔失敗亦不代表文件不存在。</p></section><script src="research-search.js"></script>'
    reader('official-research.html','公開文件與逐項核證','科目674與香港應用學習制度的文件目錄，另收具來源的轉述及明示推論。查核截至2026年11月17日；正文維持15頁，詳細證據供答問及修訂。',body)
