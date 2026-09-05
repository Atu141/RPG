# V0.71.1 — Combate + Sala da Mesa

Esta versão mantém o foco em uma **one-shot presencial**. O multiplayer não transforma o projeto em um VTT: ele serve para que cada jogador use a própria ficha no celular/computador e acompanhe **PV, PE, SAN, inventário, perícias e evolução** sem precisar manter anotações em papel.

## Novidades
- Central de combate no painel do Mestre.
- Seleção de participantes e iniciativa automática.
- Rodadas e troca de turnos.
- PV atual/máximo com dano, cura e edição manual.
- Rolagem de ataque e dano das ameaças.
- Histórico resumido do combate.
- Ficha detalhada das ameaças da sessão.
- Consulta rápida dos monstros e dos quatro assassinos.
- Rastreador de PV/PE/SAN diretamente na ficha do jogador.
- Fichas da Mesa via link direto usando PeerJS: o Mestre cria um link e os jogadores entram automaticamente de seus dispositivos, sem digitar código de sala.
- O Mestre continua sendo a autoridade sobre combate, regras, ameaças e progressão.
- Jogadores recebem somente o estado da própria ficha; o catálogo de ameaças permanece exclusivo do Mestre.

## Multiplayer presencial
1. No computador do Mestre, entre em **MESTRE** e use **Criar sala do Mestre**.
2. Compartilhe o código de 6 caracteres com os jogadores.
3. Cada jogador abre o mesmo site em seu celular/computador e informa o código.
4. O jogador escolhe uma ficha existente ou solicita a criação de uma nova ficha.
5. Alterações na ficha são enviadas ao Mestre e o estado da ficha é sincronizado de volta.

**Requisito:** o modo de fichas por link usa conexão de internet para o canal PeerJS. O modo somente neste dispositivo continua funcionando sem conexão entre jogadores.

**Importante:** a sala é de sessão. Ela não substitui um banco de dados e não foi desenhada para persistência entre sessões. Para a one-shot, isso é intencional.

---

## V0.40.3 — Profissões / Origens oficiais

- A criação de personagem agora exige uma Profissão/Origem da lista oficial de Ordem Paranormal RPG v1.3.
- As duas perícias treinadas de cada origem são aplicadas automaticamente.
- Benefícios mecânicos simples das origens são aplicados à ficha quando suportados pelo sistema local (ex.: Defesa, Sanidade, bônus de perícias e dano).
- O poder da origem fica registrado e visível na ficha para o Mestre/Jogador.
- A profissão/origem não pode mais ser digitada livremente na personalização.

## V0.40.2 — Personalização narrativa do personagem

A evolução V0.40.2 adiciona uma camada de customização para os jogadores sem permitir alterações nos valores mecânicos definidos pela campanha.

### Campos personalizáveis
- Nome
- Idade
- Profissão
- Aparência
- Personalidade
- Histórico

### Regras preservadas
A edição narrativa não altera NEX, classe, PV, PE, SAN, Defesa, atributos, perícias, treinamento, ataques ou inventário. Esses elementos continuam sujeitos às regras da campanha e ao controle do Mestre.

### Interface
- Botão **EDITAR PERSONAGEM** dentro da ficha.
- Modal responsivo para edição.
- Validação de nome duplicado.
- Dados persistidos em `localStorage`.
- Mestre pode consultar identidade/histórico de cada jogador em **IDENTIDADE / HISTÓRICO**.

### Compatibilidade
Fichas antigas recebem automaticamente os novos campos vazios por normalização, sem perda dos dados existentes.

# Arquivo Paranormal — Teste LocalHost

Versão de teste da campanha de survival horror investigativo. Os dados ficam no `fichas.json` e as alterações realizadas pelo Mestre são persistidas apenas no `localStorage` do navegador, simulando o comportamento de um banco antes da migração para Supabase.

## Executar

Abra a pasta no **VS Code** e instale a extensão **Live Server**. Depois, clique com o botão direito em `index.html` e escolha **Open with Live Server**. O navegador abrirá algo como `http://127.0.0.1:5500/`.

> Não abra o `index.html` diretamente com `file://`, porque o navegador pode bloquear o carregamento do JSON.

## Mestre

