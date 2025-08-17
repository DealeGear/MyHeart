// Variáveis globais
let ecgCanvas, paramCanvas, ecgCtx, paramCtx;
let animationId;
let isPaused = false;
let soundEnabled = true;
let audioContext;
let audioVolume = 0.5;
let currentParam = 'pressure'; // 'pressure', 'spo2', 'respiratory'

// Parâmetros fisiológicos
let heartRate = 75; // bpm
let contractility = 100; // %
let preload = 100; // %
let afterload = 100; // %
let fio2 = 21; // %
let bloodVolume = 100; // %
let currentArrhythmia = 'normal';
let hasIschemia = false;

// Valores calculados
let systolicBP = 120;
let diastolicBP = 80;
let meanBP = 93;
let spo2 = 98;
let respiratoryRate = 16;
let rhythm = 'Sinusal';

// Arrays para armazenar dados dos gráficos
let ecgData = [];
let paramData = [];
let maxDataPoints = 300;

// Tempo para simulação
let time = 0;
let lastBeatTime = 0;
let beatInterval = 60000 / heartRate; // ms entre batimentos

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Configurar canvas
    ecgCanvas = document.getElementById('ecgCanvas');
    paramCanvas = document.getElementById('paramCanvas');
    ecgCtx = ecgCanvas.getContext('2d');
    paramCtx = paramCanvas.getContext('2d');
    
    // Configurar áudio
    setupAudio();
    
    // Redimensionar canvas
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Configurar controles
    setupControls();
    
    // Iniciar simulação
    startSimulation();
});

function resizeCanvas() {
    // Redimensionar canvas ECG
    const ecgWrapper = document.querySelector('.graph-wrapper:first-child');
    ecgCanvas.width = ecgWrapper.clientWidth;
    ecgCanvas.height = ecgWrapper.clientHeight;
    
    // Redimensionar canvas de parâmetro
    const paramWrapper = document.querySelector('.graph-wrapper:last-child');
    paramCanvas.width = paramWrapper.clientWidth;
    paramCanvas.height = paramWrapper.clientHeight;
}

function setupAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.error('Web Audio API não suportada:', e);
    }
}

function playHeartSound() {
    if (!soundEnabled || !audioContext) return;
    
    const now = audioContext.currentTime;
    
    // Som S1 (fechamento mitral/tricúspide)
    const s1Oscillator = audioContext.createOscillator();
    const s1Gain = audioContext.createGain();
    
    s1Oscillator.type = 'sine';
    s1Oscillator.frequency.setValueAtTime(35, now);
    s1Oscillator.frequency.exponentialRampToValueAtTime(45, now + 0.03);
    
    s1Gain.gain.setValueAtTime(0, now);
    s1Gain.gain.linearRampToValueAtTime(audioVolume * 0.3, now + 0.01);
    s1Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    
    s1Oscillator.connect(s1Gain);
    s1Gain.connect(audioContext.destination);
    s1Oscillator.start(now);
    s1Oscillator.stop(now + 0.05);
    
    // Som S2 (fechamento aórtico/pulmonar)
    const s2Oscillator = audioContext.createOscillator();
    const s2Gain = audioContext.createGain();
    
    s2Oscillator.type = 'sine';
    s2Oscillator.frequency.setValueAtTime(150, now + 0.15);
    s2Oscillator.frequency.exponentialRampToValueAtTime(180, now + 0.18);
    
    s2Gain.gain.setValueAtTime(0, now + 0.15);
    s2Gain.gain.linearRampToValueAtTime(audioVolume * 0.2, now + 0.16);
    s2Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    
    s2Oscillator.connect(s2Gain);
    s2Gain.connect(audioContext.destination);
    s2Oscillator.start(now + 0.15);
    s2Oscillator.stop(now + 0.2);
}

