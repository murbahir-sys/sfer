const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),acorn=require('acorn');
const file=require('path').resolve(__dirname,'../math/formulas.js');
test('offline presentation adapter exists',()=>assert.ok(fs.existsSync(file),'missing textbook formula renderer'));
if(fs.existsSync(file)){
 const M=require(file),katex=require('../math/katex.js');
 const cases=[
 ['cos A = (cos a − cos b · cos c) / (sin b · sin c)',/\\frac\{/],
 ['sin a / sin A = sin b / sin B',/\\frac\{\\sin/],
 ['tg[(A + B)/2] = cos[(a − b)/2] / cos[(a + b)/2] · ctg(C/2)',/\\operatorname\{ctg\}/],
 ['N=a/√(1−e²sin²φ)',/\\sqrt\{/],
 ['M=a(1−e²)/(1−e²sin²φ)³ᐟ²',/\^\{\\frac\{3\}\{2\}\}/],
 ['tg φi = [tg φA sin(λB−λi) + tg φB sin(λi−λA)] / sin Δλ',/\\varphi_\{i\}/],
 ['Sлᵢ=Δφᵢ[′]/cos Kлᵢ',/\\prime/],
 ['cos A = (−0,12345) · (0,55555) / 0,66666 = −0,10288',/\\frac/],
 ['При sin Δλ≈0 применяется векторная интерполяция slerp.',/\\text\{При\}/],
 ['a=37°12,3′; b=−0,11111',/12\{,\}3/],
 ['Xlocal=XWGS−dx',/X_\{\\mathrm\{local\}\}/]
 ];
 for(const [plain,pattern] of cases)test('typesets '+plain,()=>{const tex=M.tex(plain);assert.match(tex,pattern);assert.doesNotThrow(()=>katex.renderToString(tex,{output:'html',throwOnError:true,strict:'ignore'}));});
 test('Delta and variable form one function operand',()=>{assert.match(M.tex('sin Δλ'),/^\\sin \\Delta \\lambda$/);assert.match(M.tex('x / sin Δλ'),/^\\frac\{x\}\{\\sin \\Delta \\lambda\}$/);});
 test('degree-minute angles stay inside function fractions',()=>{const t=M.tex('sin 37°12,3′ / sin 42°10,0′');assert.match(t,/^\\frac\{\\sin 37/);assert.ok(t.endsWith('^{\\prime}}'));});
 test('long substitution chains align at equals signs',()=>{const t=M.layoutTex('cos A = (−0,12345) · (0,55555) / (0,66666 · 0,77777) = −0,10288 = cos 95°54,3′',true);assert.match(t,/\\begin\{aligned\}/);assert.doesNotThrow(()=>katex.renderToString(t,{output:'html',throwOnError:true,strict:'ignore'}));});
 test('inherited cos-or-sin shorthand stays one fraction operator',()=>{const t=M.tex('cos или sin[(a−b)/2] / cos или sin[(a+b)/2]');assert.match(t,/^\\frac\{\\operatorname\{cos/);assert.ok(!t.includes('\\text{или}'));assert.doesNotThrow(()=>katex.renderToString(t,{output:'html',throwOnError:true,strict:'ignore'}));});
 test('inline half-angle shorthand is a tangent of the half angle',()=>assert.match(M.tex('tg A/2'),/^\\operatorname\{tg\} \\frac\{A\}\{2\}$/));
 test('prose alternatives are not reinterpreted as quotients',()=>{assert.ok(!M.tex('0°/180°').includes('\\frac'));assert.ok(!M.tex('cos/tg').includes('\\frac'));});
 test('HTML-only math retains a readable accessibility label',()=>{const s=fs.readFileSync(file,'utf8');assert.ok(s.includes("setAttribute('role','math')"));assert.ok(s.includes("setAttribute('aria-label',chunk.trim())"));});
 test('signed substituted factors get literal sign markers',()=>{assert.match(M.tex('(−0,12345) · 0,55555',true),/\\overset\{\\ominus\}/);assert.match(M.tex('(−0,12345) · 0,55555',true),/\\overset\{\\oplus\}/);});
 test('rendering is ES5 and all local font URLs exist',()=>{for(const f of ['formulas.js','katex.js'])acorn.parse(fs.readFileSync(require('path').resolve(__dirname,'../math/'+f),'utf8'),{ecmaVersion:5});const css=fs.readFileSync(require('path').resolve(__dirname,'../math/katex.css'),'utf8');for(const m of css.matchAll(/url\(([^)]+)\)/g))assert.ok(fs.existsSync(require('path').resolve(__dirname,'../math/'+m[1].replace(/["']/g,''))),m[1]);assert.ok(!/https?:/.test(css));});
}
