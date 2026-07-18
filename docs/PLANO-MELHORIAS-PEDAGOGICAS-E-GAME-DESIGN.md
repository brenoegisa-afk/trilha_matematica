# Plano de Melhorias Pedagógicas e Game Design

## Propósito e princípios

O Trilha dos Campeões deve ensinar matemática do 1º ao 5º ano de forma divertida, adaptativa e progressiva. Avanço curricular significa **compreensão e retenção**, nunca apenas XP, rapidez ou sorte. A matemática precisa produzir a ação do jogo (construir, dividir, medir, navegar e investigar), e não apenas interrompê-la com uma pergunta.

Este plano é um backlog de produto e engenharia: não autoriza implementação automática. Ele preserva perfis existentes e prioriza diagnóstico seguro, pré-requisitos corretos, dados por tentativa, domínio baseado em evidências, retenção, feedback pedagógico, unificação dos modos, BNCC, acessibilidade e segurança antes de novos recursos visuais ou cosméticos.

### Regras transversais

- A série é referência inicial; não autoriza pular pré-requisitos, nem obriga alunos mais velhos a recomeçar em soma até 10.
- Separar domínio pedagógico, progresso visual e recompensa cosmética. XP, score, estrelas, níveis, conquistas, vida e mascotes devem ter significado explícito e não provar aprendizagem.
- Sessões-alvo: 8–12 minutos, com 70% habilidade-alvo, 20% revisão e 10% desafio opcional; taxa de sucesso adaptada entre 70% e 85%.
- Usar `nodeId`, `skillId`, `factId` e metadados estruturados; não inferir habilidade de símbolos como `x`, `÷` ou `-`.
- Localização infantil brasileira: decimal visível com vírgula, dinheiro em `R$ 10,50` e vocabulário que favoreça composição, decomposição e reagrupamento com apoio visual.

## Entregas iniciais de fundação (decomposição obrigatória)

As seções da Fase 1 continuam sendo a visão completa. Para evitar que a primeira mudança misture correção, migração, privacidade e diagnóstico, sua execução começa pelas quatro entregas abaixo.

### Entrega 1 — Corrigir exclusivamente o salto de pré-requisitos

- **Problema:** `CurriculumEngine.pickNode` pode escolher um nó da série selecionada quando a fronteira está vazia e, com isso, ignorar pré-requisitos.
- **Objetivo pedagógico:** impedir avanço curricular indevido sem alterar ainda a segmentação de séries ou introduzir diagnóstico.
- **Comportamento esperado:** manter temporariamente `1-2`, `3-4` e `5`; quando não houver nó elegível, selecionar um caminho que respeite os pré-requisitos ou sinalizar ausência de elegibilidade, sem pular diretamente para nó avançado.
- **Arquivos provavelmente afetados:** `CurriculumEngine.ts`, testes do motor curricular e, apenas se indispensável, tipos curriculares.
- **Supabase:** nenhuma alteração; perfis e `nodeMastery` existentes são preservados.
- **Dependências:** nenhuma mudança de diagnóstico, migração ou tabela de tentativas.
- **Riscos:** deixar alunos temporariamente sem item elegível. Mitigar com fallback pedagógico compatível, nunca com salto de pré-requisito.
- **Critérios de aceite:** regressão reproduzida e corrigida para cada agrupamento atual; nenhum perfil é reescrito; diagnóstico não é implementado nesta entrega.
- **Testes necessários:** unidade para fronteira vazia, seleção por série, pré-requisitos completos/incompletos e perfis legados.
- **Validação com crianças e professores:** revisão de cenários por professores; teste técnico controlado antes de exposição infantil.

### Entrega 2 — Separar os cinco anos com migração compatível

- **Problema:** os agrupamentos atuais podem oferecer conteúdo inadequado a ano escolar.
- **Objetivo pedagógico:** tornar 1º, 2º, 3º, 4º e 5º ano referências mais precisas, sem mudar ainda o ponto de entrada por diagnóstico.
- **Comportamento esperado:** catálogo, seleção e interfaces reconhecem cinco anos; dados existentes em `1-2` e `3-4` são migrados/interpretados de forma compatível e permanecem utilizáveis.
- **Arquivos provavelmente afetados:** `CurriculumGraph.ts`, `CurriculumEngine.ts`, `MathEngine.ts`, Setup, Arena, tipos e testes.
- **Supabase:** estratégia versionada e reversível de compatibilidade para dados de série; sem apagar perfis.
- **Dependências:** Entrega 1 concluída.
- **Riscos:** atribuição imprecisa de dados legados. Manter origem/versionamento e fallback seguro até o diagnóstico futuro.
- **Critérios de aceite:** cinco opções individuais funcionam; perfis existentes abrem sem perda; diagnóstico ainda não é implementado.
- **Testes necessários:** migração de cada agrupamento, seleção por ano e regressão de perfis sem série.
- **Validação com crianças e professores:** docentes revisam a adequação de amostras por ano; famílias não precisam recriar perfil.

### Entrega 3 — Contrato de tentativa e privacidade antes da tabela definitiva

