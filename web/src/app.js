import { track as ptrack, initConsent, PRICE, fmtRp, checkout, orderStatus, SHARE_URL } from "./platform.js";
import { SHARE } from "./sharecard.js";
import { initI18n, isEN, tr } from "./i18n.js";
import { zakatTaxSaving, annualPkp, marginalRate, sukukVsDeposito } from "./finance.js";
(function(){
"use strict";
const $=id=>document.getElementById(id);
function track(e,p){ ptrack(e,p); }
const KEY="petasyariah.v2";
function load(){ try{ return JSON.parse(localStorage.getItem(KEY)||"null"); }catch(_){ return null; } }
function save(){ try{ localStorage.setItem(KEY,JSON.stringify(S)); }catch(_){} }
const rp=n=>"Rp"+Math.round(n).toLocaleString("id-ID");
function rpS(n){ const a=Math.abs(n),s=n<0?"−":""; if(a>=1e9) return s+"Rp"+(a/1e9).toLocaleString("id-ID",{maximumFractionDigits:2})+" M"; if(a>=1e6) return s+"Rp"+(a/1e6).toLocaleString("id-ID",{maximumFractionDigits:1})+" jt"; if(a>=1e3) return s+"Rp"+Math.round(a/1e3).toLocaleString("id-ID")+" rb"; return s+rp(a); }
const pct=(n,d)=>n.toLocaleString("id-ID",{maximumFractionDigits:d==null?1:d})+"%";
const num=(id,d)=>{ const v=parseFloat($(id).value); return isFinite(v)?v:d; };

const girih="url(\"data:image/svg+xml,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56"><g fill="none" stroke="#D4EE3A" stroke-width="1.2"><path d="M28 6l6 10 11-1-4 11 9 7-11 4 1 11-10-5-8 9-6-9-10 5 1-11-11-4 9-7-4-11 11 1z"/><circle cx="28" cy="28" r="6"/></g></svg>')+"\")";
document.documentElement.style.setProperty("--girih",girih);

/* ================= SOURCES ================= */
const FT={
 "02":"02/DSN-MUI/IV/2000 tentang Tabungan","03":"03/DSN-MUI/IV/2000 tentang Deposito","04":"04/DSN-MUI/IV/2000 tentang Murabahah",
 "07":"07/DSN-MUI/IV/2000 tentang Pembiayaan Mudharabah (Qiradh)","09":"09/DSN-MUI/VI/2000 tentang Pembiayaan Ijarah","11":"11/DSN-MUI/VI/2000 tentang Kafalah",
 "17":"17/DSN-MUI/IX/2000 tentang Sanksi atas Nasabah Mampu yang Menunda-nunda Pembayaran","19":"19/DSN-MUI/IV/2001 tentang Al-Qardh",
 "20":"20/DSN-MUI/IV/2001 tentang Pedoman Pelaksanaan Investasi untuk Reksa Dana Syari'ah","21":"21/DSN-MUI/X/2001 tentang Pedoman Umum Asuransi Syari'ah",
 "23":"23/DSN-MUI/III/2002 tentang Potongan Pelunasan dalam Murabahah","27":"27/DSN-MUI/III/2002 tentang Al-Ijarah al-Muntahiyah bi al-Tamlik",
 "31":"31/DSN-MUI/VI/2002 tentang Pengalihan Utang","43":"43/DSN-MUI/VIII/2004 tentang Ganti Rugi (Ta'widh)",
 "52":"52/DSN-MUI/III/2006 tentang Akad Wakalah bil Ujrah pada Asuransi Syari'ah dan Reasuransi Syari'ah","54":"54/DSN-MUI/X/2006 tentang Syariah Card",
 "69":"69/DSN-MUI/VI/2008 tentang Surat Berharga Syariah Negara","73":"73/DSN-MUI/XI/2008 tentang Musyarakah Mutanaqishah",
 "77":"77/DSN-MUI/VI/2010 tentang Jual-Beli Emas secara Tidak Tunai","80":"80/DSN-MUI/III/2011 tentang Penerapan Prinsip Syariah dalam Mekanisme Perdagangan Efek Bersifat Ekuitas di Pasar Reguler Bursa Efek",
 "102":"102/DSN-MUI/X/2016 tentang Akad Al-Ijarah Al-Maushufah fi Al-Dzimmah untuk Produk Pembiayaan Pemilikan Rumah (PPR)-Indent"};
const f=k=>"Fatwa DSN-MUI No. "+FT[k];
const OTHER=[
 ["POJK No. 8 Tahun 2025 tentang Penerbitan Daftar Efek Syariah dan Daftar Efek Syariah Luar Negeri","https://ojk.go.id/id/regulasi/Pages/POJK-8-Tahun-2025-Penerbitan-Daftar-Efek-Syariah-dan-Daftar-Efek-Syariah-Luar-Negeri.aspx"],
 ["SK Ketua BAZNAS No. 15 Tahun 2026 tentang nilai nisab zakat penghasilan dan jasa (via Suara Surabaya, 25 Feb 2026)","https://www.suarasurabaya.net/kelanakota/2026/baznas-ri-tetapkan-nisab-zakat-penghasilan-2026-rp764-juta-per-bulan-ini-rinciannya/"],
 ["SNLIK 2025, OJK–BPS: literasi keuangan syariah 43,42%, inklusi 13,41% (via Kontan, 4 Mei 2025)","https://keuangan.kontan.co.id/news/gap-lebar-antara-literasi-dan-inklusi-keuangan-syariah-pada-2025-ini-kata-ojk"],
 ["Perubahan batas efek syariah 2026 (IDX Channel, 27 Jul 2025)","https://www.idxchannel.com/market-news/ojk-perketat-batas-pendapatan-non-halal-efek-syariah-jadi-5-persen-mulai-2026"],
 ["POJK 8/2025 berlaku di 2026: utang berbasis bunga 33% bertahap 10 tahun (Fortune Indonesia, 25 Jul 2025)","https://www.fortuneidn.com/market/pojk-8-2025-berlaku-di-2026-ini-dampak-terhadap-pasar-modal-syariah-00-3dhnm-g5z8rf"],
 ["PP 91/2021: PPh final 10% atas imbal hasil SBN termasuk sukuk (via DDTC News)","https://news.ddtc.co.id/berita/nasional/41732/beli-sukuk-keuntungannya-kena-pajak-simak-lagi-aturannya"],
 ["Harga emas Antam di Pegadaian, 9 Okt 2026 (Databoks)","https://databoks.katadata.co.id/pertambangan/statistik/341623c4497da38/harga-emas-hari-ini-antam-di-pegadaian-rp2521000-per-gram-9-oktober-2026"],
 ["Daftar judul fatwa DSN-MUI (indeks TafsirQ)","https://tafsirq.com/id/fatwa/dsn-mui"],
 ["POJK No. 4 Tahun 2026 tentang Penyelenggaraan Produk Investasi Perbankan Syariah","https://ojk.go.id/id/regulasi/Pages/POJK-4-Tahun-2026-Penyelenggaraan-Produk-Investasi-Perbankan-Syariah.aspx"],
 ["Checklist produk dan akad, aturan status saham, dan heuristik alokasi gaji diadaptasi dari sharia-skills oleh Canggih Puspo Wibowo (lisensi MIT)","https://github.com/canggihpw/sharia-skills"]];

/* ================= QUIZ ================= */
const PILLARS={simpan:"Tabungan & dana darurat",transaksi:"Cara bayar",pembiayaan:"Cicilan & utang",lindung:"Asuransi",investasi:"Investasi",zakat:"Zakat & sedekah"};
const PSHORT={simpan:"Tabungan",transaksi:"Bayar",pembiayaan:"Cicilan",lindung:"Asuransi",investasi:"Investasi",zakat:"Zakat"};
const STEPS=[
 {id:"goal",k:"about",q:"Apa yang paling ingin kamu capai dengan keuanganmu?",h:"Urutan langkah dan keuntungan yang dihitung akan menyesuaikan tujuan ini.",o:[["tenang","Hidup lebih tenang dan berkah"],["rumah","Punya atau melunasi rumah"],["keluarga","Menyiapkan pendidikan keluarga"],["ibadah","Berangkat haji atau umrah"],["pensiun","Pensiun dengan cukup"]]},
 {id:"guess",k:"about",q:"Coba tebak: berapa persen keuanganmu yang sudah syariah?",h:"Nggak ada jawaban salah. Di akhir, tebakanmu dibandingkan dengan hasil hitungan.",o:[["12","Kurang dari 25%"],["37","25–50%"],["62","50–75%"],["87","Lebih dari 75%"]]},
 {id:"rek",k:"simpan",q:"Gajimu atau rekening utamamu ada di mana?",o:[["syariah","Bank syariah atau unit usaha syariah",100],["keduanya","Sebagian syariah, sebagian konvensional",60],["konv","Bank konvensional",25]]},
 {id:"tab",k:"simpan",q:"Tabungan dan depositomu disimpan di mana?",o:[["syariah","Tabungan atau deposito syariah",100],["campur","Campuran",60],["konv","Tabungan atau deposito konvensional",25],["belum","Belum punya tabungan khusus",10]]},
 {id:"darurat",k:"simpan",q:"Kalau penghasilan berhenti, dana daruratmu cukup untuk berapa lama?",o:[["0","Belum ada",10],["3","Kurang dari 3 bulan",40],["6","3 sampai 6 bulan",80],["7","Lebih dari 6 bulan",100]]},
 {id:"bayar",k:"transaksi",q:"Untuk belanja sehari-hari, kamu paling sering bayar pakai apa?",o:[["debit","Debit, QRIS, atau dompet digital",100],["sycard","Kartu pembiayaan syariah (iB)",90],["kk","Kartu kredit",40],["paylater","Paylater",25]]},
 {id:"biaya",k:"pembiayaan",q:"Kamu sedang punya cicilan rumah atau kendaraan?",o:[["none","Tidak ada",100],["syariah","Ada, dengan akad syariah",100],["both","Ada keduanya: syariah dan konvensional",60],["konv","Ada, dengan kredit konvensional",30]]},
 {id:"lindung",k:"lindung",q:"Asuransi kesehatan atau jiwa yang kamu punya?",o:[["syariah","Asuransi syariah",100],["bpjs","BPJS saja",70],["konv","Asuransi konvensional",40],["none","Belum ada",15]]},
 {id:"inv",k:"investasi",multi:true,q:"Uangmu dikembangkan di mana saja?",h:"Pilih semua yang kamu punya, lalu ketuk Lanjut.",o:[["saham","Saham",70],["rdsy","Reksa dana syariah",100],["rdkonv","Reksa dana konvensional",30],["sukuk","Sukuk negara (ST atau SR)",100],["sbn","SBN konvensional (ORI atau SBR)",40],["emas","Emas",80],["belum","Belum berinvestasi",25]]},
 {id:"zakat",k:"zakat",q:"Bagaimana kebiasaan zakatmu selain zakat fitrah?",o:[["resmi","Rutin, lewat BAZNAS atau LAZ resmi",100],["langsung","Rutin, langsung ke penerima",85],["kadang","Kadang-kadang",60],["fitrah","Baru zakat fitrah",35],["belum","Belum tahu cara menghitungnya",20]]},
 {id:"inc",k:"about",q:"Kira-kira penghasilan bulananmu?",h:"Hanya untuk kalkulator zakat dan target dana darurat. Tidak dikirim ke mana pun.",o:[["4","Di bawah Rp5 juta"],["8","Rp5–10 juta"],["15","Rp10–25 juta"],["35","Di atas Rp25 juta"]]}
];
const KNOW=STEPS.filter(s=>s.k==="know");
/* Istilah untuk orang awam. */
const QTAG=PILLARS;
const GLOSS=[
 ["Unit usaha syariah",/unit usaha syariah/i,"Bagian syariah dari bank konvensional, punya izin dan pengawas syariah sendiri."],
 ["Kartu pembiayaan syariah",/kartu pembiayaan syariah/i,"Kartu seperti kartu kredit, tapi memakai akad syariah dengan biaya yang disepakati di awal."],
 ["Pembiayaan",/pembiayaan/i,"Istilah syariah untuk kredit: bank menyediakan dana atau barang dengan akad tertentu."],
 ["Akad",/akad/i,"Perjanjian atau kontrak. Jenis akad menentukan hak dan kewajibanmu."],
 ["Mudharabah",/mudharabah/i,"Akad kerja sama: kamu menyerahkan modal, bank mengelolanya, keuntungan dibagi."],
 ["Nisbah",/nisbah/i,"Porsi pembagian keuntungan yang disepakati, misalnya 40:60. Bukan jumlah hasil yang pasti."],
 ["Murabahah",/murabahah/i,"Akad jual beli: bank membeli barang lalu menjualnya kepadamu dengan harga plus margin."],
 ["Margin",/margin/i,"Keuntungan bank yang ditambahkan ke harga barang, disepakati di awal."],
 ["Asuransi syariah",/asuransi syariah/i,"Asuransi yang dijalankan dengan akad syariah, diawasi Dewan Pengawas Syariah."],
 ["Tabarru'",/tabarru/i,"Dana tolong-menolong di asuransi syariah, dipakai untuk membayar klaim."],
 ["Ujrah",/ujrah/i,"Imbalan atau upah untuk jasa, misalnya jasa mengelola dana."],
 ["Daftar Efek Syariah",/daftar efek syariah/i,"Daftar saham dan surat berharga yang dinyatakan syariah oleh OJK, diperbarui berkala."],
 ["Emiten",/emiten/i,"Perusahaan yang sahamnya diperdagangkan di bursa."],
 ["Sukuk",/sukuk/i,"Surat berharga syariah, mirip obligasi. Imbal hasilnya berasal dari aset atau proyek yang mendasarinya."],
 ["Reksa dana syariah",/reksa dana syariah|reksa dana, atau sukuk syariah/i,"Kumpulan dana investor yang dikelola manajer investasi, hanya di efek syariah."],
 ["Zakat penghasilan",/zakat penghasilan/i,"Zakat dari gaji atau pendapatan rutin, 2,5% bila mencapai batas minimum (nisab)."],
 ["Zakat maal",/zakat maal|penghasilan atau maal/i,"Zakat atas harta seperti tabungan, emas, dan investasi yang sudah mencapai nisab dan dimiliki setahun."],
 ["Fatwa DSN-MUI",/DSN-MUI/,"Fatwa Dewan Syariah Nasional MUI, lembaga yang menetapkan aturan syariah untuk produk keuangan."],
 ["POJK",/POJK/,"Peraturan Otoritas Jasa Keuangan."],
 ["Shahibul maal",/shahibul maal/i,"Pemilik modal."],
 ["Ta'zir",/ta'zir/i,"Denda sebagai sanksi agar disiplin membayar."],
 ["Ta'widh",/ta'widh/i,"Ganti rugi atas kerugian nyata yang dialami bank."]];
let SHOWN=[];
function termsIn(txt,skip){ return GLOSS.filter(g=>g[1].test(txt)&&!(skip||[]).includes(g[0])); }
function termsHTML(list){ return list.length?`<span class="k">Arti istilah</span>`+list.map(g=>`<p><b>${g[0]}</b>: ${g[2]}</p>`).join(""):""; }
STEPS.sort((a,b)=>(a.k==="know")-(b.k==="know"));
const PRE=STEPS.filter(s=>s.k!=="know"), FIRSTK=STEPS.findIndex(s=>s.k==="know");
// Isi dengan nomor WhatsApp bisnis (format 62812...), kosongkan untuk mode salin pesan saja.
const WAITLIST_WA=import.meta.env.VITE_WAITLIST_WA||"";
const S=Object.assign({ans:{},know1:{},step:0,unlocked:false,done:{},tab:"untung",lab:"rumah"},load()||{});
if(!S.know1) S.know1={};
const OWNER_PREVIEW=(location.hash||"").replace("#","")==="pratinjau";
let answered=false;

function renderQ(){
  while(skipQ(S.step)) S.step++;
  const st=STEPS[S.step]; answered=false;
  $("q-count").textContent="Pertanyaan "+qPos()+"/"+qTotal(); $("q-bar").style.width=(qPos()/qTotal()*100)+"%";
  const tag=$("q-tag"); tag.className="qtag"; tag.textContent= st.k==="about" ? "Tentang kamu" : QTAG[st.k];
  $("q-text").textContent=st.q; $("q-hint").textContent=st.h||""; $("q-exp").hidden=true;
  const tl=termsIn(st.q+" "+st.o.map(o=>o[1]).join(" ")+" "+(st.h||"")); $("q-terms").innerHTML=termsHTML(tl); $("q-terms").hidden=!tl.length; SHOWN=tl.map(g=>g[0]);
  const cur=String(S.ans[st.id]||"").split(",");
  $("q-opts").innerHTML=st.o.map(o=>`<button data-v="${o[0]}" aria-pressed="${st.multi?cur.includes(o[0]):S.ans[st.id]===o[0]}">${st.multi?'<span class="mk" aria-hidden="true"></span>':""}${o[1]}</button>`).join("");
  $("q-opts").querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>choose(st,b)));
  $("q-next").textContent="Lanjut"; $("q-next").hidden=!(st.multi&&S.ans[st.id]);
  const box=$("q-box"); box.classList.remove("fade"); void box.offsetWidth; box.classList.add("fade");
}
function choose(st,b){
  if(answered) return;
  if(st.multi){ let v=String(S.ans[st.id]||"").split(",").filter(Boolean); const k=b.dataset.v;
    if(k==="belum") v=v.includes("belum")?[]:["belum"]; else { v=v.filter(x=>x!=="belum"); v=v.includes(k)?v.filter(x=>x!==k):v.concat(k); }
    S.ans[st.id]=v.join(","); save();
    $("q-opts").querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(v.includes(x.dataset.v))));
    $("q-next").hidden=!v.length; return; }
  S.ans[st.id]=b.dataset.v; save(); b.setAttribute("aria-pressed","true"); answered=true; setTimeout(next,180);
}
$("q-next").addEventListener("click",next);
const skipQ=i=>S.preGuess&&STEPS[i]&&STEPS[i].id==="guess";
const qTotal=()=>STEPS.length-(S.preGuess?1:0);
const qPos=()=>STEPS.slice(0,S.step+1).filter((x,i)=>!skipQ(i)).length;
function next(){ let n=S.step+1; while(n<STEPS.length&&skipQ(n)) n++; if(n<STEPS.length){ S.step=n; save(); renderQ(); window.scrollTo(0,0); } else finish(); }
function renderIntro1(){ answered=true; S.step=0;
  $("q-count").textContent="Sebelum mulai"; $("q-bar").style.width="2%";
  const tag=$("q-tag"); tag.className="qtag"; tag.textContent="11 pertanyaan · sekitar 3 menit";
  $("q-text").textContent="Berapa persen keuanganmu yang sudah syariah?";
  $("q-hint").textContent="Semua pertanyaannya tentang kebiasaan keuanganmu sekarang. Tidak ada jawaban benar atau salah.";
  $("q-terms").innerHTML='<span class="k">Yang kamu dapat di akhir, gratis</span><p>Persentase keuanganmu yang sudah syariah, dan levelmu</p><p>Lencana yang ternyata sudah kamu punya</p><p>Keuntungan yang belum kamu ambil</p><p>Satu langkah pertama untuk minggu ini</p><p class="muted">Tanpa login. Jawabanmu hanya disimpan di perangkat ini.</p>'; $("q-terms").hidden=false;
  $("q-exp").hidden=true; $("q-next").hidden=true;
  $("q-opts").innerHTML='<button id="q-intro1go">Mulai →</button>';
  $("q-intro1go").addEventListener("click",()=>{ renderQ(); window.scrollTo(0,0); });
  const box=$("q-box"); box.classList.remove("fade"); void box.offsetWidth; box.classList.add("fade"); }
$("q-back").addEventListener("click",()=>{ let p=S.step-1; while(p>=0&&skipQ(p)) p--; if(p>=0){ S.step=p; renderQ(); } else show("v-lander"); });
function finish(){
  track("quiz_complete"); $("q-box").hidden=true; $("q-loading").hidden=false;
  const li=[...document.querySelectorAll("#q-checks li")]; li.forEach(x=>x.classList.remove("on"));
  li.forEach((x,i)=>setTimeout(()=>x.classList.add("on"),350*(i+1)));
  setTimeout(()=>{ $("q-box").hidden=false; $("q-loading").hidden=true; renderResult(); show("v-result"); },350*li.length+500);
}

/* ================= SCORING ================= */
const hasInv=(a,k)=>String(a.inv||"").split(",").includes(k);
function invScore(a){ const v=String(a.inv||"").split(",").filter(Boolean); if(!v.length) return 50; const st=STEPS.find(x=>x.id==="inv"); return Math.round(v.reduce((t,k)=>t+((st.o.find(o=>o[0]===k)||[0,0,50])[2]),0)/v.length); }
function guessOf(a){ const st=STEPS.find(x=>x.id==="guess"); const o=st&&st.o.find(x=>x[0]===a.guess); return o?{v:+o[0],label:o[1]}:null; }
const BADGES=[
 ["Rekening syariah","Gajimu sudah masuk, setidaknya sebagian, ke rekening syariah.",a=>a.rek==="syariah"||a.rek==="keduanya"],
 ["Tabungan syariah","Sebagian tabunganmu sudah di produk syariah.",a=>a.tab==="syariah"||a.tab==="campur"],
 ["Dana darurat aman","Dana daruratmu cukup untuk 3 bulan atau lebih.",a=>a.darurat==="6"||a.darurat==="7"],
 ["Bayar dari saldo","Belanja harianmu dibayar dari saldo sendiri atau kartu syariah.",a=>a.bayar==="debit"||a.bayar==="sycard"],
 ["Cicilan syariah","Tidak ada cicilan, atau cicilanmu sudah memakai akad syariah.",a=>a.biaya==="none"||a.biaya==="syariah"],
 ["Asuransi syariah","Asuransimu memakai dana tolong-menolong (tabarru').",a=>a.lindung==="syariah"],
 ["Investasi syariah","Kamu punya reksa dana syariah atau sukuk negara.",a=>hasInv(a,"rdsy")||hasInv(a,"sukuk")],
 ["Zakat rutin","Zakatmu sudah rutin, bukan hanya zakat fitrah.",a=>a.zakat==="resmi"||a.zakat==="langsung"]];
/* Keuntungan yang benar-benar ada, dengan rujukan. [judul, isi, bisa dirupiahkan?, rujukan, berlaku?] */
const GAINS=[
 ["Zakat yang mengurangi pajak","Zakat lewat BAZNAS atau LAZ resmi, dengan bukti setor ber-NPWP, bisa dikurangkan dari penghasilan kena pajak di SPT Tahunan.",true,"UU 23/2011 Pasal 22; PMK 114/2025",a=>a.zakat!=="resmi"],
 ["Pajak setengah dari deposito","Imbal hasil sukuk negara ritel (ST dan SR) kena pajak final 10%, sedangkan bunga deposito 20%.",true,"PP 91/2021 (SBN); pajak deposito 20%",a=>a.tab==="konv"||a.tab==="campur"],
 ["Cicilan yang tidak berubah","Di murabahah, harga jual disepakati di awal, jadi cicilan tetap sampai lunas. Denda keterlambatan disalurkan untuk sosial, bukan jadi pendapatan bank.",false,"Fatwa DSN-MUI No. 04/DSN-MUI/IV/2000; No. 17/DSN-MUI/IX/2000",a=>a.goal==="rumah"||a.biaya==="konv"||a.biaya==="both"],
 ["Dana bersama milik peserta","Di asuransi syariah, dana tabarru' milik peserta bersama. Perusahaan mengelolanya dengan imbalan (ujrah) yang disebutkan di polis.",false,"Fatwa DSN-MUI No. 21/DSN-MUI/X/2001; No. 52/DSN-MUI/III/2006",a=>a.lindung!=="syariah"],
 ["Sahammu mungkin sudah syariah","Lebih dari separuh nilai pasar saham di BEI adalah saham syariah. Peta lengkap mengecek sahammu dengan aturan 2026.",false,"Bloomberg via Bisnis.com, 19 Feb 2026; POJK 8/2025",a=>hasInv(a,"saham")],
 ["Biaya kartu yang disepakati di awal","Kartu syariah memakai akad kafalah, qardh, dan ijarah, dengan biaya yang disepakati di depan.",false,"Fatwa DSN-MUI No. 54/DSN-MUI/X/2006",a=>a.bayar==="kk"||a.bayar==="paylater"]];
const gainsFor=a=>GAINS.filter(x=>x[4](a)).slice(0,4);
const FACTS=[
 ["56,8%","nilai pasar saham di BEI berasal dari saham syariah: 631 saham per 18 Februari 2026.","Bloomberg via Bisnis.com, 19 Feb 2026"],
 ["10 tahun","Telkom, Indofood CBP, Kalbe Farma, dan Unilever Indonesia bertahan di indeks saham syariah JII selama 10 tahun.","IDX Channel, 20 Okt 2022"],
 ["4.246","proyek infrastruktur dibiayai sukuk negara, termasuk rel ganda di selatan Jawa dan Jembatan Youtefa di Jayapura.","Kemenkeu via Fortune Indonesia, 10 Mar 2022"],
 ["£200 jt","Inggris jadi negara pertama di luar dunia Islam yang menerbitkan sukuk negara, pada 2014. Pesanannya sekitar £2,3 miliar.","GOV.UK, 25 Jun 2014"],
 ["Rp5 T","XL Axiata membuka program sukuk ijarah korporasi pada 2015 untuk modal kerjanya.","Selular.id, 30 Okt 2015"]];
const factHTML=x=>`<article class="fact"><b class="num">${x[0]}</b><p>${x[1]}</p><span class="cite">${x[2]}</span></article>`;
function scores(a){
  const val=id=>{ const st=STEPS.find(x=>x.id===id); const o=st.o.find(x=>x[0]===a[id]); return o?o[2]:50; };
  let trx=val("bayar"); if(a.bayar==="debit"&&a.rek==="konv") trx=70;
  const s={simpan:Math.round(val("rek")*.35+val("tab")*.35+val("darurat")*.3),transaksi:trx,pembiayaan:val("biaya"),lindung:val("lindung"),investasi:invScore(a),zakat:val("zakat")};
  s.praktik=Math.round((s.simpan+s.transaksi+s.pembiayaan+s.lindung+s.investasi+s.zakat)/6);
  s.badges=BADGES.filter(b=>b[2](a)).length;
  s.inklusi=a.rek==="syariah"||a.rek==="keduanya"||a.tab==="syariah"||a.tab==="campur"||a.bayar==="sycard"||a.biaya==="syariah"||a.biaya==="both"||a.lindung==="syariah"||hasInv(a,"rdsy")||hasInv(a,"sukuk");
  return s;
}
function persona(s){
  const x=s.praktik;
  if(x>=80) return ["Penjaga Amanah","Hampir semua keuanganmu sudah syariah. Tinggal menjaga dan merapikan sisanya."];
  if(x>=55) return ["Penggerak","Lebih dari separuh keuanganmu sudah syariah. Sisanya bisa dipindah satu per satu."];
  if(x>=30) return ["Penjelajah","Kamu sudah mulai. Beberapa langkah lagi, separuh keuanganmu syariah."];
  return ["Perintis","Langkah pertamamu dimulai di sini. Pilih satu hal kecil minggu ini."];
}
function radarSVG(s,proj){
  const keys=Object.keys(PILLARS), cx=90, cy=86, R=54, n=keys.length;
  const pt=(i,r)=>{ const a=(-90+i*360/n)*Math.PI/180; return [cx+r*Math.cos(a), cy+r*Math.sin(a)]; };
  const poly=r=>keys.map((_,i)=>pt(i,r).map(v=>v.toFixed(1)).join(",")).join(" ");
  let g="";
  [25,50,75,100].forEach(l=>{ g+=`<polygon points="${poly(R*l/100)}" fill="${l===100?"rgba(244,239,226,.04)":"none"}" stroke="rgba(212,238,58,${l===100?.45:.2})" stroke-width="1"/>`; });
  keys.forEach((_,i)=>{ const [x,y]=pt(i,R); g+=`<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(212,238,58,.2)" stroke-width="1"/>`; });
  if(proj){ const pp=keys.map((k,i)=>pt(i,R*Math.max(4,proj[k])/100)); g+=`<polygon points="${pp.map(p=>p.map(v=>v.toFixed(1)).join(",")).join(" ")}" fill="rgba(212,238,58,.08)" stroke="#D4EE3A" stroke-width="1.5" stroke-dasharray="4 3" stroke-opacity=".85"/>`; }
  const dp=keys.map((k,i)=>pt(i,R*Math.max(4,s[k])/100));
  g+=`<polygon points="${dp.map(p=>p.map(v=>v.toFixed(1)).join(",")).join(" ")}" fill="rgba(212,238,58,.3)" stroke="#D4EE3A" stroke-width="2" stroke-linejoin="round"/>`;
  dp.forEach((p,i)=>{ g+=`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.5" fill="#D4EE3A" stroke="#0B2725" stroke-width="1.5"><title>${PILLARS[keys[i]]}: ${s[keys[i]]}/100</title></circle>`; });
  keys.forEach((k,i)=>{ const [x,y]=pt(i,R+13); const anchor=Math.abs(x-cx)<4?"middle":(x>cx?"start":"end"); const dy=y<cy-R?-1:(y>cy+R?9:4);
    g+=`<text x="${x.toFixed(1)}" y="${(y+dy).toFixed(1)}" text-anchor="${anchor}">${PSHORT[k]}</text>`; });
  const label="Radar enam pilar: "+keys.map(k=>PILLARS[k]+" "+s[k]).join(", ");
  return `<svg class="radar" viewBox="0 0 180 176" role="img" aria-label="${label}">${g}</svg>`;
}
function project(s,a){
  const T=tasks(a), P={}; Object.keys(PILLARS).forEach(k=>{ const has=T.some(t=>t.p===k&&t.id!=="review"); P[k]=has?Math.round(s[k]+(100-s[k])*.7):s[k]; });
  P.praktik=Math.round(Object.keys(PILLARS).reduce((x,k)=>x+P[k],0)/6); return P;
}
function rankP(s){ const ks=Object.keys(PILLARS); return ks.slice().sort((x,y)=>(s[y]-s[x])||(ks.indexOf(x)-ks.indexOf(y))); }
function weakestP(s){ const r=rankP(s); return r[r.length-1]; }
function cardHTML(s,ex,proj){
  const p=persona(s); const sorted=rankP(s);
  return `<div class="head"><div><span class="lbl">${ex?"Contoh · ":""}Level</span><div class="persona">${p[0]}</div><p class="tagline">${p[1]}</p></div><div>${radarSVG(s,proj)}${proj?'<div class="rlegend"><span><i></i>Sekarang</span><span><i class="d"></i>Potensi</span></div>':""}</div></div>
  <div class="scores"><div><b class="num">${s.praktik}%</b><span>Keuangan yang sudah syariah</span></div><div><b class="num">${s.badges==null?"–":s.badges}/8</b><span>Lencana</span></div></div>${proj?`<div class="potential"><span>Potensi dalam 90 hari</span><span><b class="num">${s.praktik}% → ${proj.praktik}%</b></span></div>`:""}
  <div class="pillars">${Object.keys(PILLARS).map(k=>`<div class="pl"><div class="t"><span>${PILLARS[k]}</span><span>${s[k]}</span></div><div class="bar"><i style="width:${s[k]}%"></i></div></div>`).join("")}</div>
  <div class="foot"><span>Kekuatan utama <b>${PILLARS[sorted[0]]}</b></span><span>Perlu dibenahi dulu <b>${PILLARS[sorted[sorted.length-1]]}</b></span></div>`;
}
$("l-card").innerHTML=cardHTML({simpan:78,transaksi:100,pembiayaan:30,lindung:70,investasi:80,zakat:60,praktik:70,badges:4},true,{simpan:93,transaksi:100,pembiayaan:79,lindung:91,investasi:94,zakat:88,praktik:91});

/* ================= ROADMAP RULES ================= */
function tasks(a){
  const T=[],inc=+a.inc||8,add=o=>T.push(o);
  if(a.rek!=="syariah"||a.tab!=="syariah")
    add({id:"buka",ask:["Akadnya wadiah atau mudharabah?","Kalau mudharabah: berapa nisbah dan realisasi bagi hasil 3 bulan terakhir?","Apakah bonus wadiah dijanjikan di awal? (seharusnya tidak)","Apakah dijamin LPS? Penjaminan itu jaring pengaman, bukan bagian dari akad"],ph:1,p:"simpan",d:"1 hari",t:"Buka rekening tabungan syariah sebagai pusat tabunganmu",w:"Satu rekening syariah khusus tabungan membuat semua langkah berikutnya lebih mudah, tanpa harus memindahkan semuanya sekaligus.",how:["Pilih bank syariah atau unit usaha syariah yang aplikasinya nyaman kamu pakai","Tanyakan akadnya: wadiah (titipan, bonus tidak dijanjikan) atau mudharabah (bagi hasil sesuai nisbah)","Atur autodebit tabungan di tanggal gajian"],watch:"Di tabungan wadiah, bonus tidak boleh dijanjikan di awal. Kalau ada yang menjanjikan \"bonus pasti X%\", tanyakan dasarnya.",src:["02"]});
  if(a.darurat==="0"||a.darurat==="3")
    add({id:"darurat",ph:1,p:"simpan",d:"Bertahap",t:`Bangun dana darurat: target awal ${rpS(inc*1e6*3)}`,w:"Dana darurat menjaga kamu dari berutang saat ada kejadian mendadak. Ini fondasi sebelum investasi.",how:[`Sisihkan sekitar ${rpS(inc*1e6*.1)} per bulan (10% penghasilan) ke tabungan syariah terpisah`,"Pilih tabungan yang mudah dicairkan, bukan deposito","Setelah 3 bulan tercapai, naikkan target ke 6 bulan"],watch:null,src:["02"]});
  if(a.zakat!=="resmi")
    add({id:"zakat",ph:1,p:"zakat",d:"30 menit",t:"Hitung zakatmu dan jadwalkan pembayarannya",w:"Cukup hitung sekali, lalu atur pembayarannya otomatis. Lewat lembaga resmi, bukti setormu bisa mengurangi penghasilan kena pajak.",how:["Buka Lab kalkulator → Zakat","Bayar lewat BAZNAS atau LAZ resmi, dan minta bukti setor dengan NPWP-mu","Laporkan bukti setor di SPT Tahunan sebagai pengurang penghasilan"],watch:"Nisab zakat penghasilan BAZNAS 2026 Rp7.640.144 per bulan. Nisab diperbarui tiap tahun.",src:[]});
  if(a.bayar==="paylater")
    add({id:"paylater",ph:1,p:"transaksi",d:"1 minggu",t:"Jadikan debit atau QRIS sebagai cara bayar utama",w:"Membayar dari saldo sendiri menjaga pengeluaran sesuai kemampuan.",how:["Selesaikan tagihan paylater yang berjalan sesuai jadwal","Hubungkan QRIS atau dompet digital ke rekening syariahmu","Simpan paylater untuk keadaan yang benar-benar perlu"],watch:null,src:[]});
  if(a.rek==="konv"||a.rek==="keduanya")
    add({id:"payroll",ph:2,p:"simpan",d:"1–2 minggu",t:"Arahkan gaji ke rekening syariah",w:"Kalau gaji masuk ke rekening syariah, tabungan, zakat, dan pembayaran rutin otomatis ikut tertata.",how:["Tanyakan ke HR apakah gaji bisa ditransfer ke bank lain","Kalau belum bisa, atur transfer otomatis di hari gajian","Pindahkan autodebit tagihan rutin secara bertahap"],watch:null,src:["02"]});
  if(a.tab==="konv"||a.tab==="campur")
    add({id:"deposito",ask:["Berapa nisbah dan realisasi bagi hasilnya?","Apa yang terjadi bila dicairkan sebelum jatuh tempo?","Ini produk simpanan atau produk investasi? POJK 4/2026 memisahkan keduanya","Fatwa yang dirujuk dari DSN-MUI, atau hanya opini DPS bank?"],ph:2,p:"simpan",d:"Saat jatuh tempo",t:"Pindahkan deposito ke deposito mudharabah saat jatuh tempo",w:"Menunggu jatuh tempo menghindari biaya pencairan lebih awal.",how:["Catat tanggal jatuh tempo setiap deposito","Bandingkan nisbah dan realisasi bagi hasil di 2–3 bank syariah (Lab → Bagi hasil)","Untuk dana yang tidak dipakai 2–4 tahun, bandingkan juga sukuk negara ritel: pajak imbal hasilnya 10%, deposito 20%","Matikan perpanjangan otomatis (ARO) di deposito lama"],watch:"Yang disepakati di mudharabah adalah nisbah, bukan hasil. Minta data realisasi beberapa bulan terakhir, bukan hanya angka promosi.",src:["03"]});
  if(a.bayar==="kk")
    add({id:"kartu",ask:["Akad apa yang dipakai: kafalah, qardh, atau ijarah?","Denda keterlambatan disalurkan ke mana?","Iuran dan biaya dihitung tetap, atau persen dari saldo?"],ph:2,p:"transaksi",d:"1 bulan",t:"Rapikan pemakaian kartu: bayar penuh, lalu pertimbangkan kartu syariah",w:"Kartu pembiayaan syariah memakai akad kafalah, qardh, dan ijarah, dengan biaya yang disepakati di awal.",how:["Bayar tagihan penuh sebelum jatuh tempo","Bandingkan iuran dan ketentuan kartu syariah (iB)","Atau beralih ke debit untuk belanja harian"],watch:"Tanyakan bagaimana kartu syariah mengenakan biaya keterlambatan dan ke mana dananya disalurkan.",src:["54","17"]});
  if(a.biaya==="konv"||a.biaya==="both")
    add({id:"takeover",ask:["Apakah bank membeli dan memiliki rumahnya dulu sebelum menjual kepadaku? Minta buktinya","Denda keterlambatan disalurkan ke mana?","Kebijakan potongan pelunasan (ibra\'), boleh diminta tertulis?","Ada biaya yang dihitung persen dari plafon setiap tahun?","Fatwa yang dirujuk mencakup versi produk ini?"],ph:2,p:"pembiayaan",d:"1–2 bulan",t:"Hitung opsi pengalihan pembiayaan ke akad syariah",w:"Pembiayaan rumah dan kendaraan biasanya pos terbesar. Pengalihan utang ke lembaga syariah punya struktur akad sendiri.",how:["Minta penawaran pengalihan dari 2 bank syariah dan tanyakan struktur akadnya; fatwa menyediakan beberapa alternatif, misalnya qardh lalu murabahah","Bandingkan murabahah dan MMQ di Lab → Murabahah vs MMQ","Hitung biaya pindah: penalti pelunasan lama, administrasi, appraisal, notaris"],watch:"Kalau kreditmu masih dalam masa bunga tetap, penalti pelunasan biasanya lebih besar. Cek perjanjianmu dulu.",src:["31","04","73"]});
  if(a.biaya==="none"&&a.goal==="rumah")
    add({id:"siaprumah",ask:["Apakah bank memiliki rumahnya dulu sebelum menjual atau menyewakan kepadaku?","Untuk MMQ: bagaimana ujrah ditinjau, dan berapa harga pengalihan porsi bank?","Denda keterlambatan disalurkan ke mana?","Kebijakan potongan pelunasan secara tertulis","Fatwa yang dirujuk mencakup versi produk ini?"],ph:2,p:"pembiayaan",d:"Sebelum akad",t:"Pilih akad pembiayaan rumah sebelum memilih bank",w:"Murabahah memberi cicilan tetap; MMQ lebih lentur untuk pelunasan dipercepat. Rumah inden punya akad khusus.",how:["Simulasikan keduanya di Lab → Murabahah vs MMQ","Untuk rumah inden, tanyakan apakah bank memakai ijarah maushufah fi al-dzimmah","Tanyakan kebijakan potongan pelunasan secara tertulis"],watch:"Di murabahah, potongan pelunasan tidak boleh diperjanjikan di akad dan besarnya kebijakan bank.",src:["04","73","102","23"]});
  if(a.lindung!=="syariah")
    add({id:"asuransi",ask:["Berapa ujrah yang diambil perusahaan?","Bagaimana surplus dana tabarru\' dibagikan?","Dana tabarru\' dipisah dari dana investasi?","Perusahaan atau unit syariahnya berizin OJK?"],ph:2,p:"lindung",d:"2 minggu",t:a.lindung==="none"?"Pasang perlindungan dasar dengan asuransi syariah":"Bandingkan perlindunganmu dengan asuransi syariah",w:"Asuransi syariah memakai dana tabarru' milik peserta bersama; perusahaan mengelola dengan ujrah.",how:["Mulai dari kesehatan, lalu jiwa bila ada tanggungan","Tanyakan besaran ujrah dan aturan pembagian surplus tabarru'",a.lindung==="konv"?"Jangan hentikan polis lama sebelum polis baru aktif":"Pertahankan BPJS sebagai lapisan dasar"],watch:"Untuk produk yang menggabungkan proteksi dan investasi, pisahkan dulu mana porsi tabarru' dan mana porsi investasi.",src:["21","52"]});
  if(!(hasInv(a,"rdsy")||hasInv(a,"sukuk"))||hasInv(a,"rdkonv")||hasInv(a,"sbn"))
    add({id:"investasi",ask:["Sahamnya ada di DES terbaru? DES ditinjau sekitar Mei dan November","Reksa dana: siapa DPS-nya dan apa kebijakan investasinya?","Berapa biaya pengelolaan per tahun?"],ph:3,p:"investasi",d:"Mulai bulan ini",t:hasInv(a,"belum")?"Mulai investasi syariah dari nominal kecil":"Arahkan investasi baru ke instrumen syariah",w:"Reksa dana syariah, saham syariah, sukuk negara, dan emas bisa dimulai dari nominal kecil.",how:["Reksa dana syariah: pilih jenis sesuai jangka waktu tujuanmu","Saham: pastikan ada di Daftar Efek Syariah terbaru (aturan berubah di 2026)","Sukuk negara ritel: imbal hasil dikenai PPh final 10%","Emas cicilan boleh dengan syarat, selama emas tidak menjadi alat tukar"],watch:"Saham yang dulu syariah bisa keluar daftar karena batas non-halal turun ke 5%. Cek ulang portofolio lama di Lab → Cek saham.",src:["20","80","69","77"]});
  const G={rumah:["dprumah","Pisahkan dana uang muka rumah di rekening syariah sendiri","investasi"],keluarga:["edu","Buat pos dana pendidikan di reksa dana syariah","investasi"],ibadah:["haji","Buka tabungan haji atau umrah syariah","simpan"],pensiun:["pensiun","Tambah porsi investasi syariah jangka panjang untuk pensiun","investasi"],tenang:["sedekah","Jadwalkan sedekah rutin, sekecil apa pun","zakat"]}[a.goal];
  if(G) add({id:G[0],ph:3,p:G[2],d:"Rutin",t:G[1],w:"Kalau dananya dipisah, tujuannya lebih gampang dijaga.",how:["Tentukan nominal dan tanggal setoran","Pisahkan di rekening atau produk tersendiri","Tinjau setiap 6 bulan"],watch:null,src:[]});
  add({id:"review",ph:3,p:"zakat",d:"Hari ke-90",t:"Ulangi kuis dan bandingkan kartu profilmu",w:"Dari situ kelihatan langkah mana yang sudah berjalan dan mana yang belum.",how:["Ulangi kuis di hari ke-90","Bandingkan skor praktik dan pemahaman","Pilih pilar fokus untuk 90 hari berikutnya"],watch:null,src:[]});
  return T;
}

/* ================= RESULT ================= */
let SC=null;
function renderResult(){
  SC=scores(S.ans); const T=tasks(S.ans); const p=persona(SC);
  const PJ=project(SC,S.ans); $("r-card").innerHTML=cardHTML(SC,false,PJ);
  const GL={simpan:"Uang yang siap dipakai: rekening, tabungan, dana darurat",transaksi:"Cara kamu membayar kebutuhan sehari-hari",pembiayaan:"Cicilan rumah atau kendaraan dan akadnya",lindung:"Asuransi kesehatan dan jiwa",investasi:"Ke mana uangmu dikembangkan",zakat:"Zakat, infak, sedekah, dan wakaf"};
  $("r-gloss").innerHTML=Object.keys(PILLARS).map(k=>`<li><b>${PILLARS[k]}</b>${GL[k]}</li>`).join(""); const c=$("r-card"); c.classList.remove("reveal"); void c.offsetWidth; c.classList.add("reveal");
  const g=guessOf(S.ans);
  if(g){ const d=SC.praktik-g.v; $("r-guess").innerHTML=`<span class="k">Tebakanmu vs hasil hitungan</span><div class="vs"><div><b class="num">${g.label}</b><span>tebakanmu</span></div><div class="hit"><b class="num">${SC.praktik}%</b><span>hasil hitungan</span></div></div><p class="small">${d>=10?"Keuanganmu ternyata <b>lebih syariah</b> dari yang kamu kira. Lencana di bawah menunjukkan bagian mana saja.":d<=-10?"Ada bagian yang ternyata belum syariah. Lihat lencana yang belum terbuka di bawah.":"Tebakanmu cukup tepat. Kamu kenal keuanganmu sendiri."}</p>`; }
  $("r-guess").hidden=!g;
  $("r-badges").innerHTML=BADGES.map(b=>{ const on=b[2](S.ans); return `<div class="badge${on?"":" off"}"><b>${on?"✓":"○"} ${b[0]}</b><span>${on?b[1]:"Belum terbuka"}</span></div>`; }).join("");
  $("r-bcount").textContent=SC.badges+" dari "+BADGES.length;
  const G=gainsFor(S.ans);
  $("r-gains").innerHTML=G.map(x=>`<li><div><b>${x[0]}</b><p class="small muted">${x[1]}</p><p class="cite">${x[3]}</p></div><span class="lockchip">${x[2]?"Rp ••• / tahun":"dihitung di peta lengkap"}</span></li>`).join("")||`<li><div><b>Hampir semua keuntungan utama sudah kamu ambil.</b><p class="small muted">Peta lengkap membantu menjaga dan merapikan sisanya.</p></div></li>`;
  $("r-facts").innerHTML=FACTS.map(factHTML).join("");
  const weakest=weakestP(SC);
  const first=T.find(t=>t.p===weakest&&t.ph===1)||T.find(t=>t.ph===1)||T[0];
  $("r-first").innerHTML=`<span class="k">Langkah pertamamu minggu ini</span><h3>${first.t}</h3><p class="small muted">${first.w}</p>`;
  $("r-nat").innerHTML=`<div class="natrow"><span>Melek keuangan syariah (nasional)</span><b class="num">43,42%</b><div class="natbar"><i style="width:43.42%"></i></div></div>
    <div class="natrow"><span>Memakai produk syariah (nasional)</span><b class="num">13,41%</b><div class="natbar"><i style="width:13.41%"></i></div></div>
    <p class="small">${SC.inklusi?`Kamu sudah termasuk kelompok yang <b>memakai produk syariah</b>, sekitar 1 dari 7 penduduk.`:`Kamu belum termasuk kelompok yang memakai produk syariah. Itu juga kondisi sebagian besar penduduk.`}</p>`;
  $("r-pname").textContent=p[0]; $("r-ntask").textContent=T.length+" "; $("r-ngain").textContent=G.length+" keuntungan";
  $("pw-n").textContent=T.length; $("pw-sub").innerHTML=`<b>Dari ${SC.praktik}% ke sekitar ${PJ.praktik}% syariah dalam 90 hari.</b> <span class="muted">Untuk level ${p[0]}, dimulai dari ${PILLARS[weakest]}. ${G.length?G.length+" keuntungan yang belum kamu ambil dihitung dalam rupiah. ":""}Potensi adalah perkiraan bila semua langkah dijalankan.</span>`;
  track("result_view",{pct:SC.praktik,badges:SC.badges,guess:g?g.v:null}); renderShare();
  if(WAITLIST_WA){ const fb=isEN?`Hi, feedback for Peta Syariah. My result: ${SC.praktik}% sharia, level ${tr(p[0])}.\n\nMost useful: \nConfusing: \nDid the result feel right? `:`Halo, masukan untuk Peta Syariah. Hasil saya: ${SC.praktik}% syariah, level ${p[0]}.\n\nYang paling berguna: \nYang membingungkan: \nApakah hasilnya terasa pas? `; $("r-fb").href="https://wa.me/"+WAITLIST_WA+"?text="+encodeURIComponent(fb); $("r-fb").hidden=false; }
}


const SHORT={simpan:"Tabungan",transaksi:"Cara bayar",pembiayaan:"Cicilan",lindung:"Asuransi",investasi:"Investasi",zakat:"Zakat & sedekah"};
const SH={fmt:"story"}; const shCv=document.createElement("canvas");
function shSpec(){ const p=persona(SC), r=rankP(SC), g=guessOf(S.ans); return {fmt:SH.fmt,kind:"type",persona:p[0],tagline:p[1],pct:SC.praktik,badges:SC.badges,pillars:Object.keys(PILLARS).map(k=>({label:PSHORT[k],now:SC[k]})),focus:SHORT[r[r.length-1]],showGuess:$("sh-scores").checked&&!!g,guessLabel:g?g.label:"",guessV:g?g.v:0,inklusi:SC.inklusi}; }
async function renderShare(){ if(!SC) return; try{ await document.fonts.ready; }catch(_){}
  SHARE.draw(shCv,shSpec()); $("sh-img").src=shCv.toDataURL("image/png"); $("sh-status").textContent="";
  $("sh-save").hidden=!(await SHARE.hasSave()); if($("sh-save").hidden) $("sh-status").textContent="Tekan lama gambar di atas, lalu pilih Simpan gambar."; }
$("sh-fmt").querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{ SH.fmt=b.dataset.f; $("sh-fmt").querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b))); renderShare(); }));
$("sh-scores").addEventListener("change",renderShare);
$("sh-save").addEventListener("click",()=>{ track("share_save",{fmt:SH.fmt,scores:$("sh-scores").checked}); SHARE.save(shCv,"peta-syariah-"+SH.fmt+".png",$("sh-status")); });
$("sh-cap").addEventListener("click",()=>{ const o=shSpec(); const txt=isEN?`My finances are already ${o.pct}% sharia, level ${tr(o.persona)}. ${o.showGuess?`I guessed ${tr(o.guessLabel)}. `:""}What I want to fix first: ${tr(o.focus)}. What's your percentage? Free check, 3 minutes. #PetaSyariahku\n${SHARE_URL}`:`Ternyata keuanganku sudah ${o.pct}% syariah, level ${o.persona}. ${o.showGuess?`Tadinya kutebak ${o.guessLabel}. `:""}Yang mau kubenahi dulu: ${o.focus}. Berapa persen punyamu? Cek gratis, 3 menit. #PetaSyariahku\n${SHARE_URL}`;
  const ok=()=>{ $("sh-cap").textContent="Caption tersalin"; setTimeout(()=>$("sh-cap").textContent="Salin caption",1600); };
  try{ navigator.clipboard.writeText(txt).then(ok,()=>{ $("sh-status").textContent=txt; }); }catch(_){ $("sh-status").textContent=txt; }
  track("share_caption"); });
