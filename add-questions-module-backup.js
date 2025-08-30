// Add Questions Module - Shared React Application
// This module contains all the React components and functionality for adding questions
// Can be used by both PCC (Creadores) and PPF (Profesores) panels

// Initialize React if not already available
if (typeof React === 'undefined') {
    console.error('React is required for Add Questions Module');
}

// Extract React hooks
const { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext } = React;

// Translation system for Add Questions
const translations = {
    es: {
        add_question_tab_uploader: 'Subir Fichero',
        add_question_tab_manual: 'Agregar Manualmente', 
        add_question_tab_generator: 'Generar con IA',
        generator_title: 'Generador de Preguntas',
        generator_api_key: 'API Key de Gemini',
        generator_api_key_placeholder: 'Introduce tu API Key aquí',
        generator_block: 'Bloque',
        generator_block_placeholder: 'Escribe un bloque nuevo o elige uno existente',
        generator_topic: 'Tema',
        generator_topic_placeholder: 'Elige o crea un tema nuevo',
        generator_button_generate: 'Generar Preguntas',
        generator_button_generating: 'Generando...',
        uploader_title: 'Subir Preguntas desde Fichero',
        uploader_file_label: 'Subir Fichero (.txt)',
        uploader_file_prompt_1: 'Sube un fichero',
        uploader_file_prompt_2: 'o arrástralo aquí',
        uploader_button_load: 'Cargar Preguntas para Revisar',
        manual_form_title: 'Nueva Pregunta Manual',
        manual_form_question_text: 'Texto de la Pregunta',
        manual_form_answers: 'Respuestas (marca la correcta)',
        manual_form_add_button: 'Añadir Pregunta',
        manual_form_add_answer: 'Añadir Respuesta',
        block_type: 'Tipo de Bloque',
        block_public: 'Público',
        block_private: 'Privado'
    }
};

const useLanguage = () => ({
    t: (key, params = {}) => {
        let text = translations.es[key] || key;
        Object.keys(params).forEach(param => {
            text = text.replace(`{${param}}`, params[param]);
        });
        return text;
    }
});

