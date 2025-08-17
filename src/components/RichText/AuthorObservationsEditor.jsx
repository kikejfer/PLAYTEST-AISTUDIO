import React, { useState, useCallback, useRef, useEffect } from 'react';
import './AuthorObservationsEditor.scss';

const AuthorObservationsEditor = ({
  value = '',
  onChange,
  placeholder = 'Añade observaciones detalladas sobre este bloque...',
  minLength = 50,
  maxLength = 2000,
  disabled = false,
  showTemplates = true,
  className = ''
}) => {
  const [content, setContent] = useState(value);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [characterCount, setCharacterCount] = useState(value.length);
  const [currentFormat, setCurrentFormat] = useState('none');
  const editorRef = useRef(null);

  // Plantillas predefinidas para observaciones
  const templates = [
    {
      id: 'basic',
      name: 'Plantilla Básica',
      icon: '📝',
      content: `**Objetivo del bloque:**
Describe el propósito principal y los objetivos de aprendizaje.

**Nivel de dificultad:**
Indica el nivel apropiado y prerrequisitos necesarios.

**Estrategias didácticas:**
Explica cómo se puede usar este bloque en el aula.

**Evaluación:**
Sugiere criterios de evaluación y métricas de éxito.

**Observaciones adicionales:**
Cualquier información relevante para educadores.`
    },
    {
      id: 'advanced',
      name: 'Plantilla Avanzada',
      icon: '🎯',
      content: `**Competencias desarrolladas:**
• Lista las competencias específicas que desarrolla este bloque
• Indica conexiones con el currículum oficial

**Metodología pedagógica:**
• Describe el enfoque metodológico recomendado
• Incluye sugerencias de implementación

**Adaptaciones:**
• Adaptaciones para diferentes niveles
• Modificaciones para necesidades especiales
• Variaciones según el contexto

**Recursos complementarios:**
• Materiales adicionales recomendados
• Enlaces a recursos externos
• Actividades de refuerzo y ampliación

**Criterios de evaluación:**
• Rúbricas sugeridas
• Indicadores de logro
• Instrumentos de evaluación recomendados

**Reflexiones pedagógicas:**
• Experiencias de uso previo
• Puntos de mejora identificados
• Resultados esperados`
    },
    {
      id: 'subject_specific',
      name: 'Por Materia',
      icon: '📚',
      content: `**Contextualización curricular:**
Ubicación dentro del currículum de la materia.

**Conexiones interdisciplinares:**
Relaciones con otras materias y áreas de conocimiento.

**Secuenciación didáctica:**
Orden recomendado de las preguntas y progresión lógica.

**Errores comunes:**
Dificultades frecuentes y malentendidos típicos del alumnado.

**Ampliación y refuerzo:**
Actividades para diferentes ritmos de aprendizaje.

**Evaluación formativa:**
Indicadores de progreso y puntos de control.`
    },
    {
      id: 'assessment',
      name: 'Evaluación',
      icon: '📊',
      content: `**Propósito evaluativo:**
Define si es evaluación diagnóstica, formativa o sumativa.

**Criterios de calificación:**
• Excelente (90-100%): Descripción de desempeño
• Satisfactorio (70-89%): Descripción de desempeño  
• En desarrollo (50-69%): Descripción de desempeño
• Necesita mejora (0-49%): Descripción de desempeño

**Tiempo estimado:**
Duración recomendada para completar el bloque.

**Instrucciones especiales:**
Consideraciones sobre el ambiente de evaluación.

**Análisis de resultados:**
Cómo interpretar y usar los resultados obtenidos.`
    }
  ];

  // Sincronizar con prop value
  useEffect(() => {
    setContent(value);
    setCharacterCount(value.length);
  }, [value]);

  const handleContentChange = useCallback((newContent) => {
    setContent(newContent);
    setCharacterCount(newContent.length);
    onChange?.(newContent);
  }, [onChange]);

  const insertTemplate = useCallback((template) => {
    const newContent = content ? `${content}\n\n${template.content}` : template.content;
    handleContentChange(newContent);
    setShowTemplateModal(false);
    setSelectedTemplate(template.id);
    
    // Focus el editor después de insertar
    setTimeout(() => {
      editorRef.current?.focus();
    }, 100);
  }, [content, handleContentChange]);

  const formatText = useCallback((format) => {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let formattedText = selectedText;
    let newCursorPos = end;

    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        newCursorPos = selectedText ? end + 4 : start + 2;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        newCursorPos = selectedText ? end + 2 : start + 1;
        break;
      case 'list':
        formattedText = selectedText ? `• ${selectedText}` : '• ';
        newCursorPos = selectedText ? end + 2 : start + 2;
        break;
      case 'numbered':
        formattedText = selectedText ? `1. ${selectedText}` : '1. ';
        newCursorPos = selectedText ? end + 3 : start + 3;
        break;
      case 'heading':
        formattedText = selectedText ? `## ${selectedText}` : '## ';
        newCursorPos = selectedText ? end + 3 : start + 3;
        break;
      default:
        return;
    }

    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    handleContentChange(newContent);
    
    // Restaurar cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [content, handleContentChange]);

  const getValidationStatus = useCallback(() => {
    if (characterCount < minLength) {
      return {
        isValid: false,
        message: `Mínimo ${minLength} caracteres (faltan ${minLength - characterCount})`,
        className: 'invalid'
      };
    }
    if (characterCount > maxLength) {
      return {
        isValid: false,
        message: `Máximo ${maxLength} caracteres (sobran ${characterCount - maxLength})`,
        className: 'invalid'
      };
    }
    return {
      isValid: true,
      message: `${characterCount}/${maxLength} caracteres`,
      className: 'valid'
    };
  }, [characterCount, minLength, maxLength]);

  const validationStatus = getValidationStatus();

  return (
    <div className={`author-observations-editor ${className} ${isExpanded ? 'expanded' : ''}`}>
      <div className="editor-header">
        <div className="header-left">
          <h4 className="editor-title">
            📝 Observaciones del Autor
            <span className="required-indicator">*</span>
          </h4>
          <p className="editor-description">
            Proporciona información detallada para educadores sobre el uso pedagógico de este bloque.
          </p>
        </div>
        
        <div className="header-actions">
          {showTemplates && (
            <button
              type="button"
              className="template-btn"
              onClick={() => setShowTemplateModal(true)}
              disabled={disabled}
              title="Usar plantilla predefinida"
            >
              📋 Plantillas
            </button>
          )}
          
          <button
            type="button"
            className={`expand-btn ${isExpanded ? 'expanded' : ''}`}
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Contraer editor' : 'Expandir editor'}
          >
            {isExpanded ? '🗗' : '🗖'}
          </button>
        </div>
      </div>

      {/* Toolbar de formato */}
      <div className="formatting-toolbar">
        <div className="format-group">
          <button
            type="button"
            className="format-btn"
            onClick={() => formatText('bold')}
            disabled={disabled}
            title="Texto en negrita"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            className="format-btn"
            onClick={() => formatText('italic')}
            disabled={disabled}
            title="Texto en cursiva"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            className="format-btn"
            onClick={() => formatText('heading')}
            disabled={disabled}
            title="Encabezado"
          >
            H
          </button>
        </div>
        
        <div className="format-separator"></div>
        
        <div className="format-group">
          <button
            type="button"
            className="format-btn"
            onClick={() => formatText('list')}
            disabled={disabled}
            title="Lista con viñetas"
          >
            • Lista
          </button>
          <button
            type="button"
            className="format-btn"
            onClick={() => formatText('numbered')}
            disabled={disabled}
            title="Lista numerada"
          >
            1. Lista
          </button>
        </div>
      </div>

      {/* Área de edición */}
      <div className="editor-container">
        <textarea
          ref={editorRef}
          className="observations-textarea"
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={isExpanded ? 15 : 8}
        />
        
        {/* Preview lateral en modo expandido */}
        {isExpanded && content && (
          <div className="preview-panel">
            <h5 className="preview-title">Vista previa:</h5>
            <div 
              className="preview-content"
              dangerouslySetInnerHTML={{
                __html: content
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/^## (.*$)/gm, '<h3>$1</h3>')
                  .replace(/^• (.*$)/gm, '<li>$1</li>')
                  .replace(/^(\d+)\. (.*$)/gm, '<li>$2</li>')
                  .replace(/\n/g, '<br>')
              }}
            />
          </div>
        )}
      </div>

      {/* Footer con información */}
      <div className="editor-footer">
        <div className={`character-count ${validationStatus.className}`}>
          {validationStatus.message}
        </div>
        
        {!validationStatus.isValid && (
          <div className="validation-help">
            Las observaciones detalladas ayudan a otros educadores a entender el propósito y uso pedagógico del bloque.
          </div>
        )}
      </div>

      {/* Modal de plantillas */}
      {showTemplateModal && (
        <div className="template-modal-overlay" onClick={() => setShowTemplateModal(false)}>
          <div className="template-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Seleccionar Plantilla</h3>
              <button 
                className="close-modal-btn"
                onClick={() => setShowTemplateModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="templates-grid">
              {templates.map(template => (
                <div
                  key={template.id}
                  className="template-card"
                  onClick={() => insertTemplate(template)}
                >
                  <div className="template-icon">{template.icon}</div>
                  <h4 className="template-name">{template.name}</h4>
                  <div className="template-preview">
                    {template.content.substring(0, 100)}...
                  </div>
                </div>
              ))}
            </div>
            
            <div className="modal-footer">
              <p className="template-note">
                💡 Las plantillas te ayudan a estructurar observaciones completas y útiles.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthorObservationsEditor;