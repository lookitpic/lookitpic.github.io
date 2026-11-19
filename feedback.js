(() => {
  'use strict';
  const get=id=>document.getElementById(id);
  const dialog=get('feedback'),close=get('feedback-close'),form=get('feedback-form');
  if(!dialog||!close||!form)return;
  const status=get('feedback-status'),text=JSON.parse(get('feedback-text').textContent);
  const button=form.querySelector('button[type="submit"]');
  const message=form.elements.namedItem('message');
  const endpoint=window.LOOKITPIC_FEEDBACK_ENDPOINT||'';
  const ready=/^https:\/\/formspree\.io\/f\/[A-Za-z0-9]+$/.test(endpoint);
  let busy=false;
  const show=value=>{status.textContent=value;status.focus();};
  if(ready){form.action=endpoint;button.disabled=false;}
  else button.disabled=true;
  document.addEventListener('click',event=>{
    const link=event.target.closest('a.inline-feedback');if(!link)return;
    event.preventDefault();
    const lang=document.documentElement.lang;
    close.setAttribute('aria-label',lang==='ru'?'Закрыть':window.SITE_LOCALES[lang].feedbackClose);
    if(!dialog.open)dialog.showModal();
    if(!ready)show(text.unavailable);
  });
  close.addEventListener('click',()=>dialog.close());
  message.addEventListener('input',()=>message.setCustomValidity(''));
  form.addEventListener('submit',event=>{
    if(!ready||busy){event.preventDefault();if(!ready)show(text.unavailable);return;}
    message.setCustomValidity(message.value.trim().length<3?text.invalid:'');
    if(!form.reportValidity()){event.preventDefault();return;}
    // A normal POST keeps the service's server-verified CAPTCHA flow enabled.
    // No success is claimed before Formspree confirms receipt on its own page.
    busy=true;button.disabled=true;
  });
  window.addEventListener('pageshow',()=>{busy=false;button.disabled=!ready;});
})();
