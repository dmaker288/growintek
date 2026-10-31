import 'dotenv/config';
import {createRenderedApp} from '../server/render-app.js';
let initialized;
export default async function handler(req,res){
 try{
  if(!process.env.SITE_URL?.startsWith('https://'))throw new Error('Configure SITE_URL for deployment.');
  initialized ||= createRenderedApp().catch(e=>{initialized=null;throw e;});
  const {app}=await initialized;return app(req,res);
 }catch(e){console.error('Startup failed:',e.name);res.status(503).json({error:'Website setup is incomplete. Check the deployment environment.'});}
}
