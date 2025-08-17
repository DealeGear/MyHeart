/**
 * Modelo fisiológico do coração
 * Responsável por simular os parâmetros cardíacos e suas interações
 */
class PhysiologyModel {
    constructor() {
        // Tipos para arritmias
        this.arrhythmiaTypes = [
            'normal', 'fa', 'flutter', 'pvcs', 'bigeminy', 
            'vt', 'sinus-brady', 'av-block-1', 'av-block-2', 'av-block-3'
        ];
        
        // Tipos para gráficos secundários
        this.secondaryChartTypes = ['pressure', 'spo2', 'pcg'];
        
        // Inicializar parâmetros padrão
        this.params = {
            heartRate: 70,
            contractility: 100,
            preload: 100,
            afterload: 100,
            fio2: 21,
            bloodVolume: 100,
            arrhythmia: 'normal',
            ischemia: false,
            baroreflexActive: true
        };
        
        // Inicializar indicadores calculados
        this.indicators = {
            heartRate: 70,
            strokeVolume: 70,
            cardiacOutput: 4.9,
            systolicBP: 120,
            diastolicBP: 80,
            meanBP: 93,
            spo2: 98,
            rhythm: 'Normal'
        };
        
        // Constantes fisiológicas
        this.BASE_HEART_RATE = 70;
        this.BASE_STROKE_VOLUME = 70; // mL
        this.BASE_SYSTOLIC_BP = 120; // mmHg
        this.BASE_DIASTOLIC_BP = 80;  // mmHg
        this.BASE_SPO2 = 98;          // %
        this.SYSTOLE_DURATION = 300;  // ms
        this.DIASTOLE_DURATION = 500; // ms (para 60 bpm)
        this.ECG_P_DURATION = 80;     // ms
        this.ECG_PR_INTERVAL = 160;   // ms
        this.ECG_QRS_DURATION = 80;   // ms
        this.ECG_QT_INTERVAL = 400;   // ms (para 60 bpm)
        this.BAROREFLEX_THRESHOLD = 70; // mmHg
        this.SPO2_RESPONSE_TIME = 5000; // ms
        this.CONTRACTILITY_RESPONSE_TIME = 3000; // ms
        
        // Inicializar buffers
        this.ecgBuffer = [];
        this.pressureBuffer = [];
        this.spo2Buffer = [];
        this.pcgBuffer = [];
        this.lastBeatTime = 0;
        this.rrInterval = 0;
        this.nextBeatTime = 0;
        this.systoleStartTime = 0;
        this.diastoleStartTime = 0;
        this.spo2Target = 98;
        this.currentSpo2 = 98;
        this.contractilityTarget = 100;
        this.currentContractility = 100;
        this.lastPVC = 0;
        this.bigeminyNext = false;
        this.avBlockPR = 0;
        this.avBlockDropped = false;
        
        // Inicializar buffers
        this.initializeBuffers();
    }
    
    // Inicializar buffers de dados
    initializeBuffers() {
        const bufferDuration = 15000; // 15 segundos de dados
        const now = Date.now();
        
        // Inicializar buffer de ECG
        for (let i = 0; i < bufferDuration; i += 10) {
            this.ecgBuffer.push({
                time: now - bufferDuration + i,
                voltage: 0,
                pWave: false,
                qrsComplex: false,
                tWave: false,
                stSegment: 0
            });
        }
        
        // Inicializar buffer de pressão
        for (let i = 0; i < bufferDuration; i += 10) {
            this.pressureBuffer.push({
                time: now - bufferDuration + i,
                pressure: this.indicators.diastolicBP,
                isSystolic: false
            });
        }
        
        // Inicializar buffer de SpO2
        for (let i = 0; i < bufferDuration; i += 100) {
            this.spo2Buffer.push({
                time: now - bufferDuration + i,
                spo2: this.indicators.spo2
            });
        }
        
        // Inicializar buffer de PCG
        for (let i = 0; i < bufferDuration; i += 10) {
            this.pcgBuffer.push({
                time: now - bufferDuration + i,
                s1: false,
                s2: false,
                amplitude: 0
            });
        }
    }
    
    // Atualizar parâmetros
    updateParams(params) {
        const oldParams = { ...this.params };
        this.params = { ...this.params, ...params };
        
        // Se a frequência cardíaca mudou, recalcular o próximo tempo de batida
        if (params.heartRate !== undefined && params.heartRate !== oldParams.heartRate) {
            this.calculateNextBeatTime();
        }
        
        // Se FiO2 mudou, calcular o SpO2 alvo
        if (params.fio2 !== undefined && params.fio2 !== oldParams.fio2) {
            this.calculateSpo2Target();
        }
        
        // Se isquemia mudou, calcular a contractilidade alvo
        if (params.ischemia !== undefined && params.ischemia !== oldParams.ischemia) {
            this.calculateContractilityTarget();
        }
        
        // Se a arritmia mudou, resetar variáveis de controle
        if (params.arrhythmia !== undefined && params.arrhythmia !== oldParams.arrhythmia) {
            this.resetArrhythmiaVariables();
        }
    }
    
    // Calcular o tempo da próxima batida
    calculateNextBeatTime() {
        const now = Date.now();
        
        // Para ritmo sinusal normal
        if (this.params.arrhythmia === 'normal' || 
            this.params.arrhythmia === 'sinus-brady' ||
            this.params.arrhythmia === 'av-block-1' ||
            this.params.arrhythmia === 'av-block-2' ||
            this.params.arrhythmia === 'av-block-3') {
            
            // Intervalo RR baseado na frequência cardíaca
            this.rrInterval = 60000 / this.params.heartRate;
            
            // Para bradicardia sinusal, usar a frequência cardíaca definida
            if (this.params.arrhythmia === 'sinus-brady') {
                this.rrInterval = 60000 / this.params.heartRate;
            }
            
            // Para BAV 1º grau, aumentar o intervalo PR
            if (this.params.arrhythmia === 'av-block-1') {
                this.avBlockPR = this.ECG_PR_INTERVAL * 1.5;
            } else {
                this.avBlockPR = this.ECG_PR_INTERVAL;
            }
            
            // Para BAV 2º grau, ocasionalmente dropping beats
            if (this.params.arrhythmia === 'av-block-2') {
                if (Math.random() < 0.3) {
                    this.avBlockDropped = true;
                } else {
                    this.avBlockDropped = false;
                }
            }
            
            // Para BAV 3º grau, ritmo de escape ventricular mais lento
            if (this.params.arrhythmia === 'av-block-3') {
                this.rrInterval = 60000 / 40; // 40 bpm
            }
        }
        
        // Para fibrilação atrial, intervalo RR irregular
        else if (this.params.arrhythmia === 'fa') {
            // Intervalo RR entre 300ms e 1000ms (média baseada na frequência cardíaca)
            const meanRR = 60000 / this.params.heartRate;
            const minRR = meanRR * 0.6;
            const maxRR = meanRR * 1.4;
            this.rrInterval = minRR + Math.random() * (maxRR - minRR);
        }
        
        // Para flutter atrial, intervalo RR regular ou irregular
        else if (this.params.arrhythmia === 'flutter') {
            // Bloqueio AV variável (2:1, 3:1, 4:1)
            const blockRatio = Math.random() < 0.7 ? 2 : (Math.random() < 0.5 ? 3 : 4);
            this.rrInterval = (60000 / 300) * blockRatio; // 300 bpm = frequência atrial no flutter
        }
        
        // Para taquicardia ventricular, intervalo RR regular mas rápido
        else if (this.params.arrhythmia === 'vt') {
            this.rrInterval = 60000 / this.params.heartRate;
        }
        
        // Para extrassístoles, ocasionalmente batidas prematuras
        else if (this.params.arrhythmia === 'pvcs') {
            // 90% de chance de ritmo normal, 10% de chance de PVC
            if (Math.random() < 0.9) {
                this.rrInterval = 60000 / this.params.heartRate;
            } else {
                // PVC prematura (compensatório ou não)
                if (Math.random() < 0.7) {
                    // PVC compensatório (intervalo RR normal após)
                    this.rrInterval = 60000 / this.params.heartRate * 0.6;
                } else {
                    // PVC não compensatório (pausa após)
                    this.rrInterval = 60000 / this.params.heartRate * 0.4;
                }
            }
        }
        
        // Para bigeminismo, alternância entre batida normal e PVC
        else if (this.params.arrhythmia === 'bigeminy') {
            if (this.bigeminyNext) {
                // PVC
                this.rrInterval = 60000 / this.params.heartRate * 0.5;
            } else {
                // Batida normal
                this.rrInterval = 60000 / this.params.heartRate;
            }
            this.bigeminyNext = !this.bigeminyNext;
        }
        
        // Calcular o tempo da próxima batida
        if (this.lastBeatTime === 0) {
            this.nextBeatTime = now;
        } else {
            this.nextBeatTime = this.lastBeatTime + this.rrInterval;
        }
    }
    