- **Problema:** não há contrato append-only completo, e coletar dados infantis sem minimização/RLS definidos é inadequado.
- **Objetivo pedagógico:** definir evidência útil, mínima e protegida antes de persistir novas tentativas.
- **Comportamento esperado:** especificar campos, finalidade, retenção, pseudonimização, idempotência, papéis e RLS; separar campos essenciais de telemetria opcional. Nenhuma tabela definitiva é criada antes de aprovação da modelagem de segurança.
- **Arquivos provavelmente afetados:** tipos/contratos de domínio, serviços de sessão e documentação de arquitetura/privacidade; sem implementar fluxo de diagnóstico.
- **Supabase:** desenho de tabela, índice, RLS/RPC e política de retenção em revisão; migração somente após aprovação de segurança da seção 6.1.
- **Dependências:** planejamento mínimo de segurança e LGPD (6.1), com auditoria de acesso por papel.
- **Riscos:** coletar latência/dispositivo em excesso. Aplicar minimização, finalidade explícita e revisão de responsável/escola.
- **Critérios de aceite:** contrato documenta `attempt_id`, idempotência e todos os campos mínimos; matriz aluno/professor/responsável/admin e RLS é aprovada; tabela definitiva ainda não criada.
- **Testes necessários:** revisão de contrato, testes planejados de RLS/enumeração e casos de duplicação/reconexão.
- **Validação com crianças e professores:** responsáveis e escola avaliam transparência; professores confirmam que os dados previstos bastam para intervenção pedagógica.

#### Especificação mínima a aprovar antes da migração

**Finalidade única.** Uma tentativa existe para adaptar a próxima atividade, confirmar retenção e produzir um relatório pedagógico prudente. Não pode alimentar ranking global, publicidade, perfil comportamental ou avaliação punitiva da criança.

**Contrato mínimo de `LearningAttempt` (proposto).** O cliente envia um evento com `attempt_id` (UUID gerado antes da tentativa), `session_id` opaco, `student_id` interno, `game_mode`, `node_id`, `skill_id`, `fact_id` opcional, `question_ref` ou seed, `generator_version`, `item_format`, `selected_response`/resposta construída quando necessária para corrigir, `is_correct`, `response_latency_ms`, `attempt_number`, `hint_count`, `support_level`, `misconception_id` opcional e `occurred_at`. O servidor registra a data de recepção e uma chave de idempotência; não confia em `student_id`, escola ou hora fornecidos pelo cliente quando puder derivá-los da sessão autorizada.

**Minimização.** Não gravar nome, apelido, e-mail, foto, voz, endereço, IP, identificador publicitário, fingerprint do dispositivo ou texto integral da pergunta como parte da tentativa. O enunciado deve ser resolvido por `question_ref`/seed e versão do gerador. Contexto técnico, quando indispensável para suporte, deve ser agregado e de curta retenção, nunca usado para rastrear a criança.

**Idempotência e offline.** `attempt_id` é imutável e único; reenvios da mesma tentativa retornam sucesso sem criar linha adicional. A fila local só guarda eventos ainda não confirmados, cifra/limpa o que for tecnicamente viável e descarta o evento após confirmação. Conflitos não reescrevem tentativas já aceitas; a sessão pode ser reconstruída pelos eventos aceitos.

**Matriz de acesso e RLS a aprovar.**

| Papel | Inserir | Ler | Alterar/excluir |
|---|---|---|---|
| Aluno autenticado/anônimo vinculado | Somente tentativa do próprio perfil autorizado | Somente histórico mínimo próprio, se necessário para continuidade | Não altera tentativa aceita; apenas solicita exclusão via fluxo adulto |
| Professor | Nunca em nome do aluno | Somente alunos das turmas em que está autorizado; relatórios com evidência e sem diagnóstico absoluto | Não altera fatos brutos |
| Responsável | Não | Somente filho vinculado e após vínculo autorizado | Solicita exportação/exclusão conforme política |
| Administrador escolar | Não | Somente dados agregados ou escopo escolar autorizado | Sem alteração de fatos brutos; gestão por procedimento auditado |

RLS e RPC devem negar por padrão. Consultas de turma nunca podem ser descobertas por código público; toda associação aluno–turma–escola deve ser validada no servidor. A política precisa cobrir também tentativas de enumeração, inserção anônima fora de perfil reivindicado e acesso cruzado entre escolas.

**Retenção e direitos.** Antes de coletar, definir responsável controlador, base/consentimento aplicável, linguagem infantil e para responsáveis, prazo de retenção pedagógica, revisão periódica, exportação e exclusão. Exclusão deve remover ou anonimizar identificadores de acordo com a política aprovada, preservando apenas agregados realmente anonimizados quando permitido. Nenhum dado novo é coletado até essa política ser aprovada pela escola/responsável e revisada juridicamente quando aplicável.

**Gates de saída da Entrega 3.** A próxima entrega só pode criar uma migração após: (1) revisão de minimização; (2) modelo de ameaça e matriz RLS aprovados; (3) política de retenção/exportação/exclusão definida; (4) contrato versionado com exemplos de reenvio idempotente; (5) plano de testes por papel e de reconexão; e (6) confirmação de que não haverá quebra nem coleta retroativa indevida em perfis existentes.

### Entrega 4 — Diagnóstico inicial adaptativo por eixo

- **Problema:** sem diagnóstico, ano escolar isolado não identifica o ponto de entrada real.
- **Objetivo pedagógico:** posicionar cada criança por eixo com baixo estresse e respeitando pré-requisitos.
- **Comportamento esperado:** 8–12 microdesafios sem nota/ranking, começando levemente abaixo do esperado, registrando ajuda e escolhendo a próxima habilidade elegível por eixo.
- **Arquivos provavelmente afetados:** `CurriculumEngine.ts`, `MathEngine.ts`, `useGameStore.ts`, Setup, Arena/Mapa, serviços de sessão e telas de feedback.
- **Supabase:** usa o contrato e as políticas aprovadas na Entrega 3; resultados versionados por eixo.
- **Dependências:** Entregas 1, 2 e 3.
- **Riscos:** ansiedade, duração e falsa precisão. Permitir pausa/retomada, declarar evidência insuficiente e validar em piloto.
- **Critérios de aceite:** crianças do mesmo ano podem iniciar em pontos diferentes sem salto de pré-requisito; não há nota, reprovação ou ranking.
- **Testes necessários:** integração diagnóstico→entrada, persistência idempotente, ajuda/suporte e regressão de pré-requisitos.
- **Validação com crianças e professores:** testes observados por faixa e comparação da entrada sugerida com avaliação docente.

