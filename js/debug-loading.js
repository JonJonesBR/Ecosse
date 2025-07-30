/**
 * Debug Loading Issues
 * Simple diagnostic tool to identify loading problems
 */

class LoadingDebugger {
    constructor() {
        this.loadingSteps = [];
        this.errors = [];
        this.startTime = Date.now();
        this.timeouts = [];
    }
    
    logStep(step, status = 'started') {
        const timestamp = Date.now() - this.startTime;
        const logEntry = {
            step,
            status,
            timestamp,
            time: new Date().toISOString()
        };
        
        this.loadingSteps.push(logEntry);
        console.log(`🔍 [${timestamp}ms] ${step}: ${status}`);
        
        // Update loading indicator if it exists
        this.updateLoadingIndicator(step, status);
    }
    
    logError(step, error) {
        const timestamp = Date.now() - this.startTime;
        const errorEntry = {
            step,
            error: error.message || error,
            stack: error.stack,
            timestamp,
            time: new Date().toISOString()
        };
        
        this.errors.push(errorEntry);
        console.error(`❌ [${timestamp}ms] ${step} FAILED:`, error);
        
        this.updateLoadingIndicator(step, 'failed');
    }
    
    updateLoadingIndicator(step, status) {
        // Create or update loading indicator
        let indicator = document.getElementById('loading-debug-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'loading-debug-indicator';
            indicator.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 10px;
                border-radius: 5px;
                font-family: monospace;
                font-size: 12px;
                z-index: 9999;
                max-width: 300px;
                max-height: 200px;
                overflow-y: auto;
            `;
            document.body.appendChild(indicator);
        }
        
        const statusIcon = status === 'completed' ? '✅' : 
                          status === 'failed' ? '❌' : 
                          status === 'started' ? '🔄' : '⏳';
        
        indicator.innerHTML += `<div>${statusIcon} ${step}</div>`;
        indicator.scrollTop = indicator.scrollHeight;
    }
    
    checkForInfiniteLoops() {
        // Set up timeout to detect if loading takes too long
        const timeout = setTimeout(() => {
            console.error('🚨 LOADING TIMEOUT DETECTED - Possible infinite loop!');
            this.generateReport();
            this.showEmergencyUI();
        }, 10000); // 10 seconds timeout
        
        this.timeouts.push(timeout);
    }
    
    showEmergencyUI() {
        // Create emergency UI if normal loading fails
        const emergencyDiv = document.createElement('div');
        emergencyDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: linear-gradient(135deg, #1e293b, #334155);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            font-family: Arial, sans-serif;
        `;
        
        emergencyDiv.innerHTML = `
            <div style="text-align: center; max-width: 600px; padding: 20px;">
                <h1 style="color: #ef4444; margin-bottom: 20px;">🚨 Problema de Carregamento Detectado</h1>
                <p style="margin-bottom: 15px;">O jogo está demorando muito para carregar. Possíveis soluções:</p>
                <ul style="text-align: left; margin-bottom: 20px;">
                    <li>Recarregue a página (F5)</li>
                    <li>Limpe o cache do navegador</li>
                    <li>Verifique se o JavaScript está habilitado</li>
                    <li>Tente usar um navegador diferente</li>
                    <li>Verifique sua conexão com a internet</li>
                </ul>
                <div style="margin-bottom: 20px;">
                    <button onclick="location.reload()" style="
                        background: #3b82f6;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        margin: 5px;
                        font-size: 16px;
                    ">🔄 Recarregar Página</button>
                    
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
                        background: #6b7280;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        margin: 5px;
                        font-size: 16px;
                    ">❌ Fechar Aviso</button>
                    
                    <button onclick="window.loadingDebugger.generateReport()" style="
                        background: #f59e0b;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        margin: 5px;
                        font-size: 16px;
                    ">📊 Ver Relatório</button>
                </div>
                <details style="text-align: left; margin-top: 20px;">
                    <summary style="cursor: pointer; color: #60a5fa;">Detalhes Técnicos</summary>
                    <pre id="debug-details" style="
                        background: rgba(0,0,0,0.3);
                        padding: 10px;
                        border-radius: 5px;
                        font-size: 12px;
                        overflow: auto;
                        max-height: 200px;
                        margin-top: 10px;
                    ">${this.generateReport()}</pre>
                </details>
            </div>
        `;
        
        document.body.appendChild(emergencyDiv);
    }
    
    generateReport() {
        const report = {
            totalTime: Date.now() - this.startTime,
            steps: this.loadingSteps,
            errors: this.errors,
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString()
        };
        
        console.log('📊 Loading Debug Report:', report);
        return JSON.stringify(report, null, 2);
    }
    
    clearTimeouts() {
        this.timeouts.forEach(timeout => clearTimeout(timeout));
        this.timeouts = [];
    }
    
    complete() {
        this.clearTimeouts();
        this.logStep('Application Loading', 'completed');
        
        // Remove loading indicator after a delay
        setTimeout(() => {
            const indicator = document.getElementById('loading-debug-indicator');
            if (indicator) {
                indicator.style.opacity = '0';
                setTimeout(() => indicator.remove(), 1000);
            }
        }, 3000);
    }
}

// Create global instance
window.loadingDebugger = new LoadingDebugger();

export { LoadingDebugger };