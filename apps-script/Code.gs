const ADMIN_EMAIL = 'admin@lawal.org';
const COMPANY_NAME = 'ImoTech Solutions';

function doGet() {
  return json_({ ok: true, service: 'ImoTech Consultation API' });
}

function doPost(e) {
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    validate_(data);
    const analysis = analyseWithAI_(data);
    sendAdminBrief_(data, analysis);
    sendCustomerConfirmation_(data, analysis);
    return json_({
      ok: true,
      recommendation: analysis.customerRecommendation,
      customerMessage: 'Your consultation has been received. We have emailed you a summary and ImoTech will review the full project brief.'
    });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: String(err.message || err) });
  }
}

function validate_(d) {
  if (!d.contact || !d.contact.name || !d.contact.email) throw new Error('Name and email are required.');
  if (!Array.isArray(d.services) || !d.services.length) throw new Error('At least one service is required.');
  if (!d.description || d.description.length < 10) throw new Error('Project description is required.');
}

function analyseWithAI_(d) {
  const props = PropertiesService.getScriptProperties();
  const apiKey = props.getProperty('OPENAI_API_KEY');
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured in Script Properties.');
  const model = props.getProperty('OPENAI_MODEL') || 'gpt-5-mini';
  const system = `You are ImoTech Solutions' senior digital consultant. Analyse a prospective customer's consultation answers. Help the customer understand what they actually need, not merely what they selected. Recommend combinations of services where appropriate. ImoTech can provide business websites, ecommerce, web platforms, portals, booking and payment systems, domains and business email, business management systems, company intranets, CRM, dashboards, document/form systems, system improvements, AI assistants, workflow automation, AI document processing, process automation, API integrations, branding, logos, visual identity, brand refreshes, digital assets, prototypes/MVPs and bespoke software. Do not invent prices, delivery promises or facts. Distinguish immediate requirements from useful additions and future opportunities. Return ONLY valid JSON with keys: executiveSummary, customerNeed, primaryServices (array), additionalServices (array), futureOpportunities (array), whyThisFits, keyFunctionality (array), existingSystemsToRetain (array), domainHostingBranding, aiAutomationOpportunities (array), suggestedPhases (array), clarificationNeeded (array), complexity (Low|Moderate|High|Discovery required), customerRecommendation.`;
  const prompt = JSON.stringify({selectedGroups:d.groups,selectedServices:d.services,customerDescription:d.description,serviceAnswers:d.serviceAnswers,general:d.general});
  const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
    method:'post', contentType:'application/json', muteHttpExceptions:true,
    headers:{Authorization:'Bearer '+apiKey},
    payload:JSON.stringify({model:model,messages:[{role:'system',content:system},{role:'user',content:prompt}],response_format:{type:'json_object'}})
  });
  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) throw new Error('AI analysis failed: HTTP '+response.getResponseCode());
  const body = JSON.parse(response.getContentText());
  return JSON.parse(body.choices[0].message.content);
}

function sendAdminBrief_(d,a) {
  const c=d.contact, rows=(d.serviceAnswers||[]).map(x=>section_(x.service+' — '+x.question, value_(x.answer))).join('');
  const html=`<div style="font-family:Arial,sans-serif;max-width:760px;margin:auto;color:#172033"><div style="background:#020617;color:white;padding:24px;border-radius:14px 14px 0 0"><h1 style="margin:0">ImoTech — Full Project Intake Brief</h1><p style="color:#94a3b8">AI-assisted consultation submission</p></div><div style="padding:24px;border:1px solid #e2e8f0"><h2>Customer</h2>${section_('Name',c.name)}${section_('Business / organisation',c.business||'Not supplied')}${section_('Email',c.email)}${section_('Phone',c.phone||'Not supplied')}<h2>Original requirement</h2>${section_('Selected groups',value_(d.groups))}${section_('Selected services',value_(d.services))}${section_('Customer description',d.description)}<h2>Service-specific answers</h2>${rows}<h2>General project information</h2>${section_('Users',value_(d.general.users))}${section_('Current tools',value_(d.general.current))}${section_('Preferred start',d.general.timeline)}${section_('Budget guidance',d.general.budget)}<hr style="margin:28px 0;border:0;border-top:2px solid #2563eb"><h2>AI Project Analysis</h2>${section_('Executive summary',a.executiveSummary)}${section_('What the customer is trying to achieve',a.customerNeed)}${section_('Primary recommended services',value_(a.primaryServices))}${section_('Additional recommended services',value_(a.additionalServices))}${section_('Why this fits',a.whyThisFits)}${section_('Key functionality',list_(a.keyFunctionality))}${section_('Existing systems to retain / integrate',list_(a.existingSystemsToRetain))}${section_('Domain / hosting / branding',a.domainHostingBranding)}${section_('AI & automation opportunities',list_(a.aiAutomationOpportunities))}${section_('Suggested project phases',list_(a.suggestedPhases))}${section_('Clarification required',list_(a.clarificationNeeded))}${section_('Potential future enhancements',list_(a.futureOpportunities))}${section_('Complexity',a.complexity)}</div></div>`;
  MailApp.sendEmail({to:ADMIN_EMAIL,replyTo:c.email,subject:'New ImoTech consultation — '+c.name+(c.business?' — '+c.business:''),htmlBody:html,body:plain_(d,a)});
}