    // Resetar variáveis de controle de arritmia
    resetArrhythmiaVariables() {
        this.lastPVC = 0;
        this.bigeminyNext = false;
        this.avBlockPR = this.ECG_PR_INTERVAL;
        this.avBlockDropped = false;
        this.calculateNextBeatTime();
    }
    
    // Calcular SpO2 alvo baseado em FiO2
    calculateSpo2Target() {
        // Curva de dissociação da hemoglobina simplificada
        if (this.params.fio2 >= 21) {
            // Em condições normais, SpO2 > 95%
            this.spo2Target = Math.min(100, 95 + (this.params.fio2 - 21) * 0.2);
        } else {
            // Hipóxia - queda mais acentuada da SpO2
            this.spo2Target = Math.max(70, 70 + (this.params.fio2 - 10) * 2.5);
        }
    }
    
    // Calcular contractilidade alvo baseado em isquemia
    calculateContractilityTarget() {
        if (this.params.ischemia) {
            // Isquemia reduz a contractilidade
            this.contractilityTarget = Math.max(30, this.params.contractility * 0.7);
        } else {
            // Sem isquemia, usar o valor definido pelo usuário
            this.contractilityTarget = this.params.contractility;
        }
    }
    
    // Atualizar o modelo fisiológico
    update(timestamp) {
        // Verificar se é hora de uma nova batida
        if (timestamp >= this.nextBeatTime) {
            this.lastBeatTime = timestamp;
            this.generateHeartbeat();
            this.calculateNextBeatTime();
        }
        
        // Atualizar SpO2 gradualmente em direção ao alvo
        const spo2Diff = this.spo2Target - this.currentSpo2;
        this.currentSpo2 += spo2Diff * (10 / this.SPO2_RESPONSE_TIME);
        this.indicators.spo2 = Math.round(this.currentSpo2);
        
        // Atualizar contractilidade gradualmente em direção ao alvo
        const contractilityDiff = this.contractilityTarget - this.currentContractility;
        this.currentContractility += contractilityDiff * (10 / this.CONTRACTILITY_RESPONSE_TIME);
        
        // Calcular indicadores
        this.calculateIndicators();
        
        // Atualizar buffers
        this.updateBuffers(timestamp);
        
        // Aplicar reflexo barorreceptor se ativo
        if (this.params.baroreflexActive) {
            this.applyBaroreflex();
        }
    }
    
    // Gerar uma batida cardíaca
    generateHeartbeat() {
        // Marcar início da sístole
        this.systoleStartTime = Date.now();
        this.diastoleStartTime = this.systoleStartTime + this.SYSTOLE_DURATION;
    }
    
    // Calcular indicadores fisiológicos
    calculateIndicators() {
        // Frequência cardíaca (bpm)
        this.indicators.heartRate = this.params.heartRate;
        
        // Volume sistólico (mL) - baseado em pré-carga, contractilidade e pós-carga
        // Equação simplificada: VS = VS_base * (pré-carga/100) * (contractilidade/100) / (pós-carga/100)^0.5
        const frankStarlingEffect = Math.pow(this.params.preload / 100, 0.8);
        const contractilityEffect = this.currentContractility / 100;
        const afterloadEffect = Math.pow(this.params.afterload / 100, -0.5);
        const volumeEffect = Math.pow(this.params.bloodVolume / 100, 0.9);
        
        this.indicators.strokeVolume = Math.round(
            this.BASE_STROKE_VOLUME * 
            frankStarlingEffect * 
            contractilityEffect * 
            afterloadEffect * 
            volumeEffect
        );
        
        // Débito cardíaco (L/min) = FC × VS / 1000
        this.indicators.cardiacOutput = 
            (this.indicators.heartRate * this.indicators.strokeVolume) / 1000;
            
        
        // Pressão arterial sistólica (mmHg)
        // PAS = PAS_base × (DC/DC_base) × (pós-carga/100) × (volume/100)
        this.indicators.systolicBP = Math.round(
            this.BASE_SYSTOLIC_BP * 
            (this.indicators.cardiacOutput / (this.BASE_HEART_RATE * this.BASE_STROKE_VOLUME / 1000)) * 
            (this.params.afterload / 100) * 
            (this.params.bloodVolume / 100)
        );
        
        // Pressão arterial diastólica (mmHg)
        // PAD = PAD_base × (pós-carga/100) × (volume/100)
        this.indicators.diastolicBP = Math.round(
            this.BASE_DIASTOLIC_BP * 
            (this.params.afterload / 100) * 
            (this.params.bloodVolume / 100)
        );
        
        // Pressão arterial média (mmHg) = (PAS + 2×PAD) / 3
        this.indicators.meanBP = Math.round(
            (this.indicators.systolicBP + 2 * this.indicators.diastolicBP) / 3
        );
        
        // Ritmo atual
        this.indicators.rhythm = this.getRhythmDescription();
    }
    
    // Obter descrição do ritmo atual
    getRhythmDescription() {
        switch (this.params.arrhythmia) {
            case 'normal':
                return 'Sinusal Normal';
            case 'fa':
                return 'Fibrilação Atrial';
            case 'flutter':
                return 'Flutter Atrial';
            case 'pvcs':
                return 'Extrassístoles Ventriculares';
            case 'bigeminy':
                return 'Bigeminismo';
            case 'vt':
                return 'Taquicardia Ventricular';
            case 'sinus-brady':
                return 'Bradicardia Sinusal';
            case 'av-block-1':
                return 'BAV 1º Grau';
            case 'av-block-2':
                return 'BAV 2º Grau';
            case 'av-block-3':
                return 'BAV 3º Grau (Completo)';
            default:
                return 'Desconhecido';
        }
    }
    
