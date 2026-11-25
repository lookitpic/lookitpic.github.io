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
  let sent=false;
  const intro=dialog.querySelector('.feedback-pending');
  const confirmation=document.createElement('p');
  confirmation.className='feedback-confirmation';confirmation.hidden=true;
  confirmation.setAttribute('role','status');confirmation.tabIndex=-1;
  dialog.appendChild(confirmation);
  const copy={
    ru:{success:'Спасибо! Ваше сообщение отправлено.',sending:'Отправляем…',error:'Не удалось отправить сообщение. Текст сохранён — попробуйте ещё раз.',limit:'Слишком много попыток. Подождите немного и попробуйте снова.'},
    en:{success:'Thank you! Your message has been sent.',sending:'Sending…',error:'Your message could not be sent. Your text is saved — please try again.',limit:'Too many attempts. Please wait a little and try again.'},
    de:{success:'Vielen Dank! Ihre Nachricht wurde gesendet.',sending:'Wird gesendet…',error:'Die Nachricht konnte nicht gesendet werden. Ihr Text bleibt erhalten. Bitte versuchen Sie es erneut.',limit:'Zu viele Versuche. Bitte warten Sie kurz und versuchen Sie es erneut.'},
    fr:{success:'Merci ! Votre message a été envoyé.',sending:'Envoi en cours…',error:'Impossible d’envoyer le message. Votre texte est conservé. Veuillez réessayer.',limit:'Trop de tentatives. Patientez un peu avant de réessayer.'}
  }[document.documentElement.lang]||{success:'Thank you! Your message has been sent.',sending:'Sending…',error:'Unable to send. Please try again.',limit:'Please wait and try again.'};
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
    if(sent&&!busy){
      sent=false;form.hidden=false;intro.hidden=false;confirmation.hidden=true;
      dialog.classList.remove('feedback-sent');status.textContent='';
    }
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
    if(!ready||busy||sent){event.preventDefault();if(!ready)show(text.unavailable);return;}
    message.setCustomValidity(message.value.trim().length<3?text.invalid:'');
    if(!form.reportValidity()){event.preventDefault();return;}
    busy=true;button.disabled=true;status.textContent=copy.sending;
    let posting=false;
    try{
      const token=await captchaToken();
      // Recheck fields in case they changed while the verification was running.
      message.setCustomValidity(message.value.trim().length<3?text.invalid:'');
      if(!form.reportValidity()){status.textContent='';return;}
      let field=form.elements.namedItem('g-recaptcha-response');
      if(!field){field=document.createElement('input');field.type='hidden';field.name='g-recaptcha-response';form.appendChild(field);}
      field.value=token;
      posting=true;
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),30000);
      let response;
      try{
        response=await fetch(endpoint,{method:'POST',body:new FormData(form),headers:{Accept:'application/json'},signal:controller.signal});
      }finally{clearTimeout(timer);}
      if(!response.ok){
        show(response.status===429?copy.limit:copy.error);return;
      }
      // Only a successful server response may clear the message and show thanks.
      sent=true;form.reset();form.hidden=true;intro.hidden=true;status.textContent='';
      confirmation.textContent=text.success;confirmation.hidden=false;
      dialog.classList.add('feedback-sent');
      if(dialog.open)confirmation.focus();
    }catch(error){
      show(posting?copy.error:(captchaError[document.documentElement.lang]||captchaError.en));
    }finally{busy=false;button.disabled=!ready;}
  });
  window.addEventListener('pageshow',()=>{busy=false;button.disabled=!ready;});
})();
