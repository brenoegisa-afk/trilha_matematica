# 🏆 Trilha dos Campeões — Roadmap de Produto

> **Missão:** ser um *jogo* que ensina matemática para crianças do 1º ao 5º ano de
> forma **didática** (a mecânica ensina, não só testa) e **evolutiva** (a criança
> sobe de conteúdo de verdade, guiada por um grafo de pré-requisitos alinhado à BNCC).

Documento vivo. Fonte única do "para onde vamos e por quê". Atualize a cada fase concluída.

---

## 1. Princípios de design (as regras que não abrimos mão)

1. **Domínio, não sorte, move o aluno.** Avançar na trilha reflete o que a criança
   aprendeu — não o resultado de um dado.
2. **O currículo é um grafo, não uma lista.** Cada habilidade tem pré-requisitos.
   Ninguém chega em "multiplicação por 2 dígitos" sem dominar a tabuada.
3. **O erro é informação, não punição.** Cada alternativa errada mapeia um equívoco
   real (distrator diagnóstico). Registramos *qual* erro a criança cometeu.
4. **Ensinar acontece no momento do erro.** Explicação passo-a-passo + questão de
   reforço, sempre que houver falha.
5. **Retenção por repetição espaçada.** O que foi aprendido volta no tempo certo (SRS).
6. **O professor enxerga o aluno pelo grafo.** O relatório mostra: dominado /
   fronteira / travado + qual pré-requisito reforçar.

---

## 2. Diagnóstico do estado atual (jul/2026)

### O que já é forte
- **Grafo curricular real** com pré-requisitos, profundidade 1→5 e código BNCC por nó
  (`src/core/learning/CurriculumGraph.ts`).
- **Geração procedural com distratores diagnósticos** (`src/core/learning/MathEngine.ts`).
- **Seleção adaptativa por fronteira** + queda ao pré-requisito quando o aluno trava
  (`CurriculumEngine.pickNode`).
- **SRS**, **reforço pós-erro** e **explicações estruturadas**.
- Camada de jogo completa (tabuleiro, batalha, XP, streak, mascotes, conquistas, loja, ranking).
- SaaS multi-tenant (escolas, turmas, papéis, RLS, dashboards, questões do professor).

### 🔴 O gargalo central — a progressão evolutiva está desconectada
Rastreamento do fluxo pergunta → resposta → progressão:

- A questão é **selecionada** pelo grafo (`pickNode` → `generateFromNode`). ✅
- Mas `CurriculumEngine.updateNodeMastery()` **nunca é chamado**. `nodeMastery` é
  *lido* em vários lugares e **nunca escrito** no loop de jogo (`advanceTurn` só
  atualiza a maestria legada de `skillEngine`).
- **Efeito:** `getMasteredNodes()` retorna sempre vazio → `pickNode` devolve sempre a
  fronteira raiz (soma/subtração até 10) → **o aluno nunca sobe no grafo.**
- Agravante: `nodeMastery` **não é persistido** (não existe no `SaveProfile` nem no
  `refreshPlayers`). Mesmo se fosse escrito, não sobreviveria à sessão.

> **Conclusão:** o jogo *ensina* (as questões são boas), mas *não evolui*. Religar essa
> espinha é o pré-requisito de tudo mais.

### Outros gaps
- Só **matemática** tem geração viva por nó; Português/Ciências usam pool estático.
- Cobertura de matemática rasa (~15 nós, quase só operações). Faltam eixos inteiros da BNCC.
- ~~Frações/decimais **hardcoded**~~ → **frações agora procedurais** (`frac_intro`/`frac_equiv`/
  `frac_operations` variam a cada questão; jul/2026). Decimais já eram procedurais.
- ~~`pickNode` ignora a série~~ → **corrigido (jul/2026):** `pickNode` recebe `grade` e restringe
  a fronteira à série escolhida (um 5º ano entra em conteúdo de 5º, não em "Soma até 10").
- O **distrator escolhido** pelo aluno não é registrado (sinal diagnóstico desperdiçado).
- ~~Perguntas podem repetir seguidas pro mesmo jogador~~ → **corrigido (jul/2026):**
  nós com poucos números possíveis (ex.: soma até 10 no 1º ano) podiam sortear a
  mesma pergunta de novo rapidinho. `MathEngine.generateFromNode` agora recebe as
  últimas perguntas que aquele jogador viu (`SubjectService.getQuestion` rastreia
  por `player.recentQuestions`, janela de 6) e tenta sortear de novo até sair algo
  diferente (até 6 tentativas, pra não girar pra sempre em nós com range pequeno).
- Persistência fragmentada (localStorage + Supabase, `(player as any).nodeMastery`).
- Sem testes no núcleo de progressão.
- 🆕 **`pickNode` ignora pré-requisitos quando a série escolhida não bate com a fronteira
  natural do grafo** (`CurriculumEngine.ts:56-70`) — afeta principalmente séries "3-4" e "5",
  que hoje têm poucos nós e concentrados numa única profundidade (ex.: série "5" só tem nós de
  `depth: 5`). Efeito colateral encontrado (jul/2026): permitia a um aluno "dominar" um nó de
  profundidade 5 como a primeira coisa que faz no jogo, sem nunca ter passado pelos fundamentos
  — o que fazia o **estágio visual do herói pular direto de Pastor para Rei numa única partida**.
  ✅ *Mitigado* mudando `getPlayerHeroStage` para refletir o **volume** de nós de matemática
  dominados (não a maior profundidade de um único nó — `src/core/theme/heroProgress.ts`, jul/2026).
  A causa raiz (grafo raso por série) continua e só se resolve de fato com a expansão do
  grafo (P2, §5).

---

## 3. Decisões da squad (baseline deste roadmap)

| Decisão | Escolha | Impacto |
|---|---|---|
| **Foco de conteúdo** | **Matemática a fundo (1º–5º)** | Português/Ciências viram "extras"; todo o investimento pedagógico vai para o grafo de matemática. |
| **Modelo da trilha** | **Trilha = mapa do grafo** | O tabuleiro deixa de ser sorte; cada casa vira um nó/habilidade. Reformulação de UX. |
| **Ordem de trabalho** | **Plano escrito primeiro** | Este documento. Código começa após alinhamento. |

---

## 4. Arquitetura-alvo: "Trilha = Grafo"

A grande virada. Hoje há **duas coisas paralelas**: um tabuleiro linear de sorte e um
grafo curricular invisível. Vamos **fundir** os dois.

### Dois níveis de navegação
- **MACRO — Mapa de Ilhas (o mundo):** o grafo curricular renderizado como um mapa.
  Cada **nó = uma "estação"** com ícone e nome ("Soma até 10", "Tabuada do 2 a 5").
  Estações aparecem em três estados: **dominada** (✅ colorida), **fronteira**
  (✨ pulsando, jogável agora) e **bloqueada** (🔒 pré-requisito faltando). O peão do
  aluno fica na fronteira. Dominar um nó **acende o caminho** para os próximos.
- **MICRO — A partida (o que já existe):** ao entrar numa estação, roda uma partida
  temática naquele nó (com dado, casas, batalha, XP — todo o engajamento atual
  preservado). A diferença: **a partida é uma rodada de questões daquele nó**, e o
  **domínio** conquistado na partida é o que **desbloqueia** a estação seguinte no mapa.

> O dado e a batalha continuam — mas agora servem à *variação e diversão dentro* de um
> nó, enquanto a *evolução entre nós* é governada pelo domínio (grafo). Sorte diverte;
> domínio evolui.

### Fluxo de dados alvo
```
Mapa (grafo) → aluno escolhe/continua nó da fronteira
   → Partida gera N questões via generateFromNode(nó)
      → cada resposta chama updateNodeMastery(nó, acertou, distratorEscolhido)
         → pontos ≥ threshold ⇒ nó "dominado" ⇒ desbloqueia vizinhos
            → celebração (VictoryModal) + peão avança no mapa
   → nodeMastery persistido em profiles.node_mastery (jsonb)
```

---

## 5. Plano de conteúdo — Matemática 1º ao 5º (grafo BNCC)

Meta: sair de ~15 nós para **~55–65 nós**, cobrindo os 5 eixos da BNCC em cada ano.
Abaixo o **mapa-mestre** por eixo × ano (cada célula vira 1–3 nós no grafo).

| Eixo BNCC | 1º ano | 2º ano | 3º ano | 4º ano | 5º ano |
|---|---|---|---|---|---|
| **Números** | Contagem até 20; soma/sub até 10 | Valor posicional (dezenas); soma/sub até 100 | Reagrupamento; ideia de ×; centenas | Tabuada completa; divisão exata/ com resto; frações visuais | Decimais; frações equivalentes e operações; × e ÷ 2 dígitos |
| **Álgebra** | Sequências +1/+2 | Padrões (+n) | Múltiplos; regularidades | Relação de igualdade; propriedades | Expressões com > de uma operação |
| **Geometria** | Formas planas; posição/direção | Sólidos geométricos | Figuras e lados; simetria | Ângulos; ampliação/redução | Plano cartesiano (1º quadrante); polígonos |
| **Grandezas e Medidas** | Comparar tamanhos; noção de tempo | Dinheiro (moedas); calendário | Comprimento; horas | Massa/capacidade; perímetro | Área; volume; conversões |
| **Probabilidade e Estatística** | Mais/menos provável | Tabela simples | Gráfico de barras | Ler/interpretar gráficos | Média simples; chance |

