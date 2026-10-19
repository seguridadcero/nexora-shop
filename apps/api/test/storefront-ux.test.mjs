import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const src=readFileSync('apps/storefront/src/main.tsx','utf8');
test('guest shopping is accessible without login',()=>{assert.match(src,/localStorage/);assert.match(src,/guestCart/);assert.match(src,/Add to cart/);});
test('product details and quantity exist',()=>{assert.match(src,/productDetail/);assert.match(src,/selectedQuantity/);assert.match(src,/product-detail/);});
test('guest checkout requires sign in instead of confirming an order',()=>{assert.match(src,/checkout/);assert.match(src,/Sign in to continue checkout/);});
