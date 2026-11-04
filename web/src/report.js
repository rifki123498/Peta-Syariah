import { SHARE } from "./sharecard.js";

(function(){
"use strict";
const $=id=>document.getElementById(id);
const girih="url(\"data:image/svg+xml,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56"><g fill="none" stroke="#D4EE3A" stroke-width="1.2"><path d="M28 6l6 10 11-1-4 11 9 7-11 4 1 11-10-5-8 9-6-9-10 5 1-11-11-4 9-7-4-11 11 1z"/><circle cx="28" cy="28" r="6"/></g></svg>')+"\")";
document.documentElement.style.setProperty("--girih",girih);
const rp=n=>"Rp"+Math.round(n).toLocaleString("id-ID");
const rpS=n=>{const a=Math.abs(n); if(a>=1e9) return "Rp"+(a/1e9).toLocaleString("id-ID",{maximumFractionDigits:2})+" M"; if(a>=1e6) return "Rp"+(a/1e6).toLocaleString("id-ID",{maximumFractionDigits:1})+" jt"; return rp(a);};

/* pillars: same scoring as the quiz */
const P=[
 ["Tabungan & dana darurat","Tabungan",42,83,"Gaji sebagian syariah, sebagian konvensional. Tabungan dan deposito di bank konvensional. Dana darurat kurang dari 3 bulan.","Fondasinya ada. Yang perlu diubah adalah tempat uangnya, dan dana daruratnya perlu ditambah."],
 ["Cara bayar","Bayar",40,82,"Kartu kredit untuk belanja sehari-hari.","Kartu kredit konvensional mengenakan bunga bila tagihan tidak dibayar penuh. Debit, QRIS, atau kartu syariah adalah alternatifnya."],
 ["Cicilan & utang","Cicilan",100,100,"Belum punya pembiayaan rumah atau kendaraan.","Skornya penuh, tapi keputusan terbesarmu ada di sini: memilih akad KPR dalam 2 tahun."],
 ["Asuransi","Asuransi",70,91,"BPJS saja.","BPJS dihitung positif sebagai lapisan dasar. Tambahan asuransi syariah bisa melengkapinya."],
 ["Investasi","Investasi",60,88,"Campuran syariah dan konvensional.","Arahkan investasi baru ke instrumen syariah. Dana uang muka sebaiknya tidak ikut diinvestasikan ke instrumen yang nilainya bisa turun."],
 ["Zakat & sedekah","Zakat",35,81,"Baru zakat fitrah.","Penghasilanmu sudah melewati nisab BAZNAS 2026. Pilar ini yang paling cepat dirapikan."]];
$("pillars").innerHTML=P.map(p=>`<div class="pillar"><div class="top"><h3>${p[0]}</h3><span class="sc">${p[2]}${p[3]!==p[2]?" → "+p[3]:""}</span></div><div class="track" aria-hidden="true"><span class="pot" style="width:${p[3]}%"></span><span class="now" style="width:${p[2]}%"></span></div><p class="ans"><b>Jawabanmu:</b> ${p[4]}</p><p class="small muted">${p[5]}</p></div>`).join("");

/* radar */
const cx=90,cy=86,R=54,n=6,pt=(i,r)=>{const a=(-90+i*60)*Math.PI/180;return [cx+r*Math.cos(a),cy+r*Math.sin(a)];};
const poly=f=>P.map((p,i)=>pt(i,f(p)).map(v=>v.toFixed(1)).join(",")).join(" ");
let g="";[25,50,75,100].forEach(l=>g+=`<polygon points="${poly(()=>R*l/100)}" fill="none" stroke="rgba(212,238,58,${l===100?.45:.2})"/>`);
P.forEach((_,i)=>{const[x,y]=pt(i,R);g+=`<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(212,238,58,.2)"/>`;});
g+=`<polygon points="${poly(p=>R*p[3]/100)}" fill="rgba(212,238,58,.08)" stroke="#D4EE3A" stroke-width="1.5" stroke-dasharray="4 3"/>`;
g+=`<polygon points="${poly(p=>R*Math.max(4,p[2])/100)}" fill="rgba(212,238,58,.3)" stroke="#D4EE3A" stroke-width="2" stroke-linejoin="round"/>`;
P.forEach((p,i)=>{const[x,y]=pt(i,R*p[2]/100);g+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="#D4EE3A" stroke="#13241C" stroke-width="1.5"><title>${p[0]}: ${p[2]} → ${p[3]}</title></circle>`;});
P.forEach((p,i)=>{const[x,y]=pt(i,R+13);const an=Math.abs(x-cx)<4?"middle":(x>cx?"start":"end");const dy=y<cy-R?-1:(y>cy+R?9:4);g+=`<text x="${x.toFixed(1)}" y="${(y+dy).toFixed(1)}" text-anchor="${an}">${p[1]}</text>`;});
$("radar").innerHTML=g; $("radar").setAttribute("aria-label","Radar enam pilar, sekarang ke potensi: "+P.map(p=>p[0]+" "+p[2]+" ke "+p[3]).join(", "));

/* cash flow */
const F=[["Penghasilan bersih",15,"in"],["Pengeluaran rutin",9,"out"],["Zakat penghasilan",.375,"keep"],["Dana darurat",1.5,"keep"],["Sisa untuk uang muka",4.125,"left"]];
let off=0; $("flow").innerHTML=F.map((f,i)=>{ const left=i===0?0:off; if(i>0) off+=f[1]; const w=f[1]/15*100;
  return `<div class="frow ${f[2]}"><span>${f[0]}</span><span class="num">${i===0?"":"− "}${rpS(f[1]*1e6).replace("− ","")}</span><div class="bar" aria-hidden="true"><i style="left:${i===0?0:left/15*100}%;width:${w}%"></i></div></div>`; }).join("");

/* KPR */
const pmt=(B,a,k)=>{const r=a/1200;return B*r/(1-Math.pow(1+r,-k));};
const B=640e6,N=180,EX=60,Pm=pmt(B,9.5,N); let bal=B,rate=8,p=pmt(B,8,N),mm=[],tot=0,atEx=0;
for(let t=1;t<=N;t++){ if(t>1&&(t-1)%36===0){rate+=1;p=pmt(bal,rate,N-t+1);} const i=bal*rate/1200,pr=Math.min(p-i,bal); bal-=pr; tot+=i+pr; mm.push(i+pr); if(t===EX) atEx=bal; }
const r=9.5/1200, econ=B*Math.pow(1+r,EX)-Pm*(Math.pow(1+r,EX)-1)/r, owe=Pm*(N-EX), gap=owe-econ;
$("kpr-t").innerHTML=[["Cicilan awal",rp(Pm),rp(mm[0])],["Cicilan tahun ke-13",rp(Pm),rp(mm[156])],["Total bayar 15 tahun",rpS(Pm*N),rpS(tot)],["Kewajiban bila lunas di tahun ke-5",rpS(owe),rpS(atEx)]].map(x=>`<tr><td>${x[0]}</td><td class="r num">${x[1]}</td><td class="r num">${x[2]}</td></tr>`).join("");
$("kpr-note").innerHTML=`Di murabahah, kewajibanmu saat melunasi adalah sisa harga jual. Sekitar <b class="num">${rpS(gap)}</b> di antaranya sisa margin, yang hanya berkurang bila bank memberi potongan pelunasan, dan potongan itu tidak boleh diperjanjikan di akad. Kalau kamu berencana melunasi lebih cepat, MMQ lebih lentur. Kalau kepastian cicilan lebih penting, murabahah lebih tenang.`;
const W=640,H=220,ml=70,mr=14,mt=14,mb=28,w=W-ml-mr,h=H-mt-mb,lo=5.5e6,hi=7.5e6;
const x=i=>ml+w*i/(N-1),y=v=>mt+h-h*(v-lo)/(hi-lo); let s="";
for(let v=lo;v<=hi+1;v+=5e5) s+=`<line x1="${ml}" x2="${W-mr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${ml-8}" y="${y(v)+4}" text-anchor="end">${(v/1e6).toLocaleString("id-ID")} jt</text>`;
[0,5,10,15].forEach(yr=>s+=`<text x="${x(Math.min(yr*12,N-1))}" y="${H-8}" text-anchor="middle">${yr?"th "+yr:""}</text>`);
s+=`<line x1="${x(EX)}" x2="${x(EX)}" y1="${mt}" y2="${mt+h}" stroke="var(--ink)" stroke-dasharray="4 4"/><text x="${x(EX)+6}" y="${mt+12}" style="fill:var(--ink)">lunas di th 5?</text>`;
s+=`<path d="M${x(0)},${y(Pm)} L${x(N-1)},${y(Pm)}" stroke="var(--olive)" stroke-width="3" fill="none"/>`;
s+=`<path d="${mm.map((v,i)=>(i?"L":"M")+x(i).toFixed(1)+","+y(v).toFixed(1)).join(" ")}" stroke="var(--teal)" stroke-width="3" fill="none"/>`;
s+=`<text x="${W-mr}" y="${y(Pm)-8}" text-anchor="end" style="fill:var(--olive)">Murabahah</text><text x="${x(20)}" y="${y(mm[20])+18}" style="fill:var(--teal)">MMQ</text>`;
$("kpr").innerHTML=s; $("kpr").setAttribute("aria-label",`Cicilan murabahah tetap ${rp(Pm)}; MMQ dari ${rp(mm[0])} naik bertahap ke ${rp(mm[N-1])}`);

/* plan: same rules as the app, dated */
const FT={"02":"02/DSN-MUI/IV/2000 tentang Tabungan","03":"03/DSN-MUI/IV/2000 tentang Deposito","04":"04/DSN-MUI/IV/2000 tentang Murabahah","07":"07/DSN-MUI/IV/2000 tentang Pembiayaan Mudharabah (Qiradh)","17":"17/DSN-MUI/IX/2000 tentang Sanksi atas Nasabah Mampu yang Menunda-nunda Pembayaran","20":"20/DSN-MUI/IV/2001 tentang Pedoman Pelaksanaan Investasi untuk Reksa Dana Syari'ah","21":"21/DSN-MUI/X/2001 tentang Pedoman Umum Asuransi Syari'ah","23":"23/DSN-MUI/III/2002 tentang Potongan Pelunasan dalam Murabahah","52":"52/DSN-MUI/III/2006 tentang Akad Wakalah bil Ujrah pada Asuransi Syari'ah dan Reasuransi Syari'ah","54":"54/DSN-MUI/X/2006 tentang Syariah Card","69":"69/DSN-MUI/VI/2008 tentang Surat Berharga Syariah Negara","73":"73/DSN-MUI/XI/2008 tentang Musyarakah Mutanaqishah","77":"77/DSN-MUI/VI/2010 tentang Jual-Beli Emas secara Tidak Tunai","80":"80/DSN-MUI/III/2011 tentang Penerapan Prinsip Syariah dalam Mekanisme Perdagangan Efek Bersifat Ekuitas di Pasar Reguler Bursa Efek","102":"102/DSN-MUI/X/2016 tentang Akad Al-Ijarah Al-Maushufah fi Al-Dzimmah untuk Produk Pembiayaan Pemilikan Rumah (PPR)-Indent"};
const PH=[["Fase 1 · Fondasi","Hari 1–30 · 4 Nov–3 Des",[
  ["4–10 Nov","30 menit","Zakat & sedekah","Hitung zakatmu dan jadwalkan pembayarannya","Cukup hitung sekali, lalu atur pembayarannya otomatis.",["Rp375.000 per bulan dari penghasilan Rp15 jt","Pilih lembaga zakat resmi (BAZNAS atau LAZ berizin)","Atur autodebit di tanggal gajian"],[],true],
  ["4–10 Nov","1 hari","Tabungan & dana darurat","Buka rekening tabungan syariah sebagai pusat tabunganmu","Satu rekening syariah khusus tabungan membuat langkah berikutnya lebih mudah, tanpa harus memindahkan semuanya sekaligus.",["Pilih bank syariah atau unit usaha syariah yang aplikasinya nyaman kamu pakai","Tanyakan akadnya: wadiah atau mudharabah","Pindahkan dana darurat Rp20 jt ke rekening ini"],["02"]],
  ["Mulai 25 Nov","Bertahap","Tabungan & dana darurat","Tambah dana darurat Rp1,5 jt per bulan sampai 3 bulan pengeluaran","Dana darurat menjaga kamu dari berutang saat ada kejadian mendadak.",["Target awal Rp27 jt (3 × Rp9 jt), tercapai sekitar bulan ke-5","Simpan di tabungan yang mudah dicairkan, bukan deposito","Setelah itu naikkan target ke 6 bulan"],["02"]],
  ["Minggu 3","15 menit","Investasi","Catat jadwal penawaran sukuk tabungan berikutnya","Sukuk negara ritel hanya dijual di masa penawaran tertentu. Kalau jadwalnya pas, deposito yang jatuh tempo bisa langsung dipindah.",["Cek jadwal penawaran SBN ritel di situs Kemenkeu atau mitra distribusi resmi","Siapkan akun di salah satu mitra distribusi","Bandingkan hitungannya di bagian 03"],["69"]]]],
 ["Fase 2 · Pindahkan bertahap","Hari 31–60 · 4 Des–2 Jan",[
  ["25 Des","1–2 minggu","Tabungan & dana darurat","Arahkan gaji ke rekening syariah","Kalau gaji masuk ke rekening syariah, tabungan, zakat, dan pembayaran rutin ikut tertata.",["Tanyakan ke HR apakah gaji bisa ditransfer ke bank lain","Kalau belum bisa, atur transfer otomatis di hari gajian"],["02"]],
  ["15 Des","Saat jatuh tempo","Tabungan & dana darurat","Pindahkan deposito Rp50 jt ke deposito mudharabah","Menunggu jatuh tempo menghindari biaya pencairan lebih awal.",["Matikan perpanjangan otomatis (ARO) sebelum 15 Desember","Bandingkan nisbah dan realisasi bagi hasil di 2–3 bank syariah","Pilih tenor yang selesai sebelum uang muka dibutuhkan"],["03"]],
  ["Desember","1 bulan","Cara bayar","Rapikan pemakaian kartu: bayar penuh, lalu pertimbangkan kartu syariah","Kartu pembiayaan syariah memakai akad kafalah, qardh, dan ijarah, dengan biaya yang disepakati di awal.",["Bayar tagihan penuh sebelum jatuh tempo","Bandingkan iuran dan ketentuan kartu syariah (iB), atau beralih ke debit"],["54","17"]],
  ["Desember","2 minggu","Asuransi","Bandingkan perlindunganmu dengan asuransi syariah","Asuransi syariah memakai dana tabarru' milik peserta bersama; perusahaan mengelola dengan ujrah.",["Mulai dari kesehatan, lalu jiwa bila ada tanggungan","Pertahankan BPJS sebagai lapisan dasar"],["21","52"]]]],
 ["Fase 3 · Tumbuhkan","Hari 61–90 · 3 Jan–2 Feb",[
  ["Januari","Rutin","Investasi","Pisahkan dana uang muka rumah di rekening syariah sendiri","Kalau dananya dipisah, tujuannya lebih gampang dijaga.",["Setor Rp4,125 jt per bulan, atau Rp4,58 jt untuk tepat 24 bulan","Gunakan instrumen yang nilainya stabil karena dana dibutuhkan dalam 2 tahun","Tinjau setiap 6 bulan"],[]],
  ["Januari","Mulai bulan ini","Investasi","Arahkan investasi baru ke instrumen syariah","Reksa dana syariah, saham syariah, sukuk negara, dan emas bisa dimulai dari nominal kecil.",["Investasi lama Rp30 jt: cek mana yang syariah, tanpa harus menjual sekaligus","Saham: pastikan ada di Daftar Efek Syariah terbaru","Sukuk negara ritel: imbal hasil dikenai PPh final 10%"],["20","80","69"]],
  ["Sebelum akad","Sebelum akad","Cicilan & utang","Pilih akad pembiayaan rumah sebelum memilih bank","Murabahah memberi cicilan tetap; MMQ lebih lentur untuk pelunasan dipercepat. Rumah inden punya akad khusus.",["Pakai simulasi di bagian 03 dengan penawaran bank yang sebenarnya","Untuk rumah inden, tanyakan apakah bank memakai ijarah maushufah fi al-dzimmah"],["04","73","102","23"]],
  ["2 Feb 2027","Hari ke-90","Zakat & sedekah","Ulangi kuis dan bandingkan kartu profilmu","Dari situ kelihatan langkah mana yang sudah berjalan dan mana yang belum.",["Bandingkan skor praktik dan pemahaman","Pilih pilar fokus untuk 90 hari berikutnya"],[]]]]];
$("plan").innerHTML=PH.map(ph=>`<div class="phase"><div class="phase-h"><h3>${ph[0]}</h3><span>${ph[1]}</span></div>`+ph[2].map(t=>`<div class="task"><div class="when"><b>${t[0]}</b>${t[1]}</div><div><h3>${t[3]}</h3><p class="small muted" style="margin-top:4px">${t[4]}</p><ul>${t[5].map(x=>`<li>${x}</li>`).join("")}</ul><div class="chips">${t[7]?'<span class="chip go">Mulai di sini</span>':""}<span class="chip p">${t[2]}</span>${t[6].length?`<span class="chip">${t[6].length} rujukan</span>`:""}</div>${t[6].length?`<p class="cite" style="margin-top:8px">${t[6].map(k=>"Fatwa DSN-MUI No. "+FT[k]).join("<br>")}</p>`:""}</div></div>`).join("")+`</div>`).join("");

/* ask checklists: same questions as the app */
const ASK=[["Saat membuka tabungan syariah","buka",["Akadnya wadiah atau mudharabah?","Kalau mudharabah: berapa nisbah dan realisasi bagi hasil 3 bulan terakhir?","Apakah bonus wadiah dijanjikan di awal? (seharusnya tidak)","Apakah dijamin LPS? Penjaminan itu jaring pengaman, bukan bagian dari akad"]],
 ["Saat memindahkan deposito","dep",["Berapa nisbah dan realisasi bagi hasilnya?","Apa yang terjadi bila dicairkan sebelum jatuh tempo?","Ini produk simpanan atau produk investasi? POJK 4/2026 memisahkan keduanya","Fatwa yang dirujuk dari DSN-MUI, atau hanya opini DPS bank?"]],
 ["Saat mengajukan pembiayaan rumah","kpr",["Apakah bank memiliki rumahnya dulu sebelum menjual atau menyewakan kepadaku?","Untuk MMQ: bagaimana ujrah ditinjau, dan berapa harga pengalihan porsi bank?","Denda keterlambatan disalurkan ke mana?","Kebijakan potongan pelunasan secara tertulis","Fatwa yang dirujuk mencakup versi produk ini?"]],
 ["Saat membandingkan asuransi syariah","asr",["Berapa ujrah yang diambil perusahaan?","Bagaimana surplus dana tabarru' dibagikan?","Dana tabarru' dipisah dari dana investasi?","Perusahaan atau unit syariahnya berizin OJK?"]],
 ["Saat memilih kartu syariah","kartu",["Akad apa yang dipakai: kafalah, qardh, atau ijarah?","Denda keterlambatan disalurkan ke mana?","Iuran dan biaya dihitung tetap, atau persen dari saldo?"]],
 ["Sebelum investasi","inv",["Sahamnya ada di DES terbaru? DES ditinjau sekitar Mei dan November","Reksa dana: siapa DPS-nya dan apa kebijakan investasinya?","Berapa biaya pengelolaan per tahun?"]]];
const KEY="petasyariah.pro.asks"; let st={}; try{ st=JSON.parse(localStorage.getItem(KEY)||"{}")||{}; }catch(_){ st={}; }
const save=()=>{ try{ localStorage.setItem(KEY,JSON.stringify(st)); }catch(_){} };
const cnt=a=>a[2].filter((_,i)=>st[a[1]+i]).length;
$("asks").innerHTML=ASK.map(a=>`<div class="askg"><div class="sec-h"><h3>${a[0]}</h3></div><ul>${a[2].map((q,i)=>`<li><label><input type="checkbox" id="ask-${a[1]}${i}" data-k="${a[1]}${i}" ${st[a[1]+i]?"checked":""}><span>${q}</span></label></li>`).join("")}</ul><span class="prog" data-g="${a[1]}">${cnt(a)} dari ${a[2].length} terjawab</span></div>`).join("");
$("asks").addEventListener("change",e=>{ const k=e.target.dataset.k; if(!k) return; st[k]=e.target.checked; save(); const a=ASK.find(x=>k.startsWith(x[1])&&/^\d+$/.test(k.slice(x[1].length))); if(a) document.querySelector(`.prog[data-g="${a[1]}"]`).textContent=cnt(a)+" dari "+a[2].length+" terjawab"; });

/* share */


const MS=[{day:1,done:0,ph:[0,0,0],to:88,toLabel:"Persen syariah → target 90 hari"},{day:30,done:4,ph:[4,0,0],to:null},{day:90,done:10,ph:[4,4,2],to:81,toLabel:"Persen syariah, hari 1 → hari 90"}];
const SH={m:0,fmt:"story"}; const shCv=document.createElement("canvas");
function shSpec(){ const m=MS[SH.m]; return {fmt:SH.fmt,kind:"progress",persona:"Istiqamah",day:m.day,done:m.done,total:12,phases:[["Fondasi",m.ph[0],4],["Pindah bertahap",m.ph[1],4],["Tumbuh",m.ph[2],4]],showScores:$("sh-scores").checked,from:58,to:m.to,toLabel:m.toLabel}; }
async function renderShare(){ try{ await document.fonts.ready; }catch(_){} SHARE.draw(shCv,shSpec()); $("sh-img").src=shCv.toDataURL("image/png");
  $("sh-save").hidden=!(await SHARE.hasSave()); $("sh-status").textContent=$("sh-save").hidden?"Tekan lama gambar untuk menyimpannya.":""; }
const pick=(id,key,attr)=>$(id).querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{ SH[key]=attr==="m"?+b.dataset.m:b.dataset.f; $(id).querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b))); renderShare(); }));
pick("sh-ms","m","m"); pick("sh-fmt","fmt","f"); $("sh-scores").addEventListener("change",renderShare);
$("sh-save").addEventListener("click",()=>SHARE.save(shCv,"peta-syariah-hari-"+MS[SH.m].day+".png",$("sh-status")));
$("sh-cap").addEventListener("click",()=>{ const m=MS[SH.m]; const txt=m.day===1?"Hari pertama rencana 90 hari keuangan syariahku. Mulai dari yang dasar dulu: tabungan, dana darurat, zakat. Pelan-pelan, satu per satu. #PetaSyariahku":m.day===30?"Hari 30 dari 90. Fondasi keuangan syariahku sudah beres, sekarang mulai pindah bertahap. #PetaSyariahku":`Hari 90. ${m.done} dari 12 langkah sudah jalan, keuanganku dari 58% jadi ${m.to}% syariah. Langkah kecil ternyata kerasa juga. #PetaSyariahku`;
  const ok=()=>{ $("sh-cap").textContent="Caption tersalin"; setTimeout(()=>$("sh-cap").textContent="Salin caption",1600); };
  try{ navigator.clipboard.writeText(txt).then(ok,()=>{ $("sh-status").textContent=txt; }); }catch(_){ $("sh-status").textContent=txt; } });
renderShare();

/* references */
const REF=Object.keys(FT).map(k=>"Fatwa DSN-MUI No. "+FT[k]).concat(["POJK No. 8 Tahun 2025 tentang Penerbitan Daftar Efek Syariah dan Daftar Efek Syariah Luar Negeri","POJK No. 4 Tahun 2026 tentang Penyelenggaraan Produk Investasi Perbankan Syariah","SK Ketua BAZNAS No. 15 Tahun 2026 tentang nilai nisab zakat penghasilan dan jasa","Harga emas Antam di Pegadaian, 9 Okt 2026 (Databoks)","SNLIK 2025, OJK–BPS","PP 91/2021: PPh final 10% atas imbal hasil SBN termasuk sukuk"]);
$("refs").innerHTML=REF.map(r=>`<li>${r}</li>`).join("");
})();
