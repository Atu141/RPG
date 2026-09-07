# Arquivo Paranormal — O Hotel Espelho — V1.0.12

## Correção de sincronização Mestre → Jogador

Baseada na V1.0.8, que foi a última versão confirmada como funcional para PV, PE, SAN, perícias, classe, posição/mapa e condições.

### Alterações
- Removido o controle de revisão que podia descartar estados válidos.
- Mantido o fluxo de conexão PeerJS da V1.0.8.
- Criada sincronização direta `syncPlayer(playerId)` para o jogador dono da ficha.
- Mestre envia o snapshot completo da ficha após alterações de:
  - PV/PE/SAN
  - perícias
  - classe
  - posição
  - inventário
  - equipar/desequipar armas
  - rituais
- O snapshot completo inclui campanha + ficha, evitando sincronizações parciais.
- O mecanismo de fila do canal continua sendo usado quando a conexão ainda está abrindo.
- Heartbeat de sincronização continua ativo.

## Teste recomendado
1. Mestre celular cria mesa.
2. Jogador celular conecta.
3. Testar PV, PE, SAN, perícia, classe, condição e posição.
4. Adicionar arma.
5. Equipar arma.
6. Após equipar, alterar PV/PE/SAN, perícia, condição e posição.
7. Testar inventário e rituais.
8. Se tudo continuar sincronizando depois de equipar a arma, testar novamente em uma nova conexão.
