import { db, yapilandirildi } from "./firebase-config.js";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ===== GRUPLAR: şehir, kısa, açıklama, link ===== */
const GRUPLAR = [
  { ad: "Çarşı Batman",     kisa: "BT", aciklama: "Batman'ın dağlarından çıkan omuz omuza duruş.", link: "https://instagram.com" },
  { ad: "Çarşı Urfa",       kisa: "UR", aciklama: "Urfa'nın ateşli sesidir Çarşı.", link: "https://instagram.com" },
  { ad: "Çarşı Gaziantep",  kisa: "GA", aciklama: "Antep'in kurtuluşçu ruhunun temsilcisi.", link: "https://instagram.com" },
  { ad: "Çarşı Siirt",      kisa: "SI", aciklama: "Botan'ın kalbinde siyah beyaz sevda.", link: "https://instagram.com" },
  { ad: "Çarşı Mardin",     kisa: "MA", aciklama: "Taş şehrin kalesi, Çarşı'nın kapısı.", link: "https://instagram.com" }
];

/* ===== GALERİ: resimler ===== */
const GALERI = [
  { src: "https://placehold.co/600x600/222/fff?text=Pankart", alt: "Deplasman pankartı" },
  { src: "https://placehold.co/600x600/333/fff?text=Atkı", alt: "Doğu Anadolu atkısı" },
  { src: "https://placehold.co/600x600/222/fff?text=Yağmurluk", alt: "Özel tasarım yağmurluk" },
  { src: "https://placehold.co/600x600/444/fff?text=Logo", alt: "Bölge logosu" },
  { src: "https://placehold.co/600x600/222/fff?text=Tribün", alt: "Tribün üretimi" }
];

/* ===== ÖRNEK DUYURULAR (Firebase olmadan) ===== */
const ORNEK_DUYURULAR = [
  { tip: "Deplasman", baslik: "Örnek: Otobüs kaldırılması", tarih: "2026-11-15T14:00", aciklama: "Kalkış saati ve toplanma yeri açıklanacak." }
];

const $ = (s) => document.querySelector(s);
const esc = (t = "") => String(t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* --- GRUPLAR → GRID + DROPDOWN + FOOTER --- */
const gridHtml = GRUPLAR.map(g => `
  <button class="grup-karti" type="button" tabindex="0">
    <div class="rozet">${esc(g.kisa)}</div>
    <h3>${esc(g.ad)}</h3>
    <div class="ayrinti">${esc(g.aciklama)}<br><a href="${esc(g.link)}" target="_blank">Sosyal medya</a></div>
  </button>`).join("");
$("#gruplar-grid").innerHTML = gridHtml;

$("#sehir").innerHTML += GRUPLAR.map(g => `<option>${esc(g.ad)}</option>`).join("");

$("#footer-bw").innerHTML = GRUPLAR.map(g => `<a href="${esc(g.link)}" target="_blank">${esc(g.ad)}</a>`).join("");

/* --- GALERİ --- */
const galeriHtml = GALERI.map((g, i) => `
  <figure class="galeri-item" tabindex="0" role="button">
    <img src="${esc(g.src)}" alt="${esc(g.alt)}" loading="lazy">
    <figcaption>${esc(g.alt)}</figcaption>
  </figure>`).join("");
$("#galeri").innerHTML = galeriHtml;

/* --- DUYURULAR (FIREBASE) --- */
function yenileDuyurular(liste) {
  const kutu = $("#duyuru-kutusu");
  if (!liste.length) {
    kutu.innerHTML = '<div class="duyuru-kart"><p style="color:#888">Şu an bir deplasman planlanmamış. Takipte kal.</p></div>';
    return;
  }
  kutu.innerHTML = liste.sort((a, b) => new Date(a.tarih) - new Date(b.tarih)).map(d => {
    const t = new Date(d.tarih);
    const tarihStr = t.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
    const saatStr = t.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    return `
      <div class="duyuru-kart">
        <span class="tip">${esc(d.tip || "Duyuru")}</span>
        <h3>${esc(d.baslik)}</h3>
        <p class="meta">${tarihStr} · ${saatStr}</p>
        <p>${esc(d.aciklama)}</p>
      </div>`;
  }).join("");
}

if (yapilandirildi) {
  onSnapshot(query(collection(db, "duyurular"), orderBy("tarih", "asc")),
    snap => yenileDuyurular(snap.docs.map(d => d.data())),
    () => { $("#duyuru-kutusu").innerHTML = '<div class="duyuru-kart"><p style="color:red">Bağlantı hatası</p></div>'; });
} else {
  yenileDuyurular(ORNEK_DUYURULAR);
}

/* --- FORM --- */
$("#katil-form").addEventListener("submit", async e => {
  e.preventDefault();
  const f = e.target, durum = $("#form-durumu");
  const v = Object.fromEntries(new FormData(f));
  const tel = v.telefon.replace(/\s|-|(\+90|0)/g, "");
  
  durum.className = "hata";
  if (v.web) return; // Bot
  if (!v.ad.trim() || !v.soyad.trim() || !v.sehir) { durum.textContent = "Ad, soyad ve grup gerekli."; return; }
  if (!/^\d{10}$/.test(tel)) { durum.textContent = "Telefonu 05XX XXX XX XX yazmalısın."; return; }
  if (!yapilandirildi) { durum.textContent = "Firebase ayarlanmamış (firebase-config.js)"; return; }
  
  try {
    await addDoc(collection(db, "uyeler"), {
      ad: v.ad.trim(), soyad: v.soyad.trim(), sehir: v.sehir, telefon: v.telefon, tarih: serverTimestamp()
    });
    f.reset();
    durum.className = "ok";
    durum.textContent = "✓ Başvurun alındı. Temsilciliğin seninle iletişime geçecek.";
  } catch (e) {
    durum.textContent = "✗ Gönderilemedi. Tekrar dene.";
  }
});
