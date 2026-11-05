import { saveImage } from "./platform.js";
import { tr } from "./i18n.js";
/* ===== Kartu share Instagram (Story 9:16, Feed 4:5). Tanpa angka uang pribadi. ===== */
export const SHARE=(function(){
const PERSONA_STYLE={
 "Amanah":{c:"#D4EE3A",e:"star"},
 "Istiqamah":{c:"#F2C14E",e:"book"},
 "Hijrah":{c:"#7FCB8E",e:"compass"},
 "Niat":{c:"#FF9E7A",e:"sunrise"}};
const F='"Schibsted Grotesk","Helvetica Neue",Arial,sans-serif', M='"JetBrains Mono",ui-monospace,Menlo,monospace';
function wrap(ctx,t,maxW){ const w=String(t).split(" "),L=[]; let s=""; w.forEach(x=>{ const tt=s?s+" "+x:x; if(ctx.measureText(tt).width>maxW&&s){L.push(s);s=x;} else s=tt; }); if(s)L.push(s); return L; }
function text(ctx,t,x,y,font,color,maxW,lh,ls){ t=tr(t); ctx.font=font; ctx.fillStyle=color; try{ctx.letterSpacing=ls||"0px";}catch(_){} const L=maxW?wrap(ctx,t,maxW):[t]; L.forEach((l,i)=>ctx.fillText(l,x,y+i*(lh||0))); try{ctx.letterSpacing="0px";}catch(_){} return y+(L.length-1)*(lh||0); }
function rrect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
function star(ctx,cx,cy,r){ ctx.beginPath(); for(let i=0;i<16;i++){ const a=-Math.PI/2+i*Math.PI/8, rr=i%2?r*.62:r; ctx.lineTo(cx+rr*Math.cos(a),cy+rr*Math.sin(a)); } ctx.closePath(); }
function bg(ctx,W,H){ const g=ctx.createLinearGradient(0,0,W*.6,H); g.addColorStop(0,"#13241C"); g.addColorStop(1,"#1E3A2C"); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  ctx.save(); ctx.globalAlpha=.07; ctx.strokeStyle="#D4EE3A"; ctx.lineWidth=2; for(let y=60;y<H;y+=150) for(let x=(y/150%2?75:0);x<W+80;x+=150){ star(ctx,x,y,34); ctx.stroke(); } ctx.restore(); }
function emblem(ctx,kind,cx,cy,r,c){ ctx.save(); ctx.fillStyle=c; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill(); ctx.fillStyle="#13241C"; ctx.strokeStyle="#13241C"; ctx.lineWidth=r*.09; ctx.lineCap="round"; ctx.lineJoin="round";
  if(kind==="star"){ star(ctx,cx,cy,r*.62); ctx.fill(); ctx.fillStyle=c; ctx.beginPath(); ctx.arc(cx,cy,r*.2,0,Math.PI*2); ctx.fill(); }
  else if(kind==="compass"){ ctx.beginPath(); ctx.arc(cx,cy,r*.6,0,Math.PI*2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx+r*.36,cy-r*.36); ctx.lineTo(cx+r*.08,cy+r*.08); ctx.lineTo(cx-r*.36,cy+r*.36); ctx.lineTo(cx-r*.08,cy-r*.08); ctx.closePath(); ctx.fill(); }
  else if(kind==="book"){ ctx.beginPath(); ctx.moveTo(cx,cy-r*.28); ctx.quadraticCurveTo(cx-r*.3,cy-r*.44,cx-r*.6,cy-r*.3); ctx.lineTo(cx-r*.6,cy+r*.4); ctx.quadraticCurveTo(cx-r*.3,cy+r*.26,cx,cy+r*.42); ctx.quadraticCurveTo(cx+r*.3,cy+r*.26,cx+r*.6,cy+r*.4); ctx.lineTo(cx+r*.6,cy-r*.3); ctx.quadraticCurveTo(cx+r*.3,cy-r*.44,cx,cy-r*.28); ctx.moveTo(cx,cy-r*.28); ctx.lineTo(cx,cy+r*.42); ctx.stroke(); }
  else { ctx.beginPath(); ctx.arc(cx,cy+r*.22,r*.36,Math.PI,0); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx-r*.66,cy+r*.24); ctx.lineTo(cx+r*.66,cy+r*.24); ctx.stroke(); for(let i=0;i<5;i++){ const a=Math.PI+(i+1)*Math.PI/6; ctx.beginPath(); ctx.moveTo(cx+r*.48*Math.cos(a),cy+r*.22+r*.48*Math.sin(a)); ctx.lineTo(cx+r*.66*Math.cos(a),cy+r*.22+r*.66*Math.sin(a)); ctx.stroke(); } }
  ctx.restore(); }
function radar(ctx,P,cx,cy,R,c,fs){ const n=P.length, pt=(i,r)=>{ const a=-Math.PI/2+i*2*Math.PI/n; return [cx+r*Math.cos(a),cy+r*Math.sin(a)]; };
  ctx.save(); ctx.lineWidth=2; [.25,.5,.75,1].forEach(l=>{ ctx.strokeStyle=`rgba(212,238,58,${l===1?.45:.18})`; ctx.beginPath(); P.forEach((_,i)=>{ const p=pt(i,R*l); i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]); }); ctx.closePath(); ctx.stroke(); });
  const shape=(k)=>{ ctx.beginPath(); P.forEach((p,i)=>{ const q=pt(i,R*Math.max(.05,p[k]/100)); i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]); }); ctx.closePath(); };
  shape("now"); ctx.globalAlpha=.32; ctx.fillStyle=c; ctx.fill(); ctx.globalAlpha=1; ctx.strokeStyle=c; ctx.lineWidth=5; ctx.lineJoin="round"; ctx.stroke();
  ctx.font=`600 ${fs}px ${F}`; ctx.fillStyle="rgba(241,245,236,.9)"; P.forEach((p,i)=>{ const q=pt(i,R+fs*.9); ctx.textAlign=Math.abs(q[0]-cx)<5?"center":(q[0]>cx?"left":"right"); ctx.textBaseline="middle"; ctx.fillText(tr(p.label),q[0],q[1]); });
  ctx.restore(); ctx.textAlign="left"; ctx.textBaseline="alphabetic"; }
