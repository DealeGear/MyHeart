# README - Simulador de Monitor Cardíaco Virtual

## Descrição

O Simulador de Monitor Cardíaco Virtual é uma aplicação web client-side que reproduz a interface e funcionalidade de um monitor multiparamétrico hospitalar. O simulador permite visualizar em tempo real o ECG (eletrocardiograma) e outros parâmetros fisiológicos, além de permitir a manipulação de variáveis fisiológicas e a simulação de diferentes condições clínicas.

## Funcionalidades

- **Monitoramento em Tempo Real**:
  - ECG (derivação II) com ondas P-QRS-T realistas
  - Pressão arterial invasiva (PAS/PAD/MAP)
  - SpO₂ (saturação de oxigênio)
  - Frequência respiratória

- **Controles Fisiológicos**:
  - Frequência cardíaca (30-220 bpm)
  - Contractilidade (0-200%)
  - Pré-carga (0-200%)
  - Pós-carga (0-200%)
  - FiO₂ (10-100%)
  - Volume sanguíneo (50-120%)

- **Simulação de Arritmias**:
  - Sinusal normal
  - Taquicardia sinusal
  - Bradicardia sinusal
  - Fibrilação atrial
  - Flutter atrial
  - Extrassístoles ventriculares
  - Taquicardia ventricular
  - Bloqueio AV

- **Presets Clínicos**:
  - Normal
  - Taquicardia
  - Bradicardia
  - Fibrilação Atrial (FA)
  - Taquicardia Ventricular (TV)
  - Hipovolemia
  - Hipóxia
  - Choque Séptico
  - Choque Cardiogênico
  - Crise Hipertensiva
  - Edema Pulmonar
  - Hipóxia Leve
  - Hipóxia Grave
  - Anemia

- **Recursos Adicionais**:
  - Simulação de isquemia/hipóxia
  - Áudio sincronizado com batimentos cardíacos (S1/S2)
  - Interface responsiva
  - Controle de volume do áudio

## Estrutura do Projeto

```
├── index.html       # Estrutura HTML da aplicação
├── style.css        # Estilos e layout do monitor
├── script.js        # Lógica de simulação e gráficos
└── README.md        # Documentação do projeto
```

## Como Usar

1. **Abrir a Aplicação**:
   - Abra o arquivo `index.html` em um navegador moderno (Chrome, Firefox, Edge, etc.)

2. **Controles Principais**:
   - **Reset**: Restaura todos os parâmetros para os valores padrão
   - **Pausar/Continuar**: Pausa ou retoma a simulação
   - **Som ON/OFF**: Ativa ou desativa o áudio dos batimentos cardíacos

3. **Visualização de Parâmetros**:
   - O gráfico superior sempre exibe o ECG (derivação II)
   - Use o menu suspenso no gráfico inferior para alternar entre:
     - Pressão Arterial
     - SpO₂
     - Frequência Respiratória

4. **Ajuste de Parâmetros**:
   - Use os sliders para ajustar os parâmetros fisiológicos
   - Os valores são atualizados em tempo real nos gráficos e nos indicadores numéricos

5. **Simulação de Condições**:
   - Selecione uma arritmia no menu suspenso
   - Ative/desative a simulação de isquemia/hipóxia
   - Use os botões de preset para simular condições clínicas específicas

6. **Controle de Áudio**:
   - Ajuste o volume do áudio com o slider correspondente
   - O áudio é sincronizado com os complexos QRS do ECG

## Presets Clínicos Disponíveis

### Condições Básicas
- **Normal**: Parâmetros fisiológicos normais
- **Taquicardia**: Frequência cardíaca elevada (>100 bpm)
- **Bradicardia**: Frequência cardíaca reduzida (<60 bpm)
- **Fibrilação Atrial (FA)**: Ritmo atrial irregular e rápido
- **Taquicardia Ventricular (TV)**: Ritmo ventricular rápido com QRS largo
- **Hipovolemia**: Redução do volume sanguíneo com taquicardia compensatória
- **Hipóxia**: Redução da saturação de oxigênio com taquicardia

### Condições Avançadas
- **Choque Séptico**:
  - Taquicardia compensatória
  - Redução da contractilidade
  - Vasodilatação (redução da pós-carga)
  - Hipovolemia relativa
  - Hipóxia tecidual

