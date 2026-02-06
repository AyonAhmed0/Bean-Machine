(function(){
  const els = {
    addForm: document.getElementById('addForm'),
    nameInput: document.getElementById('nameInput'),
    priceInput: document.getElementById('priceInput'),
    qtyInput: document.getElementById('qtyInput'),
    itemsBody: document.getElementById('itemsBody'),
    subtotal: document.getElementById('subtotal'),
    grandTotal: document.getElementById('grandTotal'),
    taxInput: document.getElementById('taxInput'),
    discountInput: document.getElementById('discountInput'),
    dateInput: document.getElementById('dateInput'),
    cidInput: document.getElementById('cidInput'),
    staffSelect: document.getElementById('staffSelect'),
    quickMenu: document.getElementById('quickMenu'),
    copyBtn: document.getElementById('copyBtn'),
    clearBtn: document.getElementById('clearBtn'),
    packagesBtn: document.getElementById('packagesBtn'),
    recipesBtn: document.getElementById('recipesBtn'),
    receipt: document.getElementById('receipt'),
  };

  const LS_KEY = 'restaurant_calc_v1';

  let state = {
    items: [],
    tax: 0,
    discount: 0,
  };

  // Bean Machine Recipe Database
  const recipes = {
    'Vanila Ice Cream': ['1 Ice cream Cone, 1 Milk → Vanila Ice Cream'],
    'Chocolate Ice Cream': ['1 Ice cream Cone, 1 Milk, 1 Cocoa Powder → Chocolate Ice Cream'],
    'Apple Ice Cream': ['1 Ice cream Cone, 1 Milk, 1 Apple → Apple Ice Cream'],
    'Banana Ice Cream': ['1 Ice cream Cone, 1 Milk, 1 Banana → Banana Ice Cream'],
    'Lemon Ice Cream': ['1 Ice cream Cone, 1 Milk, 1 Lemon → Lemon Ice Cream'],
    'Mango Ice Cream': ['1 Ice cream Cone, 1 Milk, 1 Mango → Mango Ice Cream'],
    'Pomegranate Ice Cream': ['1 Ice cream Cone, 1 Milk, 1 Pomegranate → Pomegranate Ice Cream'],
    'Watermelon Ice Cream': ['1 Ice cream Cone, 1 Milk, 1 Watermelon → Watermelon Ice Cream'],
    'Lemon Cake': ['1 Flour, 1 Milk, 1 Sugar, 1 Eggs, 2 Lemon → Lemon Cake'],
    'Strawberry Cake': ['1 Flour, 1 Milk, 1 Sugar, 1 Eggs, 1 Cherry, 1 Strawberry → Strawberry Cake'],
    'Chocolate Cake': ['1 Flour, 1 Milk, 1 Sugar, 1 Eggs, 2 Cocoa Powder → Chocolate Cake'],
    'Bean Coffee': ['2 Water, 1 Coffee Beans → Bean Coffee'],
    'Espresso': ['2 Water, 2 Coffee Beans → Espresso'],
    'Cappuccino': ['1 Water, 1 Coffee Bean, 1 Milk → Cappuccino'],
    'Iced Latte': ['1 Water, 1 Coffee Bean, 1 Sugar, 1 Milk → Iced Latte'],
    'Hot Chocolate': ['1 Sugar, 1 Milk, 2 Cocoa Powder → Hot Chocolate'],
    'Macha': ['2 Macha Powder, 2 Water → Macha']
  };



  function save(){
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  }
  function load(){
    try{
      const raw = localStorage.getItem(LS_KEY);
      if(!raw) return;
      const data = JSON.parse(raw);
      if(Array.isArray(data.items)) state.items = data.items;
      if(typeof data.tax === 'number') state.tax = data.tax;
      if(typeof data.discount === 'number') state.discount = data.discount;
    }catch(e){
      console.warn('Load failed', e);
    }
  }

  function currency(n){
    return `$${(Math.round(n*100)/100).toFixed(2)}`;
  }

  function compute(){
    const subtotal = state.items.reduce((s, it) => s + it.price * it.qty, 0);
    const taxAmt = subtotal * (state.tax/100);
    const discountAmt = subtotal * (state.discount/100);
    const total = subtotal + taxAmt - discountAmt;
    return {subtotal, taxAmt, discountAmt, total};
  }

  function render(){
    // Inputs
    els.taxInput.value = state.tax;
    els.discountInput.value = state.discount;

    // Table
    els.itemsBody.innerHTML = '';
    if(state.items.length === 0){
      const tr = document.createElement('tr');
      tr.className = 'empty';
      const td = document.createElement('td');
      td.colSpan = 6;
      td.textContent = 'No items yet. Add from above or use quick menu.';
      tr.appendChild(td);
      els.itemsBody.appendChild(tr);
    } else {
      state.items.forEach((it, idx) => {
        const tr = document.createElement('tr');

        const tdIdx = document.createElement('td');
        tdIdx.textContent = String(idx+1);

        const tdName = document.createElement('td');
        tdName.textContent = it.name;

        const tdPrice = document.createElement('td');
        tdPrice.innerHTML = `<span class="price">${currency(it.price)}</span>`;

        const tdQty = document.createElement('td');
        const qtyInput = document.createElement('input');
        qtyInput.type = 'number';
        qtyInput.min = '1';
        qtyInput.step = '1';
        qtyInput.value = String(it.qty);
        qtyInput.className = 'qty-input';
        qtyInput.addEventListener('change', () => {
          const v = parseInt(qtyInput.value, 10);
          state.items[idx].qty = isNaN(v) || v < 1 ? 1 : v;
          save();
          updateTotalsAndReceipt();
        });
        tdQty.appendChild(qtyInput);

        const tdTotal = document.createElement('td');
        tdTotal.innerHTML = `<span class="total">${currency(it.price*it.qty)}</span>`;

        const tdActions = document.createElement('td');
        tdActions.className = 'row-actions';
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Remove';
        delBtn.addEventListener('click', () => {
          state.items.splice(idx,1);
          save();
          render();
          updateTotalsAndReceipt();
        });
        tdActions.appendChild(delBtn);

        tr.appendChild(tdIdx);
        tr.appendChild(tdName);
        tr.appendChild(tdPrice);
        tr.appendChild(tdQty);
        tr.appendChild(tdTotal);
        tr.appendChild(tdActions);
        els.itemsBody.appendChild(tr);
      });
    }

    updateTotalsAndReceipt();
  }

  function updateTotalsAndReceipt(){
    // Update totals
    const {subtotal, total} = compute();
    els.subtotal.textContent = currency(subtotal);
    els.grandTotal.textContent = currency(total);

    // Update line totals without re-rendering all rows
    Array.from(els.itemsBody.querySelectorAll('tr')).forEach((tr, i) => {
      if(!state.items[i]) return;
      const tdTotal = tr.children[4];
      if(tdTotal) tdTotal.innerHTML = `<span class="total">${currency(state.items[i].price*state.items[i].qty)}</span>`;
    });

    // Receipt
    const receipt = buildReceiptHTML();
    els.receipt.innerHTML = receipt;
  }

  function buildReceiptHTML(){
    const {subtotal, taxAmt, discountAmt, total} = compute();
    const lines = [
      '<div class="receipt-content">',
      '<h3>Kissaki Sushi Receipt</h3>',
      '<table class="receipt-table">',
      '<thead><tr><th class="item-col">Item</th><th class="qty-col">Qty</th><th class="price-col">Price</th><th class="total-col">Total</th></tr></thead>',
      '<tbody>'
    ];
    state.items.forEach(it => {
      lines.push(`<tr><td class="item-col">${escapeHTML(it.name)}</td><td class="qty-col">${it.qty}</td><td class="price-col">${currency(it.price)}</td><td class="total-col">${currency(it.price*it.qty)}</td></tr>`);
    });
    lines.push('</tbody>');
    lines.push('<tfoot>');
    lines.push(`<tr><td colspan="3" class="label-col">Subtotal</td><td class="amount-col">${currency(subtotal)}</td></tr>`);
    if (taxAmt > 0) {
      lines.push(`<tr><td colspan="3" class="label-col">Tax (${state.tax}%)</td><td class="amount-col">${currency(taxAmt)}</td></tr>`);
    }
    if (discountAmt > 0) {
      lines.push(`<tr><td colspan="3" class="label-col">Discount (${state.discount}%)</td><td class="amount-col">-${currency(discountAmt)}</td></tr>`);
    }
    lines.push(`<tr class="grand-total"><td colspan="3" class="label-col">Grand Total</td><td class="amount-col">${currency(total)}</td></tr>`);
    lines.push('</tfoot>');
    lines.push('</table>');
    lines.push('<div class="receipt-footer">');
    lines.push('<p>Thank you for dining with us!</p>');
    lines.push('<p>☕ Bean Machine ☕</p>');
    lines.push('</div>');
    lines.push('</div>');
    return lines.join('');
  }

  function escapeHTML(str){
    return String(str).replace(/[&<>"']/g, s => ({'&':'&','<':'<','>':'&gt','"':'"','\'':'&#39;'}[s]));
  }

  // Show packages modal
  function showPackages() {
    const packageList = `
      <div class="package-section">
        <h3>📦 MENU PACKAGES</h3>
        <div class="package-item">
          <h4>☕ PD / EMS / State / DOJ Meal — $500</h4>
          <div class="package-contents">
            <div>🧇 Waffle ×6</div>
            <div>🐦 Pigeon Milk ×3</div>
            <div>🍹 Pink Lemonade ×2</div>
          </div>
        </div>
        <div class="package-item">
          <h4>☕ Bean Machine Special — $750</h4>
          <div class="package-contents">
            <div>🍋 Lemon Cake ×1</div>
            <div>🧇 Waffle ×5</div>
            <div>🍫 Hot Chocolate ×2</div>
            <div>☕ Cappuccino ×2</div>
            <div>🍹 Pink Lemonade ×1</div>
            <div>🍵 Macha ×1</div>
          </div>
        </div>
        <div class="package-item">
          <h4>☕ Medium Pack — $500</h4>
          <div class="package-contents">
            <div>🍫 Chocolate Cake ×1</div>
            <div>🧇 Waffle ×3</div>
            <div>🍫 Hot Chocolate ×2</div>
            <div>🍹 Pink Lemonade ×2</div>
          </div>
        </div>
        <div class="package-item">
          <h4>☕ Regular Meal — $300</h4>
          <div class="package-contents">
            <div>🧇 Waffle ×3</div>
            <div>🍵 Macha ×2</div>
            <div>🍦 Watermelon Ice Cream ×1</div>
          </div>
        </div>
      </div>
    `;

    const modalHTML = `
      <div id="packagesModal" class="modal-overlay" style="
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); display: flex; align-items: center;
        justify-content: center; z-index: 1000;">
        <div class="modal-content" style="
          background: var(--panel); border: 1px solid var(--border);
          border-radius: 14px; padding: 20px; max-width: 700px;
          max-height: 80vh; overflow-y: auto; color: white;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #e74c3c;">☕ Bean Machine Package Details</h2>
            <button id="closePackagesBtn" style="
              background: var(--danger); color: white; border: none;
              padding: 8px 12px; border-radius: 8px; cursor: pointer;">✕ Close</button>
          </div>
          <div class="packages-list" style="line-height: 1.6;">
            ${packageList}
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Close modal functionality
    document.getElementById('closePackagesBtn').addEventListener('click', () => {
      document.getElementById('packagesModal').remove();
    });

    document.getElementById('packagesModal').addEventListener('click', (e) => {
      if (e.target.id === 'packagesModal') {
        document.getElementById('packagesModal').remove();
      }
    });
  }

  // Show recipes modal
  function showRecipes() {
    const recipeList = Object.entries(recipes).map(([item, recipeVariants]) => {
      const variants = Array.isArray(recipeVariants) ? recipeVariants : [recipeVariants];
      return `<div class="recipe-item">
        <h4>🍽️ ${item}</h4>
        ${variants.map(recipe => `<div class="recipe-variant">${recipe}</div>`).join('')}
      </div>`;
    }).join('');

    const modalHTML = `
      <div id="recipesModal" class="modal-overlay" style="
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); display: flex; align-items: center;
        justify-content: center; z-index: 1000;">
        <div class="modal-content" style="
          background: var(--panel); border: 1px solid var(--border);
          border-radius: 14px; padding: 20px; max-width: 600px;
          max-height: 80vh; overflow-y: auto; color: white;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #e74c3c;">☕Bean Machine Recipes</h2>
            <button id="closeRecipesBtn" style="
              background: var(--danger); color: white; border: none;
              padding: 8px 12px; border-radius: 8px; cursor: pointer;">✕ Close</button>
          </div>
          <div class="recipes-list" style="line-height: 1.6;">
            ${recipeList}
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Close modal functionality
    document.getElementById('closeRecipesBtn').addEventListener('click', () => {
      document.getElementById('recipesModal').remove();
    });

    document.getElementById('recipesModal').addEventListener('click', (e) => {
      if (e.target.id === 'recipesModal') {
        document.getElementById('recipesModal').remove();
      }
    });
  }

  function addItem(name, price, qty){
    if(!name) return;
    const p = Number(price);
    const q = Number(qty);
    if(!isFinite(p) || p < 0) return;
    if(!Number.isInteger(q) || q < 1) return;
    state.items.push({name, price:p, qty:q});
    save();
    render();
  }

  // Events
  els.addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = els.nameInput.value.trim();
    const price = parseFloat(els.priceInput.value);
    const qty = parseInt(els.qtyInput.value);

    // Validation with feedback
    if (!name) {
      alert('Please enter an item name');
      els.nameInput.focus();
      return;
    }
    if (isNaN(price) || price < 0) {
      alert('Please enter a valid price');
      els.priceInput.focus();
      return;
    }
    if (isNaN(qty) || qty < 1) {
      alert('Please enter a valid quantity');
      els.qtyInput.focus();
      return;
    }

    addItem(name, price, qty);
    els.addForm.reset();
    els.qtyInput.value = '1';
    els.nameInput.focus();
  });

  els.taxInput.addEventListener('change', () => {
    const v = Number(els.taxInput.value);
    state.tax = !isFinite(v) || v < 0 ? 0 : v;
    save();
    updateTotalsAndReceipt();
  });

  els.discountInput.addEventListener('change', () => {
    const v = Number(els.discountInput.value);
    state.discount = !isFinite(v) || v < 0 ? 0 : v;
    save();
    updateTotalsAndReceipt();
  });

  els.quickMenu.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-name]');
    if(!btn) return;
    
    // Add selection animation
    btn.classList.add('selected');
    setTimeout(() => {
      btn.classList.remove('selected');
    }, 300);
    
    const name = btn.getAttribute('data-name');
    const price = Number(btn.getAttribute('data-price'));
    addItem(name, price, 1);
  });

  // Copy receipt to clipboard
  function copyReceiptToClipboard() {
    const { total } = compute();

    // Format items as "Item Name (xQTY)"
    const itemsText = state.items.map(item => `${item.name} (x${item.qty})`).join(', ');

    const receiptText = `Items: ${itemsText || 'No items'}
Total Bill: ${currency(total)}`;

    // Copy to clipboard
    navigator.clipboard.writeText(receiptText).then(() => {
      // Show success feedback
      const btn = els.copyBtn;
      const originalText = btn.textContent;
      btn.textContent = '✅ Copied!';
      btn.style.background = 'linear-gradient(180deg, #27ae60, #229954)';

      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = receiptText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);

      // Show success feedback
      const btn = els.copyBtn;
      const originalText = btn.textContent;
      btn.textContent = '✅ Copied!';
      btn.style.background = 'linear-gradient(180deg, #27ae60, #229954)';

      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
      }, 2000);
    });
  }

  // Send order to Discord webhook
  function sendOrderToDiscord() {
    const { total } = compute();
    const staffName = els.staffSelect.value;
    const date = els.dateInput.value || new Date().toLocaleDateString();
    const cid = els.cidInput.value || 'N/A';
    
    if (!staffName) {
      alert('Please select a staff member before sending to Discord!');
      return;
    }

    // Format items for Discord
    const itemsText = state.items.map(item => `${item.name} (x${item.qty}) - ${currency(item.price*item.qty)}`).join('\n');
    
    const embed = {
      embeds: [{
        title: '☕ Bean Machine Order Completed',
        description: `**Staff:** ${staffName}\n**Date:** ${date}\n**CID:** ${cid}`,
        color: 0x8B4513,
        fields: [
          {
            name: 'Items',
            value: itemsText || 'No items',
            inline: false
          },
          {
            name: 'Subtotal',
            value: currency(compute().subtotal),
            inline: true
          },
          {
            name: 'Tax',
            value: state.tax > 0 ? `${state.tax}% (${currency(compute().taxAmt)})` : '0%',
            inline: true
          },
          {
            name: 'Discount',
            value: state.discount > 0 ? `${state.discount}% (-${currency(compute().discountAmt)})` : '0%',
            inline: true
          },
          {
            name: 'Grand Total',
            value: `**${currency(total)}**`,
            inline: false
          }
        ],
        footer: {
          text: 'Bean Machine Sell History',
          icon_url: 'https://i.postimg.cc/pr3K1KL4/The-Bean-Machine-GTA4-logo.webp' // Replace with your emoji URL
        },
        timestamp: new Date().toISOString()
      }]
    };

    // Replace with your Discord webhook URL
    const webhookUrl = 'https://discord.com/api/webhooks/1465017943044915291/hg-NodZHYVucm7Uzm8_1jCMbIscoIxiVCiT9Zcljd2nANEIEbSCq5F9ph5SVlNqMNi6p';
    
    // Webhook URL is configured - proceed with sending

    fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(embed)
    })
    .then(response => {
      if (response.ok) {
        alert('Order sent to Discord successfully!');
      } else {
        throw new Error('Failed to send to Discord');
      }
    })
    .catch(error => {
      console.error('Error sending to Discord:', error);
      alert('Failed to send order to Discord. Please check your webhook URL and internet connection.');
    });
  }

  els.copyBtn.addEventListener('click', copyReceiptToClipboard);

  els.clearBtn.addEventListener('click', () => {
    if(confirm('Clear all items and reset values?')){
      state.items = [];
      state.tax = 0;
      state.discount = 0;
      save();
      render();
    }
  });

  els.packagesBtn.addEventListener('click', () => {
    showPackages();
  });

  els.recipesBtn.addEventListener('click', () => {
    showRecipes();
  });

  // Add Discord webhook button
  const discordBtn = document.createElement('button');
  discordBtn.className = 'btn btn-primary';
  discordBtn.textContent = '📤 Send to Discord';
  discordBtn.addEventListener('click', sendOrderToDiscord);
  
  // Insert Discord button after copy button
  els.copyBtn.parentNode.insertBefore(discordBtn, els.copyBtn.nextSibling);

  // Init
  load();
  render();
})();
