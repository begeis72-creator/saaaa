// SADECE GÖZLE GÖRÜLEN KARTLARı AÇMA/KAPAMA (MOBILDE DOKUN, MASADA HÖVERİN)
document.addEventListener("DOMContentLoaded",()=>{
  const kartlar=document.querySelectorAll(".grup-karti");
  kartlar.forEach(k=>{
    k.addEventListener("click",()=>k.classList.toggle("acik"));
    k.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" ")k.classList.toggle("acik")});
  });
});

// GALERI LİGHTBOX
const lb=document.getElementById("lb-modal"),lbImg=document.getElementById("lb-img"),lbAlt=document.getElementById("lb-alt"),lbKapat=document.getElementById("lb-kapat");
document.addEventListener("click",e=>{
  if(e.target.closest(".galeri-item")){
    const img=e.target.closest(".galeri-item img");
    lbImg.src=img.src;
    lbAlt.textContent=img.alt||"";
    lb.showModal();
  }
});
lbKapat.onclick=()=>lb.close();
lb.addEventListener("click",e=>e.target===lb&&lb.close());
