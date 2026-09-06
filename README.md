# Arquivo Paranormal — Hotel Espelho

## Estrutura consolidada

A versão de distribuição foi reorganizada para eliminar o carregamento de módulos históricos, QA, auditorias e patches de interface que já não são necessários na execução normal.

### Arquivos principais
- `index.html` — interface.
- `style.css` — estilos.
- `fichas.json`, `itens.json`, `armas.json`, `rituais.json`, `ameacas.json` — catálogos/dados.
- `js/01-core.js` — estado, jogadores, inventário, dados, mapa-base e migrações.
- `js/02-rules.js` — campanha, regras, recursos, classes, rituais e motor de jogo.
- `js/03-threats.js` — exploração, ameaças e interface de ameaças.
- `js/04-network.js` — sincronização e multiplayer.
- `js/05-master-tools.js` — mapa, combate e ficha do Mestre.
- `js/06-master-console.js` — Central do Mestre e controles por ficha.
- `js/07-mobile.js` — adaptação mobile.

## Central do Mestre
Cada ficha possui os controles essenciais: **LIBERAR/BLOQUEAR CLASSE**, **ADICIONAR ITEM** e **EXCLUIR FICHA**. O menu de adicionar item possui **Itens prontos** (catálogos JSON) e **Criar item** (personalizado).

## Execução
Abra por servidor HTTP/Live Server ou publique no GitHub Pages. O PeerJS é carregado pelo `index.html`.
