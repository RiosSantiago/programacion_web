import { atom } from 'nanostores';

export interface Toast {
  id: number;
  message: string;
  type: 'info' | 'success' | 'error';
  action?: { label: string; href: string };
}

export const $toasts = atom<Toast[]>([]);

let nextId = 0;

export function addToast(
  message: string,
  type: Toast['type'] = 'info',
  action?: Toast['action'],
) {
  const id = nextId++;
  $toasts.set([...$toasts.get(), { id, message, type, action }]);
  setTimeout(() => {
    $toasts.set($toasts.get().filter((t) => t.id !== id));
  }, 5000);
}

export function removeToast(id: number) {
  $toasts.set($toasts.get().filter((t) => t.id !== id));
}