function setupControls() {
    // Botões superiores
    document.getElementById('resetBtn').addEventListener('click', resetSimulation);
    document.getElementById('pauseBtn').addEventListener('click', togglePause);
    document.getElementById('soundBtn').addEventListener('click', toggleSound);
    
    // Sliders
    const hrSlider = document.getElementById('hrSlider');
    hrSlider.addEventListener('input', function() {
        heartRate = parseInt(this.value);
        document.getElementById('hrSliderValue').textContent = heartRate;
        beatInterval = 60000 / heartRate;
        updateParameters();
    });
    
    const contractilitySlider = document.getElementById('contractilitySlider');
    contractilitySlider.addEventListener('input', function() {
        contractility = parseInt(this.value);
        document.getElementById('contractilitySliderValue').textContent = contractility + '%';
        updateParameters();
    });
    
    const preloadSlider = document.getElementById('preloadSlider');
    preloadSlider.addEventListener('input', function() {
        preload = parseInt(this.value);
        document.getElementById('preloadSliderValue').textContent = preload + '%';
        updateParameters();
    });
    
    const afterloadSlider = document.getElementById('afterloadSlider');
    afterloadSlider.addEventListener('input', function() {
        afterload = parseInt(this.value);
        document.getElementById('afterloadSliderValue').textContent = afterload + '%';
        updateParameters();
    });
    
    const fio2Slider = document.getElementById('fio2Slider');
    fio2Slider.addEventListener('input', function() {
        fio2 = parseInt(this.value);
        document.getElementById('fio2SliderValue').textContent = fio2 + '%';
        updateParameters();
    });
    
    const volumeSlider = document.getElementById('volumeSlider');
    volumeSlider.addEventListener('input', function() {
        bloodVolume = parseInt(this.value);
        document.getElementById('volumeSliderValue').textContent = bloodVolume + '%';
        updateParameters();
    });
    
    const audioVolumeSlider = document.getElementById('audioVolumeSlider');
    audioVolumeSlider.addEventListener('input', function() {
        audioVolume = parseInt(this.value) / 100;
        document.getElementById('audioVolumeSliderValue').textContent = this.value + '%';
    });
    
    // Seleção de arritmia
    const arrhythmiaSelect = document.getElementById('arrhythmiaSelect');
    arrhythmiaSelect.addEventListener('change', function() {
        currentArrhythmia = this.value;
        updateParameters();
    });
    
    // Toggle de isquemia
    const ischemiaToggle = document.getElementById('ischemiaToggle');
    ischemiaToggle.addEventListener('change', function() {
        hasIschemia = this.checked;
        updateParameters();
    });
    
    // Seleção de parâmetro
    const paramSelect = document.getElementById('paramSelect');
    paramSelect.addEventListener('change', function() {
        currentParam = this.value;
        paramData = []; // Limpar dados ao mudar parâmetro
    });
    
    // Botões de preset
    const presetButtons = document.querySelectorAll('.preset-btn');
    presetButtons.forEach(button => {
        button.addEventListener('click', function() {
            applyPreset(this.dataset.preset);
        });
    });
}

function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pauseBtn').textContent = isPaused ? 'Continuar' : 'Pausar';
    
    if (!isPaused) {
        startSimulation();
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    document.getElementById('soundBtn').textContent = `Som: ${soundEnabled ? 'ON' : 'OFF'}`;
}

function resetSimulation() {
    // Resetar todos os valores
    heartRate = 75;
    contractility = 100;
    preload = 100;
    afterload = 100;
    fio2 = 21;
    bloodVolume = 100;
    currentArrhythmia = 'normal';
    hasIschemia = false;
    
    // Resetar UI
    document.getElementById('hrSlider').value = heartRate;
    document.getElementById('hrSliderValue').textContent = heartRate;
    
    document.getElementById('contractilitySlider').value = contractility;
    document.getElementById('contractilitySliderValue').textContent = contractility + '%';
    
    document.getElementById('preloadSlider').value = preload;
    document.getElementById('preloadSliderValue').textContent = preload + '%';
    
    document.getElementById('afterloadSlider').value = afterload;
    document.getElementById('afterloadSliderValue').textContent = afterload + '%';
    
    document.getElementById('fio2Slider').value = fio2;
    document.getElementById('fio2SliderValue').textContent = fio2 + '%';
    
    document.getElementById('volumeSlider').value = bloodVolume;
    document.getElementById('volumeSliderValue').textContent = bloodVolume + '%';
    
    document.getElementById('arrhythmiaSelect').value = currentArrhythmia;
    document.getElementById('ischemiaToggle').checked = hasIschemia;
    
    // Limpar dados
    ecgData = [];
    paramData = [];
    time = 0;
    lastBeatTime = 0;
    beatInterval = 60000 / heartRate;
    
    // Atualizar parâmetros
    updateParameters();
}