// Simplified Combobox component
const Combobox = ({ options, value, onChange, placeholder, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const filteredOptions = options.filter(option => 
        option.label.toLowerCase().includes(value.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return React.createElement('div', { className: 'relative', ref: containerRef }, [
        React.createElement('div', { className: 'relative', key: 'input-container' }, [
            React.createElement('input', {
                key: 'input',
                type: 'text',
                value: value,
                onChange: (e) => {
                    onChange(e.target.value);
                    if (!isOpen) setIsOpen(true);
                },
                onFocus: () => setIsOpen(true),
                style: {
                    width: '100%',
                    background: '#0D1B2A',
                    border: '1px solid #415A77',
                    borderRadius: '6px',
                    padding: '8px 32px 8px 12px',
                    color: '#E0E1DD',
                    fontSize: '14px',
                    outline: 'none'
                },
                placeholder: placeholder,
                disabled: disabled
            }),
            React.createElement('button', {
                key: 'dropdown-btn',
                type: 'button',
                onClick: () => setIsOpen(!isOpen),
                disabled: disabled,
                style: {
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#778DA9',
                    cursor: 'pointer'
                }
            }, '▼')
        ]),
        isOpen && React.createElement('ul', {
            key: 'dropdown-list',
            style: {
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 10,
                background: '#1B263B',
                border: '1px solid #415A77',
                borderRadius: '6px',
                marginTop: '4px',
                maxHeight: '200px',
                overflowY: 'auto',
                padding: '4px 0'
            }
        }, 
            filteredOptions.length > 0 
                ? filteredOptions.map(option =>
                    React.createElement('li', {
                        key: option.id,
                        onClick: () => {
                            onChange(option.label);
                            setIsOpen(false);
                        },
                        style: {
                            padding: '8px 12px',
                            color: '#E0E1DD',
                            cursor: 'pointer',
                            listStyle: 'none'
                        },
                        onMouseOver: (e) => e.target.style.background = '#415A77',
                        onMouseOut: (e) => e.target.style.background = 'transparent'
                    }, option.label)
                )
                : [React.createElement('li', {
                    key: 'no-results',
                    style: { padding: '8px 12px', color: '#778DA9', listStyle: 'none' }
                }, value ? "No se encontraron bloques. Escribe para crear uno nuevo." : "Escribe para buscar o crear nuevo.")]
        )
    ]);
};

// Mock data and functions (integrate with your existing API)
const mockBlocks = [
    { id: 1, nombreCorto: 'Matemáticas', creatorId: 1, questions: [{ tema: 'Álgebra' }, { tema: 'Geometría' }] },
    { id: 2, nombreCorto: 'Historia', creatorId: 1, questions: [{ tema: 'Medieval' }, { tema: 'Moderna' }] }
];

const mockCurrentUser = { id: 1, nickname: 'Creador de Contenido' };

// Function to parse filename format: bloque_tema.txt
const parseFilename = (filename) => {
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, ''); // Remove extension
    const parts = nameWithoutExt.split('_');
    
    if (parts.length >= 2) {
        const bloque = parts[0];
        const tema = parts.slice(1).join('_'); // Join remaining parts in case tema has underscores
        return { bloque, tema };
    }
    return { bloque: '', tema: '' };
};

// Function to parse question format from file content (supports dual formats)
const parseQuestions = (content, bloque, tema) => {
    console.log('🔍 Parsing content for:', bloque, '→', tema);
    console.log('📄 Content length:', content.length);
    
    const lines = content.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
    console.log('📋 Total lines after filtering:', lines.length);
    
    const questions = [];
    
    // FORMATO 1: Original con ## y @@ separators
    if (content.includes('##')) {
        console.log('🎯 Detected original format (## separators)');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.includes('##')) {
                const parts = line.split('##');
                if (parts.length >= 2) {
                    const questionText = parts[0].trim();
                    const answerParts = parts.slice(1);
                    
                    const respuestas = answerParts.map(part => {
                        const isCorrect = part.includes('@@');
                        const answerText = part.replace(/@@/g, '').trim();
                        return {
                            textoRespuesta: answerText,
                            esCorrecta: isCorrect
                        };
                    });
                    
                    // Check for explanation on next line
                    let explicacion = '';
                    if (i + 1 < lines.length && !lines[i + 1].includes('##')) {
                        explicacion = lines[i + 1];
                        i++; // Skip explanation line
                    }
                    
                    questions.push({
                        bloque,
                        tema,
                        textoPregunta: questionText,
                        respuestas: respuestas,
                        explicacionRespuesta: explicacion
                    });
                    
                    console.log('✅ Parsed original format question:', questionText);
                }
            }
        }
    }
    // FORMATO 2: Estándar con números y letras
    else {
        console.log('🎯 Detected standard format (numbered questions)');
        
        let currentQuestion = null;
        let currentAnswers = [];
        let currentExplanation = '';
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Question patterns
            const questionPatterns = [
                /^\d+[.\-)\s]+(.+)$/,           // 1. Question, 1- Question, 1) Question
                /^[Pp]regunta\s*\d+[:\s]+(.+)$/,   // Pregunta 1: Question
                /^[Qq]\d+[:\s]+(.+)$/,           // Q1: Question
                /^\d+[:\s]+(.+)$/                // 1: Question
            ];
            
            let questionMatch = null;
            for (const pattern of questionPatterns) {
                questionMatch = line.match(pattern);
                if (questionMatch) break;
            }
            
            if (questionMatch) {
                // Save previous question
                if (currentQuestion && currentAnswers.length > 0) {
                    questions.push({
                        bloque,
                        tema,
                        textoPregunta: currentQuestion,
                        respuestas: currentAnswers,
                        explicacionRespuesta: currentExplanation
                    });
                }
                
                // Start new question
                currentQuestion = questionMatch[1].trim();
                currentAnswers = [];
                currentExplanation = '';
                console.log('✅ Found standard format question:', currentQuestion);
            }
            // Answer patterns
            else if (/^[*]?[a-zA-Z]\)?[.\-\s]+(.+)$/i.test(line)) {
                const isCorrect = line.startsWith('*');
                let answerText = line.replace(/^[*]?[a-zA-Z]\)?[.\-\s]*/i, '').trim();
                
                if (answerText) {
                    currentAnswers.push({
                        textoRespuesta: answerText,
                        esCorrecta: isCorrect
                    });
                    console.log('📝 Found answer:', answerText, isCorrect ? '(CORRECT)' : '');
                }
            }
            // Multi-line questions
            else if (currentQuestion && !currentAnswers.length && line.length > 0) {
                currentQuestion += ' ' + line;
            }
            // Possible explanation (after all answers)
            else if (currentAnswers.length > 0 && line.length > 0) {
                currentExplanation = line;
                console.log('📖 Found explanation:', line);
            }
        }
        
        // Save last question
        if (currentQuestion && currentAnswers.length > 0) {
            questions.push({
                bloque,
                tema,
                textoPregunta: currentQuestion,
                respuestas: currentAnswers,
                explicacionRespuesta: currentExplanation
            });
        }
    }
    
    console.log('✅ Total questions parsed:', questions.length);
    return questions;
};

