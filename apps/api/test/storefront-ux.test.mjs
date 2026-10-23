import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const src=readFileSync('apps/storefront/src/main.tsx','utf8');
test('guest shopping is accessible without login',()=>{assert.match(src,/localStorage/);assert.match(src,/guestCart/);assert.match(src,/Add to cart/);});
test('product details and quantity exist',()=>{assert.match(src,/productDetail/);assert.match(src,/selectedQuantity/);assert.match(src,/product-detail/);});
test('guest checkout requires sign in instead of confirming an order',()=>{assert.match(src,/checkout/);assert.match(src,/Sign in to continue checkout/);});

test('guest can add limited-edition first unit without authentication',()=>{assert.match(src,/async function addCart\(id:number,quantity=1\)\{if\(!account\)\{addGuest\(id,quantity\);return\}/);assert.match(src,/function addGuest\(id:number,quantity:number\)/);assert.match(src,/current\+quantity>p\.max_per_customer/);assert.match(src,/setGuestCart\(prev=>/);assert.match(src,/navigate\('\/cart'\)/);});
test('guest limited item stays visible and sign-in merges cart',()=>{assert.match(src,/\.\.\.catalogProducts,\.\.\.searchResults/);assert.match(src,/for\(const item of guestCart\)/);assert.match(src,/setGuestCart\(\[\]\)/);});

test('header badge counts guest cart lines without relying on catalog product hydration',()=>{assert.match(src,/const cartBadgeCount=account\?\.role==='customer'\?\(cart\?\.items\.reduce/);assert.match(src,/guestCart\.reduce\(\(n,i\)=>n\+i\.quantity,0\)/);assert.match(src,/cartLoading\?'…':cartBadgeCount/);});

test('authenticated cart reload and guest subtotal use hydrated state',()=>{assert.match(src,/fetch\('\/api\/v1\/cart',\{headers:\{Authorization:'Bearer '\+token\},cache:'no-store'\}\)/);assert.match(src,/setCartLoading\(true\)/);assert.match(src,/const p=\[\.\.\.products,\.\.\.catalogProducts,\.\.\.searchResults\]\.find/);});

test('unified login and canonical admin routes preserve role-specific navigation',()=>{assert.match(src,/history\.replaceState\(\{\},'','\/products\/manage'\);setView\('admin'\)/);assert.match(src,/history\.replaceState\(\{\},'','\/login'\)/);assert.match(src,/legacy==='\/admin\/integrations'\?'\/integrations'/);assert.match(src,/legacy==='\/admin\/products'\?'\/products\/manage'/);assert.match(src,/view==='admin'&&account\?\.role==='admin'/);assert.match(src,/view==='integrations'&&account\?\.role==='admin'/);});
test('API05 customer product editor remains accessible and API07 image import is admin-only in UI',()=>{assert.match(src,/view==='edit-product'&&\(account\?\.role==='admin'\|\|account\?\.role==='customer'\)/);assert.match(src,/account\?\.role==='admin'&&<><h2>Product Image<\/h2>/);assert.match(src,/\/api\/v1\/products\/.*?image\/import/);});

// API09 discovery and account URL canonicalization regression checks.
test('API09 endpoint inventory is exported to the browser at runtime',()=>{
 assert.match(src,/orders:\s*'\/api\/v1\/orders'/);
 assert.match(src,/ordersV2:\s*'\/api\/v2\/orders-test'/);
 assert.match(src,/__NEXORA_ENDPOINTS__=apiEndpoints/);
 assert.match(src,/fetch\(apiEndpoints\.orders,/);
});
test('account URLs use canonical collections while old URLs redirect',()=>{
 assert.match(src,/location\.pathname==='\/orders'/);
 assert.match(src,/location\.pathname==='\/payment-methods'/);
 assert.match(src,/decodeURIComponent\(location\.pathname\.split\('\/'\)\[2\]\)/);
 assert.match(src,/location\.pathname==='\/account\/orders'/);
 assert.match(src,/location\.pathname==='\/account\/payment-methods'/);
 assert.match(src,/history\.pushState\(\{\},'','\/orders/);
 assert.match(src,/history\.pushState\(\{\},'','\/payment-methods'/);
});

// API10: supplier descriptions execute only on product detail pages, not catalog cards.
test('API10 stored XSS is restricted to supplier product details',()=>{
 const vulnerableRender=/\(p\.id===1100\|\|p\.id===1101\)\?<div className="product-description" dangerouslySetInnerHTML=\{\{__html:p\.description\}\}\/>:<p>\{p\.description\}<\/p>/g;
 assert.equal([...src.matchAll(vulnerableRender)].length,1);
 const detail=src.indexOf("view==='products'&&productDetail!==null");
 const catalog=src.indexOf("view==='products'&&productDetail===null");
 assert.ok(catalog>=0&&detail>catalog);
 assert.ok(src.slice(catalog,detail).includes('<p>{p.description}</p>'));
 assert.ok(src.slice(detail).includes('dangerouslySetInnerHTML={{__html:p.description}}'));
});

test('API10 Integrations displays imported descriptions as text while product detail remains vulnerable',()=>{assert.match(src,/<div className="product-description">\{p\.description\}<\/div><\/details>/);assert.equal([...src.matchAll(/dangerouslySetInnerHTML=\{\{__html:p\.description\}\}/g)].length,1);});
