(() => {
  'use strict';
  const supported = ['ru','en','de','fr'];
  const get = id => document.getElementById(id);
  const config = window.SITE_CONFIG || {};
  // The URL owns the language. Robots and direct visitors see the same HTML;
  // a stored preference must never replace a specifically requested language.
  let language = supported.includes(document.documentElement.lang) ? document.documentElement.lang : 'en';
  let background = 4, thumbnails = true, shadow = true, generation = 0;
  const pickerWidths = {ru:256,en:198,de:226,fr:229};
  const capture = name => `/assets/captures/${language}-${name}.webp`;
  const preload = src => new Promise((resolve,reject) => {const img = new Image();img.onload=resolve;img.onerror=reject;img.src=src;});
  function updateDonation() {
    const link=get('donate-link');
    link.hidden=true;link.removeAttribute('href');link.setAttribute('aria-disabled','true');get('donate-pending').hidden=true;
    try {
      const url=new URL(config.donationUrls?.[language] || '');
      if(url.protocol==='https:') {link.href=url.href;link.removeAttribute('aria-disabled');link.hidden=false;get('donate-pending').hidden=true;}
    } catch (_) {}
    const author=config.authorNames?.[language] || config.authorName;
    if(author) get('author-name').textContent=author;
  }
  async function renderDemo() {
    const revision=++generation,ui=window.DEMO_LOCALES[language];
    const viewerSrc=capture(`viewer-${background}-${Number(thumbnails)}-${Number(shadow)}`);
    const pickerSrc=capture(`picker-${background}`);
    try {await Promise.all([preload(viewerSrc),preload(pickerSrc)]);} catch (_) {return;}
    if(revision!==generation)return;
    get('viewer-shot').src=viewerSrc;get('viewer-shot').alt=ui.viewer;
    get('picker-shot').src=pickerSrc;
    get('picker').style.width=`${pickerWidths[language]/1079*100}%`;
    get('picker').style.aspectRatio=`${pickerWidths[language]} / 222`;
    get('picker').setAttribute('aria-label',ui.picker);
    get('native-viewer').dataset.background=String(background);
    get('viewer-backdrop').hidden=background!==4;
    document.querySelectorAll('.picker-hit').forEach(button=>{
      const i=Number(button.dataset.background);button.setAttribute('aria-pressed',String(i===background));button.setAttribute('aria-label',ui.backgrounds[i]);button.title=ui.backgrounds[i];
    });
    [['toggle-shadow','shadow',shadow],['toggle-thumbnails','thumbnails',thumbnails]].forEach(([id,key,state])=>{
      const button=get(id);button.setAttribute('aria-pressed',String(state));button.setAttribute('aria-label',ui[key]);button.title=ui[key];
    });
    get('demo-status').textContent=`${ui.backgrounds[background]}. ${ui.shadow}: ${shadow?'✓':'—'}. ${ui.thumbnails}: ${thumbnails?'✓':'—'}.`;
  }
  function translateExplorer() {
    const labels=window.EXPLORER_LOCALES[language];
    document.querySelectorAll('[data-explorer-label]').forEach(node=>{
      node.textContent=labels[node.dataset.explorerLabel];
    });
  }
  function setLanguage(value) {
    language=supported.includes(value)?value:'en';
    const ui=window.DEMO_LOCALES[language];
    document.documentElement.lang=language;get('language').value=language;
    // Text and search metadata are already rendered in the language HTML.
    document.querySelector('.look').setAttribute('aria-label',ui.viewer);
    document.querySelector('.footer>a').setAttribute('aria-label',ui.top);
    document.querySelector('.header nav').setAttribute('aria-label',({ru:'Навигация',en:'Navigation',de:'Navigation',fr:'Navigation'})[language]);
    [['background-settings-shot','background-settings','backgroundSettings'],['animation-settings-shot','settings','animationSettings']].forEach(([id,file,alt])=>{get(id).src=capture(file);get(id).alt=ui[alt];});
    translateExplorer();updateDonation();renderDemo();
  }
  document.querySelectorAll('.picker-hit').forEach(button=>button.addEventListener('click',()=>{background=Number(button.dataset.background);renderDemo();}));
  get('toggle-thumbnails').addEventListener('click',()=>{thumbnails=!thumbnails;renderDemo();});
  get('toggle-shadow').addEventListener('click',()=>{shadow=!shadow;renderDemo();});
  get('language').addEventListener('change',event=>{
    const selected=event.target.value;
    if(!supported.includes(selected))return;
    try {localStorage.setItem('gallerist-language',selected);} catch (_) {}
    location.assign(`/${selected}/${location.hash}`);
  });
  setLanguage(language);
})();
