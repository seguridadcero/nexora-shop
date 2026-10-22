// Public HTTP boundary: USD decimal strings. Internal storage/calculation: integer cents.
export const usd=(cents:number):string=>(cents/100).toFixed(2);
export function centsFromUsd(value:unknown):number|null {
 const s=typeof value==='number'?String(value):value;
 if(typeof s!=='string'||!/^\d+(?:\.\d{1,2})?$/.test(s))return null;
 const [whole,part='']=s.split('.');
 const result=Number(whole)*100+Number(part.padEnd(2,'0'));
 return Number.isSafeInteger(result)?result:null;
}
export function publicProduct(product:any){
 const {price_cents,price_display,...fields}=product;
 return {...fields,price:usd(price_cents)};
}
export function publicCart(cart:any){
 const {items,total_cents,total_display,...fields}=cart;
 return {...fields,total:usd(total_cents),items:items.map((item:any)=>{
  const {unit_price_cents,unit_price_display,unit_price,...itemFields}=item;
  return {...itemFields,price:usd(unit_price_cents)};
 })};
}
export function publicOrder(order:any){
 const {total_cents,total_display,items,...fields}=order;
 const formatted:any={...fields,total:usd(total_cents)};
 if(items)formatted.items=items.map((item:any)=>{
  const {unit_price_cents,unit_price,...itemFields}=item;
  return {...itemFields,price:usd(unit_price_cents)};
 });
 return formatted;
}
export function publicSupplier(product:any){
 const {price_cents,...fields}=product;
 return {...fields,price:usd(price_cents)};
}