## Fase 1 — Fundação da aprendizagem

### 1.1 Modelo por ano e diagnóstico de entrada por eixo

- **Problema:** as séries são agrupadas em `1-2`, `3-4` e `5`; o fallback conhecido de `CurriculumEngine.pickNode` pode pular pré-requisitos quando não encontra fronteira na série. Isso expõe alunos a frações, decimais ou problemas multi-etapa antes dos fundamentos.
- **Objetivo pedagógico:** identificar, sem aparência de prova, o ponto de entrada de cada criança em cada eixo, respeitando conhecimentos já adquiridos.
- **Comportamento esperado:** ao iniciar, a criança responde 8–12 microdesafios adaptativos, começando levemente abaixo do esperado. Não recebe nota, reprovação ou ranking. O sistema registra acerto, ajuda e evidência por eixo e libera somente nós com pré-requisitos comprovados.
- **Arquivos provavelmente afetados:** `CurriculumGraph.ts`, `CurriculumEngine.ts`, `MathEngine.ts`, `useGameStore.ts`, Setup, Arena, telas de Mapa e serviços de sessão/perfil.
- **Supabase:** modelo versionado de diagnóstico, resultado por eixo e versão curricular; sem apagar `node_mastery` existente.
- **Dependências:** inventário BNCC (1.6), tentativas append-only (1.7) e definição de estados (Fase 2).
- **Riscos:** diagnóstico longo, ansiedade e falsa precisão com pouca evidência. Mitigar com microitens, interrupção segura e estado “evidência insuficiente”.
- **Critérios de aceite:** 1º–5º anos escolhidos individualmente; dois alunos do mesmo ano podem entrar em nós diferentes por eixo; nenhum nó é oferecido sem pré-requisitos; aluno mais velho não é forçado à raiz.
- **Testes necessários:** unidade para todas as fronteiras/fallbacks; integração diagnóstico→entrada; regressão do salto de pré-requisito; persistência e migração de perfis.
- **Validação com crianças e professores:** 5–8 crianças por faixa 6–7, 8–9 e 10–11 anos; observar ansiedade, compreensão e duração. Professores verificam se a entrada por eixo corresponde à observação em sala.

### 1.2 Contrato único de aprendizagem para Trilha, Arena, Batalha e Tabuada

- **Problema:** os modos têm fluxos paralelos; Arena pode misturar séries, Batalha pode não alimentar maestria/SRS/diagnósticos e Tabuada possui progresso próprio. A Batalha também depende de análise textual da questão e HP escalado por partidas.
- **Objetivo pedagógico:** fazer cada interação alimentar o mesmo histórico e as mesmas regras de domínio, preservando o papel distinto de cada modo.
- **Comportamento esperado:** Trilha apresenta habilidade nova; Arena exercita fluência em habilidade praticando/consolidando; Batalha aplica e revisa; Tabuada trabalha fatos e repetição espaçada; Mapa torna a jornada visível. Todos enviam tentativas com metadados e recebem uma seleção curricular compatível.
- **Arquivos provavelmente afetados:** `useGameStore.ts`, `Arena.tsx`, `Battle.tsx`, `Tabuada.tsx`, `CurriculumEngine.ts`, `MathEngine.ts`, `ReinforcementEngine.ts`, serviços de questões/sessão e rotas.
- **Supabase:** sessões e tentativas por `game_mode`; referência a nó, habilidade e fato.
- **Dependências:** 1.1, 1.7 e 2.2.
- **Riscos:** regressão de engajamento e duplicação temporária de estados. Migrar modo a modo atrás de contrato compatível e telemetria.
- **Critérios de aceite:** uma resposta equivalente atualiza a mesma evidência independentemente do modo; Arena não oferece série indevida; Batalha não pune desconhecimento com perda irrecuperável; dificuldade do inimigo considera evidência recente, não total de partidas.
- **Testes necessários:** matriz modo×resultado×suporte; E2E por rota; regressão de seleção de nó; testes de metadados estruturados.
- **Validação com crianças e professores:** sessão observada comparando clareza e frustração entre modos; professor confirma que relatórios não duplicam ou contradizem progresso.

### 1.3 Erro acolhedor e reforço no mesmo conceito

- **Problema:** mensagens como “Errou!” e perda de vida podem punir quem está aprendendo. O `ReinforcementEngine` pode buscar nova questão fora do nó que gerou o erro.
- **Objetivo pedagógico:** transformar erro em informação: acolher, apoiar e confirmar compreensão sem estigma.
- **Comportamento esperado:** sequência fixa: acolhimento (“Ainda não. Vamos descobrir juntos.”), pista concreta/visual, nova tentativa, exemplo parcialmente resolvido, questão equivalente e revisão futura. A ajuda reduz uma dimensão por vez (números, etapas, alternativas ou apoio visual) e mantém `nodeId`/conceito. Corrigir o próprio erro e usar estratégia rendem reconhecimento; chefes podem reduzir bônus, nunca apagar avanço.
- **Arquivos provavelmente afetados:** `ReinforcementEngine.ts`, `MathEngine.ts`, `CurriculumEngine.ts`, `Arena.tsx`, `Battle.tsx`, componentes de feedback e SFX.
- **Supabase:** tentativas ligadas em cadeia (original, dica, re-tentativa, reforço) e nível de suporte.
- **Dependências:** 1.7, formatos da Fase 3 e taxonomia de equívocos (2.4).
- **Riscos:** feedback excessivo aumenta tempo de sessão. Usar dicas graduadas e abandono seguro.
- **Critérios de aceite:** reforço preserva habilidade; erro recebe caminho pedagógico; pedido de dica não é fracasso; uma questão equivalente confirma ou agenda revisão.
- **Testes necessários:** unidade para preservação de nó e redução única de dificuldade; componentes para estados de dica; E2E de erro em todos os modos.
- **Validação com crianças e professores:** observar reações ao erro, uso voluntário de dica e capacidade de explicar a correção; docentes revisam pertinência das pistas.