    // Aplicar reflexo barorreceptor
    applyBaroreflex() {
        // Se a pressão arterial média cair abaixo do limiar, aumentar a frequência cardíaca
        if (this.indicators.meanBP < this.BAROREFLEX_THRESHOLD) {
            const targetHR = Math.min(
                220, 
                this.params.heartRate + (this.BAROREFLEX_THRESHOLD - this.indicators.meanBP) * 2
            );
            
            // Ajuste gradual da frequência cardíaca
            if (targetHR > this.params.heartRate) {
                this.params.heartRate = Math.min(
                    targetHR,
                    this.params.heartRate + 0.1
                );
            }
        }
    }
    
    // Atualizar buffers de dados
    updateBuffers(timestamp) {
        // Atualizar buffer de ECG
        this.updateECGBuffer(timestamp);
        
        // Atualizar buffer de pressão
        this.updatePressureBuffer(timestamp);
        
        // Atualizar buffer de SpO2
        this.updateSpO2Buffer(timestamp);
        
        // Atualizar buffer de PCG
        this.updatePCGBuffer(timestamp);
    }
    
    // Atualizar buffer de ECG
    updateECGBuffer(timestamp) {
        // Remover dados antigos (manter apenas 15 segundos)
        const cutoffTime = timestamp - 15000;
        this.ecgBuffer = this.ecgBuffer.filter(data => data.time >= cutoffTime);
        
        // Adicionar novos pontos a cada 10ms
        const lastTime = this.ecgBuffer.length > 0 ? this.ecgBuffer[this.ecgBuffer.length - 1].time : timestamp - 15000;
        for (let t = lastTime + 10; t <= timestamp; t += 10) {
            const timeSinceBeat = t - this.lastBeatTime;
            const ecgPoint = this.generateECGPoint(timeSinceBeat);
            this.ecgBuffer.push({ time: t, ...ecgPoint });
        }
    }
    
    // Gerar ponto do ECG
    generateECGPoint(timeSinceBeat) {
        let voltage = 0;
        let pWave = false;
        let qrsComplex = false;
        let tWave = false;
        let stSegment = 0;
        
        // Para BAV 2º grau com batida dropada, não gerar ondas
        if (this.params.arrhythmia === 'av-block-2' && this.avBlockDropped) {
            return { voltage, pWave, qrsComplex, tWave, stSegment };
        }
        
        // Onda P (se presente na arritmia)
        const hasPWave = this.params.arrhythmia !== 'fa' && 
                         this.params.arrhythmia !== 'vt' &&
                         this.params.arrhythmia !== 'av-block-3';
        
        if (hasPWave && timeSinceBeat >= 0 && timeSinceBeat < this.ECG_P_DURATION) {
            pWave = true;
            voltage = 0.25 * Math.sin(Math.PI * timeSinceBeat / this.ECG_P_DURATION);
        }
        
        // Complexo QRS
        const qrsStart = hasPWave ? this.avBlockPR : 0;
        const qrsEnd = qrsStart + this.ECG_QRS_DURATION;
        
        if (timeSinceBeat >= qrsStart && timeSinceBeat < qrsEnd) {
            qrsComplex = true;
            const qrsTime = timeSinceBeat - qrsStart;
            
            // Forma de onda QRS simplificada
            if (qrsTime < this.ECG_QRS_DURATION * 0.2) {
                // Onda Q
                voltage = -0.2 * (qrsTime / (this.ECG_QRS_DURATION * 0.2));
            } else if (qrsTime < this.ECG_QRS_DURATION * 0.6) {
                // Onda R
                voltage = 1.0 * ((qrsTime - this.ECG_QRS_DURATION * 0.2) / (this.ECG_QRS_DURATION * 0.4));
            } else {
                // Onda S
                voltage = 1.0 - 1.2 * ((qrsTime - this.ECG_QRS_DURATION * 0.6) / (this.ECG_QRS_DURATION * 0.4));
            }
            
            // Para TV, QRS mais largo
            if (this.params.arrhythmia === 'vt') {
                voltage *= 0.8;
            }
        }
        
        // Segmento ST
        const stStart = qrsEnd;
        const stEnd = stStart + 80;
        
        if (timeSinceBeat >= stStart && timeSinceBeat < stEnd) {
            stSegment = this.params.ischemia ? -0.15 : 0;
            voltage = stSegment;
        }
        
        // Onda T
        const tStart = stEnd;
        const tEnd = tStart + 160;
        
        if (timeSinceBeat >= tStart && timeSinceBeat < tEnd) {
            tWave = true;
            const tTime = timeSinceBeat - tStart;
            voltage = 0.3 * Math.sin(Math.PI * tTime / (tEnd - tStart));
            
            // Em isquemia, a onda T pode ser invertida
            if (this.params.ischemia && Math.random() < 0.3) {
                voltage *= -0.8;
            }
        }
        
        return { voltage, pWave, qrsComplex, tWave, stSegment };
    }
    
    // Atualizar buffer de pressão
    updatePressureBuffer(timestamp) {
        // Remover dados antigos (manter apenas 15 segundos)
        const cutoffTime = timestamp - 15000;
        this.pressureBuffer = this.pressureBuffer.filter(data => data.time >= cutoffTime);
        
        // Adicionar novos pontos a cada 10ms
        const lastTime = this.pressureBuffer.length > 0 ? this.pressureBuffer[this.pressureBuffer.length - 1].time : timestamp - 15000;
        for (let t = lastTime + 10; t <= timestamp; t += 10) {
            const timeSinceBeat = t - this.lastBeatTime;
            const pressurePoint = this.generatePressurePoint(timeSinceBeat);
            this.pressureBuffer.push({ time: t, ...pressurePoint });
        }
    }
    
    // Gerar ponto da curva de pressão
    generatePressurePoint(timeSinceBeat) {
        let pressure = this.indicators.diastolicBP;
        let isSystolic = false;
        
        if (timeSinceBeat < this.SYSTOLE_DURATION) {
            // Fase de sístole
            isSystolic = true;
            const systoleProgress = timeSinceBeat / this.SYSTOLE_DURATION;
            
            // Curva de pressão sistólica simplificada
            if (systoleProgress < 0.3) {
                // Fase de contração rápida
                pressure = this.indicators.diastolicBP + 
                         (this.indicators.systolicBP - this.indicators.diastolicBP) * 
                         (systoleProgress / 0.3);
            } else {
                // Fase de relaxamento
                pressure = this.indicators.systolicBP - 
                         (this.indicators.systolicBP - this.indicators.diastolicBP) * 
                         ((systoleProgress - 0.3) / 0.7);
            }
        } else {
            // Fase de diástole
            const diastoleProgress = (timeSinceBeat - this.SYSTOLE_DURATION) / this.rrInterval;
            
            // Curva de pressão diastólica simplificada (decaimento exponencial)
            pressure = this.indicators.diastolicBP + 
                     (this.indicators.systolicBP - this.indicators.diastolicBP) * 
                     Math.exp(-3 * diastoleProgress);
        }
        
        return { pressure, isSystolic };
    }
    