function restart(){ S.preGuess=false; if(S.know1At&&Date.now()-S.know1At>30*864e5){ S.know1={}; S.know1At=null; } S.ans={}; S.step=0; save(); show("v-quiz"); renderIntro1(); track("quiz_start"); }
function armRestart(btn){ const label=btn.textContent; let armed=false, t=null;
  btn.addEventListener("click",()=>{ if(armed){ clearTimeout(t); btn.textContent=label; armed=false; restart(); return; }
    armed=true; btn.textContent="Jawaban lama akan diganti. Ketuk lagi untuk mengulang"; t=setTimeout(()=>{ armed=false; btn.textContent=label; },4000); }); }
armRestart($("r-redo")); armRestart($("f-redo"));

/* sheets */
let opener=null;
function sheet(id,open){ const el=$(id); if(open){ if(el.hidden) opener=document.activeElement; el.hidden=false; const h=el.querySelector("h2"); if(h) h.focus(); } else if(!el.hidden){ el.hidden=true; if(opener&&document.contains(opener)) opener.focus(); opener=null; } }
$("l-method").addEventListener("click",()=>sheet("method",true)); $("m-close").addEventListener("click",()=>sheet("method",false));
$("r-unlock").addEventListener("click",()=>{ track("paywall_view"); $("pw-demo").hidden=true; sheet("paywall",true); });
$("pw-close").addEventListener("click",()=>sheet("paywall",false));
["paywall","method"].forEach(id=>$(id).addEventListener("click",e=>{ if(e.target.id===id) sheet(id,false); }));
document.addEventListener("keydown",e=>{ if(e.key==="Escape"){ sheet("paywall",false); sheet("method",false); } });
/* buyer form: name + email required, WhatsApp optional, explicit consent to Syarat & Privasi */
const EMAIL_RE=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function normWa(v){ let d=String(v||"").replace(/[^\d+]/g,""); if(!d) return ""; if(d.startsWith("+")) d=d.slice(1); if(d.startsWith("0")) d="62"+d.slice(1); return /^62\d{8,13}$/.test(d)?"+"+d:null; }
function fillBuyer(){ const b=S.buyer||{}; if(b.name) $("b-name").value=b.name; if(b.email) $("b-email").value=b.email; if(b.wa) $("b-wa").value=b.wa; }
fillBuyer();
$("pw-form").addEventListener("submit",async(e)=>{
  e.preventDefault();
  const name=$("b-name").value.trim(), email=$("b-email").value.trim(), waRaw=$("b-wa").value.trim(), wa=normWa(waRaw);
  const err=name.length<2?"Isi nama lengkapmu.":!EMAIL_RE.test(email)?"Cek lagi alamat emailmu.":wa===null?"Nomor WhatsApp belum benar. Contoh: 081234567890.":!$("b-agree").checked?"Centang persetujuan Syarat dan Kebijakan privasi dulu.":"";
  $("buy-err").textContent=err; $("buy-err").hidden=!err; if(err) return;
  S.buyer={name,email,wa:waRaw}; save();
  track("checkout_start",{price:PRICE,level:persona(SC)[0],pct:SC.praktik,badges:SC.badges});
  S.minat=(S.minat||0)+1; save();
  $("pw-pay").disabled=true; $("pw-pay").textContent="Menyiapkan pembayaran…";
  const co=await checkout({buyer:{name,email,wa:wa||"",consent:true}});
  if(co&&co.error==="bad_buyer"){ $("pw-pay").disabled=false; $("pw-pay").textContent="Saya mau peta lengkap · "+fmtRp(PRICE); $("buy-err").textContent="Data pembeli belum lengkap. Cek nama dan email."; $("buy-err").hidden=false; return; }
  if(co&&co.mode==="redirect"&&co.url){ S.orderId=co.orderId; save(); location.href=co.url; return; }
  $("pw-pay").textContent="Saya mau peta lengkap · "+fmtRp(PRICE);
  const msg=isEN?`Hi, I'm ${name} and I'd like the Peta Syariah full map (${fmtRp(PRICE)}).${co&&co.orderId?` Order number: ${co.orderId}.`:""} Please let me know when it can be bought.`:`Halo, saya ${name} mau Peta Syariah lengkap (${fmtRp(PRICE)}).${co&&co.orderId?` Nomor pesanan: ${co.orderId}.`:""} Kabari saya saat sudah bisa dibeli.`;
  $("fd-msg").textContent=msg;
  if(WAITLIST_WA){ $("fd-wa").href="https://wa.me/"+WAITLIST_WA+"?text="+encodeURIComponent(msg); $("fd-wa").hidden=false; }
  $("pw-demo-go").hidden=!OWNER_PREVIEW; $("pw-form").hidden=true; $("pw-demo").hidden=false;
});
$("fd-wa").addEventListener("click",()=>track("wa_click"));
$("r-fb").addEventListener("click",()=>track("feedback_click"));
$("fd-copy").addEventListener("click",()=>{ const t=$("fd-msg").textContent; const ok=()=>{ $("fd-copy").textContent="Tersalin"; };
  try{ navigator.clipboard.writeText(t).then(ok,()=>{ const r=document.createRange(); r.selectNodeContents($("fd-msg")); const sel=getSelection(); sel.removeAllRanges(); sel.addRange(r); $("fd-copy").textContent="Teks dipilih, salin manual"; }); }catch(_){} });
