# Arquivo Paranormal — O Hotel Espelho — V0.72

## Uso da sessão presencial

- O Mestre abre o site e entra com `mestre / 1234`.
- No painel **Sala da Mesa**, use **CRIAR MESA** e depois **COPIAR LINK**.
- Envie o link aos jogadores. Eles não precisam digitar código de sala.
- Cada jogador pode criar/selecionar sua ficha e acompanhar seus recursos pelo celular.
- O Mestre deve manter a página aberta durante a sessão para a sincronização PeerJS.
- Para uma mesa presencial, o celular do Mestre possui navegação rápida para Mapa, Jogadores, Ameaças, Combate e Mesa.

## Publicação GitHub Pages

Se o repositório for publicado em `https://atu141.github.io/RPG/`, o convite será gerado automaticamente usando esse endereço como base.

## Requisitos

- Navegador moderno.
- Internet para GitHub Pages e sincronização multiplayer.
- Nenhum servidor Python/Node é necessário para executar o site estático.


## V0.82 — Gerenciador de Fichas dos Jogadores
- O Mestre possui **VER FICHA COMPLETA** em cada jogador.
- Visualização somente leitura: recursos, atributos, classe, perícias, inventário, ataques, rituais, condições e identidade/histórico.
- Usa o estado atual do Mestre e não cria uma segunda cópia da ficha.
- Multiplayer continua usando a sincronização PeerJS já existente.

## V0.83 — Refatoração interna segura
- Base preservada: V0.82.
- Removido o módulo `js/19-puzzle-plus.js`, que não possuía consumidores ativos no projeto.
- Persistência consolidada: `saveLocal()` permanece como ponto principal de gravação do estado; `CampaignStorage` e a sincronização multiplayer delegam a gravação para ele.
- Criado `js/57-v083-architecture.js` para registrar módulos ativos e fornecer auditoria estrutural (`runArchitectureAudit()`).
- APIs públicas e IDs existentes foram preservados para evitar regressões na interface.
- Nenhuma regra de Ordem Paranormal, ficha, mapa, combate, investigação, ameaças, multiplayer ou visual foi alterada nesta versão.