// Enhanced File Upload Component with Multiple File Support
const QuestionUploader = ({ currentUser, blocks, onSaveQuestions, onCreateBlock }) => {
    const { t } = useLanguage();
    const [blockName, setBlockName] = useState('');
    const [topicName, setTopicName] = useState('');
    const [files, setFiles] = useState([]);
    const [uploadMode, setUploadMode] = useState('single'); // 'single' or 'multiple'
    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');
    const [processedQuestions, setProcessedQuestions] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingProgress, setProcessingProgress] = useState(0);
    const [processingStep, setProcessingStep] = useState('');
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [startTime, setStartTime] = useState(null);

    const blockOptions = blocks.map(b => ({ id: b.id, label: b.nombreCorto }));

    const handleFileChange = (event) => {
        const selectedFiles = Array.from(event.target.files);
        let filesToSet;
        
        if (uploadMode === 'single') {
            filesToSet = selectedFiles.slice(0, 1);
        } else {
            filesToSet = selectedFiles;
        }
        
        setFiles(filesToSet);
        
        // Auto-fill block and topic from first file if available
        if (filesToSet.length > 0) {
            const firstFile = filesToSet[0];
            const parsed = parseFilename(firstFile.name);
            
            if (parsed.bloque && parsed.tema) {
                setBlockName(parsed.bloque);
                setTopicName(parsed.tema);
            }
        }
    };

    const removeFile = (index) => {
        const newFiles = files.filter((_, i) => i !== index);
        setFiles(newFiles);
    };

    const handleLoadForReview = async () => {
        if (files.length === 0) {
            setMessage('Por favor, selecciona al menos un fichero.');
            setStatus('error');
            return;
        }
        
        // Check if files follow the naming convention
        const validFiles = files.filter(file => {
            const parsed = parseFilename(file.name);
            return parsed.bloque && parsed.tema;
        });
        
        if (validFiles.length === 0) {
            setMessage('Los archivos deben seguir el formato: bloque_tema.txt');
            setStatus('error');
            return;
        }
        
        setIsProcessing(true);
        setStatus('processing');
        setProcessingProgress(0);
        setProcessingStep('Iniciando procesamiento...');
        setStartTime(Date.now());
        setTimeRemaining(0);
        
        try {
            const allQuestions = [];
            const totalFiles = validFiles.length;
            const estimatedTimePerFile = 2000; // 2 seconds per file estimation
            
            setProcessingStep(`Procesando ${totalFiles} archivo(s)...`);
            
            for (let i = 0; i < validFiles.length; i++) {
                const file = validFiles[i];
                const parsed = parseFilename(file.name);
                
                // Update progress and time estimation
                const progressPercent = (i / totalFiles) * 100;
                setProcessingProgress(progressPercent);
                setProcessingStep(`Procesando archivo ${i + 1}/${totalFiles}: ${file.name}`);
                
                // Calculate time remaining
                const elapsed = Date.now() - startTime;
                const avgTimePerFile = elapsed / (i + 1);
                const remaining = Math.max(0, Math.ceil((totalFiles - i - 1) * avgTimePerFile / 1000));
                setTimeRemaining(remaining);
                
                // Read file content
                setProcessingStep(`Leyendo contenido: ${file.name}`);
                const content = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.onerror = reject;
                    reader.readAsText(file);
                });
                
                // Parse questions with small delay to show progress
                setProcessingStep(`Parseando preguntas: ${file.name}`);
                await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for UI update
                
                const questions = parseQuestions(content, parsed.bloque, parsed.tema);
                allQuestions.push(...questions);
                
                console.log(`✅ Procesado ${file.name}: ${questions.length} preguntas`);
            }
            
            // Final progress update
            setProcessingProgress(100);
            setProcessingStep('Finalizando procesamiento...');
            setTimeRemaining(0);
            
            setProcessedQuestions(allQuestions);
            setMessage(`✅ Procesado completamente: ${allQuestions.length} preguntas de ${validFiles.length} archivo(s)`);
            setStatus('completed');
            
        } catch (error) {
            console.error('Error processing files:', error);
            setMessage('Error al procesar los archivos');
            setStatus('error');
        } finally {
            setIsProcessing(false);
            setProcessingProgress(0);
            setProcessingStep('');
            setTimeRemaining(0);
        }
    };

    // Function to save processed questions to database
    const handleSaveProcessedQuestions = async () => {
        if (processedQuestions.length === 0) {
            alert('No hay preguntas para guardar');
            return;
        }

        // Start progress tracking
        setIsProcessing(true);
        setProcessingProgress(0);
        setProcessingStep('Iniciando guardado de preguntas...');
        setStatus('saving');
        setMessage('Guardando preguntas en la base de datos...');

        try {
            console.log(`🚀 Starting to save ${processedQuestions.length} questions...`);
            
            // Group questions by block
            const questionsByBlock = {};
            processedQuestions.forEach(q => {
                const blockName = q.bloque || 'Sin Clasificar';
                if (!questionsByBlock[blockName]) {
                    questionsByBlock[blockName] = [];
                }
                questionsByBlock[blockName].push(q);
            });

            let totalSaved = 0;
            const blockResults = [];
            const totalQuestions = processedQuestions.length;
            const startTime = Date.now();

            // Process each block
            let blockIndex = 0;
            const totalBlocks = Object.keys(questionsByBlock).length;
            
            for (const [blockName, questions] of Object.entries(questionsByBlock)) {
                blockIndex++;
                setProcessingStep(`Procesando bloque ${blockIndex}/${totalBlocks}: ${blockName}`);
                
                try {
                    console.log(`📦 Processing block: ${blockName} (${questions.length} questions)`);
                    
                    // Update progress
                    const blockProgress = (blockIndex - 1) / totalBlocks * 100;
                    setProcessingProgress(blockProgress);
                    
                    // Create block first
                    const blockData = {
                        name: blockName,
                        description: `Bloque creado automáticamente: ${blockName}`,
                        isPublic: false,
                        observaciones: `Generado desde archivo con ${questions.length} preguntas`
                    };
                    
                    console.log('🔄 Creating block:', blockData);
                    setProcessingStep(`Creando bloque: ${blockName}...`);
                    
                    const blockResponse = await apiDataService.createBlock(blockData);
                    console.log('✅ Block created successfully:', blockResponse);
                    
                    if (!blockResponse.blockId) {
                        throw new Error('Block creation failed - no blockId received');
                    }
                    
                    const blockId = blockResponse.blockId;
                    console.log(`📋 Block ${blockName} created with ID: ${blockId}`);
                    
                    // Save questions for this block
                    let blockQuestionsSaved = 0;
                    const blockQuestionErrors = [];
                    
                    setProcessingStep(`Guardando ${questions.length} preguntas para ${blockName}...`);
                    
                    for (let i = 0; i < questions.length; i++) {
                        const question = questions[i];
                        
                        try {
                            // Log the question data being sent
                            const questionData = {
                                blockId: blockId,
                                textoPregunta: question.textoPregunta || question.pregunta || question.text,
                                respuestas: question.respuestas || (question.opciones || question.options || []).map(opcion => ({
                                    textoRespuesta: opcion.textoRespuesta || opcion.texto || opcion.text || opcion,
                                    esCorrecta: opcion.esCorrecta || opcion.isCorrect || false
                                })),
                                explicacionRespuesta: question.explicacionRespuesta || question.explicacion || question.explanation || '',
                                difficulty: question.dificultad || question.difficulty || 1,
                                tema: question.tema || question.topic || 'General'
                            };
                            
                            console.log(`💾 Saving question ${i + 1}/${questions.length} for ${blockName}:`, {
                                blockId: questionData.blockId,
                                textoPregunta: questionData.textoPregunta.substring(0, 50) + '...',
                                tema: questionData.tema,
                                respuestasCount: questionData.respuestas.length
                            });
                            
                            const questionResponse = await apiDataService.createQuestion(questionData);
                            console.log(`✅ Question ${i + 1} saved successfully for ${blockName}`);
                            
                            blockQuestionsSaved++;
                            totalSaved++;
                            
                            // Update progress within block
                            const questionsProgress = (blockIndex - 1 + (i + 1) / questions.length) / totalBlocks * 100;
                            setProcessingProgress(questionsProgress);
                            
                        } catch (questionError) {
                            console.error(`❌ Error saving question ${i + 1} for ${blockName}:`, questionError);
                            blockQuestionErrors.push({
                                questionIndex: i + 1,
                                question: question.textoPregunta?.substring(0, 50) + '...' || 'Unknown question',
                                error: questionError.message || 'Unknown error'
                            });
                        }
                    }
                    
                    blockResults.push({
                        blockName,
                        blockId,
                        totalQuestions: questions.length,
                        savedQuestions: blockQuestionsSaved,
                        errors: blockQuestionErrors,
                        success: blockQuestionErrors.length === 0
                    });
                    
                    console.log(`✅ Block ${blockName} completed: ${blockQuestionsSaved}/${questions.length} questions saved`);
                    
                } catch (blockError) {
                    console.error(`❌ Error processing block ${blockName}:`, blockError);
                    blockResults.push({
                        blockName,
                        totalQuestions: questions.length,
                        savedQuestions: 0,
                        errors: [{ error: blockError.message || 'Block creation failed' }],
                        success: false
                    });
                }
                
                // Update overall progress
                const overallProgress = blockIndex / totalBlocks * 100;
                setProcessingProgress(overallProgress);
            }
            
            // Final results
            setProcessingProgress(100);
            setProcessingStep('✅ Guardado completado!');
            
            const successfulBlocks = blockResults.filter(b => b.success).length;
            const failedBlocks = blockResults.filter(b => !b.success);
            
            let resultMessage = `✅ Guardado completado!\n📊 Resumen:\n- Total de preguntas guardadas: ${totalSaved}\n- Bloques procesados exitosamente: ${successfulBlocks}`;
            
            if (failedBlocks.length > 0) {
                resultMessage += `\n❌ Bloques con errores:`;
                failedBlocks.forEach(block => {
                    const mainError = block.errors[0]?.error || 'Unknown error';
                    resultMessage += `\n• ${block.blockName}: ${mainError}`;
                });
            }
            
            console.log('📊 Final Results:', blockResults);
            setMessage(resultMessage);
            setStatus('success');
            
            // Clear processed questions
            setProcessedQuestions([]);
            
        } catch (error) {
            console.error('❌ Critical error during save process:', error);
            setMessage(`❌ Error crítico durante el guardado: ${error.message}`);
            setStatus('error');
        } finally {
            setIsProcessing(false);
            setProcessingProgress(0);
            setProcessingStep('');
        }
    };

    // Component render using React.createElement
    return React.createElement('div', { style: { padding: '20px' } }, [
        // Upload mode selector
        React.createElement('div', { key: 'mode-selector', style: { marginBottom: '20px' } }, [
            React.createElement('h3', { key: 'title', style: { color: '#E0E1DD', marginBottom: '10px' } }, t('uploader_title')),
            React.createElement('div', { key: 'mode-buttons', style: { display: 'flex', gap: '10px', marginBottom: '15px' } }, [
                React.createElement('button', {
                    key: 'single',
                    onClick: () => setUploadMode('single'),
                    style: {
                        padding: '8px 16px',
                        background: uploadMode === 'single' ? '#667EEA' : '#415A77',
                        color: '#E0E1DD',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                    }
                }, 'Archivo único'),
                React.createElement('button', {
                    key: 'multiple',
                    onClick: () => setUploadMode('multiple'),
                    style: {
                        padding: '8px 16px',
                        background: uploadMode === 'multiple' ? '#667EEA' : '#415A77',
                        color: '#E0E1DD',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                    }
                }, 'Múltiples archivos')
            ])
        ]),

        // File input
        React.createElement('div', { key: 'file-input', style: { marginBottom: '20px' } }, [
            React.createElement('input', {
                key: 'file-input-field',
                type: 'file',
                accept: '.txt',
                multiple: uploadMode === 'multiple',
                onChange: handleFileChange,
                style: {
                    width: '100%',
                    padding: '12px',
                    background: '#0D1B2A',
                    border: '1px solid #415A77',
                    borderRadius: '6px',
                    color: '#E0E1DD'
                }
            })
        ]),

        // Selected files display
        files.length > 0 && React.createElement('div', { key: 'files-display', style: { marginBottom: '20px' } }, [
            React.createElement('h4', { key: 'files-title', style: { color: '#E0E1DD', marginBottom: '10px' } }, 'Archivos seleccionados:'),
            React.createElement('div', { key: 'files-list', style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
                files.map((file, index) =>
                    React.createElement('div', {
                        key: index,
                        style: {
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 12px',
                            background: '#1B263B',
                            borderRadius: '6px',
                            border: '1px solid #415A77'
                        }
                    }, [
                        React.createElement('span', { key: 'filename', style: { color: '#E0E1DD' } }, file.name),
                        React.createElement('button', {
                            key: 'remove',
                            onClick: () => removeFile(index),
                            style: {
                                background: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }
                        }, 'Eliminar')
                    ])
                )
            )
        ]),

        // Processing status
        isProcessing && React.createElement('div', { key: 'processing', style: { marginBottom: '20px', padding: '15px', background: '#1B263B', borderRadius: '8px', border: '1px solid #415A77' } }, [
            React.createElement('div', { key: 'progress-bar', style: { marginBottom: '10px' } }, [
                React.createElement('div', {
                    key: 'progress-fill',
                    style: {
                        width: '100%',
                        height: '8px',
                        background: '#415A77',
                        borderRadius: '4px',
                        overflow: 'hidden'
                    }
                }, 
                    React.createElement('div', {
                        style: {
                            width: `${processingProgress}%`,
                            height: '100%',
                            background: '#667EEA',
                            transition: 'width 0.3s ease'
                        }
                    })
                )
            ]),
            React.createElement('div', { key: 'progress-text', style: { color: '#E0E1DD', fontSize: '14px' } }, [
                React.createElement('div', { key: 'step' }, processingStep),
                processingProgress > 0 && React.createElement('div', { key: 'percentage', style: { marginTop: '5px', fontSize: '12px', color: '#778DA9' } }, 
                    `${Math.round(processingProgress)}%${timeRemaining > 0 ? ` - ${timeRemaining}s restantes` : ''}`
                )
            ])
        ]),

        // Action buttons
        React.createElement('div', { key: 'actions', style: { display: 'flex', gap: '10px', marginBottom: '20px' } }, [
            React.createElement('button', {
                key: 'load',
                onClick: handleLoadForReview,
                disabled: files.length === 0 || isProcessing,
                style: {
                    padding: '12px 24px',
                    background: files.length === 0 || isProcessing ? '#415A77' : '#667EEA',
                    color: '#E0E1DD',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: files.length === 0 || isProcessing ? 'not-allowed' : 'pointer',
                    fontWeight: '500'
                }
            }, isProcessing ? 'Procesando...' : t('uploader_button_load')),

            processedQuestions.length > 0 && React.createElement('button', {
                key: 'save',
                onClick: handleSaveProcessedQuestions,
                disabled: isProcessing,
                style: {
                    padding: '12px 24px',
                    background: isProcessing ? '#415A77' : '#28a745',
                    color: '#E0E1DD',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    fontWeight: '500'
                }
            }, isProcessing ? 'Guardando...' : `Guardar ${processedQuestions.length} preguntas`)
        ]),

        // Status message
        message && React.createElement('div', {
            key: 'status-message',
            style: {
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: status === 'error' ? '#dc3545' : status === 'success' ? '#28a745' : '#667EEA',
                background: status === 'error' ? 'rgba(220, 53, 69, 0.1)' : status === 'success' ? 'rgba(40, 167, 69, 0.1)' : 'rgba(102, 126, 234, 0.1)',
                color: '#E0E1DD',
                whiteSpace: 'pre-line'
            }
        }, message)
    ]);
};