### 1.4 Semântica de recompensas e loop de sessão

- **Problema:** score, XP, estrelas, vida, níveis, conquistas e cosméticos coexistem e podem comunicar que rapidez ou quantidade é domínio.
- **Objetivo pedagógico:** tornar recompensas motivadoras sem falsear aprendizagem.
- **Comportamento esperado:** domínio move o mapa; XP mede participação/progresso visual; score mede desempenho da missão com rótulo próprio; estrelas compram apenas cosméticos; vida/bônus representam estado lúdico. Microfeedback em acertos comuns; celebrações grandes apenas para domínio, retenção confirmada, recorde pessoal, fim de missão ou desbloqueio relevante.
- **Arquivos provavelmente afetados:** `useGameStore.ts`, HUD, Arena, Battle, Tabuada, resumo de jogo, loja e componentes de recompensa.
- **Supabase:** catálogo/ledger de recompensa separado de evidência pedagógica, se necessário.
- **Dependências:** 2.2 e 4.2.
- **Riscos:** reduzir reforço imediato; testar linguagem e frequência antes de remover incentivos.
- **Critérios de aceite:** nenhuma tela chama score de XP ou XP de domínio; cosméticos não dão vantagem acadêmica; não há mecânica de compra impulsiva/caixa aleatória monetizada.
- **Testes necessários:** regressões de cálculo/exibição e testes de acessibilidade para feedback não exclusivamente visual/sonoro.
- **Validação com crianças e professores:** verificar se crianças explicam o que aprenderam versus o que ganharam; professores avaliam se o painel não sugere conclusões pedagógicas pelo XP.

### 1.5 Preservação, sincronização e perfis existentes

- **Problema:** persistência fragmentada entre localStorage e Supabase, snapshots no perfil e possível duplicidade entre `gameState` e campos achatados.
- **Objetivo pedagógico:** garantir que evidência e progresso sobrevivam a pausa, troca de dispositivo e reconexão sem corromper perfis.
- **Comportamento esperado:** fonte de verdade definida, operações idempotentes, fila offline recuperável e migrações compatíveis. Dados atuais são mantidos e recebem defaults/versionamento seguro.
- **Arquivos provavelmente afetados:** `useGameStore.ts`, serviços de perfil/sessão/sincronização, tipos de jogador e provider de nuvem.
- **Supabase:** versões de esquema, chaves de idempotência, migrações documentadas e estratégia de backfill não destrutiva.
- **Dependências:** 1.7 e auditoria de segurança (6.1).
- **Riscos:** conflito de dados entre aparelhos e migração parcial. Usar rollout, cópia lógica e métricas de conflito.
- **Critérios de aceite:** perfil existente abre sem perda; retomada não duplica tentativas; offline sincroniza uma vez; migrações manuais ficam documentadas.
- **Testes necessários:** sincronização concorrente, offline/reconexão, perfil legado, interrupção no meio de sessão e recuperação.
- **Validação com crianças e professores:** piloto em aparelhos escolares/rede instável; verificar que retomada não exige repetir conteúdo nem perde recompensa.

### 1.6 Revisão curricular, BNCC e localização brasileira

- **Problema:** há possível reaproveitamento inadequado de códigos BNCC; `frac_intro`/`frac_equiv` precisam de conferência e `frac_operations` descreve denominadores diferentes enquanto o gerador usa iguais. Linguagem e notação decimal devem ser brasileiras.
- **Objetivo pedagógico:** assegurar precisão curricular, exemplos adequados à idade e equivalência entre descrição, gerador e avaliação.
- **Comportamento esperado:** cada nó possui ano, eixo, unidade temática, objeto de conhecimento, habilidade BNCC, pré-requisitos, exemplos, formatos e equívocos esperados. Conteúdo novo passa por rascunho→validação automática→revisão docente→publicação.
- **Arquivos provavelmente afetados:** `CurriculumGraph.ts`, `MathEngine.ts`, mapas BNCC, importador de questões, componentes de texto/formatadores.
- **Supabase:** status editorial, versão de conteúdo e auditoria de publicação; não publicar JSON importado diretamente.
- **Dependências:** modelo de grafo por ano e testes de gerador.
- **Riscos:** divergência entre documento BNCC e implementação. Exigir revisão humana com evidência por nó.
- **Critérios de aceite:** catálogo revisado nó a nó; frações alinhadas entre código, descrição e gerador; decimais/dinheiro exibidos no padrão brasileiro; alternativas são únicas e explicações infantis.
- **Testes necessários:** invariantes matemáticos/pedagógicos por gerador, snapshot de notação, validação de importação e revisão de conteúdo.
- **Validação com crianças e professores:** docentes de cada faixa validam amostras; crianças testam compreensão da linguagem, não só acerto.

### 1.7 Registro append-only de tentativa

