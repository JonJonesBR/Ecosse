/**
 * Sistema de Renderização Simplificado
 * Responsável pela renderização 3D do planeta e elementos do ecossistema
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';

import eventSystem from './eventSystem-simplified.js';
import simulationSystem from './simulationSystem-simplified.js';

class RenderingSystem {
    constructor() {
        // Propriedades Three.js
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.composer = null;
        
        // Objetos 3D
        this.planet = null;
        this.atmosphere = null;
        this.clouds = null;
        this.stars = null;
        this.ecosystemElements = {};
        
        // Configurações
        this.planetRadius = 5;
        this.planetConfig = null;
        
        // Estado
        this.isInitialized = false;
        this.isRendering = false;
        this.animationFrameId = null;
        this.sunLights = [];
        this.lightAngle = 0;
        
        // Inicializar
        this.init();
    }
    
    /**
     * Inicializa o sistema de renderização
     */
    init() {
        // Configurar manipuladores de eventos
        this.setupEventListeners();
        
        console.log('Sistema de renderização inicializado');
    }
    
    /**
     * Configura os ouvintes de eventos
     */
    setupEventListeners() {
        // Eventos de canvas
        eventSystem.subscribe(eventSystem.EVENTS.CANVAS_INITIALIZED, this.setupThreeJs.bind(this));
        eventSystem.subscribe(eventSystem.EVENTS.CANVAS_RESIZE, this.handleResize.bind(this));
        
        // Eventos de planeta
        eventSystem.subscribe(eventSystem.EVENTS.PLANET_GENERATION_COMPLETE, this.createPlanet.bind(this));
        
        // Eventos de elementos
        eventSystem.subscribe(eventSystem.EVENTS.ELEMENT_ADDED_COMPLETE, this.addElement.bind(this));
        eventSystem.subscribe(eventSystem.EVENTS.ELEMENT_REMOVED, this.removeElement.bind(this));
        
        // Eventos de simulação
        eventSystem.subscribe(eventSystem.EVENTS.SIMULATION_UPDATED, this.updateElements.bind(this));
        eventSystem.subscribe(eventSystem.EVENTS.SIMULATION_STARTED, this.startRendering.bind(this));
        eventSystem.subscribe(eventSystem.EVENTS.SIMULATION_STOPPED, this.stopRendering.bind(this));
        eventSystem.subscribe(eventSystem.EVENTS.ELEMENT_ADDED_COMPLETE, this.addElement.bind(this));
        eventSystem.subscribe(eventSystem.EVENTS.SIMULATION_PAUSED, this.pauseRendering.bind(this));
        eventSystem.subscribe(eventSystem.EVENTS.SIMULATION_RESUMED, this.resumeRendering.bind(this));
    }
    
    /**
     * Configura o ambiente Three.js
     * @param {Object} data - Dados do evento
     */
    setupThreeJs(data) {
        if (!data || !data.canvasId) {
            console.error('ID do Canvas não fornecido para inicialização do Three.js');
            return;
        }
        
        const canvas = document.getElementById(data.canvasId);
        if (!canvas) {
            console.error('Elemento canvas não encontrado com o ID:', data.canvasId);
            return;
        }

        const container = document.getElementById('threejs-container') || canvas.parentElement;
        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || window.innerHeight;
        
        // Criar cena
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        
        // Criar câmera
        this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        this.camera.position.set(0, 0, 15);
        
        // Criar renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        
        // Criar controles de órbita
        this.controls = new OrbitControls(this.camera, canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 7;
        this.controls.maxDistance = 30;
        this.controls.enablePan = false;
        
        // Configurar iluminação
        this.setupLighting();
        
        // Configurar pós-processamento
        this.setupPostProcessing(width, height);
        
        // Criar estrelas de fundo
        this.createStars();
        
        // Criar planeta padrão
        this.createDefaultPlanet();
        
        // Iniciar renderização
        this.startRendering();
        
        this.isInitialized = true;
        
        // Publicar evento de Three.js inicializado
        eventSystem.publish(eventSystem.EVENTS.THREEJS_INITIALIZED, {
            scene: this.scene,
            camera: this.camera,
            renderer: this.renderer
        });
        
        console.log('Three.js inicializado');
    }
    
    /**
     * Configura a iluminação da cena
     */
    setupLighting() {
        // Luz ambiente
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // Luz direcional principal (sol)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
        directionalLight.position.set(10, 10, 10);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        this.sunLights.push(directionalLight);
    }
    
    /**
     * Configura o pós-processamento
     * @param {number} width - Largura do canvas
     * @param {number} height - Altura do canvas
     */
    setupPostProcessing(width, height) {
        // Criar compositor
        this.composer = new EffectComposer(this.renderer);
        
        // Adicionar passe de renderização
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        // Adicionar passe de bloom
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(width, height),
            0.5,  // força
            0.4,  // raio
            0.85  // limiar
        );
        this.composer.addPass(bloomPass);
        
        // Adicionar passe de anti-aliasing FXAA
        const fxaaPass = new ShaderPass(FXAAShader);
        fxaaPass.material.uniforms['resolution'].value.set(1 / width, 1 / height);
        this.composer.addPass(fxaaPass);
    }
    
    /**
     * Cria as estrelas de fundo
     */
    createStars() {
        const starsGeometry = new THREE.BufferGeometry();
        const starsCount = 2000;
        const positions = new Float32Array(starsCount * 3);
        const sizes = new Float32Array(starsCount);
        
        for (let i = 0; i < starsCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 200;
            positions[i3 + 1] = (Math.random() - 0.5) * 200;
            positions[i3 + 2] = (Math.random() - 0.5) * 200;
            sizes[i] = Math.random() * 2;
        }
        
        starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1,
            transparent: true,
            sizeAttenuation: true,
            opacity: 0.8
        });
        
        this.stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(this.stars);
    }
    
    /**
     * Cria um planeta padrão
     */
    createDefaultPlanet() {
        // Remover planeta existente, se houver
        if (this.planet) {
            this.scene.remove(this.planet);
            this.planet.geometry.dispose();
            this.planet.material.dispose();
        }
        
        if (this.atmosphere) {
            this.scene.remove(this.atmosphere);
            this.atmosphere.geometry.dispose();
            this.atmosphere.material.dispose();
        }
        
        if (this.clouds) {
            this.scene.remove(this.clouds);
            this.clouds.geometry.dispose();
            this.clouds.material.dispose();
        }
        
        // Criar geometria do planeta
        const planetGeometry = new THREE.SphereGeometry(this.planetRadius, 64, 64);
        
        // Criar material do planeta
        const planetMaterial = new THREE.MeshPhongMaterial({
            color: 0x2233aa,
            shininess: 5,
            flatShading: false
        });
        
        // Criar malha do planeta
        this.planet = new THREE.Mesh(planetGeometry, planetMaterial);
        this.scene.add(this.planet);
        
        // Criar atmosfera
        const atmosphereGeometry = new THREE.SphereGeometry(this.planetRadius + 0.2, 64, 64);
        const atmosphereMaterial = new THREE.MeshPhongMaterial({
            color: 0x8888ff,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });
        
        this.atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        this.scene.add(this.atmosphere);
    }
    
    /**
     * Cria um planeta com base na configuração
     * @param {Object} data - Dados do evento
     */
    createPlanet(data) {
        if (!data || !data.config) return;
        
        this.planetConfig = data.config;
        
        // Remover planeta existente
        if (this.planet) {
            this.scene.remove(this.planet);
            this.planet.geometry.dispose();
            this.planet.material.dispose();
        }
        
        if (this.atmosphere) {
            this.scene.remove(this.atmosphere);
            this.atmosphere.geometry.dispose();
            this.atmosphere.material.dispose();
        }
        
        if (this.clouds) {
            this.scene.remove(this.clouds);
            this.clouds.geometry.dispose();
            this.clouds.material.dispose();
        }
        
        // Limpar elementos do ecossistema
        this.clearEcosystemElements();
        
        // Configurar iluminação do planeta (sóis)
        
        
        // Criar geometria do planeta
        const planetGeometry = new THREE.SphereGeometry(this.planetRadius, 64, 64);
        
        // Definir cores com base no tipo de planeta
        let planetColor, atmosphereColor, atmosphereOpacity;
        
        switch (this.planetConfig.type) {
            case 'terrestrial':
                planetColor = new THREE.Color(0x2266aa);
                atmosphereColor = new THREE.Color(0x8888ff);
                atmosphereOpacity = 0.2;
                break;
                
            case 'desert':
                planetColor = new THREE.Color(0xddaa66);
                atmosphereColor = new THREE.Color(0xffddaa);
                atmosphereOpacity = 0.15;
                break;
                
            case 'ice':
                planetColor = new THREE.Color(0xaaddff);
                atmosphereColor = new THREE.Color(0xccffff);
                atmosphereOpacity = 0.1;
                break;
                
            case 'volcanic':
                planetColor = new THREE.Color(0x663322);
                atmosphereColor = new THREE.Color(0xff6644);
                atmosphereOpacity = 0.25;
                break;
                
            default:
                planetColor = new THREE.Color(0x2266aa);
                atmosphereColor = new THREE.Color(0x8888ff);
                atmosphereOpacity = 0.2;
        }
        
        // Ajustar cores com base na temperatura
        if (this.planetConfig.temperature < 0.3) {
            // Planeta mais frio
            planetColor.multiplyScalar(0.8).add(new THREE.Color(0x0000ff).multiplyScalar(0.1));
        } else if (this.planetConfig.temperature > 0.7) {
            // Planeta mais quente
            planetColor.multiplyScalar(0.8).add(new THREE.Color(0xff0000).multiplyScalar(0.1));
        }
        
        // Criar material do planeta com texturas processuais
        const planetMaterial = new THREE.MeshPhongMaterial({
            map: this.generatePlanetTexture(this.planetConfig),
            bumpMap: this.generatePlanetTexture(this.planetConfig, true), // Usar a mesma lógica para o bump map
            bumpScale: 0.05,
            shininess: 10
        });
        
        // Criar malha do planeta
        this.planet = new THREE.Mesh(planetGeometry, planetMaterial);
        this.scene.add(this.planet);
        
        // Criar atmosfera
        if (this.planetConfig.atmosphere !== 'none') {
            const atmosphereGeometry = new THREE.SphereGeometry(this.planetRadius + 0.2, 64, 64);
            const atmosphereMaterial = new THREE.MeshPhongMaterial({
                color: atmosphereColor,
                transparent: true,
                opacity: atmosphereOpacity,
                side: THREE.BackSide
            });
            
            this.atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
            this.scene.add(this.atmosphere);
        }
        
        // Criar nuvens se houver água
        if (this.planetConfig.waterCoverage > 0.1) {
            const cloudsGeometry = new THREE.SphereGeometry(this.planetRadius + 0.1, 64, 64);
            const cloudTexture = this.generateCloudTexture();
            const cloudsMaterial = new THREE.MeshPhongMaterial({
                map: cloudTexture,
                alphaMap: cloudTexture,
                transparent: true,
                opacity: 0.8 * this.planetConfig.waterCoverage,
                side: THREE.DoubleSide
            });
            
            this.clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
            this.scene.add(this.clouds);
        }
        
        // Publicar evento de planeta criado
        eventSystem.publish(eventSystem.EVENTS.PLANET_CREATED, {
            planet: this.planet,
            config: this.planetConfig
        });
    }

    /**
     * Gera uma textura processual para o planeta
     * @param {Object} config - Configuração do planeta
     * @param {boolean} isBump - Se a textura é para bump map
     * @returns {THREE.CanvasTexture} Textura do planeta
     */
    generatePlanetTexture(config, isBump = false) {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');
        const simplex = new SimplexNoise();

        const landColor = new THREE.Color(0x4a7d2a); // Verde escuro
        const waterColor = new THREE.Color(0x2266aa); // Azul
        const iceColor = new THREE.Color(0xffffff);
        const desertColor = new THREE.Color(0xddaa66);

        let primaryColor, secondaryColor;

        switch (config.type) {
            case 'ice':
                primaryColor = iceColor;
                secondaryColor = waterColor.clone().lerp(iceColor, 0.5);
                break;
            case 'desert':
                primaryColor = desertColor;
                secondaryColor = desertColor.clone().darken(1);
                break;
            default: // Terrestrial
                primaryColor = landColor;
                secondaryColor = waterColor;
        }

        const imageData = context.createImageData(size, size);
        for (let x = 0; x < size; x++) {
            for (let y = 0; y < size; y++) {
                const u = x / size;
                const v = y / size;
                
                // Mapeamento para esfera
                const lat = (v - 0.5) * Math.PI;
                const lon = (u - 0.5) * 2 * Math.PI;
                const px = Math.cos(lat) * Math.cos(lon);
                const py = Math.cos(lat) * Math.sin(lon);
                const pz = Math.sin(lat);

                // Ruído Simplex para continentes
                let noise = simplex.noise3d(px * 4, py * 4, pz * 4);
                noise = (noise + 1) / 2; // Normalizar para 0-1

                const threshold = 1 - config.waterCoverage;
                const isLand = noise > threshold;

                let color;
                if (isBump) {
                    const intensity = isLand ? 200 : 100;
                    color = new THREE.Color(intensity / 255, intensity / 255, intensity / 255);
                } else {
                    color = isLand ? primaryColor : secondaryColor;
                }

                const i = (y * size + x) * 4;
                imageData.data[i] = color.r * 255;
                imageData.data[i + 1] = color.g * 255;
                imageData.data[i + 2] = color.b * 255;
                imageData.data[i + 3] = 255;
            }
        }

        context.putImageData(imageData, 0, 0);
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    /**
     * Gera uma textura processual para as nuvens
     * @returns {THREE.CanvasTexture} Textura das nuvens
     */
    generateCloudTexture() {
        const size = 1024;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');
        const simplex = new SimplexNoise();

        const imageData = context.createImageData(size, size);
        for (let x = 0; x < size; x++) {
            for (let y = 0; y < size; y++) {
                const u = x / size;
                const v = y / size;

                const lat = (v - 0.5) * Math.PI;
                const lon = (u - 0.5) * 2 * Math.PI;
                const px = Math.cos(lat) * Math.cos(lon);
                const py = Math.cos(lat) * Math.sin(lon);
                const pz = Math.sin(lat);

                let noise = simplex.noise3d(px * 6, py * 6, pz * 6);
                noise = (noise + 1) / 2; // 0-1
                noise = Math.pow(noise, 2.5); // Aumentar contraste

                const intensity = Math.max(0, noise * 255);
                const i = (y * size + x) * 4;
                imageData.data[i] = 255;
                imageData.data[i + 1] = 255;
                imageData.data[i + 2] = 255;
                imageData.data[i + 3] = intensity;
            }
        }

        context.putImageData(imageData, 0, 0);
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    
    /**
     * Adiciona um elemento ao ecossistema
     * @param {Object} data - Dados do elemento
     */
    addElement(data) {
        console.log('addElement called with data:', data);
        if (!data || !data.element) return;
        
        const element = data.element;
        let mesh;
        
        // Criar geometria e material com base no tipo de elemento
        switch (element.type) {
            case 'plant':
                // Criar planta (cone verde)
                const plantGeometry = new THREE.ConeGeometry(0.1, 0.3, 8);
                const plantMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
                mesh = new THREE.Mesh(plantGeometry, plantMaterial);
                break;
                
            case 'herbivore':
                // Criar herbívoro (esfera azul)
                const herbivoreGeometry = new THREE.SphereGeometry(0.15, 16, 16);
                const herbivoreMaterial = new THREE.MeshPhongMaterial({ color: 0x0088ff });
                mesh = new THREE.Mesh(herbivoreGeometry, herbivoreMaterial);
                break;
                
            case 'carnivore':
                // Criar carnívoro (cubo vermelho)
                const carnivoreGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
                const carnivoreMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
                mesh = new THREE.Mesh(carnivoreGeometry, carnivoreMaterial);
                break;
                
            default:
                // Elemento genérico (esfera cinza)
                const genericGeometry = new THREE.SphereGeometry(0.1, 8, 8);
                const genericMaterial = new THREE.MeshPhongMaterial({ color: 0xaaaaaa });
                mesh = new THREE.Mesh(genericGeometry, genericMaterial);
        }
        
        // Posicionar na superfície do planeta
        const position = element.position || { x: 0, y: 0, z: 0 };
        const positionOnSphere = this.positionOnPlanet(position);
        mesh.position.copy(positionOnSphere);
        
        // Orientar para fora do planeta
        const normal = positionOnSphere.clone().normalize();
        mesh.lookAt(normal.multiplyScalar(this.planetRadius + 5));
        
        // Adicionar à cena
        this.scene.add(mesh);
        
        // Armazenar referência
        this.ecosystemElements[element.id] = {
            mesh,
            elementData: element // Renomeado para evitar conflito de nomes
        };
    }

    /**
     * Remove um elemento do ecossistema
     * @param {Object} data - Dados do evento
     */
    removeElement(data) {
        if (!data || !data.id) return;

        const elementRef = this.ecosystemElements[data.id];
        if (elementRef) {
            const { mesh } = elementRef;
            
            // Remover da cena
            this.scene.remove(mesh);
            
            // Liberar memória
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) {
                if (Array.isArray(mesh.material)) {
                    mesh.material.forEach(material => material.dispose());
                } else {
                    mesh.material.dispose();
                }
            }
            
            // Remover da lista de referência
            delete this.ecosystemElements[data.id];
        }
    }
    
    /**
     * Calcula a posição na superfície do planeta
     * @param {Object} position - Posição normalizada
     * @returns {THREE.Vector3} Posição na superfície do planeta
     */
    positionOnPlanet(position) {
        // Converter posição normalizada para coordenadas esféricas
        const phi = Math.acos(2 * position.y - 1);
        const theta = 2 * Math.PI * position.x;
        
        // Converter para coordenadas cartesianas na superfície do planeta
        const x = this.planetRadius * Math.sin(phi) * Math.cos(theta);
        const y = this.planetRadius * Math.cos(phi);
        const z = this.planetRadius * Math.sin(phi) * Math.sin(theta);
        
        return new THREE.Vector3(x, y, z);
    }
    
    /**
     * Atualiza os elementos do ecossistema
     * @param {Object} data - Dados da atualização
     */
    updateElements(data) {
        if (!data) return;
        
        const simState = data.simulationState;

        // Atualizar rotação do planeta
        if (this.planet) {
            this.planet.rotation.y += 0.001 * data.deltaTime;
        }
        
        // Atualizar rotação das nuvens (mais rápido que o planeta)
        if (this.clouds) {
            this.clouds.rotation.y += 0.0015 * data.deltaTime;
        }
        
        // Atualizar a posição da luz
        this.lightAngle += 0.0005 * data.deltaTime;
        this.sunLights.forEach(light => {
            const distance = 15;
            light.position.x = Math.cos(this.lightAngle) * distance;
            light.position.z = Math.sin(this.lightAngle) * distance;
        });

        // Atualizar elementos do ecossistema com base no estado da simulação
        if (simState && simState.ecosystemElements) {
            simState.ecosystemElements.forEach(simElement => {
                const renderElement = this.ecosystemElements[simElement.id];
                if (renderElement) {
                    // Atualizar posição
                    const newPosition = this.positionOnPlanet(simElement.position);
                    renderElement.mesh.position.lerp(newPosition, 0.1); // Interpolação suave

                    // Atualizar orientação
                    const normal = newPosition.clone().normalize();
                    renderElement.mesh.lookAt(normal.multiplyScalar(this.planetRadius + 5));

                    // Atualizar escala (para plantas)
                    if (simElement.type === 'plant' && simElement.properties.size) {
                        const scale = Math.max(0.1, simElement.properties.size);
                        renderElement.mesh.scale.set(scale, scale, scale);
                    }

                    // Atualizar cor com base na energia
                    if (simElement.type === 'herbivore' || simElement.type === 'carnivore') {
                        const energyRatio = simElement.properties.energy / simElement.properties.maxEnergy;
                        const originalColor = simElement.type === 'herbivore' ? new THREE.Color(0x0088ff) : new THREE.Color(0xff0000);
                        renderElement.mesh.material.color.lerpColors(new THREE.Color(0x555555), originalColor, energyRatio);
                    }
                }
            });
        }
    }
    
    /**
     * Limpa todos os elementos do ecossistema
     */
    clearEcosystemElements() {
        // Remover todos os elementos da cena
        Object.values(this.ecosystemElements).forEach(({ mesh }) => {
            this.scene.remove(mesh);
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) {
                if (Array.isArray(mesh.material)) {
                    mesh.material.forEach(material => material.dispose());
                } else {
                    mesh.material.dispose();
                }
            }
        });
        
        // Limpar referências
        this.ecosystemElements = {};
    }
    
    /**
     * Manipula o redimensionamento do canvas
     * @param {Object} data - Dados do evento
     */
    handleResize(data) {
        if (!this.renderer || !this.camera || !this.composer) return;
        
        const width = data.width;
        const height = data.height;
        
        // Atualizar câmera
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        // Atualizar renderer
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Atualizar compositor
        this.composer.setSize(width, height);
        
        // Atualizar passe FXAA
        const fxaaPass = this.composer.passes.find(pass => pass.material && pass.material.uniforms && pass.material.uniforms.resolution);
        if (fxaaPass) {
            fxaaPass.material.uniforms.resolution.value.set(1 / width, 1 / height);
        }
    }
    
    /**
     * Inicia o loop de renderização
     */
    startRendering() {
        if (this.isRendering) return;
        
        this.isRendering = true;
        this.render();
    }
    
    /**
     * Para o loop de renderização
     */
    stopRendering() {
        this.isRendering = false;
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
    
    /**
     * Pausa o loop de renderização
     */
    pauseRendering() {
        // Continuar renderizando, mas pausar animações
    }
    
    /**
     * Retoma o loop de renderização
     */
    resumeRendering() {
        this.startRendering();
    }
    
    /**
     * Loop de renderização
     */
    render() {
        if (!this.isRendering) return;
        
        // Atualizar controles
        if (this.controls) {
            this.controls.update();
        }
        
        // Renderizar cena
        if (this.composer) {
            this.composer.render();
        } else if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
        
        // Continuar loop
        this.animationFrameId = requestAnimationFrame(this.render.bind(this));
    }
}

// Exportar uma instância única do sistema de renderização
const renderingSystem = new RenderingSystem();
export default renderingSystem;