- **Choque Cardiogênico**:
  - Taquicardia compensatória
  - Redução severa da contractilidade
  - Aumento da pré-carga (congestão)
  - Vasoconstrição (aumento da pós-carga)
  - Hipóxia por baixo débito

- **Crise Hipertensiva**:
  - Frequência cardíaca normal ou ligeiramente elevada
  - Aumento da contractilidade
  - Vasoconstrição severa
  - Pressão arterial muito elevada

- **Edema Pulmonar**:
  - Taquicardia
  - Redução da contractilidade
  - Aumento significativo da pré-carga
  - Hipóxia severa
  - Pressão arterial elevada

- **Hipóxia Leve**:
  - Taquicardia leve
  - Parâmetros normais exceto FiO₂ reduzida
  - Sem isquemia significativa

- **Hipóxia Grave**:
  - Taquicardia acentuada
  - Redução da contractilidade
  - FiO₂ muito baixa
  - Isquemia tecidual

- **Anemia**:
  - Taquicardia compensatória
  - Aumento da contractilidade
  - Redução da pré-carga (hipervolemia relativa)
  - Redução da pós-carga (vasodilatação)
  - Sem hipóxia (a menos que grave)

## Requisitos

- Navegador web moderno com suporte a:
  - HTML5
  - CSS3
  - JavaScript ES6+
  - Web Audio API
  - Canvas API

## Notas Técnicas

### Modelo Fisiológico Simplificado

O simulador utiliza um modelo fisiológico simplificado baseado nas seguintes relações:

- Débito Cardíaco (DC) = Frequência Cardíaca (FC) × Volume Sistólico (VS)
- Pressão Arterial Média (MAP) ≈ DC × Resistência Vascular Sistêmica (RVS)
- O Volume Sistólico é afetado por:
  - Contractilidade
  - Pré-carga
  - Pós-carga
  - Volume sanguíneo

### Geração de Sinais

- **ECG**: Gerado sinteticamente com morfologia variável conforme a arritmia selecionada
- **Pressão Arterial**: Curva com características fisiológicas (sístole, diástole, incisura dicrótica)
- **SpO₂**: Variações sutis sincronizadas com a respiração
- **Frequência Respiratória**: Onda sinusoidal representando o ciclo respiratório

### Áudio

O áudio é gerado usando a Web Audio API com dois componentes principais:
- **S1**: Som de fechamento das valvas mitral e tricúspide (frequência ~35-45 Hz)
- **S2**: Som de fechamento das valvas aórtica e pulmonar (frequência ~150-180 Hz)

## Personalização

### Adicionar Favicon

Para adicionar um favicon à aplicação:
1. Crie um arquivo `favicon.ico` (ou outro formato de imagem)
2. Adicione a seguinte linha no `<head>` do `index.html`:
   ```html
   <link rel="icon" type="image/x-icon" href="favicon.ico">
   ```

### Adicionar Novos Presets

Para adicionar novos presets clínicos:
1. Adicione um novo caso na função `applyPreset()` no arquivo `script.js`
2. Adicione um botão correspondente na seção `.preset-buttons` do `index.html`
3. Ajuste o CSS se necessário para acomodar mais botões

### Ajustar Estilos

O arquivo `style.css` pode ser modificado para:
- Alterar cores do tema
- Ajustar layout e responsividade
- Modificar tamanhos de fontes e elementos

### Estender Funcionalidades

O arquivo `script.js` pode ser estendido para:
- Adicionar novos parâmetros fisiológicos
- Implementar novas arritmias
- Adicionar mais presets clínicos
- Implementar recursos de gravação/reprodução

## Limitações

- O simulador utiliza modelos fisiológicos simplificados e não deve ser usado para diagnóstico médico
- A precisão dos sinais gerados é aproximada e destinada apenas a fins educacionais
- O áudio pode não funcionar em alguns navegadores devido a restrições de autoplay

## Licença

Este projeto é destinado para fins educacionais e pode ser modificado e distribuído livremente.

## Contato

Para dúvidas ou sugestões sobre o projeto, por favor abra uma issue no repositório ou entre em contato com o desenvolvedor.