$("pw-demo-go").addEventListener("click",()=>{ track("owner_preview",{price:PRICE}); S.unlocked=true; save(); sheet("paywall",false); openFull(); });

/* ================= FULL ================= */
function openFull(){ SC=scores(S.ans); show("v-full"); $("f-card").innerHTML=cardHTML(SC,false,project(SC,S.ans)); renderRoad(); initLab(); renderKat(); renderAkad(); renderSrc(); initUntung(); selectTab(S.tab||"untung"); }
function selectTab(t){ S.tab=t; save(); document.querySelectorAll("[data-tab]").forEach(b=>b.setAttribute("aria-selected",String(b.dataset.tab===t))); document.querySelectorAll(".tab").forEach(p=>p.hidden=(p.dataset.panel!==t)); }
document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>selectTab(b.dataset.tab)));
const PH={1:["Fondasi","Hari 1–30"],2:["Pindahkan bertahap","Hari 31–60"],3:["Tumbuhkan","Hari 61–90"]};
function mapSVG(T){
  const W=640,y=46,xs=[70,320,570]; let g=`<line x1="${xs[0]}" y1="${y}" x2="${xs[2]}" y2="${y}" stroke="var(--line)" stroke-width="6" stroke-linecap="round"/>`;
  const tot=T.length, dn=T.filter(t=>S.done[t.id]).length; const prog=tot?dn/tot:0;
  g+=`<line x1="${xs[0]}" y1="${y}" x2="${xs[0]+(xs[2]-xs[0])*prog}" y2="${y}" stroke="var(--teal)" stroke-width="6" stroke-linecap="round"/>`;
  [1,2,3].forEach((ph,i)=>{ const L=T.filter(t=>t.ph===ph), d=L.filter(t=>S.done[t.id]).length, full=L.length&&d===L.length;
    g+=`<circle cx="${xs[i]}" cy="${y}" r="16" fill="${full?"var(--teal)":"var(--surface)"}" stroke="var(--teal)" stroke-width="3"/><text x="${xs[i]}" y="${y+5}" text-anchor="middle" style="fill:${full?"var(--bg)":"var(--ink)"};font-weight:700">${ph}</text>
      <text x="${xs[i]}" y="${y+40}" text-anchor="middle" style="fill:var(--ink);font-weight:700">${PH[ph][0]}</text><text x="${xs[i]}" y="${y+56}" text-anchor="middle">${d}/${L.length} · ${PH[ph][1]}</text>`; });
  return `<svg class="mapsvg" viewBox="0 0 ${W} 112" role="img" aria-label="Peta 3 fase, ${dn} dari ${tot} langkah selesai">${g}</svg>`;
}
function renderRoad(){
  const T=tasks(S.ans);
  $("road").innerHTML=`<div><p class="eyebrow">Rencana untuk ${persona(SC)[0]}</p><h2>${T.length} langkah dalam 90 hari</h2><p class="muted" style="margin-top:6px">Urutannya disengaja: fondasi dulu (tabungan, dana darurat, zakat), baru memindahkan produk besar, lalu menumbuhkan. Tidak ada yang harus dipindahkan sekaligus.</p></div><div class="panel" id="road-map">${mapSVG(T)}</div>`+
  [1,2,3].map(ph=>{ const L=T.filter(t=>t.ph===ph); if(!L.length) return "";
    return `<div class="phase"><div class="phase-h"><h3>Fase ${ph} · ${PH[ph][0]}</h3><span>${PH[ph][1]}</span></div>`+L.map(t=>`<div class="task${S.done[t.id]?" done":""}" data-id="${t.id}"><input type="checkbox" id="ck-${t.id}" ${S.done[t.id]?"checked":""}><div><h3><label for="ck-${t.id}" style="font:inherit;margin:0;display:inline">${t.t}</label></h3><p class="small muted" style="margin-top:4px">${t.w}</p><div class="meta"><span class="chip p">${PILLARS[t.p]}</span><span class="chip">${t.d}</span>${t.src.length?`<span class="chip f">${t.src.length} rujukan</span>`:""}</div><details><summary>Cara melakukannya</summary><ul>${t.how.map(h=>`<li>${h}</li>`).join("")}</ul>${t.watch?`<div class="watch"><b>Perlu diwaspadai:</b> ${t.watch}</div>`:""}${t.ask?`<p class="small" style="margin-top:8px"><b>Tanyakan ke penyedia, lalu centang:</b></p><ul class="asklist">${t.ask.map((q,i)=>{ const id=t.id+"-q"+i, on=!!(S.qc&&S.qc[id]); return `<li><label><input type="checkbox" data-q="${id}" ${on?"checked":""}><span class="${on?"done-q":""}">${q}</span></label></li>`; }).join("")}</ul><p class="small muted" style="margin-top:4px">${t.ask.filter((q,i)=>S.qc&&S.qc[t.id+"-q"+i]).length} dari ${t.ask.length} terjawab</p>`:""}${t.src.length?`<p class="cite" style="margin-top:8px">${t.src.map(f).join("<br>")}</p>`:""}</details></div></div>`).join("")+`</div>`; }).join("");
  $("road").querySelectorAll("input[data-q]").forEach(cb=>cb.addEventListener("change",()=>{ S.qc=S.qc||{}; S.qc[cb.dataset.q]=cb.checked; save(); cb.nextElementSibling.classList.toggle("done-q",cb.checked); const ul=cb.closest(".asklist"); const n=[...ul.querySelectorAll("input")].filter(x=>x.checked).length; ul.nextElementSibling.textContent=n+" dari "+ul.querySelectorAll("input").length+" terjawab"; track("ask_toggle",{q:cb.dataset.q,on:cb.checked}); }));
  $("road").querySelectorAll(".task > input[type=checkbox]").forEach(cb=>cb.addEventListener("change",()=>{ const id=cb.closest(".task").dataset.id; S.done[id]=cb.checked; save(); cb.closest(".task").classList.toggle("done",cb.checked); prog(); $("road-map").innerHTML=mapSVG(tasks(S.ans)); track("task_toggle",{id,done:cb.checked}); }));
  prog();
}
function prog(){ const T=tasks(S.ans); const d=T.filter(t=>S.done[t.id]).length; $("f-prog").textContent=d+" / "+T.length; $("f-progbar").style.width=(T.length?d/T.length*100:0)+"%"; }

