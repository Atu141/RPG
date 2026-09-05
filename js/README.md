# Organização dos JavaScript — Hotel Espelho

Os scripts foram separados por responsabilidade, mantendo a execução como scripts clássicos do navegador para preservar as funções globais existentes e a compatibilidade com o projeto atual.

| Arquivo | Responsabilidade |
|---|---|
| `01-core.js` | Estado global, constantes, classes, perícias, carregamento inicial e navegação básica |
| `02-players.js` | Fichas, classes, atributos, perícias e renderização do jogador |
| `03-inventory.js` | Itens, equipamentos, armas e inventário |
| `04-master-campaign.js` | Central do Mestre, campanha, objetivos, pistas, enigmas e assassinos |
| `05-horror-map.js` | Horror, perseguição, investigação de salas e mapa do hotel |
| `06-data-dice.js` | Normalização de dados, inicialização e sistema de dados |
| `07-v030.js` | Camada V0.30: movimento, portas, eventos, combate e condições |
| `08-migrations.js` | Migrações e refinamentos de versões anteriores |
| `09-v039.js` | Camada V0.39: Central Mestre ↔ Jogador, cenas, encontros e testes |

### Ordem de carregamento

A ordem dos arquivos no `index.html` é intencional. Os scripts continuam no escopo global para não alterar as APIs/funções usadas pelo HTML e pelas versões anteriores.

### Regra de manutenção

Ao adicionar uma funcionalidade, coloque o código no arquivo correspondente à responsabilidade. Evite voltar a concentrar novas funções em um único arquivo.

## V0.42–V0.49 — Camada de consolidação
- `16-integrity.js`: integridade, diagnóstico e backups locais.
- `17-state-machine.js`: estados e transições narrativas.
- `18-investigation-plus.js`: testes de investigação e relações entre pistas.
- `19-puzzle-plus.js`: validação e configuração de enigmas.
- `20-killer-ai.js`: estados comportamentais dos quatro assassinos.
- `21-combat-plus.js`: camada de combate, dano, condições e histórico.
- `22-campaign-state-save.js`: autosave, slots e histórico de salvamento.
- `23-qa.js`: laboratório de testes e simulação de cenas.
- `24-evolution-ui.js`: painel final de operação e qualidade.

## V0.50–V0.55 — Pré-produção

- `25-master-ux.js`: experiência da Central Mestre, atalhos e foco de módulos.
- `26-sheet-integration.js`: estado em jogo, condições e histórico de rolagens.
- `27-hotel-game.js`: posições, portas e pontos de interesse do hotel.
- `28-investigation-final.js`: dependências e cadeia investigativa.
- `29-endings.js`: rotas e finais condicionais.
- `30-qa-final.js`: diagnóstico e simulação de regressão.

A camada foi criada sem remover os módulos anteriores. Os módulos usam o estado central da campanha e permanecem independentes para facilitar manutenção.
