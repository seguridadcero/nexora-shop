// Public HTTP money boundary: decimal USD strings with exactly two places.
// Database calculations keep integer cents to avoid floating-point rounding.
export const usd=(cents:number)=>(cents/100).toFixed(2);
export function asProduct(p:any){const {price_cents,price_display,...rest}=p;return {...rest,price:usd(price_cents)}}
export function asCart(cart:any){const {items,total_cents,total_display,...rest}=cart;return {...rest,total:usd(total_cents),items:items.map((item:any)=>{const {unit_price_cents,unit_price_display,...detail}=item;return {...detail,unit_price:usd(unit_price_cents)}})}}
export function asOrder(o:any){const {total_cents,total_display,items,...rest}=o;const answer:any={...rest,total:usd(total_cents)};if(items)answer.items=items.map((item:any)=>{const {unit_price_cents,...detail}=item;return {...detail,unit_price:usd(unit_price_cents)}});return answer}
export function asSupplier(p:any){const {price_cents,...rest}=p;return {...rest,price:usd(price_cents)}}
export function toCents(value:unknown):number|null {const s=typeof value==='number'?String(value):value;if(typeof s!=='string'||!/^\d+(?:\.\d{1,2})?$/.test(s))return null;const [whole,fraction='']=s.split('.');const cents=Number(whole)*100+Number(fraction.padEnd(2,'0'));return Number.isSafeInteger(cents)?cents:null}