**Regras do grafo ao expandir:**
- Todo nó declara `prerequisites` reais (ex.: `div_intro` depende de `mult_tables`).
- `depth` = âncora de ano (1≈1º … 5≈5º), mas o **desbloqueio é por pré-requisito**, não por idade.
- Cada nó **precisa de um gerador procedural** em `MathEngine` (sem questões fixas).
- Cada nó mapeia um **código BNCC** em `BnccMap`.

> Entregar por **eixo × ano em fatias verticais**: fechar "Números 1º–5º" primeiro
> (linha completa e jogável), depois "Geometria 1º–5º", e assim por diante. Cada fatia
> é lançável.

---

## 6. Roadmap por fases

### 🟥 P0 — Religar a espinha evolutiva *(fundação — bloqueia tudo)* — ✅ FEITO jul/2026
Sem isto, nada "evolui". É a maior alavanca de valor.

- [x] Adicionar `nodeId` ao tipo `Question` e propagá-lo em `MathEngine.generateFromNode`.
- [x] Chamar `CurriculumEngine.updateNodeMastery(player, nodeId, isCorrect)` dentro de
      `advanceTurn` (`useGameStore`).
- [x] Registrar o **distrator escolhido** (`selectedOption`) junto da resposta
      (`NodeMastery.misconceptions`, capturado via `submitAnswer`).
- [x] Persistir `nodeMastery`: coluna `node_mastery jsonb` em `profiles`
      (`phase7_curriculum_graph.sql`); salvar no `SessionService.saveSession` + `updateProfile`
      (localStorage); carregar no `refreshPlayers`/`getOrCreateProfile`/`Setup`/`ParentService`.
- [x] Tipar `nodeMastery` no `Player` (campo já tipado; leituras via `CurriculumEngine`).
- [x] Celebrar desbloqueio de nó com modal dedicado (`NodeUnlockModal`) + som de level-up.
- [x] Testes: promoção de nó, desbloqueio de vizinhos, `findWeakPrerequisite`, regressão
      de pontos ao errar. ✅ `src/core/learning/CurriculumEngine.test.ts` (9 casos) +
      `src/core/theme/heroProgress.test.ts` (5 casos, trava a regressão do bug do herói
      Pastor→Rei). Inclui um teste que **documenta o bug conhecido** do fallback de série
      (§2 "Outros gaps") em vez de escondê-lo. jul/2026.

> ⚙️ **Ação de deploy:** rodar `supabase/phase7_curriculum_graph.sql` no banco (coluna
> `node_mastery`). Sem ela, a progressão persiste em localStorage (mesmo aparelho), mas
> não sincroniza entre dispositivos.

**Critério de aceite:** uma criança que acerta consistentemente soma até 10 vê o nó
ficar "dominado", recebe uma celebração, e a próxima questão passa a ser de um nó mais
avançado — e isso **persiste** ao fechar e reabrir o app. ✅

---

### 🟧 P1 — Trilha = Mapa do Grafo *(a virada de produto)*
- [ ] Tela **Mapa de Ilhas**: renderizar o grafo de matemática com estados
      dominado / fronteira / bloqueado (evoluir a `SkillTree` atual).
- [ ] Peão do aluno na fronteira; animar avanço ao desbloquear.
- [ ] Entrar numa estação inicia uma **partida focada naquele nó** (reusa o tabuleiro).
- [ ] A partida encerra reportando domínio ao mapa (loop macro↔micro fechado).
- [ ] Definir o papel do dado/batalha **dentro** do nó (variação, não progressão de conteúdo).

**Critério de aceite:** o aluno abre o mapa, vê onde está, joga uma estação, e ao dominá-la
vê o caminho acender até a próxima — a "trilha" agora *é* a jornada de aprendizado.

---

### 🟨 P2 — Matemática 1º–5º completa
- [ ] Expandir `CurriculumGraph` para ~55–65 nós conforme o mapa-mestre (§5),
      por fatias verticais (Números → Geometria → Medidas → …).
- [ ] Gerador procedural para **cada** novo nó (fim do hardcode de frações/decimais/geometria).
- [ ] Ampliar `BnccMap` com todos os códigos novos.
- [ ] Revisar `makeNumericOptions` (garantir 4 opções únicas; variar posição da correta;
      evitar distratores negativos/repetidos).

**Critério de aceite:** um aluno de 5º ano tem uma trilha contínua e jogável do 1º ao 5º,
cobrindo os 5 eixos, sem questão repetida "de cor".

---