function applyPreset(preset) {
    switch(preset) {
        case 'normal':
            heartRate = 75;
            contractility = 100;
            preload = 100;
            afterload = 100;
            fio2 = 21;
            bloodVolume = 100;
            currentArrhythmia = 'normal';
            hasIschemia = false;
            break;
            
        case 'tachycardia':
            heartRate = 130;
            contractility = 110;
            preload = 90;
            afterload = 95;
            fio2 = 21;
            bloodVolume = 100;
            currentArrhythmia = 'tachycardia';
            hasIschemia = false;
            break;
            
        case 'bradycardia':
            heartRate = 45;
            contractility = 95;
            preload = 110;
            afterload = 105;
            fio2 = 21;
            bloodVolume = 100;
            currentArrhythmia = 'bradycardia';
            hasIschemia = false;
            break;
            
        case 'atrialFibrillation':
            heartRate = 110;
            contractility = 90;
            preload = 95;
            afterload = 100;
            fio2 = 21;
            bloodVolume = 100;
            currentArrhythmia = 'atrialFibrillation';
            hasIschemia = false;
            break;
            
        case 'vt':
            heartRate = 180;
            contractility = 70;
            preload = 80;
            afterload = 110;
            fio2 = 21;
            bloodVolume = 100;
            currentArrhythmia = 'vt';
            hasIschemia = true;
            break;
            
        case 'hypovolemia':
            heartRate = 100;
            contractility = 120;
            preload = 50;
            afterload = 130;
            fio2 = 21;
            bloodVolume = 70;
            currentArrhythmia = 'normal';
            hasIschemia = false;
            break;
            
        case 'hypoxia':
            heartRate = 120;
            contractility = 100;
            preload = 100;
            afterload = 100;
            fio2 = 15;
            bloodVolume = 100;
            currentArrhythmia = 'tachycardia';
            hasIschemia = true;
            break;

            case 'septicShock':
            heartRate = 120;
            contractility = 60;
            preload = 70;
            afterload = 40;
            fio2 = 40;
            bloodVolume = 80;
            currentArrhythmia = 'tachycardia';
            hasIschemia = true;
            break;
            
        case 'cardiogenicShock':
            heartRate = 110;
            contractility = 40;
            preload = 120;
            afterload = 140;
            fio2 = 60;
            bloodVolume = 100;
            currentArrhythmia = 'normal';
            hasIschemia = true;
            break;
            
        case 'hypertensiveCrisis':
            heartRate = 85;
            contractility = 130;
            preload = 100;
            afterload = 180;
            fio2 = 21;
            bloodVolume = 100;
            currentArrhythmia = 'normal';
            hasIschemia = false;
            break;
            
        case 'pulmonaryEdema':
            heartRate = 130;
            contractility = 80;
            preload = 150;
            afterload = 120;
            fio2 = 60;
            bloodVolume = 110;
            currentArrhythmia = 'tachycardia';
            hasIschemia = true;
            break;
            
        case 'mildHypoxia':
            heartRate = 95;
            contractility = 100;
            preload = 100;
            afterload = 100;
            fio2 = 18;
            bloodVolume = 100;
            currentArrhythmia = 'normal';
            hasIschemia = false;
            break;
            
        case 'severeHypoxia':
            heartRate = 140;
            contractility = 90;
            preload = 95;
            afterload = 105;
            fio2 = 12;
            bloodVolume = 100;
            currentArrhythmia = 'tachycardia';
            hasIschemia = true;
            break;
            
        case 'anemia':
            heartRate = 105;
            contractility = 120;
            preload = 90;
            afterload = 80;
            fio2 = 21;
            bloodVolume = 100;
            currentArrhythmia = 'tachycardia';
            hasIschemia = false;
            break;
    }
    
    // Atualizar UI
    document.getElementById('hrSlider').value = heartRate;
    document.getElementById('hrSliderValue').textContent = heartRate;
    
    document.getElementById('contractilitySlider').value = contractility;
    document.getElementById('contractilitySliderValue').textContent = contractility + '%';
    
    document.getElementById('preloadSlider').value = preload;
    document.getElementById('preloadSliderValue').textContent = preload + '%';
    
    document.getElementById('afterloadSlider').value = afterload;
    document.getElementById('afterloadSliderValue').textContent = afterload + '%';
    
    document.getElementById('fio2Slider').value = fio2;
    document.getElementById('fio2SliderValue').textContent = fio2 + '%';
    
    document.getElementById('volumeSlider').value = bloodVolume;
    document.getElementById('volumeSliderValue').textContent = bloodVolume + '%';
    
    document.getElementById('arrhythmiaSelect').value = currentArrhythmia;
    document.getElementById('ischemiaToggle').checked = hasIschemia;
    
    beatInterval = 60000 / heartRate;
    updateParameters();
}