- **Problema:** snapshots no perfil e salvamento final perdem detalhe e abandonos; alternativa errada textual não é um diagnóstico pedagógico.
- **Objetivo pedagógico:** construir evidência confiável para adaptação, relatórios prudentes e pesquisa de retenção.
- **Comportamento esperado:** cada tentativa é salva progressivamente com `attempt_id`, `session_id`, `student_id`, `node_id`, `skill_id`, `fact_id`, seed/identificador e versão do gerador, resposta apresentada/escolhida, acerto, latência, número de tentativas, dicas, suporte, `misconceptionId`, data, modo e contexto técnico mínimo.
- **Arquivos provavelmente afetados:** store, serviços de sessão/questão/sincronização, motores pedagógicos e diagnóstico do professor.
- **Supabase:** tabela append-only de tentativas, índices por aluno/nó/data, idempotência, RLS e política de retenção.
- **Dependências:** segurança infantil e LGPD (6.1) e contrato único 1.2.
- **Riscos:** volume, privacidade e duplicação. Minimizar dados, particionar/arquivar quando necessário e usar chave idempotente.
- **Critérios de aceite:** abandonar uma sessão não perde tentativas já respondidas; reconexão não duplica; todos os modos registram o mesmo contrato; professor vê hipótese com nível de evidência, nunca diagnóstico absoluto.
- **Testes necessários:** contrato de evento, deduplicação, RLS, carga básica e abandono/retomada.
- **Validação com crianças e professores:** docentes confirmam que relatórios distinguem “pouca evidência” de dificuldade persistente; responsáveis revisam transparência de dados.

## Fase 2 — Domínio e retenção

### 2.1 Máquina de estados de evidência

- **Problema:** pontos heurísticos aproximados (+60/-25), limite por nó e mínimo de três tentativas não comprovam compreensão longitudinal.
- **Objetivo pedagógico:** separar descoberta, prática, consolidação, domínio e revisão com evidências explícitas.
- **Comportamento esperado:** nós transitam por **descobrindo**, **praticando**, **consolidando**, **dominado** e **em revisão**. Domínio requer 6–10 evidências variadas, 80%–85% de acerto, pelo menos dois formatos, uma questão de transferência e revisão posterior; painel mostra incerteza quando houver poucas evidências.
- **Arquivos provavelmente afetados:** `CurriculumEngine.ts`, tipos de maestria, `useGameStore.ts`, Mapa, relatórios de aluno e professor.
- **Supabase:** estado derivado/versionado por nó e agregados de evidência; tentativas brutas permanecem a fonte auditável.
- **Dependências:** 1.7 e formatos 3.1.
- **Riscos:** regras rígidas demais geram sensação de repetição. Adaptar quantidade dentro da faixa conforme confiança e oferecer missões variadas.
- **Critérios de aceite:** três acertos na mesma sessão não dominam nó; dois formatos e transferência são obrigatórios; relatórios mostram contagem e qualidade de evidências.
- **Testes necessários:** transições, regressão ao errar, limites 6/10 e 80/85%, transferência, baixa evidência e migração de maestria legada.
- **Validação com crianças e professores:** professores avaliam se “dominado” coincide com desempenho independente; crianças relatam se a repetição parece variada e justa.

### 2.2 Retenção por data e conceito específico

- **Problema:** o SRS usa turnos (+5/+15), que favorecem repetição imediata sem demonstrar retenção.
- **Objetivo pedagógico:** confirmar memória duradoura de nó, fato ou conceito.
- **Comportamento esperado:** agenda revisões em 1, 3, 7 e 21 dias por `nodeId`/`factId`/conceito. Erro ou muita ajuda encurta intervalo; acerto independente amplia. O estado “em revisão” é visível sem parecer punição.
- **Arquivos provavelmente afetados:** `CurriculumEngine.ts`, `ReinforcementEngine.ts`, `TabuadaEngine`, seleção de questão, store e Mapa.
- **Supabase:** agenda de revisão com data, conceito, status, suporte e idempotência de disparo.
- **Dependências:** 1.7 e 2.1.
- **Riscos:** notificações excessivas e fila grande. Priorizar poucas revisões por sessão e usar entrada voluntária.
- **Critérios de aceite:** revisão de 7 dias mede a métrica principal; fato de tabuada não é tratado como skill ampla; ajuda altera agenda; revisão confirmada atualiza domínio.
- **Testes necessários:** relógio simulado para 1/3/7/21 dias, recalendário, seleção por conceito e migração do SRS por turnos.
- **Validação com crianças e professores:** retorno após uma semana e 21 dias; professores analisam se itens recuperam conceito, não apenas formato memorizado.

### 2.3 Questões de transferência e fluência responsável

- **Problema:** múltipla escolha e anti-chute <800 ms medem reconhecimento/velocidade mais do que compreensão; cronômetro pode excluir crianças.
- **Objetivo pedagógico:** medir aplicação em contexto novo sem confundir velocidade com conhecimento.
- **Comportamento esperado:** cada habilidade recebe transferência com contexto distinto; fluência cronometrada só aparece em conteúdo consolidado, opcional e sem degradar domínio por tempo de processamento.
- **Arquivos provavelmente afetados:** `MathEngine.ts`, formatos da Fase 3, seleção adaptativa e interfaces dos modos.
- **Supabase:** metadado `item_format`, `is_transfer` e suporte usado.
- **Dependências:** 3.1 e 2.1.
- **Riscos:** geradores de transferência fracos ou contexto que introduz leitura excessiva. Revisão pedagógica e leitura em voz alta.
- **Critérios de aceite:** transferência difere de superfície e contexto dos exemplos; velocidade não é requisito de domínio; evidência de fluência é separada de compreensão.
- **Testes necessários:** invariantes de gerador, semelhança indevida de itens e acessibilidade sem cronômetro.
- **Validação com crianças e professores:** pedir que criança explique estratégia; docentes classificam se o item exige o conceito alvo.

### 2.4 Taxonomia de equívocos e relatório prudente

