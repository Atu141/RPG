# Arquivo Paranormal — O Hotel Espelho
## V1.3.1 — Arquitetura refatorada + Vercel + Supabase Free

Esta versão mantém as funcionalidades da V1.1.3, mas remove as camadas antigas de composição da interface do Mestre que sobrescreviam `renderMaster`, `renderSheet` e outros pontos de entrada. O Supabase continua sendo a fonte persistente da sessão e o Realtime continua sendo o mecanismo de atualização online.

## Principais mudanças da V1.3
- Removida a antiga Central `V0.98` (`UIV098`) do runtime.
- Removido o transporte PeerJS do carregamento da aplicação.
- `05-master-tools.js` passou a ser uma camada única de ferramentas do Mestre, sem wrappers de `renderMaster`/`renderMasterBase`.
- `06-master-systems.js` concentra combate, estado de sessão, horror, mapa auxiliar, ameaças e ferramentas de backup sem substituir renderizadores globais.
- `renderMaster()` e `renderSheet()` permanecem definidos no núcleo (`01-core.js`) e chamam explicitamente os módulos opcionais por APIs (`V030`, `V085`, `MasterPlayerTools`, `ConditionUI`, `CombatV090`, `SyncV092`).
- Condições e rituais não sobrescrevem mais `renderMaster`/`renderSheet`; o núcleo chama seus renderizadores diretamente.
- A Sala da Mesa permanece como elemento permanente no `index.html`, e o Supabase apenas preenche seu conteúdo.
- Painel de combate, rastreador de recursos e sessão/backup também possuem containers permanentes no HTML.
- Controles do Mestre por ficha ficam em um único ponto: visualizar ficha, liberar/bloquear classe, adicionar item e excluir ficha.

## Estrutura de pastas
```text
Arquivo Paranormal/
├── index.html
├── README.md
├── css/
│   └── style.css
├── js/
│   ├── 01-core.js
│   ├── 02-rules.js
│   ├── 03-threats.js
│   ├── 05-master-tools.js
│   ├── 06-master-systems.js
│   ├── 07-mobile.js
│   └── 08-supabase.js
├── data/
│   ├── fichas.json
│   ├── itens.json
│   ├── armas.json
│   ├── rituais.json
│   └── ameacas.json
├── config/
│   └── supabase-config.js
└── database/
    └── supabase_schema.sql
```

## Arquitetura ativa
```text
01-core.js
  ├─ estado, fichas, inventário, renderização principal
  ├─ mapa funcional V030
  └─ chamadas explícitas aos módulos de UI/sistema
02-rules.js
  ├─ regras e motor de jogo
  ├─ rituais
  └─ condições, sem wrappers de renderização
03-threats.js
  └─ catálogo e ameaças
05-master-tools.js
  ├─ ficha do jogador para o Mestre
  ├─ exclusão de ficha
  ├─ controles por ficha
  └─ mapa unificado V085
06-master-systems.js
  ├─ combate V090
  ├─ status/sessão
  ├─ horror/eventos
  └─ backup local
07-mobile.js
  └─ navegação mobile
08-supabase.js
  └─ PostgreSQL + Auth anônimo + Realtime
```

## Supabase
1. Habilite **Authentication → Providers → Anonymous Sign-Ins**.
2. Execute `database/supabase_schema.sql` no SQL Editor. O script é reexecutável e não deve apagar as tabelas existentes.
3. Em `config/supabase-config.js`, informe somente a Project URL e a Publishable key. Nunca coloque uma Secret/service_role key no frontend.
4. Publique a pasta no Vercel.

## Teste recomendado
1. Mestre faz login.
2. A seção **Sala da Mesa** deve aparecer diretamente na Central do Mestre.
3. Clique em **CRIAR MESA (MESTRE)**.
4. Confirme no Supabase que uma linha foi criada em `rpg_sessions`.
5. Abra o convite em outro dispositivo.
6. Crie/assuma uma ficha.
7. Teste classe, item, arma, ritual, PV, PE, SAN e condições.
8. Confirme as alterações em tempo real no jogador.

## Observação
`data/fichas.json`, `data/itens.json`, `data/armas.json`, `data/rituais.json` e `data/ameacas.json` continuam sendo catálogos/base local. A sessão criada pelo Mestre é persistida no Supabase.


## V1.3 — Sincronização resiliente
- Supabase Realtime continua como canal principal.
- O Mestre consulta periodicamente o estado persistido em `rpg_sessions` para recuperar eventos de Realtime que não cheguem ao navegador.
- O contador de jogadores usa `rpg_session_members`, distinguindo jogadores conectados de fichas cadastradas.
- O schema explicita `pgcrypto` no schema `extensions` e usa `extensions.gen_random_bytes`.


## V1.3.1 — Correção de navegação

- Navegação FICHAS/MESTRE vinculada por um handler independente dos módulos principais.
- Mantido o handler do núcleo com proteção contra dupla vinculação.
- Objetivo: impedir que uma falha de inicialização de outro módulo bloqueie o acesso à tela do Mestre.
