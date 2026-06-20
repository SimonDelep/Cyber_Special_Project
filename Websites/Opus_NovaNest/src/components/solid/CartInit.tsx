import { onMount } from 'solid-js';
import { hydrateCart } from '../../stores/cart';

/** Loads the shared cart from localStorage on every page. */
export default function CartInit() {
  onMount(() => hydrateCart());
  return null;
}
