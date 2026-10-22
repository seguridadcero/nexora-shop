import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const src=readFileSync('apps/storefront/src/main.tsx','utf8');
test('guest shopping is accessible without login',()=>{assert.match(src,/localStorage/);assert.match(src,/guestCart/);assert.match(src,/Add to cart/);});
test('product details and quantity exist',()=>{assert.match(src,/productDetail/);assert.match(src,/selectedQuantity/);assert.match(src,/product-detail/);});
test('guest checkout requires sign in instead of confirming an order',()=>{assert.match(src,/checkout/);assert.match(src,/Sign in to continue checkout/);});

test('guest can add limited-edition first unit without authentication',()=>{assert.match(src,/async function addCart\(id:number,quantity=1\)\{if\(!account\)\{addGuest\(id,quantity\);return\}/);assert.match(src,/function addGuest\(id:number,quantity:number\)/);assert.match(src,/current\+quantity>p\.max_per_customer/);assert.match(src,/setGuestCart\(prev=>/);assert.match(src,/navigate\('\/cart'\)/);});
test('guest limited item stays visible and sign-in merges cart',()=>{assert.match(src,/\.\.\.catalogProducts,\.\.\.searchResults/);assert.match(src,/for\(const item of guestCart\)/);assert.match(src,/setGuestCart\(\[\]\)/);});

test('header badge counts guest cart lines without relying on catalog product hydration',()=>{assert.match(src,/const cartBadgeCount=account\?\.role==='customer'\?\(cart\?\.items\.reduce/);assert.match(src,/guestCart\.reduce\(\(n,i\)=>n\+i\.quantity,0\)/);assert.match(src,/cartLoading\?'…':cartBadgeCount/);});

test('authenticated cart reload and guest subtotal use hydrated state',()=>{assert.match(src,/fetch\('\/api\/v1\/cart',\{headers:\{Authorization:'Bearer '\+token\},cache:'no-store'\}\)/);assert.match(src,/setCartLoading\(true\)/);assert.match(src,/const p=\[\.\.\.products,\.\.\.catalogProducts,\.\.\.searchResults\]\.find/);});
