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
