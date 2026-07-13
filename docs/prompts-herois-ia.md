# Prompts de IA — Heróis da Bíblia (Trilha dos Campeões)

Guia para gerar os personagens (ex.: no Gemini) e entregá-los ao jogo.
Cada herói tem **5 estágios de evolução** (1 = iniciante → 5 = maestria).

---

## Regras técnicas (valem para TODAS as imagens)

- **Formato:** PNG com **fundo transparente**.
- **Tamanho:** 1024×1024 (quadrado).
- **Enquadramento:** corpo inteiro (cabeça aos pés), **de frente**, personagem **centralizado** com margem, em pé numa pose neutra e amigável.
- **Arquivo:** `public/heroes/<id>-<estágio>.png` → ex.: `ester-1.png`, `ester-5.png`.
- Um único personagem por imagem. Sem texto, sem moldura.

## Tempero de estilo (COLE no final de todo prompt)

> flat vector cartoon illustration, bold thick uniform black outlines, bright
> saturated colors, soft cel shading, big expressive friendly eyes, rounded
> chunky shapes, mobile game mascot style, wholesome and kid-friendly, full
> body from head to feet, front view, standing in a neutral friendly pose,
> character centered with margin, plain transparent background, no text, no
> words, no logo, no border

## Como manter o MESMO personagem nos 5 estágios (importante!)

1. Gere primeiro o **estágio 5** (o mais completo). Ele "trava" rosto, pele, cabelo e cores.
2. Para os estágios 1–4, **envie a imagem do estágio 5 como referência** e peça:
   *"same character, same face, skin and hair, same colors — only change the clothes to: [roupa do estágio]"*.
3. Mantenha pose, enquadramento e luz idênticos nos cinco.

---

## ⭐ ESTER (flagship — totalmente detalhada)

**Identidade fixa (repita idêntica nos 5 prompts):**
> Ester, a brave and kind biblical heroine, a girl about 10 years old, warm
> light-brown skin, long dark-brown wavy hair, gentle confident smile, big warm eyes

**Estágios (troque só a roupa):**

| # | Título | Roupa a acrescentar no prompt |
|---|--------|-------------------------------|
| 1 | Órfã | wearing a very simple plain beige linen dress, humble look, no jewelry |
| 2 | Escolhida | wearing a soft embroidered veil and a modest dress with her first small golden earrings |
| 3 | Dama do Palácio | wearing a colorful royal mantle over an elegant dress, a small delicate tiara |
| 4 | Conselheira | holding a small royal scepter, wearing a golden ring and richer layered robes with jewel accents |
| 5 | Rainha | wearing a full jeweled golden crown, a flowing purple-and-gold royal mantle, holding an ornate golden scepter, radiant and regal |

**Exemplo pronto (estágio 5, é só colar):**
> Ester, a brave and kind biblical heroine, a girl about 10 years old, warm
> light-brown skin, long dark-brown wavy hair, gentle confident smile, big warm
> eyes, wearing a full jeweled golden crown, a flowing purple-and-gold royal
> mantle, holding an ornate golden scepter, radiant and regal — flat vector
> cartoon illustration, bold thick uniform black outlines, bright saturated
> colors, soft cel shading, big expressive friendly eyes, rounded chunky shapes,
> mobile game mascot style, wholesome and kid-friendly, full body from head to
> feet, front view, standing in a neutral friendly pose, character centered with
> margin, plain transparent background, no text, no words, no logo, no border

---

## ⭐ ESTER — 5 estágios de evolução (formato testado, pronto pra colar)

Regras deste eixo: **mesma pose** nos 5 (só a roupa muda) e linha de
consistência *"Same character — same face, skin, hair and body — only the
clothing changes"*. Gere a partir da estágio 3 (já existente) como referência.

**Bloco fixo (repita idêntico nos 5):**
> A full-body flat vector cartoon illustration of Ester, a friendly 10-year-old
> educational game guide. She has warm light-brown skin, big expressive kind
> dark-brown eyes, long wavy dark-brown hair, and a warm encouraging smile. She
> is standing in a neutral friendly front pose, smiling warmly and pointing with
> one open hand to the side, centered with a safety margin. Pure plain white
> background, thick uniform dark outlines, bright saturated pastel colors, soft
> cel shading, mobile game mascot style, wholesome, educational, 2d game asset.

