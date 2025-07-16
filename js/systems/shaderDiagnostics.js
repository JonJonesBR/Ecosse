/**
 * Shader Diagnostics - Tools for diagnosing and fixing shader issues
 * This module provides utilities for debugging and repairing shader problems
 */

import { loggingSystem } from './loggingSystem.js';
import { shaderErrorHandler } from './shaderErrorHandler.js';
import { notificationSystem } from './notificationSystem.js';

/**
 * Class for diagnosing and fixing shader issues
 */
class ShaderDiagnostics {
  constructor() {
    this.diagnosticResults = [];
    this.webGLInfo = null;
    this.initialized = false;
  }
  
  /**
   * Initialize the diagnostics system
   */
  init() {
    if (this.initialized) return;
    
    try {
      // Get WebGL information
      this.collectWebGLInfo();
      this.initialized = true;
      loggingSystem.info('Shader diagnostics system initialized');
    } catch (error) {
      loggingSystem.error('Failed to initialize shader diagnostics:', error);
    }
  }
  
  /**
   * Collect WebGL information from the system
   */
  collectWebGLInfo() {
    try {
      // Create a temporary canvas to get WebGL context
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) {
        this.webGLInfo = { supported: false, error: 'WebGL not supported' };
        return;
      }
      
      // Get WebGL information
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
      const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
      
      this.webGLInfo = {
        supported: true,
        version: gl.getParameter(gl.VERSION),
        vendor: vendor,
        renderer: renderer,
        shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxCubeMapTextureSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
        maxVertexAttributes: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
        maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS),
        maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
        maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
        extensions: gl.getSupportedExtensions()
      };
      