function updateParameters() {
    // Atualizar ritmo
    switch(currentArrhythmia) {
        case 'normal':
            rhythm = 'Sinusal';
            break;
        case 'tachycardia':
            rhythm = 'Taquicardia Sinusal';
            break;
        case 'bradycardia':
            rhythm = 'Bradicardia Sinusal';
            break;
        case 'atrialFibrillation':
            rhythm = 'Fibrilação Atrial';
            break;
        case 'atrialFlutter':
            rhythm = 'Flutter Atrial';
            break;
        case 'pvcs':
            rhythm = 'Extrassístoles';
            break;
        case 'vt':
            rhythm = 'Taquicardia Ventricular';
            break;
        case 'avBlock':
            rhythm = 'Bloqueio AV';
            break;
    }
    
    // Cálculo do débito cardíaco (DC = FC × VS)
    // Volume sistólico (VS) é afetado por contractilidade, pré-carga, pós-carga e volume sanguíneo
    const strokeVolume = 70 * (contractility / 100) * (preload / 100) * (100 / afterload) * (bloodVolume / 100);
    const cardiacOutput = heartRate * strokeVolume / 1000; // L/min
    
    // Cálculo da pressão arterial
    // MAP ≈ DC × RVS (resistência vascular sistêmica)
    // RVS é afetada pela pós-carga
    const vascularResistance = 1.0 * (afterload / 100);
    meanBP = Math.round(cardiacOutput * vascularResistance * 20);
    
    // Pressão sistólica e diastólica
    systolicBP = Math.round(meanBP + (meanBP * 0.4 * (contractility / 100)));
    diastolicBP = Math.round(meanBP - (meanBP * 0.3 * (100 / afterload)));
    
    // Limites fisiológicos
    systolicBP = Math.max(60, Math.min(250, systolicBP));
    diastolicBP = Math.max(30, Math.min(150, diastolicBP));
    meanBP = Math.max(40, Math.min(200, meanBP));
    
    // SpO2 é afetado pela FiO2 e isquemia/hipóxia
    spo2 = Math.round(95 + (fio2 - 21) * 0.2 - (hasIschemia ? 10 : 0));
    spo2 = Math.max(70, Math.min(100, spo2));
    
    // Frequência respiratória (geralmente relacionada à frequência cardíaca)
    respiratoryRate = Math.round(12 + (heartRate - 60) * 0.1);
    respiratoryRate = Math.max(8, Math.min(40, respiratoryRate));
    
    // Atualizar UI
    document.getElementById('hrValue').textContent = heartRate;
    document.getElementById('bpValue').textContent = `${systolicBP}/${diastolicBP}`;
    document.getElementById('mapValue').textContent = meanBP;
    document.getElementById('spo2Value').textContent = spo2;
    document.getElementById('rrValue').textContent = respiratoryRate;
    document.getElementById('rhythmValue').textContent = rhythm;
}

function startSimulation() {
    if (isPaused) return;
    
    // Calcular tempo delta
    const now = Date.now();
    const deltaTime = now - (window.lastTime || now);
    window.lastTime = now;
    
    // Atualizar tempo
    time += deltaTime;
    
    // Gerar dados ECG
    generateECGData();
    
    // Gerar dados do parâmetro selecionado
    generateParamData();
    
    // Desenhar gráficos
    drawECG();
    drawParam();
    
    // Continuar animação
    animationId = requestAnimationFrame(startSimulation);
}

