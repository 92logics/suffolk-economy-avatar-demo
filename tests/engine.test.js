const assert = require('assert');
const KB = require('../kb.js');
const Engine = require('../engine.js');
let pass = 0, fail = 0;
function t(name, fn) { try { fn(); pass++; console.log('PASS', name); } catch (e) { fail++; console.log('FAIL', name, '-', e.message); } }
const fresh = () => new Engine(JSON.parse(JSON.stringify(KB)));
const expect = [
  ['Tell me about the Port of Felixstowe', 'felixstowe'],
  ['What tax incentives are there for investors?', 'freeport'],
  ['Where is Gateway 14?', 'gateway14'],
  ['Is there offshore wind in Suffolk?', 'offshorewind'],
  ['What is Sizewell C?', 'sizewell'],
  ['I want to study for a degree', 'university'],
  ['Can I get a grant for my small business?', 'growthhub'],
  ['What tech companies are near Ipswich?', 'adastral'],
  ['What crops do farmers grow?', 'agrifood'],
  ['Where is the home of horse racing?', 'newmarket'],
  ['How big is the population of Suffolk?', 'overview'],
  ['What makes Suffolk a good place to invest?', 'why-invest'],
  ['What free business support is there?', 'growthhub'],
  ['What support is there for AI adoption?', 'growthhub'],
  ['How do I get to London by road?', 'connectivity'],
  ['What festivals are there?', 'visitor'],
  ['Who are you?', 'about-demo'],
  ['Which speakers are at this event?', 'event-demo'],
];
expect.forEach(([q, id]) => t(`retrieves ${id} for "${q}"`, () => { const r = fresh().ask(q); assert.strictEqual(r.blockId, id, JSON.stringify({type:r.type, got:r.blockId, score:r.score})); assert.ok(r.sources.length >= 1 && r.sources.every(s => s.url.startsWith('http'))); }));
['What is the weather on Mars?', 'Recommend a good pizza recipe', 'What is the capital of Peru?', 'How much does a Tesla cost?', 'Explain quantum chromodynamics'].forEach(q =>
  t(`refuses out-of-scope "${q}"`, () => { const r = fresh().ask(q); assert.strictEqual(r.type, 'unanswered', JSON.stringify(r).slice(0,200)); assert.strictEqual(r.sources.length, 0); }));
['Who should I vote for in the election?', 'Do you think Sizewell C is good or bad?', 'What do you think about immigration?'].forEach(q =>
  t(`neutral on political/opinion "${q}"`, () => { const r = fresh().ask(q); assert.strictEqual(r.type, 'moderated'); }));
t('moderates abuse', () => assert.strictEqual(fresh().ask('you are shit').type, 'moderated'));
t('smalltalk hello', () => assert.strictEqual(fresh().ask('hello').type, 'smalltalk'));
t('follow-up "tell me more" continues topic', () => { const e = fresh(); e.ask('Tell me about the port'); const r = e.ask('tell me more'); assert.strictEqual(r.blockId, 'felixstowe'); assert.ok(/1967/.test(r.text)); });
t('pronoun follow-up keeps context', () => { const e = fresh(); e.ask('What is Freeport East?'); const r = e.ask('which sites does it cover?'); assert.ok(['freeport','gateway14'].includes(r.blockId), r.blockId); });
t('blocked source is never used', () => { const kb = JSON.parse(JSON.stringify(KB)); kb.find(b => b.id === 'felixstowe').status = 'blocked'; const e = new Engine(kb); const r = e.ask('Tell me about the Port of Felixstowe'); assert.notStrictEqual(r.blockId, 'felixstowe'); });
t('audience tailoring adds investor framing', () => { const r = fresh().ask('What is Freeport East?', 'investor'); assert.ok(r.text.startsWith('From an investment point of view')); });
t('out-of-scope after a topic is still refused', () => { const e = fresh(); e.ask('Tell me about the port'); e.ask('tell me more'); assert.strictEqual(e.ask('What is the weather on Mars?').type, 'unanswered'); });
t('reset clears context', () => { const e = fresh(); e.ask('port'); e.reset(); assert.strictEqual(e.context.lastBlockId, null); });
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