Usuário: `mestre`
Senha: `1234`

## Funcionalidades desta versão

- Área do jogador sem login e seleção da própria ficha.
- Ficha com PV, PE, SAN, atributos, defesa, ataques, inventário e perícias.
- Rolagem de ataque e dano com d20/dados de dano.
- Painel do Mestre protegido por login de demonstração.
- Alteração manual de PV dos jogadores e monstros.
- Campanha dividida em 5 andares.
- Controle de andar atual, objetivo e nível de perseguição.
- Quatro assassinos principais com informações exclusivas do Mestre.
- Ativação/desativação e movimentação dos assassinos.
- Enigmas e controle das chaves.
- Monstros básicos por andar/elemento.
- Histórico básico de eventos.
- Persistência local via `localStorage` para simular a sincronização durante os testes no mesmo navegador.

## Limitação proposital

Esta versão NÃO possui banco de dados nem sincronização entre computadores/celulares. O próximo passo, depois dos testes, é migrar as mesmas entidades para Supabase PostgreSQL + Realtime e publicar o frontend na Vercel.


## Correção da leitura do `fichas.json` — v0.4

A aplicação agora carrega o arquivo `fichas.json` diretamente pelo JavaScript usando `fetch()` com `cache: no-store`.

### Ordem correta dos arquivos

Mantenha estes arquivos na **mesma pasta**:

```text
Arquivo_Paranormal_Localhost/
├── index.html
├── style.css
├── script.js
├── fichas.json
└── README.md
```

O arquivo `fichas.json` não deve ser movido para outra pasta.

### Importante no Live Server

Abra **a pasta inteira do projeto** no VS Code e execute o `index.html` com **Open with Live Server**.

Não abra o arquivo diretamente pelo Windows Explorer (`file:///...`). O navegador precisa acessar o JSON por HTTP, por exemplo:

```text
http://127.0.0.1:5500/index.html
http://127.0.0.1:5500/fichas.json
```

Se `fichas.json` abrir no navegador mostrando o conteúdo JSON, o arquivo está sendo servido corretamente.

### Se o navegador ainda mostrar a versão antiga

1. Pare o Live Server.
2. Feche a aba antiga do projeto.
3. Abra novamente a pasta do projeto no VS Code.
4. Execute `index.html` com Live Server.
5. No navegador, faça `Ctrl + F5`.

O botão **↻ Recarregar JSON** também restaura os dados originais do arquivo e remove o estado salvo no `localStorage`.


## Atualizações da versão 0.5

- Mestre agora altera manualmente **PV, PE e SAN** de todos os jogadores.
- Cada assassino possui uma **ficha exclusiva** com PV, defesa, andar, sala, estado, descrição, fraquezas e ataques.
- Os ataques dos assassinos possuem botões de **Ataque** e **Dano** utilizando o mesmo rolador de dados.
- As fichas dos jogadores agora possuem botões **TESTAR** em cada perícia, usando a fórmula definida no `fichas.json`.
- As perícias passaram a utilizar objetos `{ nome, teste }` no JSON, facilitando futuras expansões.


## Atualizações da versão 0.7 — Perícias completas

- Catálogo completo das 28 perícias solicitadas.
- Perícias com `*` são identificadas visualmente como aquelas que exigem treinamento.
- O Mestre pode marcar/desmarcar o treinamento de cada perícia individualmente para cada jogador.
- Perícia treinada recebe `+5` na fórmula automática; perícia não treinada usa somente o atributo.
- Perícias com `*` que não estejam treinadas ficam bloqueadas para o jogador.
- `Sobrevivência` usa automaticamente o maior valor entre Intelecto e Presença.
- O Mestre define a **DT padrão das perícias** no painel da campanha, de 1 a 50.
- A DT atual também aparece na ficha do jogador.
- Toda rolagem de perícia compara automaticamente o resultado com a DT e mostra **SUCESSO** ou **FALHA**.
- Migração automática do estado antigo do `localStorage` para o novo modelo de treinamento.

### Regra de uso das perícias

- `*` = exige treinamento.
- **Treinada** = rolagem automática com `+5` além do atributo.
- **Não treinada** = rolagem automática apenas com o atributo, exceto perícias com `*`, que ficam indisponíveis até o Mestre treiná-las.
- Fórmulas explicitamente cadastradas nas fichas atuais são preservadas.


