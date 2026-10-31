import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {now} from '../server/db.js';
import {hashPassword} from '../server/security.js';
test('production SSR and authenticated CMS work against PostgreSQL',{skip:!process.env.TEST_POSTGRES_URL},async()=>{
 const previous={...process.env};process.env.DATABASE_URL=process.env.TEST_POSTGRES_URL;process.env.SITE_URL='https://growintek.example';process.env.VERCEL='1';
 const {createRenderedApp}=await import('../server/render-app.js');
 const {app,db}=await createRenderedApp();const adminId=randomUUID();
 await db.prepare('INSERT INTO admins VALUES(?,?,?,?)').run(adminId,`${adminId}@example.com`,await hashPassword('Only-a-local-test-password!'),now());
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base=`http://127.0.0.1:${server.address().port}`;
 try{
  const page=await fetch(base+'/blog/seo-foundations-for-service-businesses');assert.equal(page.status,200);const html=await page.text();assert.match(html,/<h2 id="section-\d+-start-with-the-questions-buyers-ask">Start with the questions buyers ask<\/h2>/);assert.match(html,/https:\/\/growintek.example\/blog\/seo-foundations/);
  assert.equal((await fetch(base+'/missing-route')).status,404);
  const sitemap=await (await fetch(base+'/sitemap.xml')).text();assert.ok(!sitemap.includes('/admin'));
  const login=await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:`${adminId}@example.com`,password:'Only-a-local-test-password!'})});assert.equal(login.status,200);
  const cookie=login.headers.get('set-cookie').split(';')[0];
  const funds=await fetch(base+'/api/admin/funds',{headers:{Cookie:cookie}});assert.equal(funds.status,200);assert.equal((await funds.json()).currencies.length>=2,true);
 }finally{await db.prepare('DELETE FROM admins WHERE id=?').run(adminId);await new Promise(r=>server.close(r));await db.close();for(const k of Object.keys(process.env))if(!(k in previous))delete process.env[k];Object.assign(process.env,previous);}
});
