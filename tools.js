// tools.js
export async function searchOrder({ orderId }) {
  // Simulate DB lookup
  const fakeDB = {
    1001: { orderId: "1001", status: "shipped", total: 49.99 },
    1002: { orderId: "1002", status: "processing", total: 19.5 },
  };
  return fakeDB[orderId] || { error: "order_not_found", orderId };
}
export async function calculatePrice({ items }) {
  // items: [{name, qty, price}]
  let subtotal = 0;
  items.forEach((it) => (subtotal += (it.qty || 1) * (it.price || 0)));
  let tax = +(subtotal * 0.1).toFixed(2);
  let total = +(subtotal + tax).toFixed(2);
  return { subtotal, tax, total };
}
export async function logUserAction({ userid, action }) {
  // Just return success (simulate logging)
  return { ok: true, userid, action, timestamp: new Date().toISOString() };
}