      loggingSystem.info('WebGL info collected:', this.webGLInfo);
    } catch (error) {
      loggingSystem.error('Error collecting WebGL info:', error);
      this.webGLInfo = { supported: false, error: error.message };
    }
  }
  
  /**
   * Run diagnostics on a shader
   * @param {string} vertexShader - Vertex shader source
   * @param {string} fragmentShader - Fragment shader source
   * @param {string} shaderType - Type of shader
   * @returns {Object} - Diagnostic results
   */
  runDiagnostics(vertexShader, fragmentShader, shaderType) {
    if (!this.initialized) {
      this.init();
    }
    
    const diagnosticResult = {
      timestamp: new Date(),
      shaderType,
      webGLInfo: this.webGLInfo,
      vertexShaderIssues: this.analyzeShader(vertexShader, 'vertex'),
      fragmentShaderIssues: this.analyzeShader(fragmentShader, 'fragment'),
      recommendations: []
    };
    
    // Generate recommendations based on issues
    diagnosticResult.recommendations = this.generateRecommendations(
      diagnosticResult.vertexShaderIssues,
      diagnosticResult.fragmentShaderIssues,
      shaderType
    );
    
    // Store diagnostic result
    this.diagnosticResults.push(diagnosticResult);
    
    return diagnosticResult;
  }
  
  /**
   * Analyze a shader for common issues
   * @param {string} shaderSource - Shader source code
   * @param {string} shaderStage - 'vertex' or 'fragment'
   * @returns {Array} - List of issues found
   */
  analyzeShader(shaderSource, shaderStage) {
    const issues = [];
    
    // Check for empty shader
    if (!shaderSource || shaderSource.trim() === '') {
      issues.push({
        severity: 'error',
        message: `Empty ${shaderStage} shader`
      });
      return issues;
    }
    
    // Check for missing main function
    if (!shaderSource.includes('void main()') && !shaderSource.includes('void main ()')) {
      issues.push({
        severity: 'error',
        message: `Missing main function in ${shaderStage} shader`
      });
    }
    
    // Check for missing semicolons (simple check)
    const lines = shaderSource.split('\n');
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('//') && !trimmedLine.endsWith(';') && 
          !trimmedLine.endsWith('{') && !trimmedLine.endsWith('}') && 
          !trimmedLine.startsWith('#') && !trimmedLine.endsWith(')')) {
        issues.push({
          severity: 'warning',
          message: `Possible missing semicolon at line ${index + 1}: "${trimmedLine}"`
        });
      }
    });
    
    // Check for texture2D usage in fragment shader with cubemap
    if (shaderStage === 'fragment' && shaderSource.includes('texture2D') && 
        shaderSource.includes('samplerCube')) {
      issues.push({
        severity: 'error',
        message: 'Using texture2D with samplerCube - should use textureCube instead'
      });
    }
    
    // Check for potential precision issues
    if (shaderStage === 'fragment' && !shaderSource.includes('precision ')) {
      issues.push({
        severity: 'warning',
        message: 'No precision specified in fragment shader'
      });
    }
    
    // Check for potential uniform issues
    const uniformMatches = shaderSource.match(/uniform\s+\w+\s+\w+/g) || [];
    const uniformNames = uniformMatches.map(match => {
      const parts = match.split(/\s+/);
      return parts[parts.length - 1];
    });
    
    // Check for unused uniforms (simple check)
    uniformNames.forEach(name => {
      const regex = new RegExp(`[^a-zA-Z0-9_]${name}[^a-zA-Z0-9_]`);
      const usageCount = (shaderSource.match(regex) || []).length;
      if (usageCount <= 1) { // Only appears in declaration
        issues.push({
          severity: 'warning',
          message: `Uniform "${name}" might be unused`
        });
      }
    });
    
    return issues;
  }
  
  /**
   * Generate recommendations based on shader issues
   * @param {Array} vertexIssues - Vertex shader issues
   * @param {Array} fragmentIssues - Fragment shader issues
   * @param {string} shaderType - Type of shader
   * @returns {Array} - List of recommendations
   */
  generateRecommendations(vertexIssues, fragmentIssues, shaderType) {
    const recommendations = [];
    
    // Check for critical errors
    const criticalErrors = [...vertexIssues, ...fragmentIssues].filter(
      issue => issue.severity === 'error'
    );
    
    if (criticalErrors.length > 0) {
      recommendations.push({
        priority: 'high',
        message: `Fix critical errors in ${shaderType} shader: ${criticalErrors.map(e => e.message).join(', ')}`
      });
    }
    
    // Check for texture2D with cubemap issue
    const textureCubeIssue = fragmentIssues.find(
      issue => issue.message.includes('texture2D with samplerCube')
    );
    
    if (textureCubeIssue) {
      recommendations.push({
        priority: 'high',
        message: 'Replace texture2D() with textureCube() when sampling from a cubemap',
        code: 'Replace: texture2D(envMap, st) → textureCube(envMap, direction)'
      });
    }
    
    // Check for precision issues
    const precisionIssue = fragmentIssues.find(
      issue => issue.message.includes('No precision specified')
    );
    
    if (precisionIssue) {
      recommendations.push({
        priority: 'medium',
        message: 'Add precision qualifier to fragment shader',
        code: 'Add: precision mediump float; at the top of the shader'
      });
    }
    
    // Check WebGL compatibility
    if (this.webGLInfo && !this.webGLInfo.supported) {
      recommendations.push({
        priority: 'high',
        message: 'WebGL is not supported or disabled in your browser'
      });
    }
    
    // Add general recommendations
    recommendations.push({
      priority: 'low',
      message: 'Use shader validation tools during development to catch errors early'
    });
    
    return recommendations;
  }
  
  /**
   * Get diagnostic results
   * @returns {Array} - Diagnostic results
   */
  getDiagnosticResults() {
    return [...this.diagnosticResults];
  }
  
  /**
   * Clear diagnostic results
   */
  clearDiagnosticResults() {
    this.diagnosticResults = [];
  }
  
  /**
   * Create a diagnostic report for display
   * @returns {string} - HTML report
   */
  createDiagnosticReport() {
    if (!this.initialized) {
      this.init();
    }
    
    let report = '<div class="shader-diagnostic-report">';
    
    // Add WebGL information
    report += '<h3>WebGL Information</h3>';
    if (this.webGLInfo) {
      if (this.webGLInfo.supported) {
        report += `<p><strong>Vendor:</strong> ${this.webGLInfo.vendor}</p>`;
        report += `<p><strong>Renderer:</strong> ${this.webGLInfo.renderer}</p>`;
        report += `<p><strong>Version:</strong> ${this.webGLInfo.version}</p>`;
        report += `<p><strong>Shading Language:</strong> ${this.webGLInfo.shadingLanguageVersion}</p>`;
      } else {
        report += `<p class="error">WebGL not supported: ${this.webGLInfo.error}</p>`;
      }
    } else {
      report += '<p>WebGL information not available</p>';
    }
    
    // Add shader error log
    const errorLog = shaderErrorHandler.getErrorLog();
    report += '<h3>Shader Error Log</h3>';
    if (errorLog.length > 0) {
      report += '<ul>';
      errorLog.slice(-10).forEach(error => {
        report += `<li><strong>${error.shaderType}:</strong> ${error.message} <em>(${error.timestamp.toLocaleString()})</em></li>`;
      });
      report += '</ul>';
    } else {
      report += '<p>No shader errors logged</p>';
    }
    
    // Add diagnostic results
    report += '<h3>Diagnostic Results</h3>';
    if (this.diagnosticResults.length > 0) {
      this.diagnosticResults.slice(-5).forEach(result => {
        report += `<div class="diagnostic-result">`;
        report += `<h4>${result.shaderType} Shader (${result.timestamp.toLocaleString()})</h4>`;
        
        // Vertex shader issues
        report += '<h5>Vertex Shader Issues</h5>';
        if (result.vertexShaderIssues.length > 0) {
          report += '<ul>';
          result.vertexShaderIssues.forEach(issue => {
            report += `<li class="${issue.severity}">${issue.message}</li>`;
          });
          report += '</ul>';
        } else {
          report += '<p>No issues found</p>';
        }
        
        // Fragment shader issues
        report += '<h5>Fragment Shader Issues</h5>';
        if (result.fragmentShaderIssues.length > 0) {
          report += '<ul>';
          result.fragmentShaderIssues.forEach(issue => {
            report += `<li class="${issue.severity}">${issue.message}</li>`;
          });
          report += '</ul>';
        } else {
          report += '<p>No issues found</p>';
        }
        
        // Recommendations
        report += '<h5>Recommendations</h5>';
        if (result.recommendations.length > 0) {
          report += '<ul>';
          result.recommendations.forEach(rec => {
            report += `<li class="priority-${rec.priority}">${rec.message}`;
            if (rec.code) {
              report += `<pre>${rec.code}</pre>`;
            }
            report += '</li>';
          });
          report += '</ul>';
        } else {
          report += '<p>No recommendations</p>';
        }
        
        report += '</div>';
      });
    } else {
      report += '<p>No diagnostic results available</p>';
    }
    
    report += '</div>';
    return report;
  }
  
  /**
   * Show diagnostic report in a modal
   */
  showDiagnosticReport() {
    const report = this.createDiagnosticReport();
    
    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'shader-diagnostic-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;
    
    // Create modal content
    const content = document.createElement('div');
    content.className = 'shader-diagnostic-content';
    content.style.cssText = `
      background-color: white;
      padding: 20px;
      border-radius: 5px;
      max-width: 800px;
      max-height: 80vh;
      overflow-y: auto;
      position: relative;
    `;
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
    `;
    closeButton.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Add title
    const title = document.createElement('h2');
    title.textContent = 'Shader Diagnostics Report';
    
    // Add report content
    content.appendChild(closeButton);
    content.appendChild(title);
    content.innerHTML += report;
    
    // Add CSS for report styling
    const style = document.createElement('style');
    style.textContent = `
      .shader-diagnostic-report h3, .shader-diagnostic-report h4, .shader-diagnostic-report h5 {
        margin-top: 15px;
        margin-bottom: 5px;
      }
      .shader-diagnostic-report .error {
        color: #d32f2f;
      }
      .shader-diagnostic-report .warning {
        color: #f57c00;
      }
      .shader-diagnostic-report .priority-high {
        color: #d32f2f;
        font-weight: bold;
      }
      .shader-diagnostic-report .priority-medium {
        color: #f57c00;
      }
      .shader-diagnostic-report .diagnostic-result {
        border: 1px solid #ddd;
        padding: 10px;
        margin-bottom: 15px;
        border-radius: 4px;
      }
      .shader-diagnostic-report pre {
        background-color: #f5f5f5;
        padding: 8px;
        border-radius: 4px;
        overflow-x: auto;
      }
    `;
    
    // Add to DOM
    modal.appendChild(content);
    document.head.appendChild(style);
    document.body.appendChild(modal);
  }
}

// Create and export a singleton instance
export const shaderDiagnostics = new ShaderDiagnostics();