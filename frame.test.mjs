import {test} from 'node:test';
import assert from 'node:assert/strict';
import {creatorDocument} from '../../scripts/frame.mjs';
test('plain-text HTML is rendered as a srcdoc page with correct asset base',()=>{
 const html='<!DOCTYPE html><html><head><script type="module" src="./assets/app.js"></script></head><body><div id="root"></div></body></html>';
 const result=creatorDocument(html,'https://example.org/foundry/modules/saga-character-studio/app/');
 assert.match(result,/<head>\n<base href="https:\/\/example.org\/foundry\/modules\/saga-character-studio\/app\/">/);
 assert.ok(result.includes('<script type="module" src="./assets/app.js">'));
 assert.equal(new URL('./assets/app.js','https://example.org/foundry/modules/saga-character-studio/app/').pathname,'/foundry/modules/saga-character-studio/app/assets/app.js');
});
test('login/404 payloads are rejected rather than embedded as the creator',()=>{
 assert.throws(()=>creatorDocument('Not found','https://example.org/'),/missing or invalid/);
 assert.throws(()=>creatorDocument('<html><head></head><body>Login</body></html>','https://example.org/'),/missing or invalid/);
});
