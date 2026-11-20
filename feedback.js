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
  const siteKey='6Ldt0CkuAAAAAKbY1or47fqJCzMM9G1ntOr90LNr';
  const captchaError={ru:'Не удалось выполнить проверку от спама. Попробуйте отправить ещё раз.',en:'The spam check could not be completed. Please try sending again.',de:'Die Spam-Prüfung konnte nicht abgeschlossen werden. Bitte erneut senden.',fr:'La vérification anti-spam a échoué. Veuillez réessayer.'};
  let captchaScript;
  const captchaToken=()=>new Promise((resolve,reject)=>{
    let settled=false;
    const finish=(error,token)=>{
      if(settled)return;settled=true;clearTimeout(timer);
      if(error)reject(error);else resolve(token);
    };
    const timer=setTimeout(()=>finish(new Error('CAPTCHA timeout')),20000);
    const execute=()=>{
      if(settled)return;
      try{
        window.grecaptcha.ready(()=>{
          if(settled)return;
          try{window.grecaptcha.execute(siteKey,{action:'submit'}).then(token=>{
            if(typeof token!=='string'||!token)finish(new Error('Empty CAPTCHA token'));
            else finish(null,token);
          },error=>finish(error));}catch(error){finish(error);}
        });
      }catch(error){finish(error);}
    };
    if(window.grecaptcha){execute();return;}
    if(captchaScript)captchaScript.remove();
    captchaScript=document.createElement('script');
    captchaScript.src='https://www.recaptcha.net/recaptcha/api.js?render='+siteKey;
    captchaScript.async=true;
    captchaScript.onload=execute;
    captchaScript.onerror=()=>finish(new Error('CAPTCHA load failed'));
    document.head.appendChild(captchaScript);
  });
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
  // A drag starting inside the form must not dismiss it on release outside.
  let backdropPress=false;
  const outside=event=>{
    const rect=dialog.getBoundingClientRect();
    return event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom;
  };
  dialog.addEventListener('pointerdown',event=>{
    backdropPress=event.target===dialog&&outside(event);
  });
  dialog.addEventListener('pointercancel',()=>{backdropPress=false;});
  dialog.addEventListener('click',event=>{
    if(backdropPress&&event.target===dialog&&outside(event))dialog.close();
    backdropPress=false;
  });
  message.addEventListener('input',()=>message.setCustomValidity(''));
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(!ready||busy){event.preventDefault();if(!ready)show(text.unavailable);return;}
    message.setCustomValidity(message.value.trim().length<3?text.invalid:'');
    if(!form.reportValidity()){event.preventDefault();return;}
    busy=true;button.disabled=true;status.textContent='';
    try{
      const token=await captchaToken();
      // Recheck fields in case they changed while the verification was running.
      message.setCustomValidity(message.value.trim().length<3?text.invalid:'');
      if(!form.reportValidity()){busy=false;button.disabled=false;return;}
      let field=form.elements.namedItem('g-recaptcha-response');
      if(!field){field=document.createElement('input');field.type='hidden';field.name='g-recaptcha-response';form.appendChild(field);}
      field.value=token;
      // Formspree verifies the token and confirms receipt; never claim success here.
      form.submit();
    }catch(error){
      busy=false;button.disabled=false;
      show(captchaError[document.documentElement.lang]||captchaError.en);
    }
  });
  window.addEventListener('pageshow',()=>{busy=false;button.disabled=!ready;});
})();