### v0.10 — Inventário do Mestre
- O Mestre pode abrir o inventário individual de cada jogador.
- Pode adicionar itens previamente salvos no catálogo.
- Pode criar novos itens com nome, descrição e quantidade.
- Itens criados ficam salvos no catálogo local e podem ser reutilizados em outros personagens.
- Itens existentes podem receber quantidade adicional.
- O Mestre pode remover unidades dos itens do inventário.
- Alterações ficam salvas no `localStorage`.
- O jogador visualiza imediatamente o inventário atualizado na ficha.


## v0.10
- Criação de itens no Mestre agora usa formulário próprio, otimizado para celular, sem prompts do navegador.
- Mestre pode informar nome, descrição e quantidade em uma única tela.
- Jogadores podem realizar testes diretos dos atributos FOR, AGI, INT, PRE e VIG.
- Testes de atributos usam 1d20 + valor do atributo e a DT padrão da campanha.


## v0.13
- A área do jogador separa o combate corpo a corpo sem armas das demais formas de combate.
- Ataques como Soco ficam em “Combate corpo a corpo”.
- Armas e demais ataques cadastrados ficam em “Armas equipadas”.
- Armas do inventário continuam aparecendo nessa área somente quando equipadas e com teste/dano cadastrados.


## v0.14 — Abertura narrativa e escolha de classe

- Os personagens começam no 5º andar, em **O Despertar**, sem contato anterior com o paranormal.
- As fichas iniciam com a classe **não definida**.
- O Mestre libera a escolha de classe pelo controle **Liberar escolha de classe no 5º andar**.
- Enquanto liberada e ainda sem classe, o jogador pode escolher entre Combatente, Especialista e Ocultista na própria ficha.
- O Mestre pode visualizar/definir a classe de cada jogador e reiniciar a escolha quando necessário.
- A narrativa pública reforça que o contato com o paranormal é uma descoberta durante a investigação.
- A escolha só aparece para jogadores no 5º andar e não revela informações secretas dos assassinos.

### v0.15 — Fichas iguais antes da descoberta
- Todos os quatro personagens começam com a mesma ficha-base: PV 16, PE 10, SAN 18, Defesa 11, atributos FOR/AGI/INT/PRE/VIG = 1.
- Todos começam com os mesmos ataques desarmados: Soco e Improvisado.
- O inventário inicial também é padronizado com uma Lanterna.
- As perícias começam sem treinamento; a lista completa de perícias continua disponível para evolução.
- Quando o Mestre libera a escolha no 5º andar, cada jogador escolhe Combatente, Especialista ou Ocultista.
- A escolha aplica imediatamente os bônus de classe, ataque característico e treinamentos iniciais.
- Reiniciar a classe devolve a ficha ao estado-base, permitindo refazer a descoberta durante os testes.


## v0.16–v0.19 — Melhorias de sessão
- Painel rápido do Mestre com recursos dos jogadores e atalhos de PV/SAN.
- Histórico de rolagens salvo em `logs`.
- Barra/resumo rápido de recursos no jogador.
- Sistema de salas investigadas por andar.
- Sistema de pistas públicas/secretas com revelar/ocultar.
- Evento narrativo atual e sorteador de eventos.
- Área pública do jogador mostra somente pistas reveladas e informações seguras.
- Estado de exploração persistido no localStorage.

Versão histórica; consulte a seção final deste README para a versão atual.

## Campanha — O Hotel Espelho

A campanha foi atualizada para refletir a versão atual do roteiro do One-Shot:

- Os personagens se conhecem e participaram juntos de um grande evento de Taekwondo antes de chegar ao hotel.
- Eles são civis/novatos e não possuem contato prévio com o Paranormal ou com a Ordo Realitas.
- Durante o dia, o Hotel Espelho funciona normalmente. A mudança ocorre ao anoitecer, quando a Membrana enfraquece.
- O objetivo central é sair vivo do hotel.
- Existem duas saídas seguras: **Hall de Entrada (térreo)** e **Terraço (resgate/evacuação)**.
- Os quatro antagonistas foram atualizados para **O Açougueiro (Sangue)**, **O Algoz Fúnebre (Morte)**, **O Juiz Sem Rosto (Conhecimento)** e **O Incendiário / Caótico (Energia)**.
- Cada assassino possui uma criatura correspondente e um local de destaque.
- A campanha está estruturada em três atos: Pós-Evento & Descanso; Despertar do Pesadelo; Corrida pela Sobrevivência.

