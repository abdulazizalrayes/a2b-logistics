import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
for (const kind of ['careers','vendors']) {
  let submit, focused=false;
  const form={style:{},addEventListener(name,callback){if(name==='submit')submit=callback;}};
  const status={style:{},hidden:true,focus(){focused=true;}};
  const window={location:{href:''},addEventListener(){},setTimeout(){throw new Error('A draft must not redirect to a receipt page');}};
  const document={readyState:'complete',querySelector(){return null;},getElementById(id){if(id==='successMsg')return status;if(id==='careerForm'||id==='vendorForm')return form;return null;}};
  vm.runInNewContext(await readFile(`assets/js/${kind}.js`,'utf8'),{window,document,FormData:class{get(){return 'Synthetic test';}},encodeURIComponent});
  submit({preventDefault(){}});
  assert.match(window.location.href,/^mailto:info@a2b\.sa\?/);
  assert.notEqual(form.style.display,'none','Keep the form available if no mail client opens');
  assert.equal(status.hidden,false);assert.equal(focused,true);
  if(kind==='careers')assert.ok(decodeURIComponent(window.location.href).includes('Please attach your CV'));
}
console.log('Form draft checks passed: mailto preserved, no receipt redirect, form recoverable, status focused.');
