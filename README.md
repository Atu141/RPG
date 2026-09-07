# Arquivo Paranormal — O Hotel Espelho
## V1.1.1 — Etapa 1 gratuita: Vercel + Supabase PostgreSQL + Realtime

Esta versão substitui o transporte PeerJS por uma arquitetura persistente: o PostgreSQL/Supabase é a fonte oficial da sessão e o Supabase Realtime distribui as alterações aos jogadores.

## O que foi alterado
- Vercel pode hospedar o frontend estático.
- Supabase Free fornece PostgreSQL + Realtime + Auth anônimo.
- O estado da campanha é salvo na tabela `rpg_sessions`.
- Mestre e jogadores recebem alterações via Realtime.
- Inventário, armas equipadas, rituais, PV, PE, SAN, perícias, classe, condições e posição fazem parte do estado persistente.
- PeerJS deixa de ser o transporte da mesa.
- Correções de sincronização para criação/exclusão de fichas e prevenção de disputa pela mesma ficha.
- SQL preparado para ser executado novamente sem apagar as tabelas existentes.
- O navegador do Mestre não é mais o servidor da sessão.

## Configuração do Supabase
1. Crie um projeto no Supabase no plano Free.
2. No Dashboard, abra **Authentication → Providers** e habilite **Anonymous Sign-Ins**.
3. Abra **SQL Editor**.
4. Cole e execute todo o arquivo `supabase_schema.sql`.
5. Vá em **Project Settings → API**.
6. Copie a **Project URL** e a chave pública **Publishable key / anon key**. Nunca use `service_role`.
7. Abra `js/supabase-config.js`.
8. Preencha:

```js
window.SUPABASE_CONFIG = {
  url: 'https://SEU-PROJETO.supabase.co',
  anonKey: 'SUA_CHAVE_PUBLICA'
};
```

## Deploy no Vercel
1. Suba este projeto para um repositório GitHub.
2. No Vercel, **Add New → Project**.
3. Importe o repositório.
4. Para este projeto não é necessário framework nem build command.
5. Use a pasta raiz do projeto.
6. Faça o Deploy.
7. Abra a URL fornecida pelo Vercel.

## Teste inicial
1. Abra a URL do Vercel no celular do Mestre.
2. Faça login como Mestre normalmente.
3. Na Central da Mesa, pressione **CRIAR MESA (MESTRE)**.
4. Copie o link de convite.
5. Abra o link em outro celular.
6. O jogador será autenticado anonimamente e entrará na sessão.
7. Escolha uma ficha ou crie uma nova.
8. Teste PV, PE, SAN, classe, perícias, condições, posição, inventário, arma equipada e rituais.
9. Feche e reabra o navegador do jogador para confirmar que a sessão continua persistida.

## Limites do Free
O Supabase Free atualmente inclui 500 MB de banco por projeto, 1 GB de Storage, 5 GB de egress, 2 milhões de mensagens Realtime e 200 conexões Realtime simultâneas. Projetos Free podem ser pausados após uma semana de inatividade.

## Segurança
- A chave `service_role` nunca deve ser colocada no frontend.
- A aplicação usa autenticação anônima do Supabase.
- RLS protege as tabelas.
- O convite usa um código de sessão de 6 caracteres.
- Esta etapa é adequada para o uso privado da campanha; para publicação pública será necessário evoluir permissões, contas e auditoria.

## Arquivos novos
- `supabase_schema.sql` — banco, RLS, RPCs e Realtime.
- `js/supabase-config.js` — URL e chave pública do projeto.
- `js/08-supabase.js` — sincronização persistente.

## Observação
O arquivo `fichas.json` continua servindo como base inicial/local. O estado da sessão criada pelo Mestre passa a ser persistido no Supabase.
