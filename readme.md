

# Simulador de Coração Humano Virtual

Um simulador educacional interativo de fisiologia cardíaca que permite visualizar e controlar parâmetros cardíacos em tempo real. Desenvolvido com HTML, CSS e JavaScript puro, utilizando Three.js para a visualização 3D e Web Audio API para os sons cardíacos.

## Funcionalidades

- **Modelo 3D do Coração**: Visualização 3D interativa do coração que bate sincronizado com o ciclo cardíaco.
- **Gráficos em Tempo Real**:
  - ECG (Eletrocardiograma) - Derivação II
  - Pressão Arterial Sistêmica
  - Saturação de Oxigênio (SpO₂)
  - Fonocardiograma (PCG)
- **Controles Fisiológicos**:
  - Frequência cardíaca (30-220 bpm)
  - Contractilidade (0-200%)
  - Pré-carga (0-200%)
  - Pós-carga (0-200%)
  - FiO₂ - Fração inspirada de oxigênio (10-100%)
  - Volume sanguíneo (50-120%)
- **Arritmias**: Normal, Fibrilação Atrial, Flutter Atrial, Extrassístoles, Bigeminismo, Taquicardia Ventricular, Bradicardia Sinusal, BAV 1º/2º/3º grau.
- **Áudio**: Sons S1 e S2 sincronizados com o ciclo cardíaco.
- **Indicadores Calculados**: FC, VS, DC, PAS/PAD/MAP, SpO₂ e Ritmo atual.
- **Presets Clínicos**: Normal, FA, Taquicardia Sinusal, Bradicardia Sinusal, Hipovolemia, Hipóxia, TV Monomórfica.

## Como Usar

### Controles Principais

1. **Sliders**: Ajuste os parâmetros fisiológicos usando os sliders na parte inferior da tela.
2. **Arritmias**: Selecione diferentes tipos de arritmia no menu suspenso.
3. **Presets**: Clique nos botões de preset para simular condições clínicas específicas.
4. **Áudio**: Ative/desative o som do coração e ajuste o volume.
5. **Gráficos**: Alternar entre Pressão Arterial, SpO₂ e PCG usando os botões acima do segundo gráfico.

### Atalhos de Teclado

- **Espaço**: Pausar/Retomar simulação
- **R**: Resetar simulação
- **S**: Capturar snapshot dos gráficos

### Botões

- **Reset**: Retorna todos os parâmetros aos valores normais.
- **Pausar**: Pausa ou retoma a simulação.
- **Snapshot**: Salva os gráficos atuais como imagens PNG.

## Fisiologia e Equações

O simulador utiliza equações fisiológicas simplificadas mas baseadas em princípios reais:

### Equações Principais

- **Débito Cardíaco (DC)**: DC = FC × VS
- **Volume Sistólico (VS)**: VS = VS_base × (pré-carga/100) × (contractilidade/100) / (pós-carga/100)^0.5
- **Pressão Arterial Média (MAP)**: MAP ≈ DC × RVS (Resistência Vascular Sistêmica)
- **Efeito de Frank-Starling**: VS aumenta com a pré-carga
- **SpO₂**: Baseado na curva de dissociação da hemoglobina

### Arritmias

- **Normal**: Ritmo sinusal regular
- **Fibrilação Atrial (FA)**: Intervalo RR irregular, ausência de onda P
- **Flutter Atrial**: Ondas F em forma de dente de serra
- **Extrassístoles**: Batidas prematuras seguidas de pausa compensatória
- **Bigeminismo**: Alternância entre batida normal e extrassístole
- **Taquicardia Ventricular (TV)**: QRS largo, frequência rápida
- **Bradicardia Sinusal**: Frequência cardíaca < 60 bpm
- **BAV**: Bloqueio atrioventricular de diferentes graus

## Tecnologias Utilizadas

- **HTML5**: Estrutura semântica da página
- **CSS3**: Estilos e layout responsivo
- **JavaScript ES6+**: Lógica da aplicação
- **Three.js**: Renderização 3D do coração
- **Web Audio API**: Geração de sons cardíacos
- **Canvas API**: Renderização dos gráficos em tempo real

## Estrutura do Projeto

```
heart-simulator/
├── index.html          # Estrutura HTML principal
├── styles.css          # Estilos CSS
└── main.js             # Lógica principal da aplicação
```

## Instalação e Execução

1. **Clonar ou baixar o repositório**
   ```bash
   git clone https://github.com/seu-usuario/heart-simulator.git
   cd heart-simulator
   ```

2. **Abrir o arquivo index.html em um navegador moderno**
   - Basta abrir o arquivo `index.html` diretamente no navegador
   - Ou usar um servidor local (recomendado para melhor desempenho):
     ```bash
     # Usando Python
     python -m http.server
     # Ou usando Node.js com http-server
     npx http-server
     ```

3. **Acessar o simulador**
   - Abra o navegador e acesse `http://localhost:8000` (ou a porta configurada)

## Requisitos Técnicos

- Navegador moderno com suporte a:
  - WebGL (para Three.js)
  - Web Audio API
  - Canvas API
  - ES6+ (JavaScript moderno)

## Personalização

### Adicionar Novas Arritmias

Para adicionar uma nova arritmia:

1. No arquivo `main.js`, localize a classe `PhysiologyModel`
2. Adicione o novo tipo de arritmia no método `calculateNextBeatTime()`
3. Implemente a lógica específica para a nova arritmia
4. Atualize o método `getRhythmDescription()` para incluir a nova arritmia
5. Adicione a nova opção no elemento `<select id="arrhythmia-select">` no HTML

### Modificar Parâmetros Fisiológicos

Para ajustar as equações fisiológicas:

1. No arquivo `main.js`, localize a classe `PhysiologyModel`
2. Modifique os métodos relevantes:
   - `calculateIndicators()` para cálculos de VS, DC, PA, etc.
   - `generateECGPoint()` para alterar a forma do ECG
   - `generatePressurePoint()` para modificar a curva de pressão

### Personalizar a Visualização 3D

Para modificar o modelo 3D do coração:

1. No arquivo `main.js`, localize a classe `HeartVisualization`
2. Modifique o método `createHeartModel()` para alterar a geometria
3. Ajuste as cores e materiais no método `updateColor()`

## Licença

Este projeto é apenas para fins educacionais. Não substitui monitoramento clínico real.

## Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir uma issue ou enviar um pull request.

## Créditos

Desenvolvido como simulador educacional de fisiologia cardíaca.

## Aviso

Este simulador é uma ferramenta educacional e não deve ser usado para diagnóstico ou tratamento médico. As simulações são simplificações da fisiologia real e podem não refletir com precisão todas as condições clínicas.