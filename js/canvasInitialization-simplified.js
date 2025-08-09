/**
 * Inicialização Simplificada do Canvas
 * Responsável por configurar o ambiente Three.js e inicializar o canvas
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';

class CanvasInitialization {
    constructor() {
        // Elementos DOM
        this.container = document.getElementById('canvas-container');
        this.threejsContainer = document.getElementById('threejs-container');
        this.loadingIndicator = document.getElementById('loading-overlay');
        
        // Propriedades Three.js
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.composer = null;
        
        // Estado
        this.isInitialized = false;
        this.isWebGLSupported = true;
        this.qualitySettings = {
            pixelRatio: window.devicePixelRatio > 1 ? 1.5 : 1,
            antialiasing: true,
            shadows: true,
            bloomEffect: true,
            maxLights: 8
        };
    }
    
    /**
     * Inicializa o canvas e configura o ambiente Three.js
     * @returns {Promise} Promessa que resolve quando a inicialização estiver completa
     */
    async initialize() {
        return new Promise((resolve, reject) => {
            try {
                // Mostrar indicador de carregamento
                if (this.loadingIndicator) {
                    this.loadingIndicator.classList.remove('hidden');
                }
                
                // Verificar suporte a WebGL
                if (!this.checkWebGLSupport()) {
                    throw new Error('WebGL não é suportado neste navegador.');
                }
                
                // Inicializar componentes Three.js
                this.initScene();
                this.initCamera();
                this.initRenderer();
                this.initControls();
                this.initLighting();
                this.initPostProcessing();
                
                // Configurar manipuladores de eventos
                this.setupEventListeners();
                
                // Marcar como inicializado
                this.isInitialized = true;
                
                // Ocultar indicador de carregamento
                if (this.loadingIndicator) {
                    this.loadingIndicator.classList.add('hidden');
                }
                
                console.log('Canvas inicializado com sucesso!');
                resolve({
                    scene: this.scene,
                    camera: this.camera,
                    renderer: this.renderer,
                    controls: this.controls
                });
            } catch (error) {
                console.error('Falha na inicialização do canvas:', error);
                this.handleInitializationError(error);
                reject(error);
            }
        });
    }
    
    /**
     * Verifica se o navegador suporta WebGL
     * @returns {boolean} Verdadeiro se WebGL for suportado
     */
    checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            this.isWebGLSupported = !!(gl && gl instanceof WebGLRenderingContext);
            return this.isWebGLSupported;
        } catch (e) {
            console.error('Erro ao verificar suporte WebGL:', e);
            this.isWebGLSupported = false;
            return false;
        }
    }
    
    /**
     * Inicializa a cena Three.js
     */
    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0f172a);
        this.scene.fog = new THREE.FogExp2(0x0f172a, 0.002);
    }
    
    /**
     * Inicializa a câmera
     */
    initCamera() {
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);
    }
    
    /**
     * Inicializa o renderizador
     */
    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: this.qualitySettings.antialiasing,
            powerPreference: 'high-performance',
            alpha: true
        });
        
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(this.qualitySettings.pixelRatio, 2));
        this.renderer.shadowMap.enabled = this.qualitySettings.shadows;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        
        this.container.appendChild(this.renderer.domElement);
        
        // Configurar manipuladores para perda de contexto WebGL
        this.renderer.domElement.addEventListener('webglcontextlost', this.handleContextLoss.bind(this), false);
        this.renderer.domElement.addEventListener('webglcontextrestored', this.handleContextRestored.bind(this), false);
    }
    
    /**
     * Inicializa os controles de órbita
     */
    initControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 3;
        this.controls.maxDistance = 30;
        this.controls.maxPolarAngle = Math.PI / 1.5;
    }
    
    /**
     * Inicializa a iluminação básica da cena
     */
    initLighting() {
        // Luz ambiente
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);
        
        // Luz direcional (sol)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7.5);
        directionalLight.castShadow = this.qualitySettings.shadows;
        
        // Configurações de sombra
        if (this.qualitySettings.shadows) {
            directionalLight.shadow.mapSize.width = 1024;
            directionalLight.shadow.mapSize.height = 1024;
            directionalLight.shadow.camera.near = 0.5;
            directionalLight.shadow.camera.far = 50;
            directionalLight.shadow.camera.left = -20;
            directionalLight.shadow.camera.right = 20;
            directionalLight.shadow.camera.top = 20;
            directionalLight.shadow.camera.bottom = -20;
            directionalLight.shadow.bias = -0.0005;
        }
        
        this.scene.add(directionalLight);
    }
    
    /**
     * Inicializa o pós-processamento
     */
    initPostProcessing() {
        if (!this.qualitySettings.bloomEffect) return;
        
        // Configurar compositor
        this.composer = new EffectComposer(this.renderer);
        
        // Adicionar passe de renderização
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        // Adicionar passe de bloom
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(this.container.clientWidth, this.container.clientHeight),
            0.5,  // força
            0.4,  // raio
            0.85  // limiar
        );
        this.composer.addPass(bloomPass);
        
        // Adicionar passe FXAA para anti-aliasing
        const fxaaPass = new ShaderPass(FXAAShader);
        fxaaPass.material.uniforms['resolution'].value.set(
            1 / (this.container.clientWidth * this.renderer.getPixelRatio()),
            1 / (this.container.clientHeight * this.renderer.getPixelRatio())
        );
        this.composer.addPass(fxaaPass);
    }
    
    /**
     * Configura os ouvintes de eventos
     */
    setupEventListeners() {
        // Redimensionamento da janela
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Visibilidade da página
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }
    
    /**
     * Manipula o redimensionamento da janela
     */
    handleResize() {
        if (!this.isInitialized) return;
        
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        // Atualizar câmera
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        // Atualizar renderizador
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(this.qualitySettings.pixelRatio, 2));
        
        // Atualizar compositor, se existir
        if (this.composer) {
            this.composer.setSize(width, height);
            
            // Atualizar passe FXAA
            const fxaaPass = this.composer.passes.find(pass => pass.material && pass.material.uniforms && pass.material.uniforms['resolution']);
            if (fxaaPass) {
                fxaaPass.material.uniforms['resolution'].value.set(
                    1 / (width * this.renderer.getPixelRatio()),
                    1 / (height * this.renderer.getPixelRatio())
                );
            }
        }
    }
    
    /**
     * Manipula mudanças na visibilidade da página
     */
    handleVisibilityChange() {
        if (document.hidden) {
            // Página está oculta, pausar animações se necessário
        } else {
            // Página está visível novamente, retomar animações se necessário
        }
    }
    
    /**
     * Manipula a perda de contexto WebGL
     * @param {Event} event - O evento de perda de contexto
     */
    handleContextLoss(event) {
        console.warn('Contexto WebGL perdido:', event);
        event.preventDefault();
        // Implementar lógica adicional de recuperação, se necessário
    }
    
    /**
     * Manipula a restauração do contexto WebGL
     */
    handleContextRestored() {
        console.log('Contexto WebGL restaurado');
        // Reinicializar recursos necessários
        this.initRenderer();
        this.initPostProcessing();
    }
    
    /**
     * Manipula erros de inicialização
     * @param {Error} error - O erro ocorrido
     */
    handleInitializationError(error) {
        console.error('Erro de inicialização:', error);
        this.loadingIndicator.classList.add('hidden');
        
        // Exibir mensagem de erro para o usuário
        const messageBox = document.getElementById('message-box');
        const messageContent = document.getElementById('message-content');
        
        if (messageBox && messageContent) {
            messageContent.textContent = `Erro ao inicializar o canvas: ${error.message}. Por favor, tente atualizar a página ou use um navegador diferente.`;
            messageBox.classList.remove('hidden');
            
            // Ocultar mensagem após 10 segundos
            setTimeout(() => {
                messageBox.classList.add('hidden');
            }, 10000);
        }
    }
    
    /**
     * Renderiza a cena
     */
    render() {
        if (!this.isInitialized) return;
        
        // Atualizar controles
        if (this.controls) {
            this.controls.update();
        }
        
        // Renderizar cena
        if (this.composer && this.qualitySettings.bloomEffect) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    /**
     * Limpa e libera recursos
     */
    dispose() {
        // Remover ouvintes de eventos
        window.removeEventListener('resize', this.handleResize.bind(this));
        document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        
        // Limpar cena
        if (this.scene) {
            this.scene.traverse((object) => {
                if (object.geometry) {
                    object.geometry.dispose();
                }
                
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
        }
        
        // Limpar renderizador
        if (this.renderer) {
            this.renderer.dispose();
            this.container.removeChild(this.renderer.domElement);
        }
        
        // Limpar compositor
        if (this.composer) {
            this.composer.passes.forEach(pass => {
                if (pass.dispose) {
                    pass.dispose();
                }
            });
        }
        
        // Limpar controles
        if (this.controls) {
            this.controls.dispose();
        }
        
        // Redefinir propriedades
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.composer = null;
        this.isInitialized = false;
    }
}

export default CanvasInitialization;