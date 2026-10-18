import { applyAction, authenticate, requireWorkspace } from "../../lib/reviews/service.js";
import { fail, jsonBody, method, reply } from "../../lib/reviews/http.js";
export default async function handler(req,res){if(!method(req,res,"POST"))return;try{const c=await authenticate(req),body=jsonBody(req),org=body.organization_id;if(!org)throw Object.assign(new Error("organization_id is required."),{status:422});requireWorkspace(c,org,true);const data=await applyAction(c,org,body);return reply(res,200,{success:true,item:data});}catch(e){return fail(res,e);}}
