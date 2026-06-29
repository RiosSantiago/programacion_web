import { atom } from 'nanostores';

export interface CartItem {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen: string;
  vendedor: string;
  vendedor_id?: number;
}

export const $cart = atom<CartItem[]>([]);
export const $cartOpen = atom(false);

export function addToCart(item: CartItem) {
  const current = $cart.get();
  const existing = current.find((i) => i.id === item.id);
  
  if (existing) {
    $cart.set(
      current.map((i) =>
        i.id === item.id ? { ...i, cantidad: i.cantidad + item.cantidad } : i
      )
    );
  } else {
    $cart.set([...current, item]);
  }
  
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('agrotech_cart', JSON.stringify($cart.get()));
  }
}

export function removeFromCart(id: number) {
  $cart.set($cart.get().filter((i) => i.id !== id));
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('agrotech_cart', JSON.stringify($cart.get()));
  }
}

export function updateQuantity(id: number, cantidad: number) {
  if (cantidad <= 0) {
    removeFromCart(id);
    return;
  }
  $cart.set(
    $cart.get().map((i) => (i.id === id ? { ...i, cantidad } : i))
  );
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('agrotech_cart', JSON.stringify($cart.get()));
  }
}

export function clearCart() {
  $cart.set([]);
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('agrotech_cart');
  }
}

export function toggleCart() {
  $cartOpen.set(!$cartOpen.get());
}

export function getCartTotal(): number {
  return $cart.get().reduce((sum, item) => sum + item.precio * item.cantidad, 0);
}

export function getCartCount(): number {
  return $cart.get().reduce((sum, item) => sum + item.cantidad, 0);
}

export function openCart() {
  $cartOpen.set(true);
}

export function closeCart() {
  $cartOpen.set(false);
}

if (typeof localStorage !== 'undefined') {
  // Migrate from old key if present
  const oldCart = localStorage.getItem('agrotech-cart');
  if (oldCart) {
    const currentCart = localStorage.getItem('agrotech_cart');
    if (!currentCart || JSON.parse(currentCart).length === 0) {
      localStorage.setItem('agrotech_cart', oldCart);
    }
    localStorage.removeItem('agrotech-cart');
  }

  const saved = localStorage.getItem('agrotech_cart');
  if (saved) {
    try {
      $cart.set(JSON.parse(saved));
    } catch (e) {
      localStorage.removeItem('agrotech_cart');
    }
  }
}