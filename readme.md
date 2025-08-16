# Simulador de Coração Humano Virtual

Um simulador educacional interativo de fisiologia cardíaca que permite visualizar e controlar parâmetros cardíacos em tempo real.

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

## Requisitos Técnicos

- Navegador moderno com suporte a WebGL e Web Audio API
- TypeScript (opcional, para desenvolvimento)

## Estrutura do Projeto