function generateECGData() {
    // Verificar se é hora de um novo batimento
    if (time - lastBeatTime >= beatInterval) {
        lastBeatTime = time;
        
        // Tocar som do coração
        playHeartSound();
    }
    
    // Calcular posição no ciclo cardíaco (0 a 1)
    const cyclePosition = ((time - lastBeatTime) % beatInterval) / beatInterval;
    
    // Gerar valor ECG baseado na posição no ciclo
    let ecgValue = 0;
    
    // Adicionar variações baseadas na arritmia
    let adjustedCyclePosition = cyclePosition;
    let adjustedAmplitude = 1.0;
    
    switch(currentArrhythmia) {
        case 'normal':
            // ECG normal
            if (adjustedCyclePosition < 0.09) {
                // Onda P
                ecgValue = 0.25 * Math.sin(adjustedCyclePosition * 35);
            } else if (adjustedCyclePosition < 0.2) {
                // Segmento PR
                ecgValue = 0;
            } else if (adjustedCyclePosition < 0.27) {
                // Complexo QRS
                const qrsPosition = (adjustedCyclePosition - 0.2) / 0.07;
                if (qrsPosition < 0.3) {
                    ecgValue = -0.25 * Math.sin(qrsPosition * 10);
                } else {
                    ecgValue = 1.5 * Math.sin((qrsPosition - 0.3) * 15);
                }
            } else if (adjustedCyclePosition < 0.4) {
                // Segmento ST
                ecgValue = hasIschemia ? 0.2 : 0;
            } else if (adjustedCyclePosition < 0.6) {
                // Onda T
                const tPosition = (adjustedCyclePosition - 0.4) / 0.2;
                ecgValue = 0.35 * Math.sin(tPosition * Math.PI);
                if (hasIschemia) {
                    ecgValue += 0.1 * Math.sin(tPosition * Math.PI * 2);
                }
            }
            break;
            
        case 'tachycardia':
            // Taquicardia - ciclo mais curto, onda T pode se fundir com próxima onda P
            if (adjustedCyclePosition < 0.07) {
                // Onda P
                ecgValue = 0.25 * Math.sin(adjustedCyclePosition * 45);
            } else if (adjustedCyclePosition < 0.15) {
                // Segmento PR
                ecgValue = 0;
            } else if (adjustedCyclePosition < 0.21) {
                // Complexo QRS
                const qrsPosition = (adjustedCyclePosition - 0.15) / 0.06;
                if (qrsPosition < 0.3) {
                    ecgValue = -0.25 * Math.sin(qrsPosition * 10);
                } else {
                    ecgValue = 1.5 * Math.sin((qrsPosition - 0.3) * 15);
                }
            } else if (adjustedCyclePosition < 0.3) {
                // Segmento ST
                ecgValue = 0;
            } else if (adjustedCyclePosition < 0.5) {
                // Onda T
                const tPosition = (adjustedCyclePosition - 0.3) / 0.2;
                ecgValue = 0.35 * Math.sin(tPosition * Math.PI);
            }
            break;
            
        case 'bradycardia':
            // Bradicardia - ciclo mais longo
            if (adjustedCyclePosition < 0.12) {
                // Onda P
                ecgValue = 0.25 * Math.sin(adjustedCyclePosition * 26);
            } else if (adjustedCyclePosition < 0.25) {
                // Segmento PR
                ecgValue = 0;
            } else if (adjustedCyclePosition < 0.32) {
                // Complexo QRS
                const qrsPosition = (adjustedCyclePosition - 0.25) / 0.07;
                if (qrsPosition < 0.3) {
                    ecgValue = -0.25 * Math.sin(qrsPosition * 10);
                } else {
                    ecgValue = 1.5 * Math.sin((qrsPosition - 0.3) * 15);
                }
            } else if (adjustedCyclePosition < 0.45) {
                // Segmento ST
                ecgValue = 0;
            } else if (adjustedCyclePosition < 0.7) {
                // Onda T
                const tPosition = (adjustedCyclePosition - 0.45) / 0.25;
                ecgValue = 0.35 * Math.sin(tPosition * Math.PI);
            }
            break;
            
        case 'atrialFibrillation':
            // Fibrilação atrial - sem ondas P, ritmo irregular
            if (adjustedCyclePosition < 0.2) {
                // Sem onda P na fibrilação
                ecgValue = 0.05 * Math.sin(adjustedCyclePosition * 100) * (Math.random() * 0.5 + 0.5);
            } else if (adjustedCyclePosition < 0.27) {
                // Complexo QRS
                const qrsPosition = (adjustedCyclePosition - 0.2) / 0.07;
                if (qrsPosition < 0.3) {
                    ecgValue = -0.25 * Math.sin(qrsPosition * 10);
                } else {
                    ecgValue = 1.5 * Math.sin((qrsPosition - 0.3) * 15);
                }
            } else if (adjustedCyclePosition < 0.4) {
                // Segmento ST
                ecgValue = 0.05 * Math.sin(adjustedCyclePosition * 50) * (Math.random() * 0.5 + 0.5);
            } else if (adjustedCyclePosition < 0.6) {
                // Onda T
                const tPosition = (adjustedCyclePosition - 0.4) / 0.2;
                ecgValue = 0.35 * Math.sin(tPosition * Math.PI);
                ecgValue += 0.05 * Math.sin(adjustedCyclePosition * 80) * (Math.random() * 0.5 + 0.5);
            }
            // Adicionar irregularidade ao ritmo
            adjustedCyclePosition += (Math.random() - 0.5) * 0.05;
            break;
            
        case 'atrialFlutter':
            // Flutter atrial - ondas em "dente de serra"
            if (adjustedCyclePosition < 0.2) {
                // Ondas de flutter em vez de onda P
                ecgValue = 0.3 * Math.sin(adjustedCyclePosition * 60);
            } else if (adjustedCyclePosition < 0.27) {
                // Complexo QRS
                const qrsPosition = (adjustedCyclePosition - 0.2) / 0.07;
                if (qrsPosition < 0.3) {
                    ecgValue = -0.25 * Math.sin(qrsPosition * 10);
                } else {
                    ecgValue = 1.5 * Math.sin((qrsPosition - 0.3) * 15);
                }
            } else if (adjustedCyclePosition < 0.4) {
                // Segmento ST
                ecgValue = 0;
            } else if (adjustedCyclePosition < 0.6) {
                // Onda T
                const tPosition = (adjustedCyclePosition - 0.4) / 0.2;
                ecgValue = 0.35 * Math.sin(tPosition * Math.PI);
            }
            break;
            
        case 'pvcs':
            // Extrassístoles ventriculares - batimentos prematuros com morfologia diferente
            if (adjustedCyclePosition < 0.09) {
                // Onda P
                ecgValue = 0.25 * Math.sin(adjustedCyclePosition * 35);
            } else if (adjustedCyclePosition < 0.2) {
                // Segmento PR
                ecgValue = 0;
            } else if (adjustedCyclePosition < 0.27) {
                // Complexo QRS (normal ou PVC)
                const qrsPosition = (adjustedCyclePosition - 0.2) / 0.07;
                if (Math.random() < 0.8) { // 80% de chance de QRS normal
                    if (qrsPosition < 0.3) {
                        ecgValue = -0.25 * Math.sin(qrsPosition * 10);
                    } else {
                        ecgValue = 1.5 * Math.sin((qrsPosition - 0.3) * 15);
                    }
                } else { // PVC - QRS largo e bizarro
                    ecgValue = 1.2 * Math.sin(qrsPosition * 5);
                }
            } else if (adjustedCyclePosition < 0.4) {
                // Segmento ST
                ecgValue = 0;
            } else if (adjustedCyclePosition < 0.6) {
                // Onda T
                const tPosition = (adjustedCyclePosition - 0.4) / 0.2;
                ecgValue = 0.35 * Math.sin(tPosition * Math.PI);
            }
            break;
            
        case 'vt':
            // Taquicardia ventricular - QRS largo, sem ondas P
            if (adjustedCyclePosition < 0.15) {
                // Sem onda P
                ecgValue = 0;
            } else if (adjustedCyclePosition < 0.3) {
                // Complexo QRS largo e bizarro
                const qrsPosition = (adjustedCyclePosition - 0.15) / 0.15;
                ecgValue = 1.2 * Math.sin(qrsPosition * 3);
            } else if (adjustedCyclePosition < 0.5) {
                // Segmento ST e onda T fusionada
                const tPosition = (adjustedCyclePosition - 0.3) / 0.2;
                ecgValue = -0.5 * Math.sin(tPosition * Math.PI);
            }
            break;
            
        case 'avBlock':
            // Bloqueio AV - dissociação atrioventricular
            if (adjustedCyclePosition < 0.12) {
                // Onda P (não seguida por QRS)
                ecgValue = 0.25 * Math.sin(adjustedCyclePosition * 26);
            } else if (adjustedCyclePosition < 0.4) {
                // Pausa após onda P
                ecgValue = 0;
            } else if (adjustedCyclePosition < 0.47) {
                // Complexo QRS (ocorrendo independentemente)
                const qrsPosition = (adjustedCyclePosition - 0.4) / 0.07;
                if (qrsPosition < 0.3) {
                    ecgValue = -0.25 * Math.sin(qrsPosition * 10);
                } else {
                    ecgValue = 1.5 * Math.sin((qrsPosition - 0.3) * 15);
                }
            } else if (adjustedCyclePosition < 0.6) {
                // Segmento ST
                ecgValue = 0;
            } else if (adjustedCyclePosition < 0.8) {
                // Onda T
                const tPosition = (adjustedCyclePosition - 0.6) / 0.2;
                ecgValue = 0.35 * Math.sin(tPosition * Math.PI);
            }
            break;
    }
    
    // Adicionar ruído de base
    ecgValue += (Math.random() - 0.5) * 0.05;
    
    // Adicionar ao array de dados
    ecgData.push(ecgValue);
    
    // Manter apenas os últimos pontos
    if (ecgData.length > maxDataPoints) {
        ecgData.shift();
    }
}