## V0.20 — Horror

A versão V0.20 adiciona uma camada de horror e perseguição à sessão local:

- eventos aleatórios de horror com histórico;
- alertas visuais temporários para mudanças de perigo;
- sistema de perseguição aprimorado com alvo, assassino, distância e rodada;
- avanço/recuo entre estados Normal, Alerta, Caça e Perseguição;
- tela especial de perseguição para o jogador;
- efeitos visuais de tremor, flash e escurecimento;
- efeitos sonoros gerados pelo navegador com Web Audio API, sem arquivos externos;
- botão de evento de horror aleatório no painel do Mestre;
- botão de abertura da tela de horror durante uma perseguição;
- estado V0.20 persistido em `localStorage`.

### Como testar o horror

1. Abra o projeto pelo VS Code com Live Server.
2. Entre na área do Mestre com `mestre / 1234`.
3. No painel rápido, use `EVENTO ALEATÓRIO` para disparar um evento.
4. Em `PERSEGUIÇÃO`, selecione alvo e assassino.
5. Avance o estado até `PERSEGUIÇÃO` ou use `TELA DE HORROR`.
6. No jogador, a ação `☠ PERSEGUIÇÃO` abre a tela especial enquanto a perseguição estiver ativa.

O áudio usa a Web Audio API e pode exigir uma interação do usuário com a página para ser liberado pelo navegador.


## Estrutura atual do Hotel Espelho
- 9 andares no total.
- 5º andar: ponto inicial dos personagens.
- Andares 1–4: rota de fuga do Hall de Entrada / saída principal.
- Andares 6–9: rota de fuga do Terraço / resgate.
- Cada andar possui 8 a 10 ambientes, incluindo quartos e um diferencial temático (Cozinha, Biblioteca, Sala de Segurança, Gerador, Sala de Jogos etc.).
- Os quatro assassinos podem ser reposicionados pelo Mestre conforme a narrativa, sempre respeitando a regra de que não ocupam o 5º andar.


## Estrutura atual do Hotel Espelho
- O hotel possui 9 andares acima do térreo.
- O Hall de Entrada e a saída principal ficam no térreo.
- O 5º andar é o ponto inicial dos personagens.
- Rota inferior: 5º → 4º → 3º → 2º → 1º → Térreo/Hall.
- Rota superior: 5º → 6º → 7º → 8º → 9º → Terraço.
- Cada um dos 9 andares possui entre 8 e 10 quartos, além de ambientes diferenciais próprios.


## V0.30 — pacote integrado antes do primeiro teste

Esta versão consolida as melhorias planejadas da V0.22 até a V0.30 em uma única camada para teste: mapa funcional por andar, estados de portas, movimentação de jogadores, salas investigáveis/revelação, eventos por sala, integração visual com assassinos, perseguição/estado de campanha, combate com turno, condições e visão individual do jogador.

A persistência continua local via `localStorage`; o multiplayer real entre dispositivos fica para uma versão posterior. O 5º andar permanece como ponto inicial e protegido contra posicionamento de assassinos.

## V0.30.1 — refinamento do painel do Mestre

- Pistas reorganizadas por andar e tema, cobrindo os 9 andares e mantendo continuidade narrativa entre Segurança, Biblioteca, Restauração, Hospedagem, Eventos, Áreas Técnicas e Cobertura.
- Nomenclatura dos andares padronizada no formato `Nº Andar — Tema`, sem descrições extras no título.
- Movimentação & Estado recebeu cartões individuais com localização, recursos, condições e controles de movimentação por andar/sala.
- Mapa funcional recebeu representação visual de corredor central, alas de quartos, ambientes diferenciais, posições de jogadores, ameaças e portas/conexões.
- Aba de Eventos foi reformulada para permitir criar um evento personalizado com título, tipo, andar, sala e descrição, aplicar imediatamente, salvar para reutilização e encerrar o evento atual.
- Migração automática para estados antigos do localStorage: as novas pistas e nomenclaturas são incorporadas sem perder pistas já reveladas.