### 🟩 P3 — Diagnóstico do professor pelo grafo — 🟡 PARCIAL jul/2026
- [x] Relatório por aluno: dominado / praticando / travado (`StudentGraphModal`, aberto ao
      clicar num aluno no `StudentManager`; `DiagnosticService.generateGraphProgress`).
      *(lista estruturada; o mapa visual do grafo fica para o P1.)*
- [x] Usar o **distrator registrado** (P0) para nomear o equívoco (seção "Equívocos mais
      comuns": "Em Soma até 10, escolheu 12" com contagem).
- [x] Recomendação automática de pré-requisito a reforçar (`weakPrereqName` via
      `findWeakPrerequisite`, exibido nos nós travados).
- [x] Coluna "Trilha" (nós dominados) no ranking da turma.
- [ ] Visão de turma: heatmap de nós dominados por aluno (só o total por aluno hoje).

**Critério de aceite:** o professor abre um aluno e entende, em 10 segundos, *onde* ele
travou e *o que* revisar — sem interpretar números soltos. ✅ (via `StudentGraphModal`)

---

### 🟦 P4 — Qualidade, escala e extras
- [ ] Consolidar persistência numa fonte única (reduzir localStorage↔Supabase manual).
- [ ] Cobertura de testes do núcleo de progressão > 80%.
- [ ] `ROADMAP.md` (este) + doc de arquitetura no README.
- [ ] Decidir destino de Português/Ciências (extras isolados vs. grafo próprio depois).
- [x] Anti-chute (parcial, jul/2026): acerto rápido demais (< 800ms, "tap na sorte") vale
      menos pontos de maestria (baixa confiança); trava de mínimo de tentativas para dominar
      um nó; o sistema de pontos já torna o chute aleatório de saldo negativo.
- [ ] Anti-chute (resta): itens de **resposta construída** (digitar o número) além de múltipla
      escolha, ao menos nos nós-chave (reduz o chute de 25% na raiz).

---

### 🎨 Identidade visual — fusão avatar↔herói (jul/2026)

Achado da squad: existiam **dois sistemas de "personagem" desencontrados** — o avatar
genérico antigo (🚀🤖👑👽, `Shop.tsx`) e o herói bíblico novo (`HeroesMap`/`CustomizableHero`).
Isso causava uma inconsistência visual real (fila do Setup mostrava avatar antigo, tabuleiro/
batalha mostrava o herói) e vilões de batalha 100% genéricos (goblin, dragão, **alienígena**)
sem nenhuma relação com o tema.

**Feito:**
- [x] Todos os componentes que exibiam `player.avatar` sem checar `player.hero` agora seguem
      o padrão `hero ?? avatar` (já usado em `Board.tsx`/`BattleArena.tsx`): `Setup.tsx` (fila),
      `HUD.tsx`, `Dice.tsx`, `GameSummary.tsx`, `Inventory.tsx`, `ParentDashboard.tsx`.
- [x] Corrigido de passagem: `ParentService.mapProfileToPlayer` lia a coluna errada
      (`dbProfile.avatar`, inexistente) em vez de `equipped_avatar` — o avatar do painel dos
      pais sempre caía no fallback fixo `'👦'`. Agora também propaga `hero`/`heroConfig`.
- [x] **Vilões da Batalha retemados**: `src/core/theme/VillainsMap.ts` (novo, mesmo padrão do
      `HeroesMap`) substitui o pool de matemática do `BattleEngine.generateEnemy` — Muralhas de
      Jericó, Exército do Faraó, Tempestade no Mar, Golias — mesmo HP/balanceamento de antes,
      só a pele muda. Vencer continua sendo **responder certo**, não violência.

**Decisões maiores ainda pendentes (não tocadas — precisam de confirmação, afetam o piloto ao vivo):**
- [ ] **Aposentar de vez a `Shop.tsx` ("Lojinha")** — hoje ainda é o único lugar onde a
      criança gasta as estrelas que ganha jogando. Antes de tirar do menu (`SideNavigation.tsx`),
      precisa de um substituto (ex.: os slots de customização do herói — capa, escudo, cor —
      já cogitados numa conversa anterior) comprável com as mesmas estrelas, senão a criança
      perde uma recompensa que já usa, no meio do piloto.
- [ ] **`src/pages/Battle.tsx` (rota `/battle`) é um motor de batalha legado e duplicado**,
      paralelo ao `BattleEngine.ts`/`BattleArena.tsx` novo — ainda usa `player.avatar`/`mascot`
      diretamente e tem seu próprio gerador de monstros genérico (nunca retemado). Candidato a
      aposentar junto, mas primeiro confirmar se esse modo (`gameMode === 'battle'` no Setup)
      ainda está em uso.
- [ ] **Vilões de Português/Ciências não foram retemados** (só o pool de Matemática) — são
      menos urgentes por serem "extras" (§3), mas ficam com a mesma inconsistência de tema.
- [ ] **`MascotEngine`/`player.mascots`** (mochila/Inventory) é gameplay real (bônus de XP,
      dano, proteção na batalha — não só cosmético) com arquétipos genéricos (robô, coruja,
      átomo). Retematizar isso é maior: precisa de novos arquétipos bíblicos com os mesmos
      stats, não só trocar ícone. Fora de escopo por ora.
- [x] **Coluna `equipped_hero`/`hero_config` cross-device** — ✅ jul/2026,
      `supabase/phase11_hero_columns.sql` (rodada no Supabase: colunas adicionadas +
      `student_login` atualizado para devolver o herói no login). App atualizado para
      ler/escrever: `CloudSyncProvider.tsx` (upsert), `useGameStore.refreshPlayers`
      (hidrata do banco), `Setup.tsx` (login cross-device aplica o herói vindo da nuvem
      e recarrega a fila na hora). A escolha de herói agora sobrevive à troca de
      aparelho, igual ao avatar antigo já sobrevivia.

---

### 🟪 Futuro — Candidatos pós-piloto (backlog, não priorizado)

Itens avaliados pela squad mas propositalmente adiados até o piloto validar o núcleo
de matemática. Registrados aqui para não perder o contexto da decisão.

- **Educação financeira infantil.** Avaliação da squad (jul/2026):
  - *Produto:* tema altamente "gamificável" (moedas, loja, poupança/gasto) — encaixa
    direto na visão de "videogame que ensina" (§12).
  - *Pedagogia:* não precisa virar matéria nova — é matemática aplicada (contagem,
    troco/subtração, porcentagem no 5º, frações/divisão). Reaproveitar o
    `CurriculumEngine`/`MathEngine` existentes em vez de um domínio paralelo. O
    mapa-mestre (§5) já reserva um nó **"Dinheiro (moedas)"** em Grandezas e Medidas
    do 2º ano — ponto de partida natural.
  - *Tema (heróis bíblicos):* diferencial forte e sem concorrência direta — mordomia,
    generosidade, parábola dos talentos. Encaixaria no roster (`HeroesMap`) como um
    novo reino/herói, no mesmo padrão dos 4 reinos atuais.
  - *Risco:* dispersar foco do piloto em andamento (P0 concluído, testes de progressão
    ainda pendentes) e da decisão de escopo "matemática a fundo" (§3).
  - **Decisão:** não priorizar agora. Candidato forte para depois do piloto — desenhar
    como reino/skin sobre nós de matemática já existentes, não como sistema paralelo.

- **Acessibilidade e inclusão de crianças autistas.** Avaliação da squad (jul/2026),
  motivada pelo pedido do usuário de o jogo "realmente ensinar" para todas as crianças:
  - *Achado central:* boa parte do que ajudaria crianças autistas **também corrige os
    gaps pedagógicos já mapeados em §10.1** (falta momento instrucional, só múltipla
    escolha, feedback pouco previsível) — não são agendas concorrentes.
  - **Previsibilidade:** interface e regras estáveis entre sessões; evitar variações
    "surpresa" de feedback só pelo bem do "juice" (tensiona com o item 11.3 "feedback
    de acerto variado" — resolver com uma opção de modo previsível, não eliminando um
    ou outro).
  - **Controle sensorial:** modo "calmo" configurável por perfil — desliga confete/som/
    animações de tela cheia, mantém só o essencial (feedback textual + progresso).
  - **Tempo sem pressão punitiva:** o anti-chute (P4, feito) já penaliza acerto rápido
    demais — certo. Falta garantir que tempo de processamento **mais longo** (comum em
    crianças autistas) não seja penalizado; oferecer modo sem cronômetro visível.
  - **Linguagem literal:** revisar enunciados/narrativas dos heróis contra ambiguidade,
    sarcasmo ou expressão idiomática.
  - **Intensidade narrativa ajustável:** temas de "batalha"/"gigante" (Davi e Golias)
    podem ser muito estimulantes para algumas crianças — toggle de intensidade beneficia
    esse público sem tirar o tema de quem gosta da emoção.
  - **Menor carga social:** reforça o modo solo como cidadão de primeira classe (o
    hotseat multiplayer já tinha sido apontado fraco por outro motivo em §11.2/ociosidade).
  - **Decisão:** registrar como eixo transversal de acessibilidade, não como fase isolada.
    Ao implementar P1 (resposta construída, feedback variado) e o "momento instrucional"
    de §10.1, desenhar já com a opção de modo previsível/calmo — mais barato que adicionar
    depois. Priorização plena fica para pós-piloto, junto do item acima.

---

## 7. Mudanças de dados/técnicas previstas

- `Question`: novo campo `nodeId` (obrigatório para matemática).
- `Player.nodeMastery`: promover de `Record<string, NodeMastery>` opcional a campo tipado
  e persistido.
- Resposta do aluno: capturar `selectedOption` (não só correto/errado).
- Supabase `profiles`: coluna `node_mastery jsonb` (+ migração e RLS).
- Novo módulo de UI: **Mapa do Grafo** (a partir de `src/components/SkillTree.tsx`).

---

## 8. Métricas de sucesso

- **Evolução real:** % de alunos que dominam ≥1 nó novo por semana (hoje: ~0, o loop está quebrado).
- **Profundidade:** profundidade média de nó alcançada por aluno ao longo do tempo.
- **Retenção pedagógica:** taxa de acerto em revisões SRS (o que ficou aprendido).
- **Diagnóstico útil:** % de professores que abrem o relatório de grafo por semana.
- **Engajamento:** partidas por aluno/semana (não regredir com a virada da trilha).

---

## 9. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Virada da trilha reduz engajamento por "parecer escola" | Preservar dado/batalha/mascotes *dentro* do nó; mapa com estética de aventura. |
| Expansão do grafo gera questões de baixa qualidade | Gerador + revisão pedagógica por nó; nunca hardcode; testar distratores. |
| Migração de `node_mastery` quebra perfis existentes | Default seguro (`{}`), backfill idempotente, testes de carga/descarga. |
| Escopo do grafo completo é grande | Entregar por fatias verticais lançáveis (§5), não tudo de uma vez. |

---

## 10. Avaliação estratégica — como plano de ensino e como negócio

> Feita pela squad em jul/2026. As duas lentes convergem num ponto: **o mesmo ativo é
> o diferencial pedagógico e o fosso comercial — e hoje está desligado** (o gargalo do §2).

### 10.1 Como PLANO DE ENSINO
**Veredito: concepção de elite (7/10), execução incompleta (~4/10). Hoje é um ótimo
*tutor de prática*, ainda não um *professor completo*.**

O que está certo e é raro:
- **Progressão por domínio e pré-requisito (grafo)** — o modelo dos melhores sistemas
  adaptativos do mundo (Khan, ALEKS): só avança quem domina o que sustenta o próximo passo.
- **Distratores diagnósticos** — mapear o *erro* a um equívoco real é o que separa um
  app de exercícios de um tutor.
- **Ensino no erro + reforço + SRS** — base científica forte de retenção.

O que falta para ensinar de fato (não só avaliar):
1. **Falta o momento instrucional.** O ciclo é "gerar questão → errar → explicar".
   Falta *apresentar o conceito antes de cobrar* (no "eu faço, nós fazemos, você faz",
   só existe o "você faz"). É avaliação adaptativa mais que ensino.
2. **Só múltipla escolha (4 opções):** 25% de chute e mede reconhecimento, não produção.
   Matemática exige a criança **calcular e escrever** a resposta. (Já previsto no P4.)
3. **Falta o concreto → pictórico → abstrato.** Anos iniciais (1º–3º) aprendem com
   manipulativos e imagens antes do símbolo (método Singapura). Hoje é tudo simbólico.
4. **A evolução está quebrada** (§2) — promete trilha evolutiva, entrega prática infinita.
5. **Cobertura rasa e BNCC superficial** (já endereçado em P2/§5).

### 10.2 Como PLANO DE NEGÓCIOS
**Veredito: modelo e arquitetura corretos (~6/10). Faltam os 3 viabilizadores de venda:
prova de eficácia, cobertura mínima vendável e captura de dados.**

O que está estrategicamente certo:
- **Construído para vender a escolas, não a pais** (multi-tenant, turmas, papéis,
  dashboards, RLS). B2C de edtech infantil tem CAC alto e churn brutal; B2B/B2G tem
  LTV alto e churn baixo. Modelo acertado.
- **O dashboard do professor é a arma de vendas.** Quem *paga* é a coordenação, quem
  *influencia* é o professor, quem *usa* é a criança. Vender "visibilidade da
  aprendizagem + tempo economizado", não "jogo divertido".

Riscos honestos:
1. **Compete com o grátis.** Khan Academy tem matemática K-5 em PT-BR, gratuita e ótima.
   O motivo para pagar **não** é "ser adaptativo" (Khan também é) — é **BNCC profunda +
   relatório de accountability para a gestão + formato jogo localizado**, o que o Khan
   não entrega bem.
2. **Sem prova de eficácia, não há venda grande.** Escola/secretaria pergunta "melhora
   o SAEB?". É o **maior bloqueador comercial**, acima de qualquer feature.
3. **O fosso está desligado.** O ouro é o **dado de misconception em escala** (efeito de
   rede: mais alunos → melhor diagnóstico → incopiável). Mas hoje o distrator escolhido
   nem é registrado (§2). Ligar isso (P0) constrói o ativo defensável.
4. **Não dá para vender "cobre o ano"** com ~15 nós só de operações.
5. **LGPD infantil é barreira obrigatória** — dado de criança exige política formal.

Mercado (ordem de grandeza — validar): ~15 mi de alunos nos anos iniciais no Brasil.
**Começar por B2B (escola privada)** — ciclo curto, paga melhor por aluno; **B2G
(secretarias)** é o volume, mas exige eficácia comprovada e edital → fase 2.

### 10.3 Consequências para este roadmap
- **P0 é decisão de negócio, não só técnica:** religar+instrumentar a espinha valida a
  pedagogia *e* constrói o fosso de dados. Maior alavancagem que existe aqui.
- **Definir um "mínimo vendável":** fechar **1 ano completo** ou **"Operações 1º–5º"**
  ponta a ponta para poder vender "cobre X" (fatias verticais do §5).
- **Rodar um piloto medido** (3–5 escolas, pré/pós-teste) → primeira prova de eficácia,
  o maior desbloqueador comercial.
- **Escolher a cunha explicitamente:** "o adaptativo alinhado à BNCC que dá ao professor
  o relatório que a gestão exige" — o que o Khan grátis não faz.
- **Resposta construída** (P4) nos nós-chave, para o dado de domínio ser crível.

## 11. Avaliação de game design — como tornar isto *um jogo*

> Feita por especialista em jogos educacionais (jul/2026), lendo o código de gameplay.
> **Resumo de uma frase:** hoje é um *tabuleiro de sorte com um quiz pedagogicamente bem
> feito grudado por cima* — a trilha de aprendizado que daria alma ao jogo existe no
> código (`CurriculumGraph`/`SkillTree`) mas está **desligada do loop e invisível**.
> Religá-la (P0) é o que separa "quiz com skin" de um jogo que ensina de verdade.

### 11.1 O que já funciona (não é pouco)
- **Acessibilidade para a faixa:** TTS em pergunta e alternativas, tabuleiro colorido
  "chunky", problemas com emoji e contexto ("🍎 Ana tem 3 maçãs…"). Serve bem 1º–2º.
- **Tratamento pedagógico do erro:** resposta certa + explicação em passos + reforço
  opcional (`CardModal.tsx`). Muito acima de um quiz comum.
- **Erro sem recuo** (`useGameStore.ts:292`) — boa escolha para reduzir frustração.
- **Camada de jogo rica:** XP, streak, conquistas, mascotes com stats, loja, batalha com HP.

### 11.2 O que está genérico (o "quiz com skin")
1. **A "trilha" não é trilha de aprendizado — é sorte.** O avanço no tabuleiro depende
   do **dado**, não do que a criança aprende. E o tabuleiro é **descartável**:
   `createInitialState` recria as 36 casas a cada partida (`GameEngine.ts`). Não há
   mapa-mundo persistente entre sessões. → o §4 (Trilha = Grafo) é a cura.
2. **A cor/ícone da casa é decorativa e possivelmente inconsistente:** o visual usa
   `colorCycle[i % 4]` (`Board.tsx:128`), fixo pela posição — pode **não corresponder**
   ao `tile.type` que rege o comportamento no `advanceTurn`. A criança não consegue
   criar estratégia porque o que vê ≠ o que acontece. *(Investigar como bug.)*
3. **Ausência total de efeitos sonoros.** Só há TTS e confete visual — nenhum SFX de
   acerto/erro/level-up/passo/vitória. É o ganho de "juice" mais barato e de maior
   impacto nessa idade (Duolingo prova).
4. **Feedback de acerto uniforme:** sempre o mesmo confete + "Excelente!" + 1500ms
   fixos (`useGameStore.ts:365`). Repetição idêntica mata o encanto.
5. **Ruído impróprio para a idade:** o **código BNCC aparece no card da criança**
   (`CardModal.tsx:86`) — é para o professor, não para o aluno. Explicações em vários
   passos exigem leitura avançada demais para 1º–2º.
6. **Sem narrativa / objetivo emocional:** o único objetivo é "chegar no FINISH".
   Buffs de mascote são abstratos demais para motivar uma criança de 7 anos.
7. **Arena mistura 1º–5º** no mesmo pool (`Arena.tsx:35`) e **hotseat gera ociosidade**
   (cada criança espera as outras).

### 11.3 Novos itens de gameplay para o roadmap
Reforçam ou complementam as fases existentes:

- ✅ **[P0] Alinhar cor/ícone visível ao `tile.type` real** (era bug: `Board.tsx` pintava
  por `i % 4`, ignorando o tipo real embaralhado em `BoardEngine`). *Feito jul/2026.*
- ✅ **[P0] Efeitos sonoros** de acerto/erro/passo/level-up/vitória, sintetizados via
  Web Audio (`src/utils/sfx.ts`, sem arquivos de áudio). *Feito jul/2026.*
- ✅ **[P0] Esconder o código BNCC do aluno** (removido do card em `CardModal.tsx`;
  permanece no relatório do professor). *Feito jul/2026.*
- **[P1] Interação além de múltipla escolha:** contar/arrastar objetos para *montar* o
  número no 1º–2º; teclado numérico no 3º–5º (princípio DragonBox; reduz o chute de 25%).
  Conecta com a "resposta construída" do P4. *Esforço: M por tipo.*
- ✅ **[P1] Feedback de acerto variado** — jul/2026: `CardModal.tsx` sorteia entre 6
  reações de acerto e 4 de erro (antes sempre "🌟 Excelente!"/"💡 Puxa, quase lá!"
  fixos), sorteado uma vez por pergunta. Falta a parte de "explicações mais curtas e
  ilustradas nas séries iniciais".
- ✅ **[P1] Recompensa concreta no meio da partida** — jul/2026: a cada 5 acertos, a
  criança desbloqueia um item de customização (companheiro/aura) na hora, com
  celebração (`CosmeticUnlockModal.tsx`, confete + som). Reaproveita o sistema de
  customização já existente (`customization.ts`) em vez de moeda/inventário novo;
  itens ainda não desbloqueados aparecem trancados (🔒) no `CharacterCustomizer.tsx`.
  Falta traduzir buffs de mascote em algo tangível ("seu mascote come o monstro!").
- **[P2] Personagem-guia / narrativa:** expandir a moldura do "Guardião"
  (`BattleArena.tsx`) para um mascote-mentor que dá missões e reage. *Esforço: M.*
- **[P2] Streak diário / missões diárias / recompensa de login** (hoje o streak só existe
  dentro da partida). Cria hábito. *Esforço: M.*
- **[P2] Dificuldade da Arena por série** (parar de misturar 1º–5º). *Esforço: P.*
- **[P2] Reduzir ociosidade do hotseat** (turnos curtos ou solo/co-op como padrão). *Esforço: M.*

### 11.4 Referências de jogos (o que copiar de cada)
- **Prodigy Math** — casamento batalha ↔ currículo e mapa-mundo persistente. Copiar:
  progressão de conhecimento como *motor* do avanço (P0 + §4), não verniz.
- **DragonBox** — manipular objetos para *construir* o número. Copiar: interação tátil (P1).
- **Duolingo** — trilha vertical persistente, streak diário, SFX e mascote emocional.
  Copiar: mapa de jornada + som + hábito.
- **Khan Academy Kids** — TTS e leveza visual para 4–8 anos (já acertamos; estender).
- **Teach Your Monster to Read** — companheiro que dá razão narrativa a cada exercício.

---

## 12. Visão-norte e Modo Tabuada (fluência)

> **Norte do produto (jul/2026):** ser *um videogame que ensina matemática* — divertido de
> verdade (tipo Duolingo, mas melhor), onde a criança aprende sem perceber. Dor real dos
> professores: alunos chegam ao 5º ano **sem a tabuada de cor**. Isso pede **fluência**
> (recordar rápido/automático), treinada com repetição curta, rápida e lúdica.

### 🎮 Modo Tabuada — entregue (MVP, jul/2026)
Arcade de fluência (fatos 2–10):
- **Resposta digitada** (teclado na tela + físico) — sem chute de múltipla escolha.
- **Combo, pontuação, som**; acerto rápido (< 4s) vale mais ("de cor").
- **Treino adaptativo por fato**: os fatos que a criança erra/não domina aparecem mais.
- **A grade 10×10 que acende** por fato dominado — coleção visível ("complete a grade").
- Arquivos: `src/core/learning/TabuadaEngine.ts`, `src/pages/Tabuada.tsx`; rota `/tabuada`,
  card no Hub; `tabuadaMastery` persistido em localStorage.

**Falta (próximos cortes do Tabuada):**
- [ ] Coluna `tabuada_mastery jsonb` no Supabase + save/load (hoje só localStorage/mesmo aparelho).
- [ ] **Visão do professor**: a mesma grade como raio-X por aluno (quais fatos faltam) — cunha de venda.
- [ ] Fluência por tempo mais fina (meta de velocidade), missões diárias da tabuada, medalhas por tabuada completa.

---

*Próximo passo sugerido: aprovar este plano e iniciar P0 (religar a espinha evolutiva),
que é pré-requisito técnico de P1 e P2. Junto do P0, os três itens de gameplay "P"
(som, cor↔tile, esconder BNCC) são vitórias rápidas e baratas de sensação de jogo.*
