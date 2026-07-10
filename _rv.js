const { chromium } = require('playwright');
const dir='C:/Users/josukekung/Project/AI-Team-Starter/docs/design/erp-v2-ui-first/mockups';
const out='C:/Users/josukekung/Project/AI-Team-Starter/docs/design/erp-v2-ui-first/ux-audit';
const url=f=>'file:///'+dir+'/'+f;
(async()=>{
  const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1440,height:900}});const errs=[];
  for(const f of ['stock.html','po-create.html','po-detail.html','dashboard.html']){
    const p=await ctx.newPage();p.on('pageerror',e=>errs.push(f+' JS: '+e.message));
    await p.goto(url(f),{waitUntil:'networkidle'});
    await p.screenshot({path:out+'/res_'+f.replace('.html','')+'.png',fullPage:f==='stock.html'});
    await p.close();
  }
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push('po-detail JS: '+e.message));
  await p.goto(url('po-detail.html'),{waitUntil:'networkidle'});
  const badge=await p.textContent('.noti-badge');
  await p.locator('button',{hasText:'ยกเลิก PO'}).click();
  const modalVis=await p.locator('#cancelModal').isVisible();
  await p.screenshot({path:out+'/res_cancel_modal.png'});
  errs.push('po-detail: noti badge='+badge+' cancelModalOpen='+modalVis);
  await p.close();
  await ctx.close();await b.close();
  console.log(errs.length?errs.join('\n'):'NO JS ERRORS');console.log('DONE');
})();
