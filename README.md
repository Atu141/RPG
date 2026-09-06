# Arquivo Paranormal — O Hotel Espelho

## V1.0.6 — Correção de sincronização GitHub Pages / PeerJS

Base da V1.0.5 preservada, com correções de sincronização multiplayer:

- Estado da campanha agora é enviado explicitamente pelo Mestre para todos os jogadores conectados.
- O estado completo da campanha é enviado já no handshake inicial (`welcome`).
- A sincronização da ficha continua individual por jogador.
- A liberação/bloqueio de classe pelo Mestre força sincronização imediata da ficha correspondente.
- Alterações feitas pelo jogador continuam sendo enviadas ao Mestre e redistribuídas após persistência.
- Mensagens de erro do PeerJS passaram a informar o tipo do erro quando disponível.
- Evita loop de sincronização durante aplicação de estado remoto.

### GitHub Pages

O projeto continua sendo um site estático. O GitHub Pages hospeda os arquivos e o PeerJS fornece o canal de sinalização/WebRTC para a mesa. O navegador do Mestre deve permanecer aberto durante a sessão.

### Teste recomendado

1. Publique esta versão no GitHub Pages.
2. Abra a página do Mestre em um computador.
3. Crie a mesa e copie o link de convite.
4. Abra o link em outro dispositivo/navegador.
5. Selecione uma ficha.
6. No Mestre, no 5º andar, libere a classe para essa ficha.
7. Confirme que a opção de classe aparece no jogador.
8. Altere PV/PE/SAN no Mestre e confirme no celular.
9. Altere um recurso no celular e confirme no Mestre.
10. Inicie/avance/encerre o combate e confirme a atualização no celular.
