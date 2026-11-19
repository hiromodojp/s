// 作業員名簿管理システム（全建統一様式第5号）データはブラウザのlocalStorageに保存
const K='roster-v1',$=s=>document.querySelector(s),uid=()=>Math.random().toString(36).slice(2,9);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// 作業員の項目（様式第5号）。['キー','表示名','入力型']
const WF=[['name','氏名','text'],['kana','フリガナ','text'],['job','職種','text'],['birth','生年月日','date'],['gender','性別','sel:男,女'],
['blood','血液型','sel:A,B,O,AB'],['address','現住所','text'],['tel','電話番号','text'],['emergency','家族等緊急連絡先','text'],
['hi','健康保険','text'],['pen','年金保険','text'],['ei','雇用保険','text'],['kt','建設業退職金共済','text'],['enter','入場年月日','date'],
['edu','受入教育実施年月日','date'],['exp','経験年数','number'],['hc','最近の健康診断日','date'],['lic','免許・資格','text'],['spe','特別教育・技能講習','text']];
const CF=[['name','会社名','text'],['rep','代表者','text'],['address','所在地','text'],['tel','電話番号','text'],['permit','建設業許可番号','text'],['rosai','労災保険番号','text']];
const ALL=[['photo','写真'],...WF.filter(f=>f[0]!='gender').map(f=>[f[0],f[1]])];
let S=JSON.parse(localStorage.getItem(K)||'null')||{companies:[],workers:[],templates:[{id:'t0',name:'標準（様式第5号）',prime:'',site:'',cols:ALL.map(c=>c[0])}]};
const save=()=>{try{localStorage.setItem(K,JSON.stringify(S))}catch(e){alert('保存容量を超えました。写真を減らしてください')}};
let tab='companies',ed=null,o={c:'',t:'t0',sel:null};
const tabs={companies:'会社',workers:'作業員',templates:'元請名簿様式',output:'名簿PDF出力'};
const cn=id=>(S.companies.find(c=>c.id==id)||{}).name||'';
const resize=f=>new Promise(r=>{const i=new Image();i.onload=()=>{const w=240,h=Math.round(i.height*w/i.width),c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(i,0,0,w,h);r(c.toDataURL('image/jpeg',.75))};i.src=URL.createObjectURL(f)});
function field([k,l,t],v){const i=t.startsWith('sel:')?`<select name="${k}"><option></option>${t.slice(4).split(',').map(x=>`<option ${x==v?'selected':''}>${x}</option>`).join('')}</select>`:`<input name="${k}" type="${t}" value="${esc(v)}">`;return `<label>${l}${i}</label>`}
function crud(coll,label,fields,cols,extra){
  const d=ed&&ed.coll==coll?(S[coll].find(x=>x.id==ed.id)||{}):null;
  let h=`<button onclick="edit('${coll}')">＋${label}を追加</button>`;
  if(d)h+=`<form class="card" onsubmit="sv(event,'${coll}');return false"><div class="grid">${fields.map(f=>field(f,d[f[0]])).join('')}${extra?extra(d):''}</div><button>保存</button><button type="button" onclick="ed=null;render()">キャンセル</button></form>`;
  return h+`<table><tr>${cols.map(c=>`<th>${c[0]}</th>`).join('')}<th></th></tr>${S[coll].map(d=>`<tr>${cols.map(c=>`<td>${c[1](d)}</td>`).join('')}<td><button onclick="edit('${coll}','${d.id}')">編集</button><button onclick="del('${coll}','${d.id}')">削除</button></td></tr>`).join('')}</table>`}
window.edit=(coll,id)=>{ed={coll,id:id||''};render()};
window.del=(coll,id)=>{if(confirm('削除しますか？')){S[coll]=S[coll].filter(x=>x.id!=id);save();render()}};
window.sv=async(e,coll)=>{const fd=new FormData(e.target),old=S[coll].find(x=>x.id==ed.id),n={...(old||{id:uid()})};
  for(const[k,v]of fd.entries())if(k!='photo'&&k!='cols')n[k]=v;
  if(coll=='workers'){const f=fd.get('photo');if(f&&f.size)n.photo=await resize(f)}
  if(coll=='templates')n.cols=ALL.map(c=>c[0]).filter(k=>fd.getAll('cols').includes(k));
  if(!old)S[coll].push(n);else S[coll][S[coll].indexOf(old)]=n;
  save();ed=null;render()};