## v0.30.2 — Correções do painel do Mestre e mapa do jogador

- Corrigido o carregamento das salas do mapa funcional: cada andar utiliza corretamente seu objeto de salas.
- Corrigida a associação da posição dos jogadores às salas, aceitando tanto códigos (`501`) quanto nomes (`Quarto 501`).
- A movimentação do Mestre agora grava a sala canônica e o mapa atualiza a posição do jogador imediatamente.
- O mapa do Mestre apresenta quartos, ambientes especiais, jogadores presentes, portas e ameaças do andar selecionado.
- Criado painel visual para aplicação de múltiplas condições, substituindo o prompt do navegador.
- Eventos personalizados podem ser criados pelo Mestre com título, tipo, andar e sala ou andar inteiro, ficando salvos e disponíveis para ativação posterior.
- O evento aplicado passa a ser exibido na visão dos jogadores.
- Criado mapa público somente leitura para os jogadores.
- O jogador vê somente o mapa do próprio andar atual e não possui controles para trocar o andar, investigar salas ou alterar portas.
- O mapa público informa a localização do próprio personagem, salas investigadas, ambientes especiais e evento atual.


## V0.30.5 — sincronização do mapa, eventos e condições

- O **Mapa funcional** agora acompanha imediatamente o andar selecionado no **Mapa do Hotel Espelho** e também acompanha alterações feitas pelos controles gerais de andar.
- A posição dos jogadores é refletida no mapa funcional após qualquer movimentação.
- Eventos personalizados passaram a possuir um estado de evento ativo, localização (andar e, opcionalmente, sala), ativação explícita e encerramento.
- Um evento aplicado a uma sala é exibido para jogadores que estejam naquela sala; um evento aplicado ao andar inteiro é exibido aos jogadores presentes naquele andar.
- Eventos salvos podem ser ativados novamente e o evento ativo fica destacado visualmente no painel do Mestre.
- Corrigida a associação entre códigos e nomes de salas na revelação causada por eventos.
- Corrigido o botão **CONDIÇÃO**: o modal agora utiliza o estado visual correto (`show`) e pode ser fechado pelo botão, por clique fora ou por cancelamento.
- Melhorada a interface de condições com ícones, seleção visual e confirmação.
- A visão do jogador permanece somente leitura e mostra o mapa geral sem controles para alterar andar, sala, portas ou investigação.

## V0.30.6 — Central de Eventos 2.0
- Central de eventos recebeu filtros por Todos, Andar Atual, Exploração e Personalizados.
- Eventos de exploração e eventos criados pelo Mestre permanecem em uma única linha do tempo, com origem identificada.
- A criação de um novo evento desativa corretamente o evento anteriormente ativo.
- A listagem suporta até 30 eventos recentes, mantendo ativação e exclusão dos personalizados.

## V0.39 — Sistema Mestre/Jogador
A V0.31–V0.39 consolida cena/narrativa, encontros, testes, horror, portas, itens de sala, mapa somente leitura do jogador e separação visual Mestre/Jogador. O multiplayer real entre dispositivos permanece fora desta versão.


## V0.40 — Organização dos JavaScript

Os arquivos JavaScript foram reorganizados por responsabilidade na pasta `js/`, mantendo a ordem de carregamento e as funções globais para preservar a compatibilidade com o projeto.


## V0.40.4 — Ficha inicial aprovada
- A ficha inicial distribuída pelo projeto é somente a de **Arthur Reis**.
- Foi adicionada uma migração única (`_rosterSchemaVersion=1`) que remove as fichas antigas de Mariane Alves, Lucas Martins e Beatriz Lima de estados previamente salvos no `localStorage`.
- Após a migração, o sistema continua permitindo a criação de novas fichas pelo botão **CRIAR FICHA**.

## V0.41 — Motor de Campanha

A partir desta versão, o projeto possui uma camada central de campanha separada dos sistemas legados.

