# Arte dos heróis

Solte aqui os PNGs dos heróis. O jogo carrega automaticamente pelo nome.

## Padrão de nome
`<id-do-herói>-<estágio>.png` — estágio de 1 (iniciante) a 5 (maestria).

Ex. da Ester:
```
ester-1.png   (Órfã)
ester-2.png   (Escolhida)
ester-3.png   (Dama do Palácio)
ester-4.png   (Conselheira)
ester-5.png   (Rainha)
```

IDs dos heróis: `davi`, `ester`, `gideao`, `debora`, `josue`, `rute`.

## Requisitos da imagem
- Corpo inteiro, de frente, **mesma pose** nos 5 estágios.
- **Fundo transparente** (ideal). Fundo branco funciona nos cards da tela de
  escolha, mas dentro do jogo (batalha/tabuleiro) precisa ser transparente.
- Sem texto, sem cenário, um personagem por arquivo.

Se um herói ainda não tem arte, o jogo usa o emoji dele — nada quebra.