function sendCustomerConfirmation_(d,a) {
  const c=d.contact;
  const html=`<div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;color:#172033"><div style="background:#020617;color:white;padding:24px;border-radius:14px 14px 0 0"><h1 style="margin:0">Thank you, ${safe_(c.name)}</h1><p style="color:#94a3b8">ImoTech Solutions</p></div><div style="padding:24px;border:1px solid #e2e8f0"><p>We've received your project consultation.</p><h2>What we understand</h2><p>${safe_(a.customerNeed)}</p><h2>Initial recommendation</h2><p>${safe_(a.customerRecommendation)}</p><h3>Likely services</h3><p>${safe_(value_(a.primaryServices))}</p>${a.additionalServices&&a.additionalServices.length?'<h3>Additional services worth considering</h3><p>'+safe_(value_(a.additionalServices))+'</p>':''}<p style="margin-top:28px">This is an initial AI-assisted assessment. ImoTech will review the full brief before confirming scope, pricing or delivery.</p></div></div>`;
  MailApp.sendEmail({to:c.email,subject:'We received your ImoTech project consultation',htmlBody:html,body:'Thank you '+c.name+'.\n\nWe received your consultation.\n\nWhat we understand:\n'+a.customerNeed+'\n\nInitial recommendation:\n'+a.customerRecommendation+'\n\nImoTech will review the full brief before confirming scope, pricing or delivery.'});
}

function plain_(d,a){return 'IMOTECH FULL PROJECT INTAKE BRIEF\n\nCUSTOMER\n'+d.contact.name+'\n'+(d.contact.business||'')+'\n'+d.contact.email+'\n'+(d.contact.phone||'')+'\n\nDESCRIPTION\n'+d.description+'\n\nSELECTED SERVICES\n'+value_(d.services)+'\n\nAI ANALYSIS\n'+a.executiveSummary+'\n\nPRIMARY SERVICES\n'+value_(a.primaryServices)+'\n\nADDITIONAL SERVICES\n'+value_(a.additionalServices)+'\n\nCLARIFICATION NEEDED\n'+value_(a.clarificationNeeded);}
function section_(title,value){return '<div style="margin:0 0 16px"><strong>'+safe_(title)+'</strong><div style="margin-top:5px;line-height:1.55">'+safe_(value||'None identified').replace(/\n/g,'<br>')+'</div></div>'}
function list_(v){return Array.isArray(v)?v.map((x,i)=>(i+1)+'. '+x).join('\n'):value_(v)}
function value_(v){return Array.isArray(v)?v.join(', '):(v==null?'':String(v))}
function safe_(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function json_(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON)}

// Run once from the Apps Script editor to trigger required authorization.
function authoriseImoTechConsultation(){
  ScriptApp.requireScopes(ScriptApp.AuthMode.FULL,['https://www.googleapis.com/auth/script.send_mail','https://www.googleapis.com/auth/script.external_request']);
  const r=UrlFetchApp.fetch('https://www.google.com/',{muteHttpExceptions:true});
  console.log('External requests authorised. HTTP '+r.getResponseCode());
}