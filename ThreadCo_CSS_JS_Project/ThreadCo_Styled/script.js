
(function () {
  const CART_KEY = "threadco-cart";
  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch (e) { return []; }
  }
  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
  }
  function updateCartCount() {
    const count = getCart().reduce((sum, item) => sum + item.qty, 0);
    document.querySelectorAll('a[href="#cart"]').forEach(link => {
      let badge = link.querySelector(".cart-count");
      if (!badge) { badge = document.createElement("span"); badge.className = "cart-count"; link.appendChild(badge); }
      badge.textContent = count;
      badge.title = count + " items in cart";
    });
  }
  function toast(message) {
    let old = document.getElementById("toast");
    if (old) old.remove();
    const box = document.createElement("div");
    box.id = "toast"; box.setAttribute("role", "status"); box.textContent = message;
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 2400);
  }
  function addItem(name, price, qty = 1, size = "") {
    const cart = getCart();
    const key = name + "|" + size;
    const existing = cart.find(item => item.key === key);
    if (existing) existing.qty += qty;
    else cart.push({ key, name, price, qty, size });
    saveCart(cart);
    toast(name + " added to cart!");
  }

  // Product cards on catalogue/home pages.
  document.querySelectorAll(".add-to-cart").forEach(button => {
    button.addEventListener("click", () => {
      const card = button.closest("article");
      const name = card?.querySelector("h3")?.textContent.trim() || "ThreadCo item";
      const priceText = card?.querySelector("p")?.parentElement?.textContent || card?.textContent || "";
      const matches = priceText.match(/₹\s*([\d,]+)/);
      const price = matches ? Number(matches[1].replace(/,/g, "")) : 0;
      addItem(name, price);
    });
  });

  // Product detail page: require a size before adding to cart.
  const addDetail = document.querySelector("main .add-to-cart");
  const sizeSelect = document.getElementById("Size");
  const quantityInput = document.getElementById("Quantity");
  if (addDetail && sizeSelect) {
    addDetail.addEventListener("click", event => {
      event.preventDefault();
      if (!sizeSelect.value || sizeSelect.value.includes("Choose")) {
        toast("Please select a size first.");
        sizeSelect.focus();
        return;
      }
      const qty = Math.max(1, Math.min(10, Number(quantityInput?.value || 1)));
      if (quantityInput) quantityInput.value = qty;
      addItem("Oversized Drop Tee Vol.3", 799, qty, sizeSelect.value);
    });
  }
  const buyNow = document.querySelector(".buy-now");
  if (buyNow) buyNow.addEventListener("click", () => {
    if (sizeSelect && (!sizeSelect.value || sizeSelect.value.includes("Choose"))) {
      toast("Please select a size first."); sizeSelect.focus(); return;
    }
    const qty = Math.max(1, Math.min(10, Number(quantityInput?.value || 1)));
    addItem("Oversized Drop Tee Vol.3", 799, qty, sizeSelect?.value || "");
    toast("Added to cart. Checkout can be connected later.");
  });

  // Contact page: validate consent and required fields, then show demo confirmation.
  const sendButton = document.getElementById("send-message");
  if (sendButton) sendButton.addEventListener("click", () => {
    const name = document.getElementById("text");
    const email = document.getElementById("Email");
    const message = document.getElementById("Message:");
    const consent = document.getElementById("Checkbox");
    if (!name?.value.trim() || !email?.value.trim() || !message?.value.trim()) {
      toast("Please fill in your name, email and message."); return;
    }
    if (!email.checkValidity()) { email.reportValidity(); return; }
    if (!consent?.checked) { toast("Please accept the contact consent first."); consent?.focus(); return; }
    toast("Message checked! This demo does not send it to a server yet.");
  });
  const clearButton = document.getElementById("clear-form");
  if (clearButton) clearButton.addEventListener("click", () => {
    document.querySelectorAll("input, textarea, select").forEach(el => {
      if (el.type === "checkbox" || el.type === "radio") el.checked = false;
      else if (el.type !== "file") el.value = "";
    });
    toast("Form cleared.");
  });

  // Catalogue search/filter/sort controls are added without changing the original HTML structure.
  const articles = Array.from(document.querySelectorAll("main article"));
  const catalogue = document.querySelector("h2")?.textContent.toLowerCase().includes("catalogue");
  if (catalogue && articles.length) {
    const section = articles[0].parentElement;
    const tools = document.createElement("div");
    tools.id = "catalog-tools";
    tools.innerHTML = '<input id="product-search" type="search" placeholder="Search products..." aria-label="Search products"><select id="category-filter" aria-label="Filter category"><option value="">All categories</option><option>T-Shirts</option><option>Hoodies</option><option>Cargo Pants</option><option>Caps</option><option>Accessories</option></select><input id="max-price" type="number" min="0" placeholder="Max price ₹" aria-label="Maximum price"><select id="price-sort" aria-label="Sort products"><option value="">Default order</option><option value="low">Price: Low to High</option><option value="high">Price: High to Low</option></select>';
    const heading = Array.from(section.children).find(el => el.tagName === "H2");
    if (heading) heading.insertAdjacentElement("afterend", tools);
    const search = tools.querySelector("#product-search");
    const category = tools.querySelector("#category-filter");
    const maxPrice = tools.querySelector("#max-price");
    const sort = tools.querySelector("#price-sort");
    function filterProducts() {
      let visible = articles.filter(card => {
        const text = card.textContent.toLowerCase();
        const cat = (text.match(/category:\s*([^\n]+)/i) || [,""])[1].trim().toLowerCase();
        const priceMatch = text.match(/₹\s*([\d,]+)/);
        const price = priceMatch ? Number(priceMatch[1].replace(/,/g, "")) : 0;
        return text.includes(search.value.toLowerCase()) &&
          (!category.value || cat.includes(category.value.toLowerCase())) &&
          (!maxPrice.value || price <= Number(maxPrice.value));
      });
      articles.forEach(card => card.classList.toggle("is-hidden", !visible.includes(card)));
      if (sort.value) {
        visible.sort((a,b) => {
          const getPrice = el => Number(((el.textContent.match(/₹\s*([\d,]+)/)||[,"0"])[1]).replace(/,/g,""));
          return sort.value === "low" ? getPrice(a)-getPrice(b) : getPrice(b)-getPrice(a);
        });
        visible.forEach(card => section.appendChild(card));
      }
    }
    [search, category, maxPrice, sort].forEach(control => control.addEventListener("input", filterProducts));
    // Keep filter panel from submitting/reloading the page.
    document.querySelectorAll("form").forEach(form => form.addEventListener("submit", e => e.preventDefault()));
  }
  document.querySelectorAll('a[href="#cart"]').forEach(link => link.addEventListener("click", e => {
    e.preventDefault();
    const cart = getCart();
    if (!cart.length) { toast("Your cart is empty."); return; }
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    alert("YOUR THREADCO CART\n\n" + cart.map(item => item.name + (item.size ? " (" + item.size + ")" : "") + " × " + item.qty + " — ₹" + (item.price * item.qty)).join("\n") + "\n\nTotal: ₹" + total);
  }));
  updateCartCount();
})();
