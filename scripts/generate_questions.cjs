const fs = require('fs');
const path = require('path');

const data = {
    grades: {
        "1-2": { Green: [], Red: [], Yellow: [] },
        "3-4": { Green: [], Red: [], Yellow: [] },
        "5": { Green: [], Red: [], Yellow: [] }
    }
};

const shuffle = (array) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex > 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

const generateOptions = (correctStr, numType) => {
    const correct = parseInt(correctStr);
    if (isNaN(correct)) return shuffle([correctStr, "Nenhuma", "Todas", "Errado"]); // fallback for text

    const options = new Set([correct]);
    while (options.size < 4) {
        const variance = Math.floor(Math.random() * 5) + 1;
        const sign = Math.random() > 0.5 ? 1 : -1;
        let wrong = correct + (variance * sign);
        if (wrong < 0 && numType === 'positive') wrong = Math.abs(wrong) + 1;
        options.add(wrong);
    }
    return shuffle(Array.from(options).map(String));
}

// ============== GRADE 1-2 ==============
// Green: Simple addition/subtraction (0-20)
for (let i = 0; i < 30; i++) {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    data.grades["1-2"].Green.push({
        question: `Quanto é ${a} + ${b}?`,
        answer: String(a + b),
        options: generateOptions(String(a + b), 'positive')
    });
}
// Red: Subtraction, simple word problems (0-20)
for (let i = 0; i < 25; i++) {
    const a = Math.floor(Math.random() * 15) + 5;
    const b = Math.floor(Math.random() * a);
    const isWord = Math.random() > 0.5;
    if (isWord) {
        data.grades["1-2"].Red.push({
            question: `João tinha ${a} balas e comeu ${b}. Quantas sobraram?`,
            answer: String(a - b),
            options: generateOptions(String(a - b), 'positive')
        });
    } else {
        data.grades["1-2"].Red.push({
            question: `Quanto é ${a} - ${b}?`,
            answer: String(a - b),
            options: generateOptions(String(a - b), 'positive')
        });
    }
}
// Yellow: Basic Logic/Patterns
const seqBase = [2, 10, 5, 1];
for (let i = 0; i < 15; i++) {
    const step = seqBase[Math.floor(Math.random() * seqBase.length)];
    const start = Math.floor(Math.random() * 5) * step;
    data.grades["1-2"].Yellow.push({
        question: `Qual o próximo número: ${start}, ${start + step}, ${start + step * 2}, ?`,
        answer: String(start + step * 3),
        options: generateOptions(String(start + step * 3), 'positive')
    });
}

// ============== GRADE 3-4 ==============
// Green: Multiplication / Larger Addition
for (let i = 0; i < 30; i++) {
    const isMult = Math.random() > 0.3;
    if (isMult) {
        const a = Math.floor(Math.random() * 9) + 2;
        const b = Math.floor(Math.random() * 9) + 2;
        data.grades["3-4"].Green.push({
            question: `Quanto é ${a} x ${b}?`,
            answer: String(a * b),
            options: generateOptions(String(a * b), 'positive')
        });
    } else {
        const a = Math.floor(Math.random() * 50) + 20;
        const b = Math.floor(Math.random() * 50) + 20;
        data.grades["3-4"].Green.push({
            question: `Some: ${a} + ${b} = ?`,
            answer: String(a + b),
            options: generateOptions(String(a + b), 'positive')
        });
    }
}
// Red: Division / Multi-step Word Problems
for (let i = 0; i < 25; i++) {
    const b = Math.floor(Math.random() * 8) + 2;
    const ans = Math.floor(Math.random() * 9) + 2;
    const a = b * ans;
    const isWord = Math.random() > 0.5;
    if (isWord) {
        data.grades["3-4"].Red.push({
            question: `Tenho ${a} figurinhas para dividir entre ${b} amigos. Quantas cada um recebe?`,
            answer: String(ans),
            options: generateOptions(String(ans), 'positive')
        });
    } else {
        data.grades["3-4"].Red.push({
            question: `Qual é o resultado de ${a} ÷ ${b}?`,
            answer: String(ans),
            options: generateOptions(String(ans), 'positive')
        });
    }
}
// Yellow: Word Logic
const wordPuzzles = [
    { q: "Um pato tem 2 pés. Quantos pés têm 5 patos?", a: "10" },
    { q: "O dobro do dobro de 3 é?", a: "12" },
    { q: "Se eu leio 5 páginas por dia, em quantos dias leio 30 páginas?", a: "6" },
    { q: "Uma dúzia e meia de ovos são quantos ovos?", a: "18" }
];
wordPuzzles.forEach(p => {
    data.grades["3-4"].Yellow.push({ question: p.q, answer: p.a, options: generateOptions(p.a, 'positive') });
});
for (let i = 0; i < 15; i++) {
    const w = 4 * (Math.floor(Math.random() * 4) + 1);
    data.grades["3-4"].Yellow.push({
        question: `Um carro tem 4 rodas. Quantas rodas têm ${w / 4} carros iguais?`,
        answer: String(w),
        options: generateOptions(String(w), 'positive')
    });
}

// ============== GRADE 5 ==============
// Green: Fractions, Expressions, Multi-digit
for (let i = 0; i < 25; i++) {
    const a = Math.floor(Math.random() * 50) + 10;
    const b = Math.floor(Math.random() * 20) + 5;
    const c = Math.floor(Math.random() * 10) + 1;
    data.grades["5"].Green.push({
        question: `Resolva a expressão: ${a} + (${b} x ${c})`,
        answer: String(a + (b * c)),
        options: generateOptions(String(a + (b * c)), 'positive')
    });
}
// Red: Percentages, Decimals, Hard word problems
for (let i = 0; i < 25; i++) {
    const val = (Math.floor(Math.random() * 10) + 1) * 100;
    const pct = (Math.floor(Math.random() * 4) + 1) * 10; // 10, 20, 30, 40, 50
    data.grades["5"].Red.push({
        question: `Qual é ${pct}% de R$ ${val}?`,
        answer: String((pct / 100) * val),
        options: generateOptions(String((pct / 100) * val), 'positive')
    });
}
// Yellow: Hard Logic
for (let i = 0; i < 15; i++) {
    const ans = Math.floor(Math.random() * 20) + 10;
    data.grades["5"].Yellow.push({
        question: `Pensei em um número. Dobrei seu valor e subtraí 4, resultando em ${ans * 2 - 4}. Que número é esse?`,
        answer: String(ans),
        options: generateOptions(String(ans), 'positive')
    });
}

// Add some riddles manually
data.grades["5"].Yellow.push({ question: "O que é que tem raiz, mas não é planta, tem volume, mas não é líquido?", answer: "Cabelo", options: ["Cabelo", "Cubo", "Dado", "Terra"] });
data.grades["5"].Yellow.push({ question: "Continue: 1, 1, 2, 3, 5, 8, ...", answer: "13", options: ["10", "11", "12", "13"] });

// Write Output
const outPath = path.join(__dirname, '../src/data/questions.json');
fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf-8');
console.log(`Generated ${Object.keys(data.grades).reduce((acc, g) => acc + data.grades[g].Green.length + data.grades[g].Red.length + data.grades[g].Yellow.length, 0)} questions!`);
