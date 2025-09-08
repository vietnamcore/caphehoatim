// ===== Data =====
const CATEGORIES = [
  { id: 'ca-phe', name: 'Cà phê' },
  { id: 'cacao', name: 'Cacao' },
  { id: 'tra', name: 'Trà' },
  { id: 'chanh', name: 'Chanh' },
  { id: 'khac', name: 'Khác' },
];

const MENU = [
  { id:'cf-den', name:'Cà phê đen', price:15000, cat:'ca-phe' },
  { id:'cf-sua', name:'Cà phê sữa đá', price:20000, cat:'ca-phe' },
  { id:'cf-da-me-sua', name:'Đá me sữa', price:20000, cat:'ca-phe' },
  { id:'cacao-sua', name:'Cacao sữa', price:28000, cat:'cacao' },
  { id:'cacao-ba', name:'Cacao Ba', price:25000, cat:'cacao' },
  { id:'chanh-day', name:'Chanh dây', price:25000, cat:'chanh' },
  { id:'chanh-tuoi', name:'Chanh tươi', price:15000, cat:'chanh' },
  { id:'chanh-muoi', name:'Chanh muối', price:20000, cat:'chanh' },
  { id:'lipton', name:'Lipton', price:20000, cat:'tra' },
  { id:'tra-dao', name:'Trà đào cam sả', price:32000, cat:'tra' },
  { id:'tra-olong', name:'Trà ô long sữa', price:30000, cat:'tra' },
  { id:'nuoc-suoi', name:'Nước suối', price:10000, cat:'khac' },
];

// ===== State =====
let activeCat = 'all';
let cart = JSON.parse(localStorage.getItem('cart') || '{}');

// ===== Helpers =====
const fmtVND = (n) => n.toLocaleString('vi-VN') + 'đ';
const byId = (id) => document.getElementById(id);

function setTheme(light){
  const root = document.documentElement;
  if(light){ root.classList.add('light'); localStorage.setItem('theme','light'); }
  else{ root.classList.remove('light'); localStorage.setItem('theme','dark'); }
  byId('themeToggle').setAttribute('aria-pressed', light ? 'true' : 'false');
}

function initTheme(){
  const pref = localStorage.getItem('theme');
  if(!pref){
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    setTheme(prefersLight);
  }else{
    setTheme(pref === 'light');
  }
}

// ===== Tabs =====
function renderTabs(){
  const tabsWrap = document.querySelector('.tabs');
  tabsWrap.innerHTML = '';
  const allBtn = document.createElement('button');
  allBtn.className = 'tab'; allBtn.role = 'tab'; allBtn.dataset.cat = 'all';
  allBtn.textContent = 'Tất cả'; allBtn.setAttribute('aria-selected', activeCat==='all');
  tabsWrap.appendChild(allBtn);
  CATEGORIES.forEach(c => {
    const b = document.createElement('button');
    b.className='tab'; b.role='tab'; b.dataset.cat = c.id;
    b.textContent = c.name; b.setAttribute('aria-selected', activeCat===c.id);
    tabsWrap.appendChild(b);
  });
  tabsWrap.addEventListener('click', (e)=>{
    const btn = e.target.closest('.tab'); if(!btn) return;
    activeCat = btn.dataset.cat;
    document.querySelectorAll('.tab').forEach(x=>x.setAttribute('aria-selected', x===btn ? 'true' : 'false'));
    renderMenu();
  });
}

// ===== Menu =====
function filteredMenu(){
  const q = byId('searchInput').value.trim().toLowerCase();
  return MENU.filter(item => {
    const byCat = activeCat==='all' || item.cat===activeCat;
    const byText = !q || item.name.toLowerCase().includes(q);
    return byCat && byText;
  });
}