### Organização JavaScript
- `01-core.js` — estado global, navegação e base.
- `02-players.js` — fichas, classes, atributos e perícias.
- `03-inventory.js` — inventário e equipamentos.
- `04-master-campaign.js` — controles legados da campanha.
- `05-horror-map.js` — horror, perseguição e mapa.
- `06-data-dice.js` — normalização e rolagens.
- `07-v030.js` — mapa, movimento, eventos, combate legado e condições.
- `08-migrations.js` — migrações.
- `09-v039.js` — Central Mestre ↔ Jogador.
- `10-campaign-engine.js` — estado narrativo, atos, cenas, objetivos e consequências.
- `11-investigation.js` — catálogo de pistas e descobertas.
- `12-puzzles.js` — quatro chaves e progressão dos enigmas.
- `13-combat-engine.js` — iniciativa, rodada, turnos, ataques e log de combate.
- `14-campaign-save.js` — salvar, exportar, importar e nova campanha.
- `15-campaign-ui.js` — integração visual da V0.41.

### Persistência
O estado continua sendo salvo em `localStorage` para uso local. A V0.41 também permite exportar a campanha para JSON e importar posteriormente.

### Compatibilidade
Os sistemas V0.30/V0.39 não foram removidos. O motor V0.41 funciona como uma camada superior de integração, reduzindo o risco de regressão nas funcionalidades existentes.

## V0.42–V0.49 — Consolidação antes do multiplayer
A evolução até V0.49 foi consolidada em módulos independentes. Esta etapa não implementa rede nem multiplayer. O objetivo é estabilizar o motor local: integridade/migrações, salvamento robusto, máquina de estados, investigação avançada, enigmas, comportamento dos assassinos, combate estruturado, consequências e laboratório de QA. O painel **Operação & Qualidade** permite diagnóstico, backup, autosave e simulação de cenas.

## V0.55 — Pré-multiplayer

Esta versão encerra a evolução local prevista antes da rede. O projeto consolida UX do Mestre, ficha em jogo, hotel operacional, investigação, finais e QA. Não há servidor, WebSocket ou sincronização de rede nesta versão.

### Ordem dos módulos V0.50–V0.55

1. `25-master-ux.js` — Central do Mestre e navegação.
2. `26-sheet-integration.js` — integração da ficha durante a sessão.
3. `27-hotel-game.js` — estado operacional do hotel.
4. `28-investigation-final.js` — investigação e dependências.
5. `29-endings.js` — rotas e finais.
6. `30-qa-final.js` — testes de regressão e simulação.

Use o Live Server do VS Code para executar o projeto.


## V0.55.2 — Auditoria de conteúdo e correções

- Revisão textual geral da campanha, com padronização de **Taekwondo**.
- Verificação da estrutura dos 9 andares, rotas, ponto inicial e restrição dos assassinos no 5º andar.
- Verificação das 26 origens oficiais da versão 1.3 e correção das descrições de poderes no catálogo local.
- Correção de um erro na edição da identidade do personagem que poderia interromper o salvamento.
- Os quatro enigmas principais agora possuem enunciado, dados, pista, resposta, dica, falha e recompensa.
- Os dois enigmas de saída (Hall e Terraço) também possuem sequência, resposta e condição de rota.
- Esta versão permanece local e não implementa multiplayer.

## Auditoria V0.55.2 — resultado

A auditoria foi realizada antes da próxima etapa do projeto. Foram verificadas a estrutura do hotel, personagens, assassinos, rotas, textos da campanha, origens, enigmas, persistência e sintaxe dos módulos.

### Correções encontradas e aplicadas

1. Corrigido erro na função de salvamento da personalização do personagem, que referenciava variáveis inexistentes.
2. Padronizado o nome do esporte para **Taekwondo**.
3. Corrigidas descrições dos poderes das 26 origens oficiais da versão 1.3 no catálogo local; os benefícios passivos simples suportados pelo sistema continuam automatizados.
4. Os quatro enigmas de progressão receberam dados determinísticos, resposta, pista, dica, consequência e recompensa.
5. Os enigmas das duas saídas também receberam solução determinística e condição de rota.
6. Corrigida a validação de respostas dos enigmas para ignorar acentuação e diferenças de pontuação/maiúsculas.
7. Verificada a compatibilidade entre a ficha inicial de Arthur Reis, os 9 andares e os quatro assassinos.
8. Verificada a existência e a ordem dos 30 módulos JavaScript carregados pelo `index.html`.