function chipW(ctx,k,v){ k=tr(k); v=tr(v); ctx.font=`600 28px ${F}`; const kw=ctx.measureText(k).width; ctx.font=`700 34px ${F}`; return kw+ctx.measureText(v).width+70; }
function chip(ctx,x,y,k,v,c){ k=tr(k); v=tr(v); ctx.font=`600 28px ${F}`; const kw=ctx.measureText(k).width; ctx.font=`700 34px ${F}`; const vw=ctx.measureText(v).width; const w=kw+vw+70,h=72;
  rrect(ctx,x,y,w,h,36); ctx.strokeStyle="rgba(241,245,236,.35)"; ctx.lineWidth=2; ctx.stroke();
  text(ctx,k,x+28,y+46,`600 28px ${F}`,"#B9C7BD"); text(ctx,v,x+42+kw,y+47,`700 34px ${F}`,c); return w; }
/* o: {fmt, kind:"type"|"progress", persona, tagline, pillars:[{label,now}], strong, focus, showScores, praktik, paham, inklusi, day, done, total, phases:[[nama,selesai,total]], from, to, toLabel} */
function draw(cv,o){
  const W=1080,H=o.fmt==="feed"?1350:1920, st=o.fmt!=="feed"; cv.width=W; cv.height=H; const ctx=cv.getContext("2d");
  const S=PERSONA_STYLE[o.persona]||PERSONA_STYLE["Niat"], c=S.c, X=90, top=st?240:110;
  bg(ctx,W,H);
  text(ctx,"SHARIA COMPASS",X,top,`700 30px ${F}`,"#D4EE3A",0,0,"6px");
  emblem(ctx,S.e,W-X-70,top-10,70,c);
  if(o.kind==="type"){
    text(ctx,"Keuanganku sudah",X,top+70,`500 42px ${F}`,"#F1F5EC");
    const big=st?250:190, by=top+70+Math.round(big*.95);
    ctx.font=`800 ${big}px ${F}`; try{ctx.letterSpacing="-8px";}catch(_){} const pw=ctx.measureText(o.pct+"%").width; try{ctx.letterSpacing="0px";}catch(_){}
    text(ctx,o.pct+"%",X,by,`800 ${big}px ${F}`,c,0,0,"-8px");
    text(ctx,"syariah",X+pw+24,by,`700 ${st?64:52}px ${F}`,"#F1F5EC");
    let y=text(ctx,"Level "+o.persona,X,by+(st?92:74),`700 ${st?46:40}px ${F}`,c);
    if(o.showGuess) y=text(ctx,(o.pct>=o.guessV+10?"Tadinya kutebak cuma ":"Tadinya kutebak ")+o.guessLabel+".",X,y+(st?66:56),`500 ${st?38:32}px ${F}`,"#F1F5EC",W-2*X,st?50:42);
    if(st){ radar(ctx,o.pillars,W/2,y+330,180,c,30);
      let cy=y+590, cx=X; cx+=chip(ctx,cx,cy,"Lencana ",o.badges+" dari 8",c)+16; if(cx+chipW(ctx,"Fokusku ",o.focus)>W-X){ cx=X; cy+=88; } chip(ctx,cx,cy,"Fokusku ",o.focus,"#F1F5EC");
      if(o.inklusi) text(ctx,"Termasuk 13,41% penduduk yang sudah memakai produk syariah (SNLIK 2025)",X,cy+140,`500 30px ${F}`,"#B9C7BD",W-2*X,42);
      text(ctx,"Berapa persen punyamu?",X,H-250,`800 54px ${F}`,"#D4EE3A");
      text(ctx,"Cek gratis, 3 menit  ·  #ShariaCompass",X,H-195,`500 34px ${F}`,"#F1F5EC");
    } else {
      radar(ctx,o.pillars,W-280,H-400,140,c,26);
      let cy=y+60; chip(ctx,X,cy,"Lencana ",o.badges+" dari 8",c); chip(ctx,X,cy+90,"Fokusku ",o.focus,"#F1F5EC");
      text(ctx,"Berapa persen punyamu?",X,H-150,`800 48px ${F}`,"#D4EE3A");
      text(ctx,"Cek gratis, 3 menit  ·  #ShariaCompass",X,H-98,`500 30px ${F}`,"#F1F5EC");
    }
  } else {
    text(ctx,"Rencana 90 hari syariahku",X,top+70,`500 42px ${F}`,"#F1F5EC");
    text(ctx,o.persona,X,top+(st?135:130),`700 38px ${F}`,c);
    const by=top+(st?400:330);
    text(ctx,"Hari "+o.day,X,by,`800 ${st?210:170}px ${F}`,"#F1F5EC",0,0,"-6px");
    ctx.font=`800 ${st?210:170}px ${F}`; try{ctx.letterSpacing="-6px";}catch(_){} const dw=ctx.measureText("Hari "+o.day).width; try{ctx.letterSpacing="0px";}catch(_){}
    text(ctx,"/ 90",X+dw+24,by,`500 ${st?60:50}px ${M}`,"#B9C7BD");
    const py=by+(st?90:70), pw=W-2*X; rrect(ctx,X,py,pw,30,15); ctx.fillStyle="rgba(241,245,236,.14)"; ctx.fill();
    rrect(ctx,X,py,Math.max(30,pw*Math.min(1,o.day/90)),30,15); ctx.fillStyle=c; ctx.fill();
    [1,2].forEach(i=>{ ctx.fillStyle="#13241C"; ctx.fillRect(X+pw*i/3-3,py,6,30); });
    let ry=py+(st?150:120);
    o.phases.forEach(ph=>{ const full=ph[1]>=ph[2]&&ph[2]>0;
      ctx.beginPath(); ctx.arc(X+28,ry-14,26,0,Math.PI*2); ctx.fillStyle=full?c:"rgba(241,245,236,.12)"; ctx.fill();
      if(full){ ctx.strokeStyle="#13241C"; ctx.lineWidth=6; ctx.lineCap="round"; ctx.beginPath(); ctx.moveTo(X+16,ry-14); ctx.lineTo(X+25,ry-4); ctx.lineTo(X+41,ry-25); ctx.stroke(); }
      text(ctx,ph[0],X+80,ry,`700 42px ${F}`,"#F1F5EC");
      ctx.font=`500 36px ${M}`; const t=ph[1]+"/"+ph[2]+" langkah"; text(ctx,t,W-X-ctx.measureText(t).width,ry,`500 36px ${M}`,full?c:"#B9C7BD");
      ry+=st?104:86; });
    if(o.showScores&&o.to!=null){ text(ctx,o.toLabel||"Skor praktik",X,ry+40,`600 32px ${F}`,"#B9C7BD"); text(ctx,`${o.from}% → ${o.to}%`,X,ry+(st?120:110),`500 ${st?84:70}px ${M}`,c); }
    text(ctx,"Pelan-pelan, satu per satu.",X,H-(st?300:150),`800 ${st?52:46}px ${F}`,"#D4EE3A");
    text(ctx,"Mulai perjalananmu  ·  #ShariaCompass",X,H-(st?245:98),`500 34px ${F}`,"#F1F5EC");
  }
  return cv;
}
async function save(cv,name,statusEl){
  const set=t=>{ if(statusEl) statusEl.textContent=t; };
  const r=await saveImage(cv,name);
  const feed=/feed/.test(name);
  set(r==="shared"?(feed?"Pilih Instagram di menu berbagi, lalu Feed (postingan).":"Pilih Instagram di menu berbagi, lalu Story."):r==="downloaded"?(feed?"Gambar tersimpan. Buka Instagram, buat postingan baru (Feed), lalu pilih gambar dari galeri.":"Gambar tersimpan. Buka Instagram, pilih Story, lalu unggah dari galeri."):r==="cancelled"?"Dibatalkan.":"Tidak bisa menyimpan otomatis. Tekan lama gambar di atas untuk menyimpannya.");
  return r;
}
async function hasSave(){ return true; }
return {draw,save,hasSave,PERSONA_STYLE};
})();