// Simple Manual Question Form Component  
const ManualQuestionForm = ({ currentUser, blocks, onSaveQuestions, onCreateBlock }) => {
    const { t } = useLanguage();
    const [blockName, setBlockName] = useState('');
    const [topicName, setTopicName] = useState('');
    const [questionText, setQuestionText] = useState('');
    const [answers, setAnswers] = useState([
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
    ]);
    const [explanation, setExplanation] = useState('');
    const [isPublic, setIsPublic] = useState(false);

    const blockOptions = blocks.map(b => ({ id: b.id, label: b.nombreCorto }));

    const addAnswer = () => {
        setAnswers([...answers, { text: '', isCorrect: false }]);
    };

    const updateAnswer = (index, field, value) => {
        const newAnswers = [...answers];
        if (field === 'isCorrect') {
            // Only one answer can be correct
            newAnswers.forEach((answer, i) => {
                answer.isCorrect = i === index ? value : false;
            });
        } else {
            newAnswers[index][field] = value;
        }
        setAnswers(newAnswers);
    };

    const removeAnswer = (index) => {
        if (answers.length > 2) {
            setAnswers(answers.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!questionText.trim()) {
            alert('Por favor, introduce el texto de la pregunta');
            return;
        }

        if (answers.filter(a => a.text.trim()).length < 2) {
            alert('Por favor, introduce al menos 2 respuestas');
            return;
        }

        if (!answers.some(a => a.isCorrect)) {
            alert('Por favor, marca al menos una respuesta como correcta');
            return;
        }

        try {
            // Create block if new
            let blockId;
            const existingBlock = blocks.find(b => b.nombreCorto === blockName);
            
            if (existingBlock) {
                blockId = existingBlock.id;
            } else {
                const blockData = {
                    name: blockName,
                    description: `Bloque: ${blockName}`,
                    isPublic: isPublic,
                    observaciones: 'Creado manualmente'
                };
                
                const blockResponse = await apiDataService.createBlock(blockData);
                blockId = blockResponse.blockId;
            }

            // Prepare question data
            const questionData = {
                blockId: blockId,
                textoPregunta: questionText,
                respuestas: answers
                    .filter(a => a.text.trim())
                    .map(a => ({
                        textoRespuesta: a.text.trim(),
                        esCorrecta: a.isCorrect
                    })),
                explicacionRespuesta: explanation,
                difficulty: 1,
                tema: topicName || 'General'
            };

            await apiDataService.createQuestion(questionData);
            
            alert('Pregunta guardada exitosamente');
            
            // Reset form
            setQuestionText('');
            setAnswers([
                { text: '', isCorrect: false },
                { text: '', isCorrect: false }
            ]);
            setExplanation('');
            setTopicName('');
            
        } catch (error) {
            console.error('Error saving manual question:', error);
            alert('Error al guardar la pregunta: ' + (error.message || 'Error desconocido'));
        }
    };

    return React.createElement('form', { onSubmit: handleSubmit, style: { padding: '20px' } }, [
        React.createElement('h3', { key: 'title', style: { color: '#E0E1DD', marginBottom: '20px' } }, t('manual_form_title')),
        
        // Block selection
        React.createElement('div', { key: 'block-field', style: { marginBottom: '15px' } }, [
            React.createElement('label', { key: 'block-label', style: { display: 'block', color: '#E0E1DD', marginBottom: '5px' } }, 'Bloque:'),
            React.createElement(Combobox, {
                key: 'block-input',
                options: blockOptions,
                value: blockName,
                onChange: setBlockName,
                placeholder: 'Selecciona o crea un bloque'
            })
        ]),

        // Topic field
        React.createElement('div', { key: 'topic-field', style: { marginBottom: '15px' } }, [
            React.createElement('label', { key: 'topic-label', style: { display: 'block', color: '#E0E1DD', marginBottom: '5px' } }, 'Tema:'),
            React.createElement('input', {
                key: 'topic-input',
                type: 'text',
                value: topicName,
                onChange: (e) => setTopicName(e.target.value),
                style: {
                    width: '100%',
                    padding: '8px 12px',
                    background: '#0D1B2A',
                    border: '1px solid #415A77',
                    borderRadius: '6px',
                    color: '#E0E1DD'
                },
                placeholder: 'Introduce el tema de la pregunta'
            })
        ]),

        // Block type
        React.createElement('div', { key: 'public-field', style: { marginBottom: '15px' } }, [
            React.createElement('label', { key: 'public-label', style: { display: 'flex', alignItems: 'center', color: '#E0E1DD', gap: '8px' } }, [
                React.createElement('input', {
                    key: 'public-input',
                    type: 'checkbox',
                    checked: isPublic,
                    onChange: (e) => setIsPublic(e.target.checked)
                }),
                'Bloque público'
            ])
        ]),

        // Question text
        React.createElement('div', { key: 'question-field', style: { marginBottom: '15px' } }, [
            React.createElement('label', { key: 'question-label', style: { display: 'block', color: '#E0E1DD', marginBottom: '5px' } }, t('manual_form_question_text')),
            React.createElement('textarea', {
                key: 'question-input',
                value: questionText,
                onChange: (e) => setQuestionText(e.target.value),
                style: {
                    width: '100%',
                    padding: '12px',
                    background: '#0D1B2A',
                    border: '1px solid #415A77',
                    borderRadius: '6px',
                    color: '#E0E1DD',
                    minHeight: '80px',
                    resize: 'vertical'
                },
                placeholder: 'Introduce el texto de la pregunta...'
            })
        ]),

        // Answers
        React.createElement('div', { key: 'answers-field', style: { marginBottom: '15px' } }, [
            React.createElement('label', { key: 'answers-label', style: { display: 'block', color: '#E0E1DD', marginBottom: '10px' } }, t('manual_form_answers')),
            ...answers.map((answer, index) =>
                React.createElement('div', { 
                    key: `answer-${index}`, 
                    style: { 
                        display: 'flex', 
                        gap: '10px', 
                        marginBottom: '8px', 
                        alignItems: 'center' 
                    } 
                }, [
                    React.createElement('input', {
                        key: 'answer-text',
                        type: 'text',
                        value: answer.text,
                        onChange: (e) => updateAnswer(index, 'text', e.target.value),
                        style: {
                            flex: 1,
                            padding: '8px 12px',
                            background: '#0D1B2A',
                            border: '1px solid #415A77',
                            borderRadius: '6px',
                            color: '#E0E1DD'
                        },
                        placeholder: `Respuesta ${index + 1}...`
                    }),
                    React.createElement('label', { 
                        key: 'answer-correct',
                        style: { display: 'flex', alignItems: 'center', color: '#E0E1DD', gap: '5px' } 
                    }, [
                        React.createElement('input', {
                            key: 'correct-radio',
                            type: 'radio',
                            name: 'correctAnswer',
                            checked: answer.isCorrect,
                            onChange: (e) => updateAnswer(index, 'isCorrect', e.target.checked)
                        }),
                        'Correcta'
                    ]),
                    answers.length > 2 && React.createElement('button', {
                        key: 'remove-answer',
                        type: 'button',
                        onClick: () => removeAnswer(index),
                        style: {
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '6px 10px',
                            cursor: 'pointer'
                        }
                    }, '✕')
                ])
            ),
            React.createElement('button', {
                key: 'add-answer',
                type: 'button',
                onClick: addAnswer,
                style: {
                    padding: '8px 16px',
                    background: '#667EEA',
                    color: '#E0E1DD',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    marginTop: '5px'
                }
            }, t('manual_form_add_answer'))
        ]),

        // Explanation
        React.createElement('div', { key: 'explanation-field', style: { marginBottom: '20px' } }, [
            React.createElement('label', { key: 'explanation-label', style: { display: 'block', color: '#E0E1DD', marginBottom: '5px' } }, 'Explicación (opcional):'),
            React.createElement('textarea', {
                key: 'explanation-input',
                value: explanation,
                onChange: (e) => setExplanation(e.target.value),
                style: {
                    width: '100%',
                    padding: '12px',
                    background: '#0D1B2A',
                    border: '1px solid #415A77',
                    borderRadius: '6px',
                    color: '#E0E1DD',
                    minHeight: '60px',
                    resize: 'vertical'
                },
                placeholder: 'Introduce una explicación de la respuesta correcta...'
            })
        ]),

        // Submit button
        React.createElement('button', {
            key: 'submit',
            type: 'submit',
            style: {
                padding: '12px 24px',
                background: '#28a745',
                color: '#E0E1DD',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px'
            }
        }, t('manual_form_add_button'))
    ]);
};

// Simple AI Question Generator Component
const AIQuestionGenerator = ({ currentUser, blocks, onSaveQuestions, onCreateBlock }) => {
    const { t } = useLanguage();
    const [apiKey, setApiKey] = useState('');
    const [blockName, setBlockName] = useState('');
    const [topicName, setTopicName] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const blockOptions = blocks.map(b => ({ id: b.id, label: b.nombreCorto }));

    const handleGenerate = async () => {
        if (!apiKey.trim()) {
            alert('Por favor, introduce tu API Key de Gemini');
            return;
        }

        if (!blockName.trim() || !topicName.trim()) {
            alert('Por favor, introduce el bloque y el tema');
            return;
        }

        setIsGenerating(true);
        
        try {
            alert('Funcionalidad de generación con IA en desarrollo. Por ahora, usa la subida de archivos o la creación manual.');
        } catch (error) {
            console.error('Error generating questions:', error);
            alert('Error al generar preguntas: ' + (error.message || 'Error desconocido'));
        } finally {
            setIsGenerating(false);
        }
    };

    return React.createElement('div', { style: { padding: '20px' } }, [
        React.createElement('h3', { key: 'title', style: { color: '#E0E1DD', marginBottom: '20px' } }, t('generator_title')),
        
        // API Key field
        React.createElement('div', { key: 'api-field', style: { marginBottom: '15px' } }, [
            React.createElement('label', { key: 'api-label', style: { display: 'block', color: '#E0E1DD', marginBottom: '5px' } }, t('generator_api_key')),
            React.createElement('input', {
                key: 'api-input',
                type: 'password',
                value: apiKey,
                onChange: (e) => setApiKey(e.target.value),
                style: {
                    width: '100%',
                    padding: '12px',
                    background: '#0D1B2A',
                    border: '1px solid #415A77',
                    borderRadius: '6px',
                    color: '#E0E1DD'
                },
                placeholder: t('generator_api_key_placeholder')
            })
        ]),

        // Block field
        React.createElement('div', { key: 'block-field', style: { marginBottom: '15px' } }, [
            React.createElement('label', { key: 'block-label', style: { display: 'block', color: '#E0E1DD', marginBottom: '5px' } }, t('generator_block')),
            React.createElement(Combobox, {
                key: 'block-input',
                options: blockOptions,
                value: blockName,
                onChange: setBlockName,
                placeholder: t('generator_block_placeholder')
            })
        ]),

        // Topic field
        React.createElement('div', { key: 'topic-field', style: { marginBottom: '20px' } }, [
            React.createElement('label', { key: 'topic-label', style: { display: 'block', color: '#E0E1DD', marginBottom: '5px' } }, t('generator_topic')),
            React.createElement('input', {
                key: 'topic-input',
                type: 'text',
                value: topicName,
                onChange: (e) => setTopicName(e.target.value),
                style: {
                    width: '100%',
                    padding: '12px',
                    background: '#0D1B2A',
                    border: '1px solid #415A77',
                    borderRadius: '6px',
                    color: '#E0E1DD'
                },
                placeholder: t('generator_topic_placeholder')
            })
        ]),

        // Generate button
        React.createElement('button', {
            key: 'generate',
            onClick: handleGenerate,
            disabled: isGenerating,
            style: {
                padding: '12px 24px',
                background: isGenerating ? '#415A77' : '#667EEA',
                color: '#E0E1DD',
                border: 'none',
                borderRadius: '6px',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                fontWeight: '500'
            }
        }, isGenerating ? t('generator_button_generating') : t('generator_button_generate'))
    ]);
};

// Main Add Questions App Component
const AddQuestionsApp = () => {
    const [activeTab, setActiveTab] = useState('uploader');
    const [currentUser, setCurrentUser] = useState(mockCurrentUser);
    const [blocks, setBlocks] = useState(mockBlocks);

    // Mock functions - to be replaced with real API calls
    const handleSaveQuestions = async (questions) => {
        console.log('Saving questions:', questions);
    };

    const handleCreateBlock = async (blockData) => {
        console.log('Creating block:', blockData);
        return { blockId: Date.now() };
    };

    const tabStyle = (isActive) => ({
        padding: '12px 24px',
        background: isActive ? '#667EEA' : '#415A77',
        color: '#E0E1DD',
        border: 'none',
        borderRadius: '8px 8px 0 0',
        cursor: 'pointer',
        fontWeight: '500',
        transition: 'background 0.2s'
    });

    const contentStyle = {
        background: '#1B263B',
        borderRadius: '0 8px 8px 8px',
        border: '1px solid #415A77',
        minHeight: '500px'
    };

    return React.createElement('div', { style: { width: '100%', maxWidth: '1200px', margin: '0 auto' } }, [
        // Tab navigation
        React.createElement('div', { key: 'tabs', style: { display: 'flex', marginBottom: '0' } }, [
            React.createElement('button', {
                key: 'uploader-tab',
                onClick: () => setActiveTab('uploader'),
                style: tabStyle(activeTab === 'uploader')
            }, '📁 ' + translations.es.add_question_tab_uploader),
            
            React.createElement('button', {
                key: 'manual-tab',
                onClick: () => setActiveTab('manual'),
                style: tabStyle(activeTab === 'manual')
            }, '✏️ ' + translations.es.add_question_tab_manual),
            
            React.createElement('button', {
                key: 'generator-tab',
                onClick: () => setActiveTab('generator'),
                style: tabStyle(activeTab === 'generator')
            }, '🤖 ' + translations.es.add_question_tab_generator)
        ]),

        // Tab content
        React.createElement('div', { key: 'content', style: contentStyle }, [
            activeTab === 'uploader' && React.createElement(QuestionUploader, {
                key: 'uploader-component',
                currentUser,
                blocks,
                onSaveQuestions: handleSaveQuestions,
                onCreateBlock: handleCreateBlock
            }),
            
            activeTab === 'manual' && React.createElement(ManualQuestionForm, {
                key: 'manual-component',
                currentUser,
                blocks,
                onSaveQuestions: handleSaveQuestions,
                onCreateBlock: handleCreateBlock
            }),
            
            activeTab === 'generator' && React.createElement(AIQuestionGenerator, {
                key: 'generator-component',
                currentUser,
                blocks,
                onSaveQuestions: handleSaveQuestions,
                onCreateBlock: handleCreateBlock
            })
        ])
    ]);
};

// CSS Animation styles
const addCSSAnimations = () => {
    if (!document.querySelector('#add-questions-animations')) {
        const style = document.createElement('style');
        style.id = 'add-questions-animations';
        style.textContent = `
            @keyframes fadeIn { 
                from { opacity: 0; transform: translateY(-10px); } 
                to { opacity: 1; transform: translateY(0); } 
            }
            @keyframes spin { 
                0% { transform: rotate(0deg); } 
                100% { transform: rotate(360deg); } 
            }
            .add-questions-container {
                animation: fadeIn 0.3s ease-out;
            }
        `;
        document.head.appendChild(style);
    }
};

// Public API for the module
window.AddQuestionsModule = {
    // Main component
    AddQuestionsApp,
    
    // Individual components
    QuestionUploader,
    ManualQuestionForm,
    AIQuestionGenerator,
    Combobox,
    
    // Utility functions
    parseFilename,
    parseQuestions,
    useLanguage,
    translations,
    
    // Initialization
    init: () => {
        addCSSAnimations();
        console.log('📚 Add Questions Module initialized');
    },
    
    // Mount function for easy integration
    mount: (containerId) => {
        const container = document.getElementById(containerId);
        if (container && typeof ReactDOM !== 'undefined') {
            addCSSAnimations();
            const root = ReactDOM.createRoot(container);
            root.render(React.createElement(AddQuestionsApp));
            console.log(`📚 Add Questions Module mounted to #${containerId}`);
        } else {
            console.error('Container not found or ReactDOM not available');
        }
    }
};

// Auto-initialize when script loads
document.addEventListener('DOMContentLoaded', () => {
    if (window.AddQuestionsModule) {
        window.AddQuestionsModule.init();
    }
});

console.log('📚 Add Questions Module loaded successfully');