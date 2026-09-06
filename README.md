# Hotel Espelho RPG — V1.0.2

## Correção do rolador da ficha do jogador

- Perícias agora geram fórmulas compatíveis com o rolador: `1d20 + atributo + treinamento`.
- Armas do catálogo que possuem `teste: Luta` ou `teste: Pontaria` agora resolvem automaticamente a perícia correspondente do jogador.
- Armas adicionadas pelo Mestre passam a funcionar nos botões **ATACAR** e **DANO** da ficha do jogador.
- Fórmulas de dano com alternativas (`1d4/1d6`, por exemplo) usam a primeira expressão como padrão para evitar o erro de fórmula inválida.
- Mantida a Central do Mestre e suas funcionalidades existentes.

## Arquivos principais

- `index.html` — interface
- `style.css` — estilos responsivos
- `js/01-core.js` — ficha, rolagens e inventário
- `js/02-rules.js` — regras e rituais
- `js/03-threats.js` — ameaças
- `js/04-network.js` — sincronização
- `js/05-master-tools.js` — ferramentas do Mestre
- `js/06-master-console.js` — Central do Mestre
- `js/07-mobile.js` — ajustes mobile
- `itens.json` — catálogo de itens
- `armas.json` — catálogo de armas
- `rituais.json` — catálogo de rituais
- `ameacas.json` — catálogo de ameaças
- `fichas.json` — dados base das fichas