function generateParamData() {
    // Calcular posição no ciclo cardíaco (0 a 1)
    const cyclePosition = ((time - lastBeatTime) % beatInterval) / beatInterval;
    
    let paramValue = 0;
    
    switch(currentParam) {
        case 'pressure':
            // Curva de pressão arterial
            if (cyclePosition < 0.3) {
                // Sístole - aumento rápido da pressão
                const systolePosition = cyclePosition / 0.3;
                paramValue = diastolicBP + (systolicBP - diastolicBP) * Math.sin(systolePosition * Math.PI);
            } else {
                // Diástole - queda lenta da pressão com incisura dicrótica
                const diastolePosition = (cyclePosition - 0.3) / 0.7;
                paramValue = systolicBP - (systolicBP - diastolicBP) * diastolePosition;
                
                // Adicionar incisura dicrótica
                if (diastolePosition > 0.1 && diastolePosition < 0.2) {
                    const notchPosition = (diastolePosition - 0.1) / 0.1;
                    paramValue -= 10 * Math.sin(notchPosition * Math.PI);
                }
            }
            
            // Normalizar para o gráfico (0-1) com faixa dinâmica
            // Ajustar a faixa dinamicamente baseado nos valores atuais
            const maxExpectedBP = Math.max(250, systolicBP + 20);
            const minExpectedBP = Math.min(30, diastolicBP - 10);
            paramValue = (paramValue - minExpectedBP) / (maxExpectedBP - minExpectedBP);
            paramValue = Math.max(0, Math.min(1, paramValue)); // Garantir que fique entre 0 e 1
            break;
            
        case 'spo2':
            // Curva de SpO2 - variações sutis com a respiração
            const respiratoryCycle = (time % 60000) / 60000; // Ciclo respiratório (assumindo 1 rpm)
            const respiratoryPosition = (respiratoryCycle * respiratoryRate) % 1;
            
            // Variação normal da SpO2 com a respiração
            paramValue = spo2 / 100 + 0.005 * Math.sin(respiratoryPosition * Math.PI * 2);
            
            // Adicionar flutuações aleatórias menores
            paramValue += (Math.random() - 0.5) * 0.002;
            
            // Normalizar para o gráfico (0-1)
            paramValue = Math.max(0.7, Math.min(1.0, paramValue));
            break;
            
        case 'respiratory':
            // Curva de frequência respiratória - onda mais lenta
            const respCycle = (time % 60000) / 60000; // Ciclo respiratório (assumindo 1 rpm)
            const respPosition = (respCycle * respiratoryRate) % 1;
            
            // Forma de onda respiratória
            if (respPosition < 0.4) {
                // Inspiração
                paramValue = Math.sin(respPosition * Math.PI / 0.4);
            } else {
                // Expiração
                paramValue = Math.sin((respPosition - 0.4) * Math.PI / 0.6);
            }
            
            // Adicionar ruído
            paramValue += (Math.random() - 0.5) * 0.05;
            
            // Normalizar para o gráfico (0-1)
            paramValue = Math.max(0, Math.min(1, paramValue));
            break;
    }
    
    // Adicionar ao array de dados
    paramData.push(paramValue);
    
    // Manter apenas os últimos pontos
    if (paramData.length > maxDataPoints) {
        paramData.shift();
    }
}