- **Problema:** registrar só a alternativa errada desperdiça sinal e pode induzir diagnóstico excessivo.
- **Objetivo pedagógico:** orientar intervenção com hipótese pedagógica fundamentada.
- **Comportamento esperado:** distratores e respostas mapeiam `misconceptionId` (valor posicional, soma de denominadores, troca de operação, diferença de um, inversão minuendo/subtraendo, multiplicação como adição simples etc.). Relatório informa frequência e nível de evidência.
- **Arquivos provavelmente afetados:** `MathEngine.ts`, `CurriculumGraph.ts`, `CurriculumEngine.ts`, diagnóstico e relatórios.
- **Supabase:** catálogo versionado de equívocos e vínculo tentativa→equívoco.
- **Dependências:** 1.7 e revisão BNCC (1.6).
- **Riscos:** classificar com excesso de certeza. Apresentar “hipótese” e “evidência insuficiente”.
- **Critérios de aceite:** um erro textual não vira diagnóstico isolado; relatório explica conceito provável e recomenda pré-requisito/atividade de reforço.
- **Testes necessários:** mapeamento de distrator, agregação de evidência e privacidade no relatório.
- **Validação com crianças e professores:** docentes avaliam utilidade e precisão das hipóteses em casos reais anonimizados.

## Fase 3 — Formas variadas de aprender

### 3.1 Biblioteca de atividades manipuláveis e resposta construída

- **Problema:** múltipla escolha predomina, permite chute e limita produção matemática.
- **Objetivo pedagógico:** permitir representar, experimentar, produzir e explicar, garantindo dois formatos por habilidade.
- **Comportamento esperado:** introdução incremental de resposta digitada, arrastar objetos, agrupamentos visuais, reta numérica, blocos de unidades/dezenas, composição/decomposição, frações manipuláveis, ordenação de etapas, seleção de estratégia e explicação de como pensou. Dicas são graduadas e registradas.
- **Arquivos provavelmente afetados:** `MathEngine.ts`, novos componentes de atividade, Arena/Trilha/Batalha, acessibilidade e serviços de tentativa.
- **Supabase:** esquema de resposta por formato, versão de atividade e dados mínimos de interação.
- **Dependências:** 1.7, 2.1 e acessibilidade (6.2).
- **Riscos:** complexidade de entrada em celular e acessibilidade de drag-and-drop. Oferecer alternativa por toque/teclado e resposta equivalente.
- **Critérios de aceite:** ao menos dois formatos validados para cada nó expandido; resposta construída aceita vírgula decimal; dicas não são penalidade; suporte fica registrado.
- **Testes necessários:** unidade de avaliação, componentes por teclado/toque/leitor de tela, E2E móvel e invariantes de resposta.
- **Validação com crianças e professores:** observar autonomia, estratégia verbal e frustração; professor confere se representação torna o conceito mais compreensível.

### 3.2 Matemática integrada às missões

- **Problema:** a pergunta pode interromper animações em vez de mudar o mundo do jogo.
- **Objetivo pedagógico:** relacionar representação, símbolo e aplicação significativa.
- **Comportamento esperado:** medir para construir ponte/casa, dividir alimentos, formar grupos iguais, comprar com moedas, completar receitas fracionárias, navegar coordenadas e interpretar gráficos para resolver mistérios. Cada missão segue história→exploração concreta→representação visual→símbolos→novo contexto→obstáculo→recompensa→próximo caminho.
- **Arquivos provavelmente afetados:** Arena, Trilha/Mapa, geradores, componentes de missão e assets de mundo.
- **Supabase:** catálogo/versionamento de missões e vínculo missão→nó/atividade.
- **Dependências:** 3.1, mundos 4.1 e cobertura curricular 5.1.
- **Riscos:** narrativa eclipsar aprendizagem; toda ação deve ter relação verificável com a habilidade.
- **Critérios de aceite:** completar a ação exige usar matemática alvo; uma missão não aumenta progresso curricular apenas por clicar/animar.
- **Testes necessários:** integração missão→tentativa→domínio e testes de desempenho em aparelhos fracos.
- **Validação com crianças e professores:** observar se criança conecta ação à estratégia matemática e se a história é compreendida sem explicação adulta constante.

## Fase 4 — Jornada lúdica

### 4.1 Mapa curricular e cinco mundos

- **Problema:** modos e recompensas podem parecer minijogos isolados; a jornada de habilidades não é suficientemente visível.
- **Objetivo pedagógico:** dar contexto, escolha segura e visualização de progresso sem transformar o mapa em ranking.
- **Comportamento esperado:** cinco mundos — **Mundo dos Números**, **Oficina das Operações**, **Ilha das Formas e Medidas**, **Reino das Frações e Decimais** e **Laboratório dos Padrões e Dados** — exibem estações descobrindo/praticando/consolidando/dominado/em revisão e caminhos bloqueados por pré-requisito.
- **Backlog de game design:** tutorial jogável de até 90 segundos; mascote como tutor pedagógico (pista, demonstração e encorajamento, sem dar a resposta); botão de pausa; repetição permanente de instrução; lembrete de descanso; limite de sessão configurável pelo responsável; álbum de conquistas vinculado a habilidades (não a volume/velocidade); e escolha entre dois caminhos de missão pedagogicamente equivalentes.
- **Arquivos provavelmente afetados:** Mapa/SkillTree, `CurriculumGraph.ts`, componentes de jornada, navegação e herói.
- **Supabase:** preferências de apresentação e estado derivado já suportado pela Fase 2.
- **Dependências:** 1.1, 2.1 e 5.1.
- **Riscos:** mapa muito complexo para os menores. Revelar progressivamente e usar texto+ícone, não apenas cor.
- **Critérios de aceite:** criança consegue dizer o que está aprendendo e qual é o próximo caminho; bloqueio explica pré-requisito de modo acolhedor.
- **Testes necessários:** componentes, navegação por teclado, responsividade e regressão de estado curricular.
- **Validação com crianças e professores:** teste de compreensão do mapa e entrevista curta sobre sensação de progresso.