### Resultado

- JavaScript: **30/30 arquivos aprovados no `node --check`**.
- JSON: **`fichas.json` aprovado**.
- Personagem inicial: **Arthur Reis**.
- Andares: **9/9**.
- Assassinos: **4/4**, nenhum no 5º andar.
- Enigmas de progressão: **4/4 completos**.
- Enigmas de saída: **2/2 completos**.
- Multiplayer: **não iniciado**.

## V0.56 — Grimório de Rituais
- Implementado catálogo de rituais baseado na **Lista de Rituais do Ordem Paranormal RPG v1.3, p. 122–123**.
- Catálogo contém 85 entradas, incluindo os rituais de Medo e suas exigências de trilha ficam apenas como referência de elemento; o sistema não tenta aplicar regras não solicitadas.
- Para cada ritual são armazenados somente: **nome, elemento/tipo e círculo**.
- Apenas personagens com classe **Ocultista** exibem o bloco de rituais.
- Mestre pode adicionar, remover e liberar/ocultar cada ritual individualmente.
- O jogador vê somente os rituais liberados pelo Mestre.
- Custos, DT, alcance, duração, efeitos, versões Discente/Verdadeiro e demais regras continuam no livro físico/PDF e não foram duplicados no sistema.
- A ficha usa `rituais` como coleção persistida no `localStorage`.

## V0.58 → V0.61 — Regras e Investigação

- **V0.58 — Motor de Regras:** testes de atributo/perícia com quantidade de d20 conforme o atributo, bônus por grau de treinamento, recursos e relação elemental.
- **V0.59 — Condições:** condições do livro com duração opcional e controle pelo Mestre.
- **V0.60 — Combate:** resolução de ataque contra Defesa, dano, resistência a dano e testes de resistência com modificadores elementais.
- **V0.61 — Investigação:** cenas de investigação com urgência, rodadas, procurar pistas, facilitar investigação, falhas e redução de tempo a cada três falhas.
- **Classes v1.3 corrigidas:** Combatente, Especialista e Ocultista agora usam os valores de PV/PE/SAN e proficiências da classe conforme o PDF; a ficha não recebe bônus de atributos fictícios nem armas automáticas. No NEX 5%, respectivamente: Combatente 20+VIG / 2+PRE / 12 SAN; Especialista 16+VIG / 3+PRE / 16 SAN; Ocultista 12+VIG / 4+PRE / 20 SAN.
- O Ocultista passa a exigir a escolha dos **3 rituais iniciais de 1º círculo** pelo Mestre.
- O Mestre pode configurar as perícias de classe e alterar o NEX pela central de regras.

## V0.62 — Versão jogável / sessão presencial

Esta versão fecha a base para uso presencial, mantendo o navegador como ferramenta de qualidade de vida.

### Dados externos
- `itens.json`: catálogo separado de itens/equipamentos da campanha.
- `rituais.json`: catálogo separado de rituais baseado na lista de rituais da v1.3.
- `fichas.json`: somente estado inicial da campanha, jogadores, andares, enigmas e antagonistas; não depende dos catálogos para armazenar a lista completa.

### Correções e regras
- Distribuição automática de atributos corrigida para 9 pontos: Combatente 3/2/1/1/2; Especialista 1/3/3/1/1; Ocultista 1/1/3/3/1.
- Limite de PE por turno derivado do NEX.
- Progressão de recursos por classe preservada conforme v1.3.
- Crítico estruturado para dobrar somente os dados de dano, preservando bônus numéricos.
- Relação elemental oficial integrada ao motor.
- Catálogos carregados por `fetch` no início da sessão; o projeto continua exigindo Live Server.
- Estado local continua em `localStorage` para qualidade de vida durante a sessão.

### Escopo da sessão
A aplicação é um auxiliar de mesa: a resolução narrativa e as regras completas que não possuem representação automática continuam sob decisão do Mestre. O PDF v1.3 continua sendo a referência para efeitos completos de rituais, poderes, trilhas, armas e condições.


