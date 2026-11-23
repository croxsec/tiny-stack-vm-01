// tiny stack VM competition entry — own work from ISA.md, checked byte-exact vs reference VM on practice
const fs = require('node:fs');
const IN = '/input', OUT = '/output', LIMIT = 1000000, OMAX = 65536;

function runVM(prog, input) {
  const len = prog.length;
  let pc = 0, sp = 0, csp = 0, ip = 0, steps = 0;
  const st = new Int32Array(256), cs = new Int32Array(64), mem = new Int32Array(256);
  const out = [];
  while (true) {
    if (steps === LIMIT) return [10, out];
    if (pc < 0 || pc >= len) return [9, out];
    const op = prog[pc];
    steps++;
    switch (op) {
      case 0x00: return [0, out];
      case 0x01:
        if (pc + 1 >= len) return [9, out];
        if (sp >= 256) return [3, out];
        st[sp++] = (prog[pc + 1] << 24) >> 24; pc += 2; break;
      case 0x02:
        if (pc + 4 >= len) return [9, out];
        if (sp >= 256) return [3, out];
        st[sp++] = prog[pc + 1] | (prog[pc + 2] << 8) | (prog[pc + 3] << 16) | (prog[pc + 4] << 24);
        pc += 5; break;
      case 0x03: if (sp < 1) return [2, out]; sp--; pc++; break;
      case 0x04:
        if (sp < 1) return [2, out];
        if (sp >= 256) return [3, out];
        st[sp] = st[sp - 1]; sp++; pc++; break;
      case 0x05:
        if (sp < 2) return [2, out];
        { const t = st[sp - 1]; st[sp - 1] = st[sp - 2]; st[sp - 2] = t; }
        pc++; break;
      case 0x06:
        if (sp < 2) return [2, out];
        if (sp >= 256) return [3, out];
        st[sp] = st[sp - 2]; sp++; pc++; break;
      case 0x07:
        if (sp < 3) return [2, out];
        { const a = st[sp - 3], b = st[sp - 2], c = st[sp - 1];
          st[sp - 3] = b; st[sp - 2] = c; st[sp - 1] = a; }
        pc++; break;
      case 0x10: if (sp < 2) return [2, out]; sp--; st[sp - 1] = (st[sp - 1] + st[sp]) | 0; pc++; break;
      case 0x11: if (sp < 2) return [2, out]; sp--; st[sp - 1] = (st[sp - 1] - st[sp]) | 0; pc++; break;
      case 0x12: if (sp < 2) return [2, out]; sp--; st[sp - 1] = Math.imul(st[sp - 1], st[sp]); pc++; break;
      case 0x13:
        if (sp < 2) return [2, out];
        if (st[sp - 1] === 0) return [4, out];
        sp--; { const b = st[sp], a = st[sp - 1];
          st[sp - 1] = (a === -2147483648 && b === -1) ? -2147483648 : (a / b) | 0; }
        pc++; break;
      case 0x14:
        if (sp < 2) return [2, out];
        if (st[sp - 1] === 0) return [4, out];
        sp--; { const b = st[sp], a = st[sp - 1];
          st[sp - 1] = b === -1 ? 0 : (a % b) | 0; }
        pc++; break;
      case 0x15:
        if (sp < 2) return [2, out];
        if (st[sp - 1] === 0) return [4, out];
        sp--; st[sp - 1] = ((st[sp - 1] >>> 0) / (st[sp] >>> 0)) | 0; pc++; break;
      case 0x16:
        if (sp < 2) return [2, out];
        if (st[sp - 1] === 0) return [4, out];
        sp--; st[sp - 1] = ((st[sp - 1] >>> 0) % (st[sp] >>> 0)) | 0; pc++; break;
      case 0x17: if (sp < 1) return [2, out]; st[sp - 1] = (-st[sp - 1]) | 0; pc++; break;
      case 0x18: if (sp < 2) return [2, out]; sp--; st[sp - 1] &= st[sp]; pc++; break;
      case 0x19: if (sp < 2) return [2, out]; sp--; st[sp - 1] |= st[sp]; pc++; break;
      case 0x1a: if (sp < 2) return [2, out]; sp--; st[sp - 1] ^= st[sp]; pc++; break;
      case 0x1b: if (sp < 1) return [2, out]; st[sp - 1] = ~st[sp - 1]; pc++; break;
      case 0x1c: if (sp < 2) return [2, out]; sp--; st[sp - 1] = (st[sp - 1] << (st[sp] & 31)) | 0; pc++; break;
      case 0x1d: if (sp < 2) return [2, out]; sp--; st[sp - 1] >>= st[sp] & 31; pc++; break;
      case 0x1e: if (sp < 2) return [2, out]; sp--; st[sp - 1] = (st[sp - 1] >>> (st[sp] & 31)) | 0; pc++; break;
      case 0x20: if (sp < 2) return [2, out]; sp--; st[sp - 1] = st[sp - 1] === st[sp] ? 1 : 0; pc++; break;
      case 0x21: if (sp < 2) return [2, out]; sp--; st[sp - 1] = st[sp - 1] < st[sp] ? 1 : 0; pc++; break;
      case 0x22: if (sp < 2) return [2, out]; sp--; st[sp - 1] = (st[sp - 1] >>> 0) < (st[sp] >>> 0) ? 1 : 0; pc++; break;
      case 0x30:
        if (pc + 2 >= len) return [9, out];
        pc += 3 + ((prog[pc + 1] | (prog[pc + 2] << 8)) << 16 >> 16); break;
      case 0x31:
        if (pc + 2 >= len) return [9, out];
        if (sp < 1) return [2, out];
        { const v = st[--sp]; pc += 3; if (v === 0) pc += (prog[pc - 2] | (prog[pc - 1] << 8)) << 16 >> 16; }
        break;
      case 0x32:
        if (pc + 2 >= len) return [9, out];
        if (sp < 1) return [2, out];
        { const v = st[--sp]; pc += 3; if (v !== 0) pc += (prog[pc - 2] | (prog[pc - 1] << 8)) << 16 >> 16; }
        break;
      case 0x33:
        if (pc + 2 >= len) return [9, out];
        if (csp >= 64) return [7, out];
        cs[csp++] = pc + 3; pc = prog[pc + 1] | (prog[pc + 2] << 8); break;
      case 0x34: if (csp < 1) return [8, out]; pc = cs[--csp]; break;
      case 0x40:
        if (sp < 1) return [2, out];
        { const a = st[sp - 1];
          if (a < 0 || a > 255) return [6, out];
          st[sp - 1] = mem[a]; }
        pc++; break;
      case 0x41:
        if (sp < 2) return [2, out];
        { const a = st[sp - 1];
          if (a < 0 || a > 255) return [6, out];
          mem[a] = st[sp - 2]; sp -= 2; }
        pc++; break;
      case 0x50:
        if (sp < 1) return [2, out];
        { const s = String(st[--sp]);
          if (out.length + s.length > OMAX) return [11, out];
          for (let i = 0; i < s.length; i++) out.push(s.charCodeAt(i)); }
        pc++; break;
      case 0x51:
        if (sp < 1) return [2, out];
        if (out.length + 1 > OMAX) return [11, out];
        out.push(st[--sp] & 255); pc++; break;
      case 0x52:
        if (sp >= 256) return [3, out];
        st[sp++] = ip < input.length ? input[ip++] : -1; pc++; break;
      case 0x53: if (sp < 1) return [2, out]; return [st[--sp] & 255, out];
      default: return [5, out];
    }
  }
}

fs.mkdirSync(OUT, { recursive: true });
for (let k = 1; k <= 40; k++) {
  const id = 'i' + String(k).padStart(3, '0');
  try {
    const prog = fs.readFileSync(IN + '/' + id + '/program.bin');
    const input = fs.readFileSync(IN + '/' + id + '/input.bin');
    const [code, out] = runVM(prog, input);
    fs.mkdirSync(OUT + '/' + id, { recursive: true });
    fs.writeFileSync(OUT + '/' + id + '/stdout.bin', Buffer.from(out));
    fs.writeFileSync(OUT + '/' + id + '/exit.txt', String(code));
  } catch (e) {
    try {
      fs.mkdirSync(OUT + '/' + id, { recursive: true });
      fs.writeFileSync(OUT + '/' + id + '/stdout.bin', Buffer.alloc(0));
      fs.writeFileSync(OUT + '/' + id + '/exit.txt', '1');
    } catch (_) { }
  }
}
