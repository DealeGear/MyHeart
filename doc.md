# MyHeart – Monitor Cardíaco Virtual


> **MyHeart** é um aplicativo web educativo que simula **parâmetros cardíacos em tempo real**, permitindo visualizar ECG, pressão arterial, SpO₂ e outros sinais vitais, com controles para alterar frequência cardíaca, pré/pós-carga, inotropismo, FiO₂ e simular arritmias.
> Ideal para estudantes, profissionais de saúde e entusiastas da fisiologia cardiovascular.

---

## Índice

* [Visão Geral](#visão-geral)
* [Funcionalidades](#funcionalidades)
* [Arquitetura do Projeto](#arquitetura-do-projeto)
* [Modelo Fisiológico Simplificado](#modelo-fisiológico-simplificado)
* [Estrutura de Pastas](#estrutura-de-pastas)
* [Como Rodar](#como-rodar)
* [Futuras Melhorias](#futuras-melhorias)
* [Boas Práticas para Colaboração](#boas-práticas-para-colaboração)
* [Licença](#licença)

---

## Visão Geral

O **MyHeart** é um **simulador interativo de monitor cardíaco** que permite ao usuário:

* Visualizar **ECG em tempo real** (derivação II).
* Observar **pressão arterial, SpO₂ e frequência respiratória**.
* Alterar parâmetros fisiológicos (FC, pré/pós-carga, contractilidade, FiO₂, volume sanguíneo).
* Testar **arritmias e condições clínicas** como FA, TV, hipovolemia e hipóxia.
* Ouvir batimentos cardíacos sincronizados (**S1/S2**) via Web Audio API.

> **Importante:** todo o conteúdo é educativo. Não substitui monitoramento clínico.

---

## Funcionalidades

### Gráficos em Tempo Real

* **ECG (derivação II)**: ondas P-QRS-T realistas.
* **Segundo gráfico** (configurável): pressão arterial, SpO₂ ou frequência respiratória.
* Curvas animadas em **canvas** ou **Chart.js**.

### Indicadores Numéricos

* FC (bpm)
* PAS / PAD / MAP (mmHg)
* SpO₂ (%)
* FR (irpm)
* Ritmo atual (NSR, FA, TV, etc.)

### Controles Interativos

* Frequência cardíaca: 30–220 bpm
* Contractilidade: 0–200%
* Pré-carga: 0–200%
* Pós-carga / Resistência vascular sistêmica: 0–200%
* Volume sanguíneo: 50–120%
* FiO₂: 10–100%
* Arritmias: sinusal normal, taquicardia, bradicardia, FA, flutter, extrassístoles, TV, BAV
* Isquemia/Hipóxia toggle
* Áudio ON/OFF (S1/S2)

### Presets

* Normal
* Taquicardia
* Bradicardia
* Fibrilação Atrial (FA)
* Taquicardia Ventricular (TV)
* Hipovolemia
* Hipóxia

---

## Arquitetura do Projeto

O projeto é **client-side** e organizado em três arquivos principais:

| Arquivo      | Função                                                                  |
| ------------ | ----------------------------------------------------------------------- |
| `index.html` | Estrutura da página, seções, gráficos, botões e sliders                 |
| `style.css`  | Layout, cores, tipografia, responsividade                               |
| `script.js`  | Lógica da simulação, gráficos, arritmias, audio e controles interativos |

### Dependências

* Nenhuma obrigatória.
* Pode usar **Chart.js** para gráficos se desejado.
* Áudio via **Web Audio API**.

---

## Modelo Fisiológico Simplificado

* **Débito Cardíaco (CO)**

  ```
  CO = FC × VS
  ```
* **Pressão Arterial Média (MAP)**

  ```
  MAP ≈ CO × RVS
  ```
* **Volume Sistólico (VS)**: função de pré-carga, pós-carga e inotropismo.

### Efeitos Simulados

| Condição    | Efeito                                                           |
| ----------- | ---------------------------------------------------------------- |
| Hipovolemia | ↓ Pré-carga → ↓ VS → ↓ MAP                                       |
| Hipóxia     | ↓ Inotropismo → ↓ VS, ↓ SpO₂                                     |
| Arritmias   | Alteração do intervalo RR e morfologia do ECG                    |
| Isquemia    | Alteração do segmento ST/T, redução da SpO₂ e força de contração |

> Observação: valores aproximados, **apenas para fins educacionais**.

---

## Estrutura de Pastas

```text
MyHeart/
│
├── index.html
├── style.css
├── script.js
├── assets/
│   ├── images/     # imagens de interface ou ícones
│   └── sounds/     # arquivos S1/S2
└── README.md
```

---

## Como Rodar

1. Clone ou baixe o repositório:

   ```bash
   git clone <url-do-repo>
   ```
2. Abra `index.html` em qualquer navegador moderno.
3. Ajuste sliders, toggles e presets para explorar a simulação.
4. Para desenvolvimento, recomenda-se usar um **servidor local**:

   * VSCode: Live Server
   * Terminal: `python -m http.server`

---

## Futuras Melhorias

* Mais gráficos: fonocardiograma, SpO₂ vs tempo.
* Precisão avançada de arritmias e pressão arterial.
* Salvar presets personalizados.
* Total responsividade para dispositivos móveis.
* Exportação de dados simulados (CSV/JSON).
* Tutorial interativo e tooltips explicativos.
* Temas claro/escuro personalizáveis.

---

## Boas Práticas para Colaboração

* Documentar novas funções e variáveis no `script.js`.
* Separar **lógica**, **apresentação** e **interatividade**.
* Usar commits claros.
* Abrir issues para bugs ou novas funcionalidades.

---

## Licença

* Código aberto para **educação e desenvolvimento**.
* Pode ser copiado, modificado e aperfeiçoado, mantendo **atribuição ao autor original**.
* **Não usar como dispositivo médico real**.