function out(){
  const ws=S.workers.filter(w=>w.companyId==o.c);if(!o.sel)o.sel=new Set(ws.map(w=>w.id));
  const t=S.templates.find(x=>x.id==o.t)||S.templates[0],cols=ALL.filter(c=>t.cols.includes(c[0])),rows=ws.filter(w=>o.sel.has(w.id));
  $('#sheet').innerHTML=o.c?`<h2>作業員名簿（全建統一様式第5号）</h2><div>元請事業者名：${esc(t.prime)}　工事名：${esc(t.site)}　会社名：${esc(cn(o.c))}　提出日：${new Date().toLocaleDateString('ja-JP')}</div>
  <table><thead><tr><th>No</th>${cols.map(c=>`<th>${c[1]}</th>`).join('')}</tr></thead><tbody>${rows.map((w,i)=>`<tr><td>${i+1}</td>${cols.map(c=>`<td>${c[0]=='photo'?(w.photo?`<img class="ph" src="${w.photo}">`:''):esc(w[c[0]])}</td>`).join('')}</tr>`).join('')}</tbody></table>`:'';
  return `<div class="card"><label>会社<select onchange="o.c=this.value;o.sel=null;render()"><option value="">選択してください</option>${S.companies.map(c=>`<option value="${c.id}" ${c.id==o.c?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label>
  <label>元請様式<select onchange="o.t=this.value;render()">${S.templates.map(x=>`<option value="${x.id}" ${x.id==o.t?'selected':''}>${esc(x.name)}</option>`).join('')}</select></label>
  <p>${ws.map(w=>`<label class="chk"><input type="checkbox" ${o.sel.has(w.id)?'checked':''} onchange="tg('${w.id}')">${esc(w.name)}</label>`).join('')}</p>
  <button onclick="print()">PDF出力（印刷ダイアログで「PDFに保存」）</button><p>※下にプレビューが表示されます</p></div>`}
window.tg=id=>{o.sel.has(id)?o.sel.delete(id):o.sel.add(id);render()};
function render(){
  $('#nav').innerHTML=Object.entries(tabs).map(([k,v])=>`<button class="${k==tab?'on':''}" onclick="tab='${k}';ed=null;render()">${v}</button>`).join('');
  $('#sheet').innerHTML='';const m=$('#main');
  if(tab=='companies')m.innerHTML=crud('companies','会社',CF,[['会社名',d=>esc(d.name)],['代表者',d=>esc(d.rep)],['電話',d=>esc(d.tel)],['作業員数',d=>S.workers.filter(w=>w.companyId==d.id).length]]);
  if(tab=='workers')m.innerHTML=crud('workers','作業員',WF,[['写真',d=>d.photo?`<img class="ph" src="${d.photo}">`:''],['氏名',d=>esc(d.name)],['職種',d=>esc(d.job)],['所属会社',d=>esc(cn(d.companyId))]],
    d=>`<label>所属会社<select name="companyId" required><option value="">選択</option>${S.companies.map(c=>`<option value="${c.id}" ${c.id==d.companyId?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label><label>顔写真<input type="file" name="photo" accept="image/*"></label>${d.photo?`<img class="ph" src="${d.photo}">`:''}`);
  if(tab=='templates')m.innerHTML=crud('templates','元請様式',[['name','様式名','text'],['prime','元請事業者名','text'],['site','工事名','text']],[['様式名',d=>esc(d.name)],['元請',d=>esc(d.prime)],['工事名',d=>esc(d.site)]],
    d=>`<div style="grid-column:1/-1"><b>出力する項目</b><br>${ALL.map(c=>`<label class="chk"><input type="checkbox" name="cols" value="${c[0]}" ${(d.cols||ALL.map(x=>x[0])).includes(c[0])?'checked':''}>${c[1]}</label>`).join('')}</div>`);
  if(tab=='output')m.innerHTML=out();
}
render();
