/**
 * remove-hero-bg.mjs — deixa transparente o fundo branco das artes dos heróis.
 *
 * Usa flood-fill a partir das BORDAS: só o branco conectado à margem vira
 * transparente. O branco/creme DENTRO do personagem (ex.: vestido da Ester)
 * é preservado, porque está cercado pelo contorno escuro e o flood não passa.
 *
 * Uso:  node scripts/remove-hero-bg.mjs [pasta]   (default: public/heroes)
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PNG } from 'pngjs';

const DIR = process.argv[2] || join('public', 'heroes');

// Um pixel é "esbranquiçado" (candidato a fundo) se é claro e pouco colorido.
const WHITE_MIN = 200;   // canais >= isto
const CHROMA_MAX = 32;   // (max - min) <= isto  → cinza/branco, não cor viva

function isWhitish(r, g, b) {
    const min = Math.min(r, g, b);
    const max = Math.max(r, g, b);
    return min >= WHITE_MIN && (max - min) <= CHROMA_MAX;
}

function processFile(path) {
    const png = PNG.sync.read(readFileSync(path));
    const { width: w, height: h, data } = png;
    const idx = (x, y) => (y * w + x) * 4;
    const bg = new Uint8Array(w * h); // 1 = fundo (flood alcançou)

    // BFS a partir de todos os pixels da borda que são esbranquiçados.
    const stack = [];
    const pushIf = (x, y) => {
        if (x < 0 || y < 0 || x >= w || y >= h) return;
        const p = y * w + x;
        if (bg[p]) return;
        const i = idx(x, y);
        if (isWhitish(data[i], data[i + 1], data[i + 2])) {
            bg[p] = 1;
            stack.push(x, y);
        }
    };
    for (let x = 0; x < w; x++) { pushIf(x, 0); pushIf(x, h - 1); }
    for (let y = 0; y < h; y++) { pushIf(0, y); pushIf(w - 1, y); }

    while (stack.length) {
        const y = stack.pop();
        const x = stack.pop();
        pushIf(x + 1, y); pushIf(x - 1, y);
        pushIf(x, y + 1); pushIf(x, y - 1);
    }

    // Aplica transparência no fundo; feather nas bordas do personagem.
    let cleared = 0;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const p = y * w + x;
            const i = idx(x, y);
            if (bg[p]) {
                data[i + 3] = 0; // fundo → transparente
                cleared++;
                continue;
            }
            // Pixel do personagem encostando no fundo → suaviza franja branca:
            // quanto mais claro, mais transparente (só na fronteira).
            const touchesBg =
                (x > 0 && bg[p - 1]) || (x < w - 1 && bg[p + 1]) ||
                (y > 0 && bg[p - w]) || (y < h - 1 && bg[p + w]);
            if (touchesBg) {
                const min = Math.min(data[i], data[i + 1], data[i + 2]);
                if (min > 200) {
                    // branco puro (min~245) → ~30 de alpha; cinza médio mantém.
                    data[i + 3] = Math.max(0, Math.min(255, (255 - min) * 4));
                }
            }
        }
    }

    // Recorta na figura: acha a caixa dos pixels visíveis e apara a margem
    // transparente, com uma folga. Assim todo herói fica enquadrado igual.
    const PAD = 12;
    let minX = w, minY = h, maxX = -1, maxY = -1;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            if (data[idx(x, y) + 3] > 16) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }

    let out = png;
    if (maxX >= minX && maxY >= minY) {
        minX = Math.max(0, minX - PAD); minY = Math.max(0, minY - PAD);
        maxX = Math.min(w - 1, maxX + PAD); maxY = Math.min(h - 1, maxY + PAD);
        const cw = maxX - minX + 1, ch = maxY - minY + 1;
        const cropped = new PNG({ width: cw, height: ch });
        for (let y = 0; y < ch; y++) {
            for (let x = 0; x < cw; x++) {
                const s = idx(minX + x, minY + y);
                const d = (y * cw + x) * 4;
                cropped.data[d] = data[s];
                cropped.data[d + 1] = data[s + 1];
                cropped.data[d + 2] = data[s + 2];
                cropped.data[d + 3] = data[s + 3];
            }
        }
        out = cropped;
    }

    writeFileSync(path, PNG.sync.write(out));
    const pct = ((cleared / (w * h)) * 100).toFixed(1);
    console.log(`  ✓ ${path.split(/[\\/]/).pop()}  (${w}x${h} → ${out.width}x${out.height}, ${pct}% de fundo)`);
}

const files = readdirSync(DIR).filter(f => /\.png$/i.test(f));
if (files.length === 0) {
    console.log(`Nenhum PNG em ${DIR}`);
} else {
    console.log(`Removendo fundo branco de ${files.length} imagem(ns) em ${DIR}:`);
    for (const f of files) processFile(join(DIR, f));
    console.log('Pronto. Dê refresh forte (Ctrl+Shift+R) no navegador.');
}