    // Atualizar buffer de SpO2
    updateSpO2Buffer(timestamp) {
        // Remover dados antigos (manter apenas 15 segundos)
        const cutoffTime = timestamp - 15000;
        this.spo2Buffer = this.spo2Buffer.filter(data => data.time >= cutoffTime);
        
        // Adicionar novos pontos a cada 100ms
        const lastTime = this.spo2Buffer.length > 0 ? this.spo2Buffer[this.spo2Buffer.length - 1].time : timestamp - 15000;
        for (let t = lastTime + 100; t <= timestamp; t += 100) {
            // Adicionar pequena variação aleatória para simular ruído fisiológico
            const spo2Variation = (Math.random() - 0.5) * 0.5;
            const spo2 = Math.max(70, Math.min(100, this.indicators.spo2 + spo2Variation));
            this.spo2Buffer.push({ time: t, spo2 });
        }
    }
    
    // Atualizar buffer de PCG
    updatePCGBuffer(timestamp) {
        // Remover dados antigos (manter apenas 15 segundos)
        const cutoffTime = timestamp - 15000;
        this.pcgBuffer = this.pcgBuffer.filter(data => data.time >= cutoffTime);
        
        // Adicionar novos pontos a cada 10ms
        const lastTime = this.pcgBuffer.length > 0 ? this.pcgBuffer[this.pcgBuffer.length - 1].time : timestamp - 15000;
        for (let t = lastTime + 10; t <= timestamp; t += 10) {
            const timeSinceBeat = t - this.lastBeatTime;
            const pcgPoint = this.generatePCGPoint(timeSinceBeat);
            this.pcgBuffer.push({ time: t, ...pcgPoint });
        }
    }
    
    // Gerar ponto do fonocardiograma
    generatePCGPoint(timeSinceBeat) {
        let s1 = false;
        let s2 = false;
        let amplitude = 0;
        
        // Som S1 (fechamento das válvulas atrioventriculares)
        const s1Start = 20;
        const s1End = s1Start + 40;
        
        if (timeSinceBeat >= s1Start && timeSinceBeat < s1End) {
            s1 = true;
            const s1Progress = (timeSinceBeat - s1Start) / (s1End - s1Start);
            amplitude = Math.sin(Math.PI * s1Progress);
        }
        
        // Som S2 (fechamento das válvulas semilunares)
        const s2Start = this.SYSTOLE_DURATION + 20;
        const s2End = s2Start + 30;
        
        if (timeSinceBeat >= s2Start && timeSinceBeat < s2End) {
            s2 = true;
            const s2Progress = (timeSinceBeat - s2Start) / (s2End - s2Start);
            amplitude = 0.8 * Math.sin(Math.PI * s2Progress);
        }
        
        return { s1, s2, amplitude };
    }
    
    // Obter parâmetros atuais
    getParams() {
        return { ...this.params };
    }
    
    // Obter indicadores calculados
    getIndicators() {
        return { ...this.indicators };
    }
    
    // Obter buffer de ECG
    getECGBuffer() {
        return [...this.ecgBuffer];
    }
    
    // Obter buffer de pressão
    getPressureBuffer() {
        return [...this.pressureBuffer];
    }
    
    // Obter buffer de SpO2
    getSpO2Buffer() {
        return [...this.spo2Buffer];
    }
    
    // Obter buffer de PCG
    getPCGBuffer() {
        return [...this.pcgBuffer];
    }
    
    // Obter tempo da última batida
    getLastBeatTime() {
        return this.lastBeatTime;
    }
    
    // Obter tempo da próxima batida
    getNextBeatTime() {
        return this.nextBeatTime;
    }
    
    // Obter tempo de início da sístole
    getSystoleStartTime() {
        return this.systoleStartTime;
    }
    
    // Obter tempo de início da diástole
    getDiastoleStartTime() {
        return this.diastoleStartTime;
    }
    
    // Resetar para valores normais
    reset() {
        this.params = {
            heartRate: this.BASE_HEART_RATE,
            contractility: 100,
            preload: 100,
            afterload: 100,
            fio2: 21,
            bloodVolume: 100,
            arrhythmia: 'normal',
            ischemia: false,
            baroreflexActive: true
        };
        
        this.indicators = {
            heartRate: this.BASE_HEART_RATE,
            strokeVolume: this.BASE_STROKE_VOLUME,
            cardiacOutput: this.BASE_HEART_RATE * this.BASE_STROKE_VOLUME / 1000,
            systolicBP: this.BASE_SYSTOLIC_BP,
            diastolicBP: this.BASE_DIASTOLIC_BP,
            meanBP: (this.BASE_SYSTOLIC_BP + 2 * this.BASE_DIASTOLIC_BP) / 3,
            spo2: this.BASE_SPO2,
            rhythm: 'Normal'
        };
        
        this.spo2Target = this.BASE_SPO2;
        this.currentSpo2 = this.BASE_SPO2;
        this.contractilityTarget = 100;
        this.currentContractility = 100;
        
        this.resetArrhythmiaVariables();
        this.calculateNextBeatTime();
    }
}

/**
 * Sistema de áudio para o simulador cardíaco
 * Responsável por gerar os sons do coração (S1 e S2) usando Web Audio API
 */
class HeartAudio {
    constructor() {
        // Inicializar o contexto de áudio
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Criar nó de controle de volume
        this.gainNode = this.audioContext.createGain();
        this.gainNode.connect(this.audioContext.destination);
        this.gainNode.gain.value = 0.5;
        
        this.enabled = true;
        this.volume = 0.5;
        this.lastS1Time = 0;
        this.lastS2Time = 0;
    }
    
    // Habilitar/desabilitar áudio
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    
    // Definir volume (0.0 a 1.0)
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.gainNode.gain.value = this.volume;
    }
    
    // Tocar som S1 (fechamento das válvulas atrioventriculares)
    playS1(timestamp) {
        if (!this.enabled) return;
        
        // Evitar tocar S1 muito próximo do anterior
        if (timestamp - this.lastS1Time < 100) return;
        
        this.lastS1Time = timestamp;
        
        // Criar oscilador para o som S1
        const oscillator = this.audioContext.createOscillator();
        const s1Gain = this.audioContext.createGain();
        
        // Configurar oscilador (frequência mais baixa para S1)
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(30, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.05);
        
        // Configurar envelope de volume
        s1Gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        s1Gain.gain.linearRampToValueAtTime(0.8, this.audioContext.currentTime + 0.01);
        s1Gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        // Conectar nós
        oscillator.connect(s1Gain);
        s1Gain.connect(this.gainNode);
        
        // Tocar som
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }
    
    // Tocar som S2 (fechamento das válvulas semilunares)
    playS2(timestamp) {
        if (!this.enabled) return;
        
        // Evitar tocar S2 muito próximo do anterior
        if (timestamp - this.lastS2Time < 100) return;
        
        this.lastS2Time = timestamp;
        
        // Criar oscilador para o som S2
        const oscillator = this.audioContext.createOscillator();
        const s2Gain = this.audioContext.createGain();
        
        // Configurar oscilador (frequência mais alta para S2)
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(60, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(90, this.audioContext.currentTime + 0.04);
        
        // Configurar envelope de volume (S2 é mais suave que S1)
        s2Gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        s2Gain.gain.linearRampToValueAtTime(0.6, this.audioContext.currentTime + 0.01);
        s2Gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.08);
        
        // Conectar nós
        oscillator.connect(s2Gain);
        s2Gain.connect(this.gainNode);
        
        // Tocar som
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.08);
    }
    
    // Retornar se o áudio está habilitado
    isEnabled() {
        return this.enabled;
    }
    
    // Retornar volume atual
    getVolume() {
        return this.volume;
    }
}