function drawParam() {
    // Limpar canvas
    paramCtx.fillStyle = '#000';
    paramCtx.fillRect(0, 0, paramCanvas.width, paramCanvas.height);
    
    // Desenhar grade
    drawGrid(paramCtx, paramCanvas.width, paramCanvas.height, '#030');
    
    // Desenhar parâmetro selecionado
    if (paramData.length > 1) {
        // Definir cor baseada no parâmetro
        switch(currentParam) {
            case 'pressure':
                paramCtx.strokeStyle = '#f00';
                break;
            case 'spo2':
                paramCtx.strokeStyle = '#00f';
                break;
            case 'respiratory':
                paramCtx.strokeStyle = '#ff0';
                break;
        }
        
        paramCtx.lineWidth = 2;
        paramCtx.beginPath();
        
        const xStep = paramCanvas.width / maxDataPoints;
        // Ajustar a escala vertical para usar mais espaço e evitar cortes
        const yScale = paramCanvas.height * 0.85; // Aumentado para 85%
        const yOffset = paramCanvas.height * 0.075; // Reduzido para 7.5% em cima e embaixo
        
        for (let i = 0; i < paramData.length; i++) {
            const x = i * xStep;
            // Garantir que o valor fique dentro dos limites do canvas
            const y = Math.max(yOffset, Math.min(paramCanvas.height - yOffset, 
                         paramCanvas.height - yOffset - paramData[i] * yScale));
            
            if (i === 0) {
                paramCtx.moveTo(x, y);
            } else {
                paramCtx.lineTo(x, y);
            }
        }
        
        paramCtx.stroke();
        
        // Adicionar rótulos de escala para pressão arterial
        if (currentParam === 'pressure') {
            paramCtx.fillStyle = '#f00';
            paramCtx.font = '10px Courier New';
            paramCtx.fillText(`${Math.round(systolicBP)}`, 5, yOffset + 10);
            paramCtx.fillText(`${Math.round(diastolicBP)}`, 5, paramCanvas.height - yOffset);
        }
    }
}