/* ---------- lab ---------- */
function pmt(B,a,n){ if(n<=0) return B; const r=a/1200; return r===0?B/n:B*r/(1-Math.pow(1+r,-n)); }
function balAfter(B,a,n,k){ const r=a/1200,P=pmt(B,a,n); return r===0?B-P*k:B*Math.pow(1+r,k)-P*(Math.pow(1+r,k)-1)/r; }
let labInit=false;
function initLab(){
  document.querySelectorAll("#labnav button").forEach(b=>b.onclick=()=>{ S.lab=b.dataset.lab; save(); showLab(); });
  if(!labInit){
    ["h-harga","h-dp","h-tenor","h-mur","h-mmq","h-rev","h-chg","h-exit"].forEach(id=>$(id).addEventListener("input",calcRumah));
    ["s-aset","s-utang","s-pend","s-nh","s-div"].forEach(id=>$(id).addEventListener("input",calcSaham));
    ["b-dana","b-nis","b-yield"].forEach(id=>$(id).addEventListener("input",calcBagi));
    ["z-inc","z-nis","z-har","z-gold"].forEach(id=>$(id).addEventListener("input",calcZakat));
    ["w-inc","w-wife","w-zak","w-debt","w-par","w-naf","w-ef","w-life"].forEach(id=>$(id).addEventListener("input",calcAlok));
    document.querySelectorAll("#w-mode button").forEach(b=>b.addEventListener("click",()=>{ S.wmode=b.dataset.m; save(); calcAlok(); }));
    $("w-inc").value={4:4,8:8,15:15,35:35}[S.ans.inc]||15;
    $("z-inc").value={4:4,8:8,15:15,35:35}[S.ans.inc]||8; labInit=true;
  }
  showLab(); calcRumah(); calcSaham(); calcBagi(); calcZakat(); calcAlok();
}
function showLab(){ document.querySelectorAll("#labnav button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.lab===S.lab))); document.querySelectorAll(".lab").forEach(l=>l.hidden=(l.dataset.l!==S.lab)); }
function check(errId,rules){
  const bad=[]; rules.forEach(([id,min,max,msg])=>{ const v=parseFloat($(id).value); const ok=isFinite(v)&&v>=min&&v<=max; $(id).setAttribute("aria-invalid",String(!ok)); if(!ok) bad.push(msg); });
  const e=$(errId); if(bad.length){ e.innerHTML=`<p class="h">Periksa isian</p><p class="small">${bad.join(" ")}</p>`; e.hidden=false; return false; } e.hidden=true; return true;
}
function calcRumah(){
  if(!check("h-err",[["h-harga",50,100000,"Harga rumah antara 50 juta dan 100 miliar."],["h-dp",0,90,"Uang muka 0–90%."],["h-tenor",1,30,"Tenor 1–30 tahun."],["h-mur",0,30,"Margin 0–30% per tahun."],["h-mmq",0,30,"Ujrah 0–30% per tahun."],["h-rev",1,30,"Peninjauan tiap 1–30 tahun."],["h-chg",-10,10,"Perubahan per peninjauan antara −10 dan 10 poin."],["h-exit",1,29,"Tahun pelunasan harus sebelum tenor berakhir."]])) return;
  if(num("h-exit",5)>=num("h-tenor",15)){ $("h-err").innerHTML=`<p class="h">Periksa isian</p><p class="small">Tahun pelunasan harus lebih kecil dari tenor.</p>`; $("h-err").hidden=false; return; }
  const B=num("h-harga",800)*1e6*(1-num("h-dp",20)/100), n=Math.max(12,Math.round(num("h-tenor",15)*12));
  const m=num("h-mur",9.5), u0=num("h-mmq",8), rev=Math.max(1,Math.round(num("h-rev",3)))*12, chg=num("h-chg",1);
  const exitM=Math.min(n-1,Math.max(1,Math.round(num("h-exit",5)*12)));
  const Pm=pmt(B,m,n), hargaJual=Pm*n;
  // MMQ: re-amortise remaining bank share at each review with new ujrah
  let bal=B, rate=u0, P=pmt(B,rate,n), mmq=[], totalM=0, balAtExit=null;
  for(let t=1;t<=n;t++){ if(t>1&&(t-1)%rev===0){ rate=Math.max(0,rate+chg); P=pmt(bal,rate,n-t+1); }
    const i=bal*rate/1200, pr=Math.min(P-i,bal); bal-=pr; totalM+=i+pr; mmq.push(i+pr); if(t===exitM) balAtExit=bal; }
  const murOwe=Pm*(n-exitM), murEcon=balAfter(B,m,n,exitM);
  drawLines($("h-chart"),[{vals:new Array(n).fill(Pm),c:"var(--gold)"},{vals:mmq,c:"var(--teal)"}],n,exitM);
  $("h-facts").innerHTML=`<div><span>Cicilan murabahah (tetap)</span><b>${rp(Pm)}</b></div><div><span>Cicilan MMQ awal → akhir</span><b>${rpS(mmq[0])} → ${rpS(mmq[mmq.length-1])}</b></div>
    <div><span>Harga jual murabahah</span><b>${rpS(hargaJual)}</b></div><div><span>Total bayar MMQ (asumsi)</span><b>${rpS(totalM)}</b></div>
    <div><span>Lunas thn ke-${exitM/12|0}: sisa harga jual murabahah</span><b>${rpS(murOwe)}</b></div><div><span>Lunas thn ke-${exitM/12|0}: sisa porsi bank di MMQ</span><b>${rpS(balAtExit)}</b></div>`;
  const gap=murOwe-murEcon;
  $("h-insight").className="res"+(gap>0?"":" neutral");
  $("h-insight").innerHTML=`<p class="h">Kepastian vs kelenturan</p><p class="small">Murabahah mengunci cicilan ${rp(Pm)} sampai lunas, apa pun kondisi pasar. Tapi kalau kamu melunasi di tahun ke-${exitM/12|0}, kewajibanmu adalah sisa harga jual ${rpS(murOwe)}. Dari angka itu, sekitar <b>${rpS(gap)}</b> adalah sisa margin yang hanya berkurang bila bank memberi potongan pelunasan, dan potongan itu kebijakan bank, bukan hak yang diperjanjikan. Di MMQ, kamu membeli sisa porsi bank (sekitar ${rpS(balAtExit)} dalam model ini), dengan risiko ujrah bisa berubah di setiap peninjauan.</p>`;
}
function drawLines(svg,series,n,mark){
  const W=640,H=240,ml=78,mr=12,mt=14,mb=30,w=W-ml-mr,h=H-mt-mb;
  const all=series.flatMap(s=>s.vals); let hi=Math.max(...all)*1.1, lo=Math.min(...all)*0.85; const st=nice((hi-lo)/4); lo=Math.floor(lo/st)*st; hi=Math.ceil(hi/st)*st;
  const x=i=>ml+w*i/(n-1), y=v=>mt+h-h*(v-lo)/(hi-lo); let g="";
  for(let v=lo;v<=hi+1;v+=st) g+=`<line x1="${ml}" x2="${W-mr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${ml-8}" y="${y(v)+5}" text-anchor="end">${ax(v)}</text>`;
  const yrs=n/12, ev=yrs>15?5:yrs>6?3:1; for(let yr=0;yr<=yrs;yr+=ev) g+=`<text x="${ml+w*Math.min(yr*12,n-1)/(n-1)}" y="${H-8}" text-anchor="middle">${yr?"th "+yr:""}</text>`;
  if(mark) g+=`<line x1="${x(mark)}" x2="${x(mark)}" y1="${mt}" y2="${mt+h}" stroke="var(--ink)" stroke-dasharray="4 4"/><text x="${x(mark)+6}" y="${mt+14}" style="fill:var(--ink)">lunas?</text>`;
  series.forEach(s=>{ g+=`<path d="${s.vals.map((v,i)=>(i?"L":"M")+x(i).toFixed(1)+","+y(v).toFixed(1)).join(" ")}" fill="none" stroke="${s.c}" stroke-width="3"/>`; });
  svg.innerHTML=g;
}
function nice(v){ const p=Math.pow(10,Math.floor(Math.log10(Math.max(v,1)))),m=v/p; return (m<=1?1:m<=2?2:m<=2.5?2.5:m<=5?5:10)*p; }
function ax(v){ if(v>=1e9) return (v/1e9).toLocaleString("id-ID",{maximumFractionDigits:1})+" M"; if(v>=1e6) return (v/1e6).toLocaleString("id-ID",{maximumFractionDigits:1})+" jt"; if(v>=1e3) return Math.round(v/1e3)+" rb"; return String(Math.round(v)); }
function ratioBar(label,val,limitNow,limitAlt,altLabel){
  const max=Math.max(60,val*1.2,limitAlt||0); const over=val>limitNow;
  return `<div class="ratio"><div class="row" style="justify-content:space-between"><b>${label}</b><span class="num">${pct(val)}</span></div><div class="track"><div class="fill${over?" over":""}" style="width:${Math.min(100,val/max*100)}%"></div><div class="tick" style="left:${limitNow/max*100}%" title="batas"></div>${limitAlt?`<div class="tick alt" style="left:${limitAlt/max*100}%"></div>`:""}</div><p class="small muted">Batas ${pct(limitNow,0)}${altLabel?" · "+altLabel:""}</p></div>`;
}
function calcSaham(){
  const raw=["s-aset","s-utang","s-pend","s-nh"].map(id=>$(id).value.trim());
  if(raw.some(v=>v==="")){ $("s-err").hidden=true; $("s-out").innerHTML=`<p><span class="status na">Data kurang</span></p><p class="small">Isi keempat angka dari laporan keuangan tahunan. Tanpa data lengkap, status tidak bisa ditentukan.</p>`; return; }
  if(!check("s-err",[["s-aset",0.001,1e9,"Total aset harus lebih dari 0."],["s-utang",0,1e9,"Utang tidak boleh negatif."],["s-pend",0.001,1e9,"Total pendapatan harus lebih dari 0."],["s-nh",0,1e9,"Pendapatan non-halal tidak boleh negatif."],["s-div",0,1e15,"Dividen tidak boleh negatif."]])) { $("s-out").innerHTML=""; return; }
  const aset=num("s-aset",100), ut=num("s-utang",38), pend=num("s-pend",80), nh=num("s-nh",5), div=num("s-div",1e6);
  const rDebt=ut/aset*100, rNH=nh/pend*100;
  let st,cls,why;
  if(rNH>5){ st="Tidak sesuai"; cls="no"; why="Pendapatan non-halal di atas batas 5% yang berlaku untuk Daftar Efek Syariah sejak 2026."; }
  else if(rDebt>45){ st="Tidak sesuai"; cls="no"; why="Rasio utang berbasis bunga di atas 45%."; }
  else if(rDebt>33){ st="Meragukan"; cls="q"; why="Rasio utang di bawah 45% tapi di atas target akhir 33%. Batas yang berlaku tahun ini mengikuti tahapan OJK yang belum kami pastikan, jadi status tidak kami naikkan ke \"sesuai\"."; }
  else { st="Sesuai secara rasio"; cls="ok"; why="Lolos kedua rasio, termasuk target akhir. Kegiatan usaha belum diperiksa di sini; daftar resmi tetap DES yang diterbitkan OJK."; }
  const row=(t,v,lim,ok,src)=>`<tr><td>${t}</td><td class="num">${pct(v)}</td><td>${lim}</td><td>${ok}</td><td class="small">${src}</td></tr>`;
  const pf=b=>b?"lolos":"tidak lolos";
  $("s-out").innerHTML=`<p><span class="status ${cls}">${st}</span></p><p class="small">${why}</p>
   <div class="scroll"><table><thead><tr><th>Uji</th><th>Nilai</th><th>Batas</th><th>Hasil</th><th>Dasar</th></tr></thead><tbody>
   ${row("Non-halal ÷ total pendapatan",rNH,"≤ 5%",pf(rNH<=5),"Aturan OJK berlaku: POJK 8/2025, seleksi 2026")}
   ${row("Non-halal ÷ total pendapatan",rNH,"≤ 10%",pf(rNH<=10),"Nilai fatwa: DSN-MUI 80/2011")}
   ${row("Utang berbasis bunga ÷ total aset",rDebt,"≤ 45% → 33%",rDebt<=33?"lolos":rDebt<=45?"tergantung tahapan":"tidak lolos","POJK 8/2025, bertahap hingga 10 tahun")}
   ${row("Utang berbasis bunga ÷ total aset",rDebt,"≤ 45%",pf(rDebt<=45),"Nilai fatwa: DSN-MUI 80/2011")}
   </tbody></table></div>
   <p class="small">Nilai fatwa dan aturan OJK yang berlaku ditampilkan terpisah karena keduanya memang berbeda. Status mengikuti aturan yang berlaku.</p>
   <div class="res"><p class="h">Pembersihan dividen: ${rp(div*rNH/100)}</p><p class="small">${pct(rNH)} dari dividen ${rp(div)} disisihkan untuk sosial (tathir), sesuai pendapat ulama yang kamu pegang.</p></div>
   <p class="small"><b>Perlu ditanyakan ke ahli:</b> ${cls==="q"?"batas utang yang berlaku untuk tahun ini, dan apakah ada pos utang yang diperdebatkan klasifikasinya.":cls==="no"?"bila ada pos pendapatan yang klasifikasinya diperdebatkan, minta pendapat sebelum memutuskan.":"tidak ada untuk uji rasio; cek kegiatan usaha dan DES terbaru."}</p>`;
}
function calcBagi(){
  if(!check("b-err",[["b-dana",0,1e6,"Dana tidak boleh negatif."],["b-nis",0,100,"Nisbah 0–100%."],["b-yield",0,50,"Imbal hasil 0–50% per tahun."]])) return;
  const d=num("b-dana",100)*1e6, ns=num("b-nis",45), y=num("b-yield",9), eq=ns*y/100;
  $("b-out").innerHTML=`<p class="h">Setara ${pct(eq,2)} per tahun</p><p class="small">Nisbah ${pct(ns,0)} × imbal hasil ${pct(y,2)}. Untuk dana ${rpS(d)}, sekitar <b>${rp(d*eq/100/12)}</b> per bulan sebelum pajak, selama imbal hasil dana bank tetap.</p>`;
  const W=640,H=200,ml=60,mr=14,mt=14,mb=30,w=W-ml-mr,h=H-mt-mb, ys=[]; for(let v=4;v<=14;v+=0.5) ys.push(v);
  const hi=Math.ceil(ns*14/100), x=v=>ml+w*(v-4)/10, yy=v=>mt+h-h*v/hi; let g="";
  for(let v=0;v<=hi;v+=hi>8?2:1) g+=`<line x1="${ml}" x2="${W-mr}" y1="${yy(v)}" y2="${yy(v)}" stroke="var(--line)"/><text x="${ml-8}" y="${yy(v)+5}" text-anchor="end">${v}%</text>`;
  for(let v=4;v<=14;v+=2) g+=`<text x="${x(v)}" y="${H-8}" text-anchor="middle">${v}%</text>`;
  g+=`<path d="${ys.map((v,i)=>(i?"L":"M")+x(v).toFixed(1)+","+yy(ns*v/100).toFixed(1)).join(" ")}" fill="none" stroke="var(--teal)" stroke-width="3"/>`;
  if(y>=4&&y<=14) g+=`<circle cx="${x(y)}" cy="${yy(eq)}" r="6" fill="var(--gold)"/><text x="${x(y)+10}" y="${yy(eq)-10}" style="fill:var(--ink)">kamu</text>`;
  g+=`<text x="${W-mr}" y="${mt+12}" text-anchor="end">sumbu x: imbal hasil dana bank</text>`;
  $("b-chart").innerHTML=g;
}
function calcZakat(){
  const inc=num("z-inc",8)*1e6, nis=num("z-nis",7640144);
  $("z-out1").className="res"+(inc>=nis?"":" neutral");
  $("z-out1").innerHTML=inc>=nis?`<p class="h num">${rp(inc*.025)} / bulan</p><p class="small">Di atas nisab. 2,5% dari ${rp(inc)}, sekitar ${rpS(inc*.025*12)} setahun.</p>`:`<p class="h">Belum mencapai nisab</p><p class="small">${rp(inc)} di bawah nisab ${rp(nis)} per bulan. Kamu tetap bisa berinfak dan bersedekah.</p>`;
  const har=num("z-har",0)*1e6, g=num("z-gold",0), n2=85*g;
  $("z-out2").className="res"+(har>=n2?"":" neutral");
  $("z-out2").innerHTML=har>=n2?`<p class="h num">${rp(har*.025)} / tahun</p><p class="small">Di atas nisab ${rpS(n2)} (85 gram emas). Zakat 2,5% bila sudah dimiliki 1 tahun.</p>`:`<p class="h">Belum mencapai nisab</p><p class="small">Nisab saat ini ${rpS(n2)} (85 gram × ${rp(g)}).</p>`;
}


/* ---------- alokasi gaji (waterfall) ---------- */
S.wmode=S.wmode||"single";
function calcAlok(){
  document.querySelectorAll("#w-mode button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.m===S.wmode)));
  const couple=S.wmode==="couple"; $("w-wife-wrap").hidden=!couple; $("w-inc-l").textContent=couple?"Penghasilan bersih suami":"Penghasilan bersih per bulan";
  if(!check("w-err",[["w-inc",0.1,10000,"Penghasilan harus lebih dari 0."],["w-zak",0,10000,"Zakat tidak boleh negatif."],["w-debt",0,10000,"Cicilan tidak boleh negatif."],["w-par",0,10000,"Dukungan orang tua tidak boleh negatif."],["w-naf",0,10000,"Kebutuhan rumah tangga tidak boleh negatif."],["w-ef",0,1e6,"Dana darurat tidak boleh negatif."],["w-life",0,10000,"Gaya hidup tidak boleh negatif."]].concat(couple?[["w-wife",0,10000,"Penghasilan istri tidak boleh negatif."]]:[]))){ $("w-out").innerHTML=""; $("w-ledger").innerHTML=""; return; }
  const J=1e6, I=num("w-inc",15)*J, zak=num("w-zak",0)*J, debt=num("w-debt",0)*J, par=num("w-par",0)*J, naf=num("w-naf",0)*J, ef=num("w-ef",0)*J, lifeW=num("w-life",0)*J;
  const core=naf+debt+par, months=core>0?ef/core:99;
  $("w-ef-m").textContent=core>0?`Dana daruratmu: ${months.toLocaleString("id-ID",{maximumFractionDigits:1})} bulan pengeluaran inti`:"";
  const T={wajib:{n:"Kewajiban",d:"Wajib · zakat, cicilan halal, orang tua",a:zak+debt+par,f:null,c:null},
    nafkah:{n:"Nafkah keluarga",d:"Wajib · kebutuhan rumah tangga",a:naf,f:.40,c:.60},
    tahan:{n:"Ketahanan",d:"Dana darurat & proteksi",a:0,f:.10,c:.20},
    invest:{n:"Investasi jangka panjang",d:"Sunnah / hajiyyat",a:0,f:.05,c:.30},
    infak:{n:"Infak & ibadah",d:"Sunnah · sedekah, kurban, umrah",a:0,f:.025,c:.10},
    gaya:{n:"Gaya hidup",d:"Mubah · rekreasi",a:0,f:0,c:.30},
    sisa:{n:"Belum dialokasikan",d:"Putuskan sendiri: pelunasan, dana haji, dll.",a:0,f:null,c:null}};
  const led=[]; let R=I-T.wajib.a-T.nafkah.a;
  if(R<0){ $("w-out").innerHTML=`<div class="res warn"><p class="h">Defisit ${rpS(-R)} per bulan</p><p class="small">Kewajiban dan nafkah sudah melebihi penghasilan. Investasi, infak sukarela, dan gaya hidup ditunda dulu. Kewajiban tidak dipangkas untuk menyeimbangkan angka; tinjau ulang cicilan dan kebutuhan rumah tangga, atau tambah penghasilan.</p></div>`; $("w-ledger").innerHTML=""; renderWife(); return; }
  const give=(k,amt,why)=>{ const x=Math.max(0,Math.min(amt,R)); if(x>0){ T[k].a+=x; R-=x; if(why) led.push(`${rpS(x)} → ${T[k].n}: ${why}`); } return x; };
  // 1) floors, in priority order
  give("tahan", months>=6?0:T.tahan.f*I, null);
  give("invest", T.invest.f*I, null);
  give("infak", T.infak.f*I, null);
  // 2) lifestyle the user asked for, hard-capped
  give("gaya", Math.min(lifeW, T.gaya.c*I), null);
  if(lifeW>T.gaya.c*I) led.push(`Gaya hidup dibatasi ${rpS(T.gaya.c*I)} (30% penghasilan). Melebihinya harus keputusanmu sendiri.`);
  // 3) spillover
  if(months<6) give("tahan", T.tahan.c*I-T.tahan.a, months<3?"dana darurat masih di bawah 3 bulan":"dana darurat belum 6 bulan");
  give("invest", T.invest.c*I-T.invest.a, "tujuan utama limpahan dana");
  give("infak", T.infak.c*I-T.infak.a, "investasi sudah di batas atas");
  if(R>0){ T.sisa.a=R; led.push(`${rpS(R)} → Belum dialokasikan: semua pos sudah di batas atas, tidak dikembalikan ke belanja.`); R=0; }
  const st=k=>{ const t=T[k]; if(t.f===null) return k==="wajib"?(t.a>.35*I?["over","di atas 35%: tinjau"]:["actual","sesuai kebutuhan nyata"]):["actual","perlu keputusan"]; const p=t.a/I; return p<t.f-1e-9?["under","di bawah rentang"]:p>t.c+1e-9?["over","di atas rentang"]:["within","dalam rentang"]; };
  $("w-out").innerHTML=Object.keys(T).filter(k=>k!=="sisa"||T.sisa.a>0).map(k=>{ const t=T[k], p=t.a/I*100, [sc,sl]=st(k);
    const band=t.f!==null&&t.c!==null?`<span class="band" style="left:${t.f*100}%;width:${(t.c-t.f)*100}%"></span>`:"";
    return `<div class="wfrow"><div class="nm"><b>${t.n} <span class="chipst ${sc}">${sl}</span></b><span>${t.d}${t.f!==null&&t.c!==null?` · rentang ${pct(t.f*100)}–${pct(t.c*100,0)}`:""}</span></div><div class="amt">${rpS(t.a)}<small>${pct(p)}</small></div><div class="wfbar" aria-hidden="true"><i style="width:${Math.min(100,p)}%"></i>${band}</div></div>`; }).join("")+
    `<p class="small muted">Garis putus-putus = rentang heuristik. Batang = porsi dari penghasilan ${rpS(I)}.</p>`;
  $("w-ledger").innerHTML=led.length?led.map(x=>`<li>${x}</li>`).join(""):"<li>Tidak ada limpahan: semua dana terserap di batas bawah dan gaya hidup.</li>";
  renderWife();
}
function renderWife(){
  const box=$("w-wife-out"); if(S.wmode!=="couple"){ box.hidden=true; return; }
  const W=num("w-wife",0)*1e6, nis=7640144, z=W>=nis?W*.025:0;
  box.hidden=false; box.innerHTML=`<h3>Penghasilan istri: ${rpS(W)}</h3><p class="small">Menurut pendapat mayoritas, penghasilan istri sepenuhnya miliknya, dan kewajiban nafkah suami tidak berkurang karena istri bekerja. Kontribusi istri ke rumah tangga bersifat sukarela (i'anah atau sedekah), termasuk boleh nol.</p>
   <div class="facts"><div><span>Kewajibannya sendiri (zakat)</span><b>${z?rpS(z)+" / bulan":"belum mencapai nisab"}</b></div><div><span>Kontribusi sukarela ke keluarga</span><b>sesuai pilihannya</b></div><div><span>Aset & investasi pribadinya</span><b>sisanya</b></div><div><span>Zakat dihitung</span><b>terpisah per orang</b></div></div>
   <p class="small muted">Kesepakatan lain di antara suami-istri juga diperbolehkan bila disepakati bersama.</p>`;
}
/* ---------- catalog ---------- */
// r: risiko 1-3, l: likuiditas, j: jangka; g: goals it fits
const PROD=[
 {n:"Tabungan syariah",c:"Simpan",by:"Bank syariah atau unit usaha syariah",ak:"Wadiah atau mudharabah",r:1,l:"Mudah dicairkan",j:"Pendek",g:["darurat","ibadah","tenang"],u:"Dana darurat dan kebutuhan harian.",w:"Bonus wadiah tidak boleh dijanjikan di awal. Cek ketentuan penjaminan LPS.",s:["02"]},
 {n:"Deposito mudharabah",c:"Simpan",by:"Bank syariah",ak:"Mudharabah",r:1,l:"Terkunci sampai jatuh tempo",j:"Pendek–menengah",g:["rumah","tenang"],u:"Dana yang tidak dipakai 1–12 bulan.",w:"Yang disepakati nisbah, bukan hasil. Minta data realisasi bagi hasil.",s:["03"]},
 {n:"Tabungan haji",c:"Simpan",by:"Bank syariah penerima setoran haji",ak:"Wadiah atau mudharabah",r:1,l:"Terikat tujuan",j:"Panjang",g:["ibadah"],u:"Mengumpulkan setoran awal untuk mendapat nomor porsi.",w:"Masa tunggu berangkat haji panjang. Tanyakan alur setoran awal dan pendaftaran porsi.",s:["02"]},
 {n:"Sukuk Tabungan (ST)",c:"Investasi",by:"Pemerintah RI (Kemenkeu)",ak:"Akad SBSN sesuai seri",r:1,l:"Tidak diperjualbelikan; cair awal terbatas",j:"Menengah",g:["rumah","keluarga","tenang"],u:"Imbal hasil rutin dengan risiko gagal bayar sangat rendah.",w:"Imbal hasil dikenai PPh final 10%. Pencairan sebelum jatuh tempo mengikuti ketentuan tiap seri.",s:["69"]},
 {n:"Sukuk Ritel (SR)",c:"Investasi",by:"Pemerintah RI (Kemenkeu)",ak:"Akad SBSN sesuai seri",r:1,l:"Bisa dijual di pasar sekunder",j:"Menengah",g:["keluarga","pensiun","tenang"],u:"Imbal hasil tetap dan bisa dijual sebelum jatuh tempo.",w:"Kalau dijual sebelum jatuh tempo, harganya bisa di atas atau di bawah harga beli. PPh final 10%.",s:["69"]},
 {n:"Sukuk Wakaf Ritel (SWR)",c:"Sosial",by:"Pemerintah RI bersama Badan Wakaf Indonesia",ak:"Wakaf uang temporer melalui SBSN",r:1,l:"Pokok kembali saat jatuh tempo",j:"Menengah",g:["tenang"],u:"Berwakaf tanpa melepas pokok: imbal hasilnya disalurkan untuk program sosial.",w:"Kamu tidak menerima imbal hasil. Penawarannya hanya di periode tertentu.",s:["69"]},
 {n:"Reksa dana syariah",c:"Investasi",by:"Manajer investasi berizin OJK",ak:"Wakalah dan mudharabah",r:2,l:"Bisa dicairkan dalam beberapa hari kerja",j:"Pendek s.d. panjang, tergantung jenis",g:["keluarga","pensiun","rumah"],u:"Mulai investasi dengan nominal kecil dan dikelola profesional.",w:"Pilih jenis sesuai jangka waktu: pasar uang untuk pendek, saham untuk panjang. Nilai bisa turun.",s:["20"]},
 {n:"Saham syariah",c:"Investasi",by:"Emiten di Daftar Efek Syariah OJK",ak:"Musyarakah (kepemilikan)",r:3,l:"Diperdagangkan di bursa",j:"Panjang",g:["pensiun","keluarga"],u:"Kepemilikan usaha jangka panjang.",w:"Kriteria DES diperketat mulai 2026 (POJK 8/2025). Cek ulang saham lama, dan bersihkan porsi non-halal dividen.",s:["40","80"]},
 {n:"Tabungan emas",c:"Investasi",by:"Pegadaian atau penyelenggara berizin",ak:"Jual beli (bai')",r:2,l:"Bisa dijual kembali atau dicetak",j:"Menengah–panjang",g:["ibadah","rumah","tenang"],u:"Menabung emas mulai dari gram kecil.",w:"Ada selisih harga beli dan jual. Cicilan emas boleh selama emas tidak menjadi alat tukar.",s:["77"]},
 {n:"Asuransi syariah",c:"Asuransi",by:"Perusahaan atau unit syariah berizin OJK",ak:"Tabarru' dan wakalah bil ujrah",r:1,l:"—",j:"Sesuai polis",g:["keluarga","tenang","darurat"],u:"Asuransi kesehatan dan jiwa berbasis tolong-menolong.",w:"Pisahkan porsi proteksi dan investasi. Tanyakan ujrah dan pembagian surplus.",s:["21","52"]},
 {n:"Dana pensiun syariah",c:"Investasi",by:"Dana Pensiun Lembaga Keuangan (DPLK) syariah",ak:"Sesuai ketentuan program",r:2,l:"Terkunci sampai usia pensiun, dengan pengecualian",j:"Panjang",g:["pensiun"],u:"Menabung pensiun secara disiplin di luar kantor.",w:"Pahami kapan dana bisa diambil dan pajaknya saat pencairan.",s:[]},
 {n:"Urun dana (securities crowdfunding) syariah",c:"Investasi",by:"Platform urun dana berizin OJK",ak:"Musyarakah atau sukuk usaha",r:3,l:"Sulit dicairkan sebelum jatuh tempo",j:"Menengah–panjang",g:["pensiun"],u:"Ikut membiayai UMKM atau proyek dengan akad bagi hasil.",w:"Risiko usaha gagal tinggi. Hanya dana yang siap kamu tanggung risikonya.",s:[]},
 {n:"Gadai syariah (rahn)",c:"Pembiayaan",by:"Pegadaian syariah atau penyelenggara berizin",ak:"Rahn dengan biaya pemeliharaan (ijarah)",r:1,l:"Dana cair cepat",j:"Pendek",g:["darurat"],u:"Kebutuhan dana mendesak dengan jaminan barang, tanpa kartu kredit.",w:"Biaya dihitung dari pemeliharaan barang, bukan dari besar pinjaman. Bandingkan totalnya.",s:["19"]},
 {n:"Zakat dan wakaf uang",c:"Sosial",by:"BAZNAS, LAZ berizin, nazhir terdaftar BWI",ak:"Zakat; wakaf",r:1,l:"—",j:"Rutin",g:["tenang","ibadah"],u:"Menunaikan kewajiban dan berbagi secara terjadwal.",w:"Pastikan lembaganya resmi dan minta bukti setor untuk pengurang penghasilan kena pajak.",s:[]}];
const GOALS=[["all","Semua"],["darurat","Dana darurat"],["rumah","Rumah"],["keluarga","Pendidikan keluarga"],["ibadah","Haji & umrah"],["pensiun","Pensiun"],["tenang","Berkah & berbagi"]];
function renderKat(){
  const sel=S.kat||"all", mine=S.ans.goal;
  $("kat-f").innerHTML=GOALS.map(g=>`<button data-g="${g[0]}" aria-pressed="${g[0]===sel}">${g[1]}${g[0]===mine?" ★":""}</button>`).join("");
  $("kat-f").querySelectorAll("button").forEach(b=>b.onclick=()=>{ S.kat=b.dataset.g; save(); renderKat(); track("catalog_filter",{g:b.dataset.g}); });
  const dot=r=>`<span class="dots" aria-label="risiko ${r} dari 3">${[1,2,3].map(i=>`<i class="${i<=r?"on":""}"></i>`).join("")}</span>`;
  const list=PROD.filter(p=>sel==="all"||p.g.includes(sel)).sort((a,b)=>(b.g.includes(mine)?1:0)-(a.g.includes(mine)?1:0));
  $("kat-list").innerHTML=list.map(p=>{ const fit=p.g.includes(mine);
    return `<article class="prod${fit?" fit":""}"><div class="top"><div><span class="eyebrow">${p.c}</span><h3>${p.n}</h3></div>${fit?'<span class="chip p">Cocok untukmu</span>':""}</div>
    <p class="small">${p.u}</p>
    <div class="attrs"><div>Risiko<b>${dot(p.r)}</b></div><div>Pencairan<b>${p.l}</b></div><div>Jangka<b>${p.j}</b></div></div>
    <p class="small muted"><b>Pengelola:</b> ${p.by} · <b>Akad:</b> ${p.ak}</p>
    <div class="watch"><b>Perlu diwaspadai:</b> ${p.w}</div>
    ${p.s.length?`<p class="cite">${p.s.map(f).join("<br>")}</p>`:""}</article>`; }).join("");
}

/* ---------- akad ---------- */
const AKAD=[
 ["Wadiah","وديعة","Titipan","Kamu menitipkan uang; bank boleh memakainya dan boleh memberi bonus.","Bonus wadiah tidak boleh dijanjikan di awal. Kalau dijanjikan pasti, itu bukan karakter wadiah.","02",["Bonus tidak disebut sebagai janji atau angka pasti","Dana bisa ditarik sesuai ketentuan titipan"]],
 ["Mudharabah","مضاربة","Bagi hasil","Pemilik dana menyerahkan modal, pengelola menjalankan usaha; keuntungan dibagi sesuai nisbah.","Yang disepakati nisbah, bukan hasil. Kerugian modal ditanggung pemilik dana, kecuali pengelola lalai.","07",["Yang disepakati nisbah, bukan jumlah hasil tetap","Tidak ada jaminan modal atau hasil dari pengelola","Kerugian ditanggung sesuai porsi modal","Standar kelalaian pengelola dijelaskan"]],
 ["Murabahah","مرابحة","Jual beli dengan margin","Bank membeli barang lalu menjualnya kepadamu dengan harga plus margin yang disepakati.","Barang harus dimiliki bank lebih dulu. Melunasi lebih cepat tidak otomatis menghapus sisa margin.","04",["Bank membeli dan memiliki barang sebelum menjual kepadamu","Harga pokok dan margin disebutkan","Denda keterlambatan disalurkan ke dana sosial","Penjadwalan ulang tidak menambah margin baru yang menumpuk","Potongan pelunasan tidak dijanjikan di akad (itu kebijakan bank)"]],
 ["Musyarakah Mutanaqishah","مشاركة متناقصة","Kepemilikan bertahap","Kamu dan bank memiliki aset bersama; porsi bank kamu beli bertahap sambil menyewa porsinya.","Ujrah atas porsi bank bisa ditinjau berkala sesuai kesepakatan, jadi cicilan belum tentu tetap.","73",["Porsi kepemilikan kamu dan bank tercatat jelas","Cara dan jadwal peninjauan ujrah tertulis","Harga pengalihan porsi bank disebutkan","Pembagian risiko dan pemeliharaan aset jelas","Denda keterlambatan disalurkan ke dana sosial"]],
 ["Ijarah","إجارة","Sewa","Pembayaran atas manfaat barang atau jasa dalam jangka waktu tertentu.","Ijarah tidak memindahkan kepemilikan. Untuk berujung milik, akadnya ijarah muntahiyah bit tamlik.","09",["Pemberi sewa memiliki aset selama masa sewa","Pemeliharaan besar ditanggung pemilik aset","Sewa dibayar atas manfaat, bukan atas uang yang dipinjamkan"]],
 ["IMBT","إجارة منتهية بالتمليك","Sewa berujung milik","Sewa yang di akhir masanya diikuti pemindahan kepemilikan.","Di awal hanya ada janji (wa'd). Pemindahan milik dilakukan dengan akad tersendiri setelah masa sewa selesai.","27",["Pemindahan milik dilakukan dengan akad terpisah setelah masa sewa","Selama sewa, aset tetap milik pemberi sewa"]],
 ["Qardh","قرض","Pinjaman kebajikan","Pinjaman yang wajib dikembalikan sejumlah pokoknya.","Pemberi pinjaman tidak boleh mensyaratkan tambahan. Biaya administrasi riil diperbolehkan.","19",["Tidak ada tambahan yang disyaratkan di atas pokok","Biaya administrasi berupa biaya riil, bukan persen dari pinjaman"]],
 ["Kafalah","كفالة","Penjaminan","Pihak ketiga menjamin kewajiban pihak lain.","Dipakai di kartu syariah: bank menjamin pembayaranmu ke merchant.","11",["Imbalan penjaminan disebutkan jelas","Denda keterlambatan disalurkan ke dana sosial"]],
 ["Tabarru'","تبرع","Hibah tolong-menolong","Kontribusi peserta ke dana bersama untuk saling menanggung risiko.","Dana tabarru' milik peserta bersama, bukan milik perusahaan asuransi.","21",["Dana tabarru' terpisah dari dana investasi","Besaran ujrah disebutkan","Aturan pembagian surplus tertulis","Penanggungnya benar perusahaan atau unit syariah berizin"]]];
$("l-facts").innerHTML=FACTS.map(factHTML).join("");
function renderAkad(){ $("akad-list").innerHTML=AKAD.map(a=>`<article><span class="ar" lang="ar" dir="rtl">${a[1]}</span><h3>${a[0]} <span class="muted small" style="font-weight:500">· ${a[2]}</span></h3><p class="small">${a[3]}</p><p class="myth"><b>Salah kaprah:</b> ${a[4]}</p>${a[6]?`<details><summary class="small" style="color:var(--teal);font-weight:700;cursor:pointer">Cek di akadmu sebelum tanda tangan</summary><ul class="akcheck">${a[6].map(x=>`<li>${x}</li>`).join("")}</ul></details>`:""}<p class="cite">${f(a[5])}</p></article>`).join(""); }
function renderSrc(){ const keys=Object.keys(FT); $("src-list").innerHTML=keys.map(k=>`<li>${f(k)}</li>`).join("")+OTHER.map(o=>`<li><a href="${o[1]}" target="_blank" rel="noopener">${o[0]}</a></li>`).join(""); }

/* ================= VIEWS ================= */
const views=["v-lander","v-quiz","v-result","v-full"];
function show(id){ views.forEach(v=>$(v).hidden=(v!==id)); window.scrollTo(0,0); }
document.querySelectorAll(".go-start").forEach(b=>b.addEventListener("click",()=>{ track("quiz_start",{from:b.textContent.trim()}); S.step=0; S.ans={}; S.preGuess=false; show("v-quiz"); renderIntro1(); }));
/* guess chips on the lander: commit to a guess, then go straight to question 1 (guess step is skipped) */
document.querySelectorAll(".guess-chip").forEach(b=>b.addEventListener("click",()=>{ S.ans={guess:b.dataset.guess}; S.preGuess=true; S.step=0; save(); track("quiz_start",{from:"guess",guess:+b.dataset.guess}); show("v-quiz"); renderQ(); }));
/* ---------- keuntungan (paid) ---------- */
let untungInit=false;
function initUntung(){
  if(!untungInit){ ["u-gross","u-zakat","u-dep","u-deprate","u-sukrate"].forEach(id=>$(id).addEventListener("input",calcUntung)); $("u-ptkp").addEventListener("change",calcUntung);
    const inc={4:4,8:8,15:15,35:35}[S.ans.inc]||15; $("u-gross").value=inc; $("u-zakat").value=inc*1e6>=7640144?+(inc*0.025).toFixed(3):0; untungInit=true; }
  calcUntung(); }
function calcUntung(){
  const g=num("u-gross",15)*1e6, st=$("u-ptkp").value, z=num("u-zakat",0)*1e6, d=num("u-dep",0)*1e6, dr=num("u-deprate",4.5), sr=num("u-sukrate",6.4);
  const zs=zakatTaxSaving(g,st,z), pkp=annualPkp(g,st), mr=marginalRate(pkp), sv=sukukVsDeposito(d,dr,sr), tot=Math.max(0,zs)+Math.max(0,sv.gain);
  $("u-total").innerHTML=`<p class="h num">± ${rp(tot)} / tahun</p><p class="small">Perkiraan keuntungan dari dua langkah di bawah, sekitar ${Math.max(0,Math.round(tot/PRICE))}× harga peta lengkap.</p>`;
  $("u-zres").innerHTML=`<p class="h">Zakat lewat lembaga resmi: ± ${rp(zs)} / tahun</p><p class="small">Zakat ${rp(z*12)} setahun mengurangi penghasilan kena pajakmu (perkiraan ${rpS(pkp)} setahun, tarif tertinggi ${pct(mr*100,0)}). Syaratnya dibayar lewat BAZNAS atau LAZ resmi dengan bukti setor ber-NPWP.</p>`;
  $("u-sres").innerHTML=`<p class="h">Deposito ke sukuk tabungan: ${sv.gain>=0?"+":"−"}${rp(Math.abs(sv.gain))} / tahun</p><p class="small">Bersih setahun: deposito ${rp(sv.deposito)} (pajak 20%) dan sukuk ${rp(sv.sukuk)} (pajak 10%). Sukuk tabungan hanya dijual di masa penawaran dan punya aturan pencairan sendiri.</p>`;
}

/* ---------- boot ---------- */
document.querySelectorAll(".px").forEach(el=>el.textContent=fmtRp(PRICE));
initI18n();
initConsent();
(async()=>{ const oid=new URLSearchParams(location.search).get("order"); if(!oid) return;
  for(let i=0;i<10;i++){ const r=await orderStatus(oid);
    if(r.status==="paid"){ S.unlocked=true; S.orderId=oid; save(); track("purchase_return",{orderId:oid}); history.replaceState(null,"",location.pathname); if(Object.keys(S.ans).length>=STEPS.length) openFull(); return; }
    if(r.status==="expired"||r.status==="failed"||r.status==="unknown") return;
    await new Promise(res=>setTimeout(res,3000)); } })();
track("lp_view");
if(S.unlocked && Object.keys(S.ans).length>=STEPS.length) openFull();
})();