/**
 * Visualização 3D do coração usando Three.js
 * Responsável por renderizar e animar o modelo 3D do coração
 */
class HeartVisualization {
    constructor(containerId) {
        this.container = document.getElementById(containerId) || document.body;
        this.clock = new THREE.Clock();
        
        // Inicializar cena, câmera e renderer
        this.initScene();
        
        // Criar modelo do coração
        this.createHeartModel();
        
        // Configurar iluminação
        this.setupLighting();
        
        // Inicializar variáveis de animação
        this.animationId = null;
        this.isPaused = false;
        this.lastBeatTime = 0;
        this.nextBeatTime = 0;
        this.systoleStartTime = 0;
        this.diastoleStartTime = 0;
        this.currentScale = 1.0;
        this.targetScale = 1.0;
        this.beatAnimationDuration = 300; // ms
        
        // Iniciar animação
        this.animate();
    }
    
    // Inicializar cena, câmera e renderer
    initScene() {
        // Criar cena
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf0f0f0);
        
        // Criar câmera
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        this.camera.position.set(0, 0, 5);
        
        // Criar renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);
        
        // Adicionar evento de redimensionamento
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }
    
    // Criar modelo do coração
    createHeartModel() {
        this.heart = new THREE.Group();
        
        // Material do coração
        this.heartMaterial = new THREE.MeshPhongMaterial({
            color: 0xe74c3c,
            shininess: 30,
            transparent: true,
            opacity: 0.9
        });
        
        // Criar geometria simplificada do coração
        // Usando uma esfera modificada para representar o coração
        const heartGeometry = new THREE.SphereGeometry(1, 32, 32);
        
        // Modificar a geometria para ter formato de coração
        const positionAttribute = heartGeometry.getAttribute('position');
        const vertex = new THREE.Vector3();
        
        for (let i = 0; i < positionAttribute.count; i++) {
            vertex.fromBufferAttribute(positionAttribute, i);
            
            // Transformar esfera em formato de coração
            const x = vertex.x;
            const y = vertex.y;
            const z = vertex.z;
            
            // Equação paramétrica para coração
            const r = Math.sqrt(x * x + y * y + z * z);
            const theta = Math.atan2(y, x);
            const phi = Math.acos(z / r);
            
            // Modificar coordenadas para formar coração
            const newX = r * Math.sin(phi) * Math.cos(theta);
            const newY = r * Math.sin(phi) * Math.sin(theta) * 1.2;
            const newZ = r * Math.cos(phi) * 0.8;
            
            // Adicionar "corte" no topo para formar os átrios
            if (newY > 0.3) {
                const factor = 1 - (newY - 0.3) * 2;
                vertex.x = newX * factor + (Math.random() - 0.5) * 0.1;
                vertex.y = newY * factor;
                vertex.z = newZ * factor;
            } else {
                vertex.x = newX;
                vertex.y = newY;
                vertex.z = newZ;
            }
            
            positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        
        positionAttribute.needsUpdate = true;
        heartGeometry.computeVertexNormals();
        
        // Criar mesh do coração
        const heartMesh = new THREE.Mesh(heartGeometry, this.heartMaterial);
        this.heart.add(heartMesh);
        
        // Adicionar coração à cena
        this.scene.add(this.heart);
    }
    
    // Configurar iluminação
    setupLighting() {
        // Luz ambiente
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        // Luz direcional
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);
        
        // Luz pontual
        const pointLight = new THREE.PointLight(0xffffff, 0.5);
        pointLight.position.set(-5, 5, 5);
        this.scene.add(pointLight);
    }
    
    // Manipular redimensionamento da janela
    onWindowResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
    }
    
    // Iniciar uma nova batida cardíaca
    startBeat(timestamp) {
        this.lastBeatTime = timestamp;
        this.systoleStartTime = timestamp;
        this.diastoleStartTime = timestamp + this.beatAnimationDuration;
        this.targetScale = 1.15; // Expansão durante a sístole
    }
    
    // Atualizar animação
    update(timestamp, heartRate) {
        // Calcular tempo da próxima batida
        if (this.lastBeatTime === 0) {
            this.nextBeatTime = timestamp;
        } else {
            const beatInterval = 60000 / heartRate;
            this.nextBeatTime = this.lastBeatTime + beatInterval;
        }
        
        // Verificar se é hora de uma nova batida
        if (timestamp >= this.nextBeatTime) {
            this.startBeat(timestamp);
        }
        
        // Animar escala do coração
        if (timestamp >= this.systoleStartTime && timestamp < this.diastoleStartTime) {
            // Fase de sístole (expansão)
            const progress = (timestamp - this.systoleStartTime) / this.beatAnimationDuration;
            this.currentScale = 1.0 + 0.15 * Math.sin(progress * Math.PI);
        } else if (timestamp >= this.diastoleStartTime) {
            // Fase de diástole (relaxamento)
            const progress = (timestamp - this.diastoleStartTime) / this.beatAnimationDuration;
            this.currentScale = 1.15 - 0.15 * Math.min(1, progress);
        }
        
        // Aplicar escala ao coração
        this.heart.scale.set(this.currentScale, this.currentScale, this.currentScale);
        
        // Rotacionar lentamente o coração
        if (!this.isPaused) {
            this.heart.rotation.y += 0.003;
        }
    }
    
    // Pausar/retomar animação
    setPaused(paused) {
        this.isPaused = paused;
    }
    
    // Atualizar cor do coração baseado em SpO2
    updateColor(spo2) {
        // Normalizar SpO2 para o intervalo 0-1
        const normalizedSpo2 = Math.max(0, Math.min(1, (spo2 - 70) / 30));
        
        // Interpolar cor de azul (SpO2 baixo) para vermelho (SpO2 normal)
        const r = 0.9;
        const g = 0.3 * normalizedSpo2;
        const b = 0.3 * (1 - normalizedSpo2);
        
        // Atualizar cor do material
        this.heartMaterial.color.setRGB(r, g, b);
    }
    
    // Loop de animação
    animate() {
        this.animationId = requestAnimationFrame(this.animate.bind(this));
        
        if (!this.isPaused) {
            // Renderizar cena
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    // Destruir visualização
    dispose() {
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Remover event listeners
        window.removeEventListener('resize', this.onWindowResize.bind(this));
        
        // Remover renderer do DOM
        if (this.container.contains(this.renderer.domElement)) {
            this.container.removeChild(this.renderer.domElement);
        }
        
        // Dispor recursos
        this.renderer.dispose();
    }
}

/**
 * Sistema de renderização de gráficos
 * Responsável por desenhar os gráficos de ECG, Pressão Arterial, SpO2 e PCG
 */
class ChartRenderer {
    constructor(ecgCanvasId, secondChartCanvasId) {
        // Obter elementos canvas
        this.ecgCanvas = document.getElementById(ecgCanvasId);
        this.secondChartCanvas = document.getElementById(secondChartCanvasId);
        
        if (!this.ecgCanvas || !this.secondChartCanvas) {
            throw new Error('Canvas elements not found');
        }
        
        // Obter contextos 2D
        this.ecgCtx = this.ecgCanvas.getContext('2d');
        this.secondChartCtx = this.secondChartCanvas.getContext('2d');
        
        if (!this.ecgCtx || !this.secondChartCtx) {
            throw new Error('Could not get 2D context');
        }
        
        // Configurar tipo do segundo gráfico
        this.secondChartType = 'pressure';
        
        // Configurar cores
        this.gridColor = '#e0e0e0';
        this.ecgColor = '#2ecc71';
        this.pressureColor = '#3498db';
        this.spo2Color = '#9b59b6';
        this.pcgColor = '#e67e22';
        this.backgroundColor = '#ffffff';
        this.textColor = '#2c3e50';
        this.isDarkMode = false;
        
        // Configurar tamanho dos canvas
        this.resizeCanvases();
        
        // Adicionar listener para redimensionamento
        window.addEventListener('resize', this.resizeCanvases.bind(this));
    }
    
    // Redimensionar canvas
    resizeCanvases() {
        const ecgContainer = this.ecgCanvas.parentElement;
        const secondChartContainer = this.secondChartCanvas.parentElement;
        
        if (ecgContainer) {
            this.ecgCanvas.width = ecgContainer.clientWidth - 32; // Subtrair padding
            this.ecgCanvas.height = ecgContainer.clientHeight - 80; // Subtrair padding e título
        }
        
        if (secondChartContainer) {
            this.secondChartCanvas.width = secondChartContainer.clientWidth - 32; // Subtrair padding
            this.secondChartCanvas.height = secondChartContainer.clientHeight - 120; // Subtrair padding, título e botões
        }
    }
    
    // Definir tipo do segundo gráfico
    setSecondChartType(type) {
        this.secondChartType = type;
    }
    
    // Alternar modo escuro
    setDarkMode(enabled) {
        this.isDarkMode = enabled;
        
        if (enabled) {
            this.gridColor = '#34495e';
            this.ecgColor = '#2ecc71';
            this.pressureColor = '#3498db';
            this.spo2Color = '#9b59b6';
            this.pcgColor = '#e67e22';
            this.backgroundColor = '#2c3e50';
            this.textColor = '#ecf0f1';
        } else {
            this.gridColor = '#e0e0e0';
            this.ecgColor = '#2ecc71';
            this.pressureColor = '#3498db';
            this.spo2Color = '#9b59b6';
            this.pcgColor = '#e67e22';
            this.backgroundColor = '#ffffff';
            this.textColor = '#2c3e50';
        }
    }
    
    // Limpar canvas
    clearCanvas(ctx, canvas) {
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Desenhar grade
    drawGrid(ctx, canvas, xScale, yScale) {
        ctx.strokeStyle = this.gridColor;
        ctx.lineWidth = 1;
        
        // Linhas verticais
        for (let x = 0; x <= canvas.width; x += xScale) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        // Linhas horizontais
        for (let y = 0; y <= canvas.height; y += yScale) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }
    
    // Desenhar gráfico ECG
    drawECG(data, currentTime, windowDuration = 10000) {
        const canvas = this.ecgCanvas;
        const ctx = this.ecgCtx;
        
        // Limpar canvas
        this.clearCanvas(ctx, canvas);
        
        // Desenhar grade (1mm = 0.1mV, 25mm/s)
        const xScale = canvas.width / (windowDuration / 10); // 10ms por pixel
        const yScale = canvas.height / 10; // 10mV de altura total
        this.drawGrid(ctx, canvas, xScale * 25, yScale); // Grade de 25mm x 1mm
        
        // Configurar estilo da linha
        ctx.strokeStyle = this.ecgColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        // Encontrar o início dos dados a serem plotados
        const startTime = currentTime - windowDuration;
        let firstPoint = true;
        
        // Desenhar ECG
        for (const point of data) {
            if (point.time < startTime) continue;
            
            const x = ((point.time - startTime) / windowDuration) * canvas.width;
            const y = canvas.height / 2 - (point.voltage * canvas.height / 10); // 10mV de altura total
            
            if (firstPoint) {
                ctx.moveTo(x, y);
                firstPoint = false;
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
        
        // Desenhar linha do tempo atual
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(canvas.width - 1, 0);
        ctx.lineTo(canvas.width - 1, canvas.height);
        ctx.stroke();
    }
    
    // Desenhar gráfico de pressão arterial
    drawPressure(data, currentTime, windowDuration = 10000) {
        const canvas = this.secondChartCanvas;
        const ctx = this.secondChartCtx;
        
        // Limpar canvas
        this.clearCanvas(ctx, canvas);
        
        // Desenhar grade
        const xScale = canvas.width / (windowDuration / 100); // 100ms por pixel
        const yScale = canvas.height / 200; // 200mmHg de altura total
        this.drawGrid(ctx, canvas, xScale, yScale);
        
        // Configurar estilo da linha
        ctx.strokeStyle = this.pressureColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        // Encontrar o início dos dados a serem plotados
        const startTime = currentTime - windowDuration;
        let firstPoint = true;
        
        // Desenhar curva de pressão
        for (const point of data) {
            if (point.time < startTime) continue;
            
            const x = ((point.time - startTime) / windowDuration) * canvas.width;
            const y = canvas.height - ((point.pressure / 200) * canvas.height); // 200mmHg de altura total
            
            if (firstPoint) {
                ctx.moveTo(x, y);
                firstPoint = false;
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
        
        // Desenhar linha do tempo atual
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(canvas.width - 1, 0);
        ctx.lineTo(canvas.width - 1, canvas.height);
        ctx.stroke();
        
        // Adicionar rótulos
        ctx.fillStyle = this.textColor;
        ctx.font = '12px Arial';
        ctx.fillText('200 mmHg', 5, 15);
        ctx.fillText('0 mmHg', 5, canvas.height - 5);
    }
    
    // Desenhar gráfico de SpO2
    drawSpO2(data, currentTime, windowDuration = 10000) {
        const canvas = this.secondChartCanvas;
        const ctx = this.secondChartCtx;
        
        // Limpar canvas
        this.clearCanvas(ctx, canvas);
        
        // Desenhar grade
        const xScale = canvas.width / (windowDuration / 1000); // 1000ms por pixel
        const yScale = canvas.height / 30; // 30% de altura total
        this.drawGrid(ctx, canvas, xScale, yScale);
        
        // Configurar estilo da linha
        ctx.strokeStyle = this.spo2Color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        // Encontrar o início dos dados a serem plotados
        const startTime = currentTime - windowDuration;
        let firstPoint = true;
        
        // Desenhar curva de SpO2
        for (const point of data) {
            if (point.time < startTime) continue;
            
            const x = ((point.time - startTime) / windowDuration) * canvas.width;
            const y = canvas.height - (((point.spo2 - 70) / 30) * canvas.height); // 70-100% de altura total
            
            if (firstPoint) {
                ctx.moveTo(x, y);
                firstPoint = false;
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
        
        // Desenhar linha do tempo atual
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(canvas.width - 1, 0);
        ctx.lineTo(canvas.width - 1, canvas.height);
        ctx.stroke();
        
        // Adicionar rótulos
        ctx.fillStyle = this.textColor;
        ctx.font = '12px Arial';
        ctx.fillText('100%', 5, 15);
        ctx.fillText('70%', 5, canvas.height - 5);
    }
    
    // Desenhar gráfico de PCG (Fonocardiograma)
    drawPCG(data, currentTime, windowDuration = 10000) {
        const canvas = this.secondChartCanvas;
        const ctx = this.secondChartCtx;
        
        // Limpar canvas
        this.clearCanvas(ctx, canvas);
        
        // Desenhar grade
        const xScale = canvas.width / (windowDuration / 100); // 100ms por pixel
        const yScale = canvas.height / 2; // 2 unidades de amplitude
        this.drawGrid(ctx, canvas, xScale, yScale);
        
        // Encontrar o início dos dados a serem plotados
        const startTime = currentTime - windowDuration;
        
        // Desenhar S1 e S2
        for (const point of data) {
            if (point.time < startTime) continue;
            
            const x = ((point.time - startTime) / windowDuration) * canvas.width;
            const y = canvas.height / 2;
            
            if (point.s1) {
                // Desenhar S1
                ctx.fillStyle = this.pcgColor;
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, Math.PI * 2);
                ctx.fill();
                
                // Adicionar rótulo
                ctx.fillStyle = this.textColor;
                ctx.font = '10px Arial';
                ctx.fillText('S1', x + 8, y);
            } else if (point.s2) {
                // Desenhar S2
                ctx.fillStyle = this.pcgColor;
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
                
                // Adicionar rótulo
                ctx.fillStyle = this.textColor;
                ctx.font = '10px Arial';
                ctx.fillText('S2', x + 8, y);
            }
        }
        
        // Desenhar linha do tempo atual
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(canvas.width - 1, 0);
        ctx.lineTo(canvas.width - 1, canvas.height);
        ctx.stroke();
    }
    
    // Renderizar segundo gráfico baseado no tipo selecionado
    renderSecondChart(pressureData, spo2Data, pcgData, currentTime, windowDuration = 10000) {
        switch (this.secondChartType) {
            case 'pressure':
                this.drawPressure(pressureData, currentTime, windowDuration);
                break;
            case 'spo2':
                this.drawSpO2(spo2Data, currentTime, windowDuration);
                break;
            case 'pcg':
                this.drawPCG(pcgData, currentTime, windowDuration);
                break;
        }
    }
    
    // Capturar snapshot do gráfico
    captureSnapshot(canvasId) {
        let canvas = null;
        
        if (canvasId === 'ecg-canvas') {
            canvas = this.ecgCanvas;
        } else if (canvasId === 'second-chart-canvas') {
            canvas = this.secondChartCanvas;
        }
        
        if (!canvas) return null;
        
        return canvas.toDataURL('image/png');
    }
}

/**
 * Aplicação principal do simulador de coração
 * Orquestra todos os componentes e gerencia a interação do usuário
 */
class HeartSimulatorApp {
    constructor() {
        // Inicializar componentes
        this.physiology = new PhysiologyModel();
        this.audio = new HeartAudio();
        this.visualization = new HeartVisualization('heart-container');
        this.charts = new ChartRenderer('ecg-canvas', 'second-chart-canvas');
        
        // Inicializar variáveis de controle
        this.isPaused = false;
        this.lastUpdateTime = 0;
        this.animationFrameId = null;
        this.currentSecondChart = 'pressure';
        this.isDarkMode = false;
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Iniciar loop de animação
        this.startAnimation();
    }
    
    // Configurar event listeners
    setupEventListeners() {
        // Botão de reset
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.resetSimulation();
        });
        
        // Botão de pausa
        document.getElementById('pause-btn').addEventListener('click', () => {
            this.togglePause();
        });
        
        // Botão de snapshot
        document.getElementById('snapshot-btn').addEventListener('click', () => {
            this.takeSnapshot();
        });
        
        // Toggle de áudio
        document.getElementById('audio-toggle').addEventListener('change', (e) => {
            const enabled = e.target.checked;
            this.audio.setEnabled(enabled);
        });
        
        // Toggle de reflexo barorreceptor
        document.getElementById('baroreflex-toggle').addEventListener('change', (e) => {
            const enabled = e.target.checked;
            this.physiology.updateParams({ baroreflexActive: enabled });
        });
        
        // Sliders
        this.setupSlider('hr-slider', 'heartRate', 'hr-slider-value');
        this.setupSlider('contractility-slider', 'contractility', 'contractility-slider-value');
        this.setupSlider('preload-slider', 'preload', 'preload-slider-value');
        this.setupSlider('afterload-slider', 'afterload', 'afterload-slider-value');
        this.setupSlider('fio2-slider', 'fio2', 'fio2-slider-value');
        this.setupSlider('volume-slider', 'bloodVolume', 'volume-slider-value');
        this.setupSlider('audio-volume-slider', 'audioVolume', 'audio-volume-slider-value', (value) => {
            this.audio.setVolume(value / 100);
        });
        
        // Select de arritmia
        document.getElementById('arrhythmia-select').addEventListener('change', (e) => {
            const arrhythmia = e.target.value;
            this.physiology.updateParams({ arrhythmia });
        });
        
        // Toggle de isquemia
        document.getElementById('ischemia-toggle').addEventListener('change', (e) => {
            const ischemia = e.target.checked;
            this.physiology.updateParams({ ischemia });
        });
        
        // Botões de presets
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const preset = e.target.dataset.preset;
                if (preset) {
                    this.applyPreset(preset);
                    
                    // Atualizar botão ativo
                    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                }
            });
        });
        
        // Botões de toggle do segundo gráfico
        document.querySelectorAll('.chart-toggle button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const chartType = e.target.dataset.chart;
                if (chartType) {
                    this.currentSecondChart = chartType;
                    this.charts.setSecondChartType(chartType);
                    
                    // Atualizar título
                    const titles = {
                        'pressure': 'Pressão Arterial Sistêmica',
                        'spo2': 'Saturação de Oxigênio (SpO₂)',
                        'pcg': 'Fonocardiograma (PCG)'
                    };
                    document.getElementById('second-chart-title').textContent = titles[chartType];
                    
                    // Atualizar botão ativo
                    document.querySelectorAll('.chart-toggle button').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                }
            });
        });
        
        // Teclado
        document.addEventListener('keydown', (e) => {
            if (e.key === ' ') {
                e.preventDefault();
                this.togglePause();
            } else if (e.key === 'r' || e.key === 'R') {
                this.resetSimulation();
            } else if (e.key === 's' || e.key === 'S') {
                this.takeSnapshot();
            }
        });
    }
    
    // Configurar slider
    setupSlider(sliderId, paramKey, valueId, callback) {
        const slider = document.getElementById(sliderId);
        const valueDisplay = document.getElementById(valueId);
        
        if (!slider || !valueDisplay) return;
        
        slider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            valueDisplay.textContent = value.toString();
            
            if (paramKey === 'audioVolume') {
                if (callback) callback(value);
            } else {
                this.physiology.updateParams({ [paramKey]: value });
            }
        });
    }
    
    // Aplicar preset
    applyPreset(preset) {
        switch (preset) {
            case 'normal':
                this.physiology.updateParams({
                    heartRate: 70,
                    contractility: 100,
                    preload: 100,
                    afterload: 100,
                    fio2: 21,
                    bloodVolume: 100,
                    arrhythmia: 'normal',
                    ischemia: false
                });
                break;
                
            case 'fa':
                this.physiology.updateParams({
                    heartRate: 120,
                    contractility: 90,
                    preload: 100,
                    afterload: 100,
                    fio2: 21,
                    bloodVolume: 100,
                    arrhythmia: 'fa',
                    ischemia: false
                });
                break;
                
            case 'sinus-tachy':
                this.physiology.updateParams({
                    heartRate: 140,
                    contractility: 100,
                    preload: 100,
                    afterload: 100,
                    fio2: 21,
                    bloodVolume: 100,
                    arrhythmia: 'normal',
                    ischemia: false
                });
                break;
                
            case 'sinus-brady':
                this.physiology.updateParams({
                    heartRate: 45,
                    contractility: 100,
                    preload: 100,
                    afterload: 100,
                    fio2: 21,
                    bloodVolume: 100,
                    arrhythmia: 'sinus-brady',
                    ischemia: false
                });
                break;
                
            case 'hypovolemia':
                this.physiology.updateParams({
                    heartRate: 90,
                    contractility: 100,
                    preload: 70,
                    afterload: 100,
                    fio2: 21,
                    bloodVolume: 70,
                    arrhythmia: 'normal',
                    ischemia: false
                });
                break;
                
            case 'hypoxia':
                this.physiology.updateParams({
                    heartRate: 110,
                    contractility: 100,
                    preload: 100,
                    afterload: 100,
                    fio2: 14,
                    bloodVolume: 100,
                    arrhythmia: 'normal',
                    ischemia: true
                });
                break;
                
            case 'vt':
                this.physiology.updateParams({
                    heartRate: 180,
                    contractility: 70,
                    preload: 100,
                    afterload: 100,
                    fio2: 21,
                    bloodVolume: 100,
                    arrhythmia: 'vt',
                    ischemia: false
                });
                break;
        }
        
        // Atualizar UI para refletir os novos valores
        this.updateUIFromParams();
    }
    
    // Atualizar UI a partir dos parâmetros
    updateUIFromParams() {
        const params = this.physiology.getParams();
        
        // Atualizar sliders
        document.getElementById('hr-slider').value = params.heartRate.toString();
        document.getElementById('hr-slider-value').textContent = params.heartRate.toString();
        
        document.getElementById('contractility-slider').value = params.contractility.toString();
        document.getElementById('contractility-slider-value').textContent = params.contractility.toString();
        
        document.getElementById('preload-slider').value = params.preload.toString();
        document.getElementById('preload-slider-value').textContent = params.preload.toString();
        
        document.getElementById('afterload-slider').value = params.afterload.toString();
        document.getElementById('afterload-slider-value').textContent = params.afterload.toString();
        
        document.getElementById('fio2-slider').value = params.fio2.toString();
        document.getElementById('fio2-slider-value').textContent = params.fio2.toString();
        
        document.getElementById('volume-slider').value = params.bloodVolume.toString();
        document.getElementById('volume-slider-value').textContent = params.bloodVolume.toString();
        
        document.getElementById('arrhythmia-select').value = params.arrhythmia;
        
        document.getElementById('ischemia-toggle').checked = params.ischemia;
        
        document.getElementById('baroreflex-toggle').checked = params.baroreflexActive;
    }
    
    // Resetar simulação
    resetSimulation() {
        this.physiology.reset();
        this.updateUIFromParams();
        
        // Resetar presets
        document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('.preset-btn[data-preset="normal"]').classList.add('active');
    }
    
    // Alternar pausa
    togglePause() {
        this.isPaused = !this.isPaused;
        this.visualization.setPaused(this.isPaused);
        
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.textContent = this.isPaused ? 'Retomar' : 'Pausar';
        }
    }
    
    // Capturar snapshot
    takeSnapshot() {
        // Capturar ECG
        const ecgSnapshot = this.charts.captureSnapshot('ecg-canvas');
        if (ecgSnapshot) {
            const link = document.createElement('a');
            link.download = `ecg-snapshot-${Date.now()}.png`;
            link.href = ecgSnapshot;
            link.click();
        }
        
        // Capturar segundo gráfico
        const secondChartSnapshot = this.charts.captureSnapshot('second-chart-canvas');
        if (secondChartSnapshot) {
            const link = document.createElement('a');
            link.download = `${this.currentSecondChart}-snapshot-${Date.now()}.png`;
            link.href = secondChartSnapshot;
            link.click();
        }
    }
    
    // Atualizar indicadores na UI
    updateIndicators(indicators) {
        document.getElementById('hr-value').textContent = indicators.heartRate.toString();
        document.getElementById('sv-value').textContent = indicators.strokeVolume.toString();
        document.getElementById('co-value').textContent = indicators.cardiacOutput.toFixed(1);
        document.getElementById('bp-value').textContent = `${indicators.systolicBP}/${indicators.diastolicBP}`;
        document.getElementById('map-value').textContent = indicators.meanBP.toString();
        document.getElementById('spo2-value').textContent = indicators.spo2.toString();
        document.getElementById('rhythm-value').textContent = indicators.rhythm;
    }
    
    // Iniciar loop de animação
    startAnimation() {
        const animate = (timestamp) => {
            // Atualizar modelo fisiológico
            if (!this.isPaused) {
                this.physiology.update(timestamp);
                
                // Obter dados atualizados
                const indicators = this.physiology.getIndicators();
                const ecgData = this.physiology.getECGBuffer();
                const pressureData = this.physiology.getPressureBuffer();
                const spo2Data = this.physiology.getSpO2Buffer();
                const pcgData = this.physiology.getPCGBuffer();
                
                // Atualizar visualização 3D
                this.visualization.update(timestamp, indicators.heartRate);
                this.visualization.updateColor(indicators.spo2);
                
                // Verificar se é hora de tocar sons S1 e S2
                const lastBeatTime = this.physiology.getLastBeatTime();
                const systoleStartTime = this.physiology.getSystoleStartTime();
                const diastoleStartTime = this.physiology.getDiastoleStartTime();
                
                if (timestamp >= systoleStartTime && timestamp < systoleStartTime + 50) {
                    this.audio.playS1(timestamp);
                }
                
                if (timestamp >= diastoleStartTime && timestamp < diastoleStartTime + 50) {
                    this.audio.playS2(timestamp);
                }
                
                // Atualizar gráficos
                this.charts.drawECG(ecgData, timestamp);
                this.charts.renderSecondChart(pressureData, spo2Data, pcgData, timestamp);
                
                // Atualizar indicadores na UI
                this.updateIndicators(indicators);
            }
            
            // Continuar loop de animação
            this.animationFrameId = requestAnimationFrame(animate);
        };
        
        // Iniciar animação
        this.animationFrameId = requestAnimationFrame(animate);
    }
    
    // Inicializar aplicação
    init() {
        // Atualizar UI inicial
        this.updateUIFromParams();
        
        // Configurar áudio inicial
        this.audio.setEnabled(true);
        this.audio.setVolume(0.5);
        
        console.log('Simulador de Coração Humano Virtual inicializado com sucesso!');
    }
    
    // Destruir aplicação
    dispose() {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        this.visualization.dispose();
    }
}

// Inicializar aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    const app = new HeartSimulatorApp();
    app.init();
});