## V0.66 — Limpeza da visualização do Mestre
Removido o Painel rápido legado, que duplicava recursos, exploração, pistas e perseguição já cobertos pelos módulos dedicados. Também foram removidos os controles de navegação duplicados do Perfil do Mestre e ajustados os pontos de inserção dos painéis dependentes.

## V0.70 — Consolidação do Motor de Jogo

A versão V0.70 introduz uma camada consolidada de regras e estado:
- `GameEngineV070`: API autoritativa para testes, recursos, combate, condições, rituais, NEX e inventário.
- IDs estáveis para personagens, ameaças e itens.
- Registro estruturado de eventos do motor para futura sincronização multiplayer.
- Combate com iniciativa rolada, rodadas, turnos, ações, reações, ataque, crítico, dano e morte.
- Limite de PE por turno integrado ao gasto de recursos.
- Progressão de NEX restrita aos valores oficiais e fila de habilidades pendentes.
- Condições com efeitos mecânicos essenciais e duração.
- Capacidade de carga e estado de sobrecarga.
- Compatibilidade com as APIs legadas: `RuleEngine`, `CombatRulesV060`, `CombatPlus` e `ConditionEngine` encaminham suas operações ao motor consolidado.
- `MotorQA` e painel operacional para regressão/auditoria.

A arquitetura continua local e usa `localStorage`; nenhuma funcionalidade de multiplayer foi ativada nesta versão.


## V0.70.4 — Otimização da Central do Mestre
- Removidos da visualização do mapa funcional os blocos duplicados de Movimentação & Estado e Eventos.
- O mapa funcional permanece como núcleo da exploração.
- Movimentação fica centralizada no módulo HotelGame; condições no ConditionEngine; combate no GameEngineV070; cenas/eventos narrativos no CampaignEngine/V039.
- Removido o modal legado de condições e exports de eventos da camada V0.30.
- Corrigida a posição inicial de personagens no HotelGame.

## V0.70.5 — Responsividade e organização visual
- Layout Mestre e Jogador adaptado para desktop, notebook, tablet e celular.
- Grade da Central do Mestre reorganizada em blocos responsivos.
- Mapa ocupa melhor a largura disponível e reduz colunas progressivamente em telas menores.
- Ficha do jogador adapta atributos, recursos, inventário e painéis para telas estreitas.
- Barra superior, formulários, botões e listas ajustados para evitar overflow horizontal.
- Mantida toda a lógica da V0.70.4; alteração focada em apresentação e responsividade.

## V0.70.8 / V0.80-prep
- `ameacas.json` separa o catálogo das ameaças das instâncias mutáveis da sessão.
- `ThreatEngine` e `ThreatUI` permitem adicionar ameaças, controlar PV e condições.
- `SessionSyncV080` prepara IDs de sessão/dispositivo, revisão monotônica e `BroadcastChannel` opcional; não sincroniza automaticamente nem exige servidor.
- `SessionUI` exibe revisão e histórico recente do motor.
- `QAV080` verifica catálogo, instâncias, IDs e estado de sincronização.

## V0.70.9 — Catálogo completo de ameaças
O arquivo `ameacas.json` foi ampliado para contemplar as criaturas com fichas prontas do Capítulo 7 do Ordem Paranormal RPG v1.3, mantendo separadas as instâncias mutáveis da sessão. As entradas `m1`, `m2` e `m3` foram preservadas para compatibilidade com a campanha O Hotel Espelho, assim como os quatro assassinos customizados. O Gerenciador de Ameaças ganhou busca rápida no catálogo.


## V0.71.1 — Link direto para jogadores
- O Mestre cria um link único depois de iniciar a conexão PeerJS.
- O jogador abre o link e conecta automaticamente, sem código de sala.
- O jogador pode criar sua própria ficha pelo formulário normal; a nova ficha é enviada ao Mestre automaticamente.
- O jogador pode acompanhar PV, PE, SAN, inventário e evolução no próprio dispositivo.
- O Mestre continua sendo a autoridade sobre regras, classes, ameaças e informações secretas.
- A conexão precisa que o endereço do site seja acessível pelos jogadores (preferencialmente HTTPS/publicado).
- Se o projeto estiver aberto somente em localhost, o link não será acessível a celulares externos; publique o site em GitHub Pages, hospedagem estática equivalente ou abra o Live Server em uma rede acessível.