**Roupa por estágio (encaixe antes de "She is standing…"):**

| Arquivo | Título | Roupa |
|---------|--------|-------|
| `ester-1` | Órfã | a very simple, humble, plain beige linen tunic with no decorations, no jewelry and no tiara, and worn leather sandals; she looks modest and hopeful |
| `ester-2` | Escolhida | a modest soft lavender tunic with a light embroidered veil over her hair and small delicate golden earrings — her first touch of elegance, still no tiara — and simple leather sandals |
| `ester-3` | Dama do Palácio | a kid-friendly ancient Persian-style pastel purple and white tunic with gold trim, a small delicate golden tiara, and simple leather sandals *(já gerada ✅)* |
| `ester-4` | Conselheira | richer layered royal robes in purple and gold with jewel accents, a golden ring, a slightly larger tiara, and leather sandals |
| `ester-5` | Rainha | a full radiant royal outfit: a jeweled golden crown, a flowing purple-and-gold royal mantle over an elegant gown, and golden sandals; she looks regal, confident and kind |

### Bônus — poses de REAÇÃO (opcional, deixam o jogo vivo)
Mesma roupa (do estágio atual), só muda a pose. Úteis no gameplay:
- **Ídle/guia:** apontando pra tela (a imagem 4 original).
- **Acertou:** jumping joyfully, both arms raised, wide smile *(sem números embutidos — o jogo põe o confete por cima)*.
- **Pensando:** curious thoughtful expression, one finger tapping her chin.

---

## Os outros 5 heróis (identidade + arco de evolução)

Use a mesma lógica: identidade fixa + roupa que evolui do estágio 1 (humilde) ao 5 (herói pleno).
Tom SEMPRE gentil — coragem e sabedoria, **nunca** violência/sangue.

### DAVI — coragem (o pequeno que vence o gigante)
Identidade: *David, a courageous young shepherd boy, olive skin, curly reddish-brown hair, bright determined eyes, warm smile.*
Arco: 1 Pastor (simple shepherd tunic, holding a sling) → 2 (leather belt and pouch of stones) → 3 (a small round shield, sturdy sandals) → 4 (a light bronze chest armor and a sword at his side, brave stance) → 5 Rei (golden crown, royal cape, full shining armor, noble and kind).

### GIDEÃO — superação (de medroso a herói)
Identidade: *Gideon, a young man, tan skin, short dark hair, shy-turning-brave expression.*
Arco: 1 Escondido (worn plain clothes, timid, empty hands) → 2 (holding a lit torch, first spark of courage) → 3 (a helmet and a trumpet) → 4 (partial armor and a banner) → 5 Juiz (full armor, torch and trumpet raised high, confident hero).

### DÉBORA — sabedoria e liderança
Identidade: *Deborah, a wise biblical woman, brown skin, dark hair, calm intelligent kind face.*
Arco: 1 Ouvinte (simple mantle, sitting under a palm tree) → 2 (a short staff and embroidered shawl) → 3 (a longer staff and a leadership sash) → 4 (prophetess robe and a diadem of leaves) → 5 Juíza (full staff, regal and wise, palm tree behind her).

### JOSUÉ — conquista (território por território)
Identidade: *Joshua, a brave young leader, tan skin, short dark hair, strong friendly determined face.*
Arco: 1 Ajudante (plain servant tunic) → 2 (a travel cloak, holding a map) → 3 (a trumpet and marching sandals) → 4 (campaign armor and a banner) → 5 Conquistador (full armor, trumpet and the banner of the land, triumphant and kind).

### RUTE — persistência (colher todo dia)
Identidade: *Ruth, a gentle hardworking biblical young woman, warm skin, dark hair in a headscarf, kind humble smile.*
Arco: 1 Respigadeira (simple work dress, empty basket) → 2 (basket with first wheat ears) → 3 (a bundle of wheat in her hands, a harvest scarf) → 4 (a new mantle, a barn filling up behind her) → 5 Matriarca (robes of honor, a full barn, a golden sheaf of wheat).

---

## Checklist antes de me enviar

- [ ] Fundo transparente (PNG)?
- [ ] Corpo inteiro, de frente, centralizado?
- [ ] Mesmo rosto/cores entre os 5 estágios do herói?
- [ ] Nome do arquivo no padrão `id-estágio.png` (ex.: `ester-3.png`)?