function drawECG() {
    // Limpar canvas
    ecgCtx.fillStyle = '#000';
    ecgCtx.fillRect(0, 0, ecgCanvas.width, ecgCanvas.height);
    
    // Desenhar grade
    drawGrid(ecgCtx, ecgCanvas.width, ecgCanvas.height, '#030');
    
    // Desenhar ECG
    if (ecgData.length > 1) {
        ecgCtx.strokeStyle = '#0f0';
        ecgCtx.lineWidth = 2;
        ecgCtx.beginPath();
        
        const xStep = ecgCanvas.width / maxDataPoints;
        const yCenter = ecgCanvas.height / 2;
        const yScale = ecgCanvas.height * 0.4; // 40% da altura para o ECG
        
        for (let i = 0; i < ecgData.length; i++) {
            const x = i * xStep;
            const y = yCenter - ecgData[i] * yScale;
            
            if (i === 0) {
                ecgCtx.moveTo(x, y);
            } else {
                ecgCtx.lineTo(x, y);
            }
        }
        
        ecgCtx.stroke();
    }
}

function drawParam() {
    // Limpar canvas
    paramCtx.fillStyle = '#000';
    paramCtx.fillRect(0, 0, paramCanvas.width, paramCanvas.height);
    
    // Desenhar grade
    drawGrid(paramCtx, paramCanvas.width, paramCanvas.height, '#030');
    
    // Desenhar parâmetro selecionado
    if (paramData.length > 1) {
        // Definir cor baseada no parâmetro
        switch(currentParam) {
            case 'pressure':
                paramCtx.strokeStyle = '#f00';
                break;
            case 'spo2':
                paramCtx.strokeStyle = '#00f';
                break;
            case 'respiratory':
                paramCtx.strokeStyle = '#ff0';
                break;
        }
        
        paramCtx.lineWidth = 2;
        paramCtx.beginPath();
        
        const xStep = paramCanvas.width / maxDataPoints;
        const yScale = paramCanvas.height * 0.8; // 80% da altura para o parâmetro
        const yOffset = paramCanvas.height * 0.1; // 10% de margem
        
        for (let i = 0; i < paramData.length; i++) {
            const x = i * xStep;
            const y = paramCanvas.height - yOffset - paramData[i] * yScale;
            
            if (i === 0) {
                paramCtx.moveTo(x, y);
            } else {
                paramCtx.lineTo(x, y);
            }
        }
        
        paramCtx.stroke();
    }
}

function drawGrid(ctx, width, height, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.5;
    
    // Linhas verticais
    const xStep = width / 20; // 20 linhas verticais
    for (let x = 0; x <= width; x += xStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    
    // Linhas horizontais
    const yStep = height / 10; // 10 linhas horizontais
    for (let y = 0; y <= height; y += yStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
}