### 4.2 Cooperação, ranking seguro e economia ética

- **Problema:** ranking global pode expor crianças; recompensas podem privilegiar velocidade ou volume.
- **Objetivo pedagógico:** incentivar esforço, autonomia e colaboração sem comparação prejudicial.
- **Comportamento esperado:** progresso pessoal e metas cooperativas são padrão (ex.: construir mundo coletivamente). Ranking, se habilitado por adulto, usa apelidos, é limitado à turma e não ordena somente velocidade/respostas. Sem chat infantil, foto ou e-mail obrigatório; sem vantagens acadêmicas compráveis.
- **Backlog de game design:** chefes aparecem em etapas de aplicação/transferência, não como punição por erro; a construção cooperativa da turma contribui para um mundo compartilhado sem expor desempenho individual nem alterar domínio pedagógico.
- **Arquivos provavelmente afetados:** ranking, perfil/Setup, loja, SideNavigation, dashboards e políticas de acesso.
- **Supabase:** configurações de turma, apelido e permissões adultas; auditoria RLS.
- **Dependências:** segurança infantil e LGPD (6.1) e semântica de recompensas (1.4).
- **Riscos:** configurações adultas mal protegidas. Usar barreira de adulto e validação no servidor.
- **Critérios de aceite:** ranking global infantil não é padrão; criança não vê dados de outras turmas/escolas; cooperação não altera domínio indevidamente.
- **Testes necessários:** RLS/roles, E2E de configuração adulta e testes de visibilidade de ranking.
- **Validação com crianças e professores:** avaliar se metas cooperativas motivam sem constrangimento; responsáveis revisam compreensão de privacidade.

## Fase 5 — Currículo completo e qualidade de conteúdo

### 5.1 Expansão do grafo para 55–65 habilidades

- **Problema:** grafo concentrado em números e operações não sustenta jornada completa do 1º ao 5º ano.
- **Objetivo pedagógico:** cobrir Números, Álgebra, Geometria, Grandezas e Medidas e Probabilidade e Estatística com continuidade de pré-requisitos.
- **Comportamento esperado:** expansão em fatias lançáveis, incluindo contagem/comparação, valor posicional, composição/decomposição, operações e significados, grupos/arranjos, partilha/medida, formas/sólidos, localização, simetria, ângulos, perímetro, área, comprimento, massa, capacidade, tempo/calendário/dinheiro, frações/decimais/porcentagem, padrões/igualdade/incógnitas, tabelas/gráficos/média/probabilidade.
- **Arquivos provavelmente afetados:** `CurriculumGraph.ts`, `MathEngine.ts`, mapas BNCC, Mapa e testes de aprendizagem.
- **Supabase:** dados iniciais versionados e publicação editorial por nó.
- **Dependências:** 1.6 e 3.1.
- **Riscos:** quantidade superar qualidade. Cada novo nó precisa de gerador, exemplos, distratores/equívocos, dois formatos e revisão docente.
- **Critérios de aceite:** 55–65 nós revisados, todos com pré-requisitos reais e cobertura declarada; nenhum nó novo é apenas pergunta fixa.
- **Testes necessários:** invariantes de cada gerador, grafo acíclico, cobertura BNCC, opções únicas e não negativas quando inadequadas.
- **Validação com crianças e professores:** pilotos por fatia; professores validam progressão e crianças demonstram transferência em contexto novo.

### 5.2 Importação editorial e garantia de qualidade

- **Problema:** JSON de questões não pode virar conteúdo publicado sem revisão; distratores e explicações podem ser ambíguos.
- **Objetivo pedagógico:** preservar qualidade didática em conteúdo escalável.
- **Comportamento esperado:** importação passa por rascunho, validação automática, revisão docente e publicação. Valida ano, habilidade, nó, BNCC, dificuldade, resposta, alternativas únicas, ambiguidade, distratores, explicação, linguagem infantil e notação brasileira.
- **Arquivos provavelmente afetados:** importador, serviços administrativos, mapas curriculares, painéis docentes e testes.
- **Supabase:** estados editoriais, autor/revisor, histórico e rollback lógico.
- **Dependências:** 1.6 e segurança infantil e LGPD (6.1).
- **Riscos:** gargalo editorial. Usar validações automatizadas sem substituir revisão humana.
- **Critérios de aceite:** nenhuma importação publica direto; conteúdo publicado é rastreável à versão e revisão.
- **Testes necessários:** validação de arquivo, permissões por papel e rollback de publicação.
- **Validação com crianças e professores:** revisão amostral por docentes e leitura com crianças para detectar ambiguidade.

## Segurança, acessibilidade, qualidade e operação

### 6.1 LGPD, segurança infantil e papéis

- **Problema:** dados infantis exigem minimização; é necessário investigar inserção anônima em perfis, pesquisas públicas de turma, RLS e RPC.
- **Objetivo pedagógico:** criar ambiente confiável para aprender, sem expor criança ou escola.
- **Comportamento esperado:** apelido por padrão; sem e-mail infantil, foto ou chat; área de adulto protegida; consentimento, retenção, exportação e exclusão definidos; acesso sempre isolado por aluno/turma/escola.
- **Arquivos provavelmente afetados:** autenticação, perfil, dashboards, serviços Supabase, configurações e documentação.
- **Supabase:** auditoria integral de RLS/RPC, políticas por aluno/professor/responsável/admin e mecanismos de exclusão/exportação.
- **Dependências:** 1.7 e 1.5.
- **Riscos:** confiança indevida no cliente. Autorizar e filtrar no banco/servidor, com testes por papel.
- **Critérios de aceite:** aluno não acessa dados externos; adulto controla recursos sensíveis; políticas e ciclo de vida documentados.
- **Testes necessários:** suíte automatizada RLS/RPC para os quatro papéis, autenticação, exclusão/exportação e tentativa de enumeração de turma.
- **Validação com crianças e professores:** responsáveis revisam linguagem de consentimento; escolas avaliam adequação operacional.