function renderMenu(){
  const grid = byId('menuGrid');
  const data = filteredMenu();
  grid.innerHTML = '';
  byId('emptyState').hidden = data.length>0;
  data.forEach(item => {
    const card = document.createElement('article');
    card.className='card';
    card.innerHTML = `
      <div class="thumb" aria-hidden="true">${item.name[0]}</div>
      <div class="body">
        <h3 class="title">${item.name}</h3>
        <div class="meta">
          <span class="price">${fmtVND(item.price)}</span>
          <span class="badge">${categoryName(item.cat)}</span>
        </div>
        <div class="actions">
          <div class="qty">
            <button aria-label="Giảm" data-act="minus">−</button>
            <input type="text" inputmode="numeric" value="1" aria-label="Số lượng">
            <button aria-label="Tăng" data-act="plus">+</button>
          </div>
          <button class="btn primary" data-add="${item.id}">Thêm</button>
          <button class="btn ghost" data-fav="${item.id}" aria-label="Yêu thích">★</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function categoryName(id){
  return (CATEGORIES.find(c=>c.id===id)||{name:'Khác'}).name;
}

// ===== Qty controls & Add to cart =====
document.addEventListener('click', (e)=>{
  const qtyBox = e.target.closest('.qty');
  if(qtyBox && e.target.dataset.act){
    const input = qtyBox.querySelector('input');
    let v = parseInt(input.value||'1',10);
    v = e.target.dataset.act==='plus' ? v+1 : Math.max(1, v-1);
    input.value = v;
  }
  const addBtn = e.target.closest('[data-add]');
  if(addBtn){
    const id = addBtn.dataset.add;
    const card = addBtn.closest('.card');
    const qty = parseInt(card.querySelector('.qty input').value||'1',10);
    addToCart(id, qty);
  }
});

function addToCart(id, qty){
  const item = MENU.find(x=>x.id===id);
  if(!item) return;
  const key = id;
  cart[key] = cart[key] || { ...item, qty:0 };
  cart[key].qty += qty;
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartUI();
  showToast('Đã thêm vào giỏ ✅');
}

// ===== Search =====
byId('searchInput').addEventListener('input', renderMenu);

// ===== Cart UI =====
function updateCartUI(){
  const itemsWrap = byId('cartItems');
  const items = Object.values(cart);
  byId('cartCount').textContent = items.reduce((s,i)=>s+i.qty,0);
  itemsWrap.innerHTML = '';
  let subtotal = 0;
  items.forEach(i=>{
    subtotal += i.qty * i.price;
    const row = document.createElement('div');
    row.className='cart-item';
    row.innerHTML = `
      <div class="thumb"></div>
      <div>
        <div class="title">${i.name}</div>
        <div class="mini">${fmtVND(i.price)} × ${i.qty}</div>
      </div>
      <div class="right">
        <div><strong>${fmtVND(i.price*i.qty)}</strong></div>
        <button class="btn ghost sm" data-remove="${i.id}">Bỏ</button>
      </div>
    `;
    itemsWrap.appendChild(row);
  });
  const vat = Math.round(subtotal*0.08);
  byId('cartSubtotal').textContent = fmtVND(subtotal);
  byId('cartVat').textContent = fmtVND(vat);
  byId('cartTotal').textContent = fmtVND(subtotal+vat);
}
document.addEventListener('click', (e)=>{
  const rm = e.target.closest('[data-remove]');
  if(rm){
    const id = rm.dataset.remove;
    delete cart[id];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
  }
});

// Drawer toggle
function openCart(){ document.querySelector('#cartDrawer').classList.add('show'); document.querySelector('#cartDrawer').setAttribute('aria-hidden','false') }
function closeCart(){ document.querySelector('#cartDrawer').classList.remove('show'); document.querySelector('#cartDrawer').setAttribute('aria-hidden','true') }
byId('cartToggle').addEventListener('click', openCart);
byId('cartClose').addEventListener('click', closeCart);

// Checkout demo
byId('checkoutBtn').addEventListener('click', ()=>{
  showToast('Đặt món demo thành công ✨');
  cart = {}; localStorage.setItem('cart','{}'); updateCartUI(); closeCart();
});

// ===== Theme toggle =====
byId('themeToggle').addEventListener('click', ()=>{
  const isLight = !document.documentElement.classList.contains('light');
  setTheme(isLight);
});

// ===== Toast =====
let toastTimer;
function showToast(msg){
  const t = byId('toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>{ t.hidden = true }, 1800);
}

// ===== Init =====
function init(){
  initTheme();
  renderTabs();
  renderMenu();
  updateCartUI();

  // Hash category support: #cat=ca-phe
  const params = new URLSearchParams(location.hash.replace('#','?'));
  const cat = params.get('cat');
  if(cat && (cat==='all' || CATEGORIES.some(c=>c.id===cat))){
    activeCat = cat;
    document.querySelectorAll('.tab').forEach(b=>b.setAttribute('aria-selected', b.dataset.cat===cat ? 'true':'false'));
    renderMenu();
  }
}
document.addEventListener('DOMContentLoaded', init);
