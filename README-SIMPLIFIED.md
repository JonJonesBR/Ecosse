# Ecosse Simplificado - Sandbox Planetário

Esta é uma versão simplificada do projeto Ecosse, um sandbox de simulação de ecossistemas planetários. Esta versão mantém as funcionalidades essenciais enquanto remove componentes complexos para facilitar a manutenção e o desenvolvimento.

## Características

- Geração de planetas com diferentes tipos (terrestre, deserto, gelado, oceânico)
- Configuração de propriedades planetárias (gravidade, atmosfera, temperatura, cobertura de água, luminosidade)
- Adição de elementos do ecossistema (plantas, herbívoros, carnívoros)
- Simulação básica de interações entre elementos
- Visualização 3D usando Three.js
- Sistema de persistência para salvar e carregar simulações

## Arquitetura Simplificada

A versão simplificada foi reorganizada em sistemas modulares:

- **Sistema de Eventos**: Gerencia a comunicação entre componentes
- **Sistema de UI**: Controla a interface do usuário e interações
- **Sistema de Simulação**: Gerencia a lógica de simulação do ecossistema
- **Sistema de Renderização**: Controla a visualização 3D
- **Sistema de Persistência**: Gerencia o salvamento e carregamento de estados

## Como Executar

1. Execute o arquivo `start-simplified.bat` para iniciar um servidor HTTP local
2. Acesse `http://localhost:8000/test-simplified.html` no seu navegador

## Controles

- **Botão Iniciar/Pausar**: Inicia ou pausa a simulação
- **Botão Reiniciar**: Reinicia a simulação
- **Botão Salvar**: Salva o estado atual da simulação
- **Botão Carregar**: Carrega um estado salvo anteriormente
- **Tecla Espaço**: Alterna entre iniciar e pausar a simulação
- **Tecla R**: Reinicia a simulação
- **Ctrl+S**: Salva o estado atual
- **Ctrl+L**: Carrega um estado salvo

## Arquivos Principais

- `test-simplified.html`: Página HTML principal
- `js/main-simplified.js`: Ponto de entrada da aplicação
- `js/eventSystem-simplified.js`: Sistema de eventos
- `js/uiSystem-simplified.js`: Sistema de interface do usuário
- `js/simulationSystem-simplified.js`: Sistema de simulação
- `js/renderingSystem-simplified.js`: Sistema de renderização 3D
- `js/persistenceSystem-simplified.js`: Sistema de persistência
- `css/style-simplified.css`: Estilos principais
- `css/canvas-resize-responsive-simplified.css`: Estilos responsivos para o canvas

## Diferenças da Versão Completa

Esta versão simplificada remove:

- Sistema de conquistas
- Árvore tecnológica
- Sistema de energia
- Gerenciamento de áudio avançado
- Música adaptativa
- Áudio espacial
- Cenários pré-definidos
- Sistema narrativo
- Cultura tribal
- Monitoramento de desempenho avançado
- Integração com IA (Gemini)
- Painel de genética
- UI adaptativa complexa

Esta versão mantém apenas os componentes essenciais para a simulação básica de ecossistemas planetários.