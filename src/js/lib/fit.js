// Tự co chữ / nén bố cục khi nội dung dài hơn khung — để patch nào cũng không vỡ ảnh.
const px = (el) => parseFloat(getComputedStyle(el).fontSize);

// [data-fit]: 1 dòng, co cỡ chữ cho vừa chiều ngang.
function fitLine(el, min = 0.55) {
  const start = px(el);
  let size = start;
  while (el.scrollWidth > el.clientWidth + 1 && size > start * min) {
    size -= 2;
    el.style.fontSize = `${size}px`;
  }
  if (el.scrollWidth > el.clientWidth + 1) console.warn(`[fit] Tràn chữ: "${el.textContent.trim()}"`);
}

// [data-fit-block]: đoạn văn, tối đa N dòng (data-fit-lines, mặc định 3).
function fitBlock(el, min = 0.7) {
  const maxLines = Number(el.dataset.fitLines ?? 3);
  const start = px(el);
  let size = start;
  const tooTall = () => el.scrollHeight > parseFloat(getComputedStyle(el).lineHeight) * maxLines + 2;
  while (tooTall() && size > start * min) {
    size -= 2;
    el.style.fontSize = `${size}px`;
  }
  if (tooTall()) console.warn(`[fit] Đoạn văn quá dài: "${el.textContent.trim().slice(0, 60)}…"`);
}

// .chg: số liệu quá dài (theo cấp, nhiều mốc) → nhãn lên dòng riêng; vẫn tràn thì co cỡ số trong thẻ đó.
const MIN_LABEL = 170;
function fitCard(card) {
  const lines = card.querySelector('.chg-lines');
  if (!lines) return;
  const overflows = () => lines.scrollWidth > lines.clientWidth + 1;
  const label = card.querySelector('.ln:not(.ln--text) .ln-label');
  if (!card.closest('.changes--cols') && ((label && label.clientWidth < MIN_LABEL) || overflows())) {
    card.classList.add('is-stacked');
  }
  const els = [...card.querySelectorAll('.ln-old, .ln-new, .ln-delta b')].map((el) => [el, px(el)]);
  let scale = 1;
  while (overflows() && scale > 0.55) {
    scale -= 0.06;
    for (const [el, size] of els) el.style.fontSize = `${size * scale}px`;
  }
  if (overflows()) console.warn(`[fit] Số liệu quá dài trong thẻ "${card.querySelector('.chg-title')?.textContent.trim()}"`);
}

// [data-fit-stack]: cột thẻ thay đổi — tràn thì chuyển dần sang chế độ gọn.
// (khổ 1:1 xếp thẻ thành 2 cột, tràn sẽ sinh thêm cột sang ngang nên kiểm tra cả chiều rộng)
function fitStack(el) {
  const overflows = () => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1;
  const levels = ['is-dense', 'is-denser', 'is-densest'];
  for (const cls of levels) {
    if (!overflows()) return;
    el.classList.add(cls);
  }
  if (overflows()) console.warn('[fit] Quá nhiều thay đổi cho 1 ảnh — nên tách thành 2 ảnh.');
}

// Cột trái (tên + câu chốt): nếu khung chốt chạm chân ảnh thì thu gọn biểu tượng/tên cho vừa.
function fitHero(hero) {
  const verdict = hero.querySelector('.verdict');
  const foot = hero.closest('.slide')?.querySelector('.footbar');
  if (!verdict || !foot) return;
  const hits = () => verdict.getBoundingClientRect().bottom > foot.getBoundingClientRect().top - 4;
  if (hits()) hero.classList.add('is-compact');
  if (hits()) console.warn('[fit] Câu chốt quá dài, đè lên chân ảnh — nên rút gọn.');
}

export function fitAll(root = document) {
  root.querySelectorAll('.chg').forEach(fitCard);
  root.querySelectorAll('[data-fit-stack]').forEach(fitStack);
  root.querySelectorAll('[data-fit]').forEach((el) => fitLine(el));
  root.querySelectorAll('[data-fit-block]').forEach((el) => fitBlock(el));
  root.querySelectorAll('.it-hero, .ch-hero').forEach(fitHero);
}