### 6.2 Acessibilidade e modos de regulação

- **Problema:** cor, movimento, som, cronômetro e entradas complexas podem excluir crianças com baixa visão, daltonismo, dislexia, TDAH ou dificuldade motora.
- **Objetivo pedagógico:** permitir que o sistema avalie matemática, não tolerância sensorial, velocidade de leitura ou motricidade.
- **Comportamento esperado:** leitura em voz alta e repetição, volume independente, redução de movimento, alto contraste, modo sem cronômetro, texto com ícone, alvos grandes, foco visível e suporte a teclado, leitor de tela e toque. Cronômetro apenas em fluência já consolidada.
- **Arquivos provavelmente afetados:** componentes de atividade, CSS global, Arena/Batalha/Tabuada/Mapa, preferências de perfil e SFX.
- **Supabase:** preferências de acessibilidade por perfil, com defaults seguros.
- **Dependências:** 3.1 e 1.2.
- **Riscos:** opções inconsistentes entre modos. Criar camada de preferências comum e checklist por componente.
- **Critérios de aceite:** jogar uma missão inteira sem depender de cor, som, mouse ou cronômetro; preferências persistem entre sessões.
- **Testes necessários:** auditoria automatizada de acessibilidade, teclado/leitor de tela, contraste, redução de movimento e E2E móvel.
- **Validação com crianças e professores:** testes observados com necessidades diversas, sem coletar dados sensíveis desnecessários; educadores especializados revisam barreiras.

### 6.3 Qualidade, performance, documentação e CI

- **Problema:** 32 testes são um começo, mas faltam integração, RLS, offline, PWA, E2E e CI; recursos 3D podem pesar; README ainda parece template Vite.
- **Objetivo pedagógico:** tornar aprendizagem confiável em escola, rede lenta e aparelho de baixo desempenho.
- **Comportamento esperado:** CI executa instalação, lint, typecheck, testes, build e validação de migrações. Adicionar testes de componentes, integração, Supabase/RLS, migrações, autenticação, sincronização, offline/PWA, acessibilidade, Playwright e fluxos aluno/professor/responsável. Definir orçamento de bundle, carregamento sob demanda e alternativa 2D. README documenta produto, arquitetura, requisitos, instalação, ambiente sem segredos, Supabase/migrações, testes, build/deploy, papéis e modelo pedagógico.
- **Arquivos provavelmente afetados:** configuração de CI, testes, documentação, build/Vite e componentes de carregamento.
- **Supabase:** validação de migrações e ambiente de teste isolado.
- **Dependências:** entregas de persistência e segurança.
- **Riscos:** pipeline lento. Dividir verificações rápidas e suites noturnas, sem remover gates críticos.
- **Critérios de aceite:** alteração curricular não passa sem testes de gerador/grafo; fluxo crítico passa em dispositivo/rede simulados; documentação não contém segredo.
- **Testes necessários:** os próprios gates descritos, incluindo abandono/retomada e baixo desempenho.
- **Validação com crianças e professores:** piloto em infraestrutura escolar real, medindo abertura, estabilidade e interrupções.

## Métricas e validação contínua

### Métrica principal

- **Percentual de habilidades retidas após 7 dias**, segmentado por eixo, ano, formato e nível de suporte, sem identificar crianças publicamente.

### Métricas complementares

- Retenção em 30 dias; ganho entre diagnóstico e avaliação posterior; transferência sem dica; tempo até domínio; redução de equívocos conceituais; uso de dicas e acerto após dica; abandono por atividade; conclusão de missão; retorno voluntário; tempo saudável de sessão; confiança percebida da criança.

Não otimizar apenas tempo de tela, respostas, XP, moedas ou sequência diária.

### Protocolo de validação

- Testes observados com 5–8 crianças de 6–7, 8–9 e 10–11 anos por ciclo, além de professores e responsáveis.
- Observar compreensão de instrução, jogo sem ajuda, reação ao erro, uso de dica, explicação de estratégia, frustração, cansaço, compreensão de recompensas e retenção posterior.
- Não registrar imagem, voz ou dado pessoal sem autorização adequada. Relatórios usam agregação e apelidos.

## Ordem recomendada de execução

1. Corrigir o salto de pré-requisitos (Entrega 1).
2. Separar os cinco anos (Entrega 2).
3. Definir privacidade e contrato de tentativas (Entrega 3; planejamento de 6.1 vem antes da tabela).
4. Registrar tentativas de forma idempotente (implementação posterior à aprovação do contrato e RLS).
5. Criar diagnóstico inicial (Entrega 4).
6. Criar estados de domínio (2.1).
7. Criar revisão por data (2.2).
8. Melhorar erro e reforço (1.3).
9. Unificar os modos (1.2).
10. Revisar e expandir currículo (1.6, 5.1 e 5.2).
11. Implementar formatos manipuláveis (3.1 e 3.2).
12. Desenvolver os mundos e a narrativa (4.1 e 4.2).

Cada fatia deve sair atrás de critérios de aceite, testes e validação com crianças/professores. A métrica de 7 dias decide se a próxima expansão continua, ajusta ou recua.
