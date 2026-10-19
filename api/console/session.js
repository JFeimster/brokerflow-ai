import { authenticate } from "../../lib/reviews/service.js";
import { fail, method, reply } from "../../lib/reviews/http.js";
export default async function handler(req,res){ if(!method(req,res,"GET")) return; try { const c=await authenticate(req); return reply(res,200,{success:true,user:c.user,workspaces:c.workspaces.map(({id,name,role,canRead,canWrite})=>({id,name,role,can_read:canRead,can_write:canWrite}))}); } catch(e){ return fail(res,e); } }
