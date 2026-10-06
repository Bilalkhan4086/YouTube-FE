// Progressive enhancement: every guide is a normal HTML link without JavaScript.
const filterPanel = document.querySelector('[data-filters]');
if (filterPanel) {
 const search = document.querySelector('#article-search');
 const category = document.querySelector('#article-category');
 const cards = [...document.querySelectorAll('[data-card]')];
 const count = document.querySelector('[data-count]');
 const empty = document.querySelector('[data-empty]');
 function filter() {
  const words = search.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
  let visible = 0;
  for (const card of cards) {
   const matches = (!category.value || card.dataset.category === category.value) && words.every(word => card.dataset.search.includes(word));
   card.hidden = !matches;
   if (matches) visible++;
  }
  count.textContent = `${visible} ${visible === 1 ? 'guide' : 'guides'}${visible === cards.length ? ' for better listening' : ' found'}`;
  empty.hidden = visible !== 0;
 }
 filterPanel.hidden = false;
 search.addEventListener('input', filter);
 category.addEventListener('change', filter);
 document.querySelector('[data-reset]').addEventListener('click', () => {search.value='';category.value='';filter();search.focus();});
}
