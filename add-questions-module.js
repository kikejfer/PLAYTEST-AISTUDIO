// Add Questions Module - Complete Shared React Application
// This module contains all the React components and functionality for adding questions
// Compatible with both PCC (Creadores) and PPF (Profesores) panels
// Updated with full functionality from add-question.html

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
        generator_powered_by: 'Hecho con Gemini',
        generator_api_key: 'API Key de Gemini',
        generator_api_key_placeholder: 'Introduce tu API Key aquí',
        generator_block: 'Bloque',
        generator_block_placeholder: 'Escribe un bloque nuevo o elige uno existente',
        generator_topic: 'Tema',
        generator_topic_placeholder: 'Elige o crea un tema nuevo',
        generator_questions: 'Preguntas',
        generator_difficulty: 'Dificultad',
        generator_button_generate: 'Generar Preguntas',
        generator_button_generating: 'Generando...',
        generator_error_no_api_key: 'Generador de preguntas con AI sin habilitar. Introducir una API Key.',
        generator_error_fields_missing: 'Por favor, introduce un nombre de bloque y de tema.',
        generator_generated_questions: 'Preguntas Generadas:',
        generator_explanation: 'Explicación:',
        generator_button_save: 'Guardar Preguntas',
        generator_save_success_updated: '¡Se han guardado {count} preguntas en "{block}"!',
        generator_save_success_created: '¡Se ha creado "{block}" y guardado {count} preguntas!',
        generator_save_error: 'Ha ocurrido un error inesperado al guardar.',
        generator_syllabus_upload: 'Subir Temario (Opcional)',
        generator_syllabus_upload_button: 'Seleccionar Archivo',
        generator_syllabus_clear: 'Quitar',
        generator_difficulty_range: 'Rango de Dificultad (Opcional)',
        generator_observations: 'Observaciones (Opcional)',
        generator_observations_placeholder: 'Añade observaciones sobre el bloque...',
        uploader_title: 'Subir Preguntas desde Fichero',
        uploader_file_label: 'Subir Fichero (.txt)',
        uploader_file_prompt_1: 'Sube un fichero',
        uploader_file_prompt_2: 'o arrástralo aquí',
        uploader_file_selected: 'Seleccionado: {fileName}',
        uploader_button_load: 'Cargar Preguntas para Revisar',
        uploader_button_load_selected: 'Cargar {count} archivo(s) para revisar',
        uploader_parsing: 'Analizando...',
        uploader_status_loaded: 'Se han cargado {count} preguntas para revisar.',
        uploader_status_no_questions: 'No se han encontrado preguntas válidas en el fichero. Por favor, comprueba el formato.',
        uploader_status_read_error: 'Error al leer el fichero.',
        uploader_status_generic_error: 'Por favor, introduce un tema y selecciona un fichero.',
        uploader_review_title: 'Revisar y Editar Preguntas Subidas ({count})',
        uploader_question_text: 'Texto de la Pregunta',
        uploader_answers: 'Respuestas',
        uploader_button_cancel: 'Cancelar',
        uploader_button_save_edit: 'Guardar Edición',
        uploader_button_edit: 'Editar',
        uploader_button_clear: 'Limpiar y Reiniciar',
        uploader_button_save_all: 'Guardar Todas las Preguntas',
        uploader_saving: 'Guardando...',
        uploader_button_exclude: 'No incluir',
        uploader_batch_title: "Subida Múltiple desde Carpeta",
        uploader_batch_explanation: "Selecciona una carpeta que contenga ficheros .txt con el formato <strong>NombreBloque_NombreTema.txt</strong>. Cada fichero será procesado de forma secuencial.",
        uploader_batch_button_select: "Seleccionar Carpeta",
        uploader_batch_button_processing: "Procesando Lote...",
        uploader_batch_status_progress: "Procesando fichero {current} de {total}: {fileName}",
        uploader_batch_status_complete: "¡Proceso de subida por lote completado!",
        uploader_batch_status_no_files: "No se encontraron ficheros válidos en la carpeta. El formato debe ser 'Bloque_Tema.txt'.",
        uploader_batch_status_skip_no_save: "No hay preguntas para guardar, saltando al siguiente fichero.",
        uploader_button_skip: "Descartar Archivo",
        uploader_separator: "O sube un único fichero",
        uploader_batch_detected_files: 'Archivos Detectados en la Carpeta',
        uploader_batch_finish: 'Finalizar Subida Múltiple',
        uploader_format_info_title: 'Formatos Soportados',
        uploader_format_info_subtitle: 'Tu archivo debe usar uno de estos formatos:',
        uploader_format_1_title: 'Formato 1: Separadores ## y @@',
        uploader_format_1_desc: 'Pregunta##Respuesta1##Respuesta2##@@RespuestaCorrecta##Respuesta4',
        uploader_format_1_example: '¿Cuál es la capital de España?##Barcelona##Valencia##@@Madrid##Sevilla',
        uploader_format_2_title: 'Formato 2: Formato Estándar',
        uploader_format_2_desc: 'Preguntas numeradas con respuestas marcadas con * para la correcta',
        uploader_format_2_example: '1. ¿Cuál es la capital de España?\\na) Barcelona\\nb) Valencia\\n*c) Madrid\\nd) Sevilla',
        uploader_filename_title: 'Formato de Nombres de Archivo',
        uploader_filename_desc: 'Para subida múltiple: <strong>NombreBloque_NombreTema.txt</strong>',
        uploader_filename_example: 'Ejemplo: Constitución_Título1.txt, Historia_Edad Media.txt',
        manual_form_title: 'Nueva Pregunta Manual',
        manual_form_question_text: 'Texto de la Pregunta',
        manual_form_answers: 'Respuestas (marca la correcta)',
        manual_form_explanation: 'Explicación (opcional)',
        manual_form_add_button: 'Añadir Pregunta',
        manual_form_add_answer: 'Añadir Respuesta',
        manual_form_discard_button: 'Descartar',
        manual_form_save_success: '¡Pregunta añadida correctamente!',
        manual_form_error: 'Error al guardar la pregunta.',
        manual_form_fields_missing: 'Por favor, rellena el bloque, tema, la pregunta y al menos dos respuestas con una correcta.',
        block_type: 'Tipo de Bloque',
        block_public: 'Público',
        block_private: 'Privado',
        generic_cancel: 'Cancelar',
        delete: 'Eliminar',
        error: 'Error',
        loading: 'Cargando...',
    }
};

// Language hook
const useLanguage = () => ({
    t: (key, params = {}) => {
        let text = translations.es[key] || key;
        Object.keys(params).forEach(param => {
            text = text.replace(`{${param}}`, params[param]);
        });
        return text;
    }
});

// Icon Components
const SparklesIcon = (props) => React.createElement('svg', {
    xmlns: "http://www.w3.org/2000/svg",
    className: "h-6 w-6",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    ...props
}, React.createElement('path', {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: 2,
    d: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
}));

const CheckCircleIcon = (props) => React.createElement('svg', {
    xmlns: "http://www.w3.org/2000/svg",
    className: "h-5 w-5",
    viewBox: "0 0 20 20",
    fill: "currentColor",
    ...props
}, React.createElement('path', {
    fillRule: "evenodd",
    d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z",
    clipRule: "evenodd"
}));

const XCircleIcon = (props) => React.createElement('svg', {
    xmlns: "http://www.w3.org/2000/svg",
    className: "h-5 w-5",
    viewBox: "0 0 20 20",
    fill: "currentColor",
    ...props
}, React.createElement('path', {
    fillRule: "evenodd",
    d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z",
    clipRule: "evenodd"
}));

const SaveIcon = (props) => React.createElement('svg', {
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    ...props
}, React.createElement('path', {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
}));

const ChevronUpDownIcon = (props) => React.createElement('svg', {
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    ...props
}, React.createElement('path', {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
}));

const DocumentTextIcon = (props) => React.createElement('svg', {
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    ...props
}, React.createElement('path', {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
}));

const PlusCircleIcon = (props) => React.createElement('svg', {
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    ...props
}, React.createElement('path', {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
}));

const TrashIcon = (props) => React.createElement('svg', {
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.5,
    stroke: "currentColor",
    ...props
}, React.createElement('path', {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
}));

// Enhanced Combobox component
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

    return React.createElement('div', { 
        className: 'relative', 
        ref: containerRef 
    }, [
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
                    borderRadius: '8px',
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
            }, React.createElement(ChevronUpDownIcon, { style: { height: '16px', width: '16px' } }))
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
                borderRadius: '8px',
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

// AI Question Generation with full Gemini integration
const generateQuestionsWithAI = async (blockName, topicName, questionCount, optionCount, difficulty, apiKey, errorMessage, syllabusContent = '', difficultyRange = new Set()) => {
    if (!apiKey) throw new Error(errorMessage);
    
    try {
        // Import GoogleGenAI dynamically
        const { GoogleGenAI } = await import("https://esm.sh/@google/genai");
        const genAI = new GoogleGenAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const difficultyText = difficultyRange.size > 0 
            ? `Varía la dificultad entre los niveles: ${Array.from(difficultyRange).join(', ')}`
            : `Nivel de dificultad: ${difficulty} de 5`;
            
        const syllabusContext = syllabusContent 
            ? `\n\nUSA ESTE TEMARIO COMO REFERENCIA:\n${syllabusContent.substring(0, 2000)}`
            : '';

        const prompt = `Genera exactamente ${questionCount} preguntas de opción múltiple sobre "${topicName}" para el bloque "${blockName}".

${difficultyText}.
Cada pregunta debe tener exactamente ${optionCount} opciones.
${syllabusContext}

FORMATO REQUERIDO (JSON válido):
{
  "questions": [
    {
      "textoPregunta": "Texto de la pregunta aquí",
      "respuestas": [
        {"textoRespuesta": "Opción A", "esCorrecta": false},
        {"textoRespuesta": "Opción B", "esCorrecta": true},
        {"textoRespuesta": "Opción C", "esCorrecta": false},
        {"textoRespuesta": "Opción D", "esCorrecta": false}
      ],
      "explicacionRespuesta": "Explicación clara de por qué esta es la respuesta correcta"
    }
  ]
}

IMPORTANTE:
- Solo una respuesta correcta por pregunta
- Explicaciones educativas y claras
- Responde SOLO con el JSON, sin texto adicional`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        
        // Clean up response to extract JSON
        text = text.replace(/```json\s*|\s*```/g, '').trim();
        
        const parsedData = JSON.parse(text);
        
        if (!parsedData.questions || !Array.isArray(parsedData.questions)) {
            throw new Error('Invalid response format from AI');
        }

        return parsedData.questions.map((q, index) => ({
            id: Date.now() + index,
            bloque: blockName,
            tema: topicName,
            textoPregunta: q.textoPregunta,
            respuestas: q.respuestas || [],
            explicacionRespuesta: q.explicacionRespuesta || '',
            dificultad: difficulty
        }));
        
    } catch (error) {
        console.error('AI Generation Error:', error);
        throw new Error(`Error generando preguntas: ${error.message}`);
    }
};

// Enhanced Question Generator Component
const QuestionGenerator = ({ currentUser, blocks, onSaveQuestions, onCreateBlock, preselectedBlock, preselectedTopic }) => {
    const { t } = useLanguage();
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
    const [blockName, setBlockName] = useState('');
    const [topicName, setTopicName] = useState('');
    const [availableTopics, setAvailableTopics] = useState([]);
    const [questionCount, setQuestionCount] = useState(5);
    const [optionCount, setOptionCount] = useState(4);
    const [difficulty, setDifficulty] = useState(3);
    const [difficultyRange, setDifficultyRange] = useState(new Set());
    const [syllabusContent, setSyllabusContent] = useState('');
    const [syllabusFileName, setSyllabusFileName] = useState('');
    const [generatedQuestions, setGeneratedQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [saveStatus, setSaveStatus] = useState('idle');
    const [saveMessage, setSaveMessage] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [observaciones, setObservaciones] = useState('');
    const syllabusInputRef = useRef(null);
    
    const isNewBlock = useMemo(() => 
        blockName.trim() && !blocks.some(b => b.nombreCorto?.toLowerCase() === blockName.trim().toLowerCase() && b.creatorId === currentUser?.id),
        [blockName, blocks, currentUser?.id]
    );

    useEffect(() => {
        if (preselectedBlock) setBlockName(preselectedBlock);
        if (preselectedTopic) setTopicName(preselectedTopic);
    }, [preselectedBlock, preselectedTopic]);

    useEffect(() => { 
        localStorage.setItem('gemini_api_key', apiKey); 
    }, [apiKey]);

    useEffect(() => {
        const selectedBlock = blocks.find(b => b.nombreCorto?.toLowerCase() === blockName.toLowerCase());
        if (selectedBlock && selectedBlock.questions && selectedBlock.questions.length > 0) {
            const uniqueTopics = [...new Set(selectedBlock.questions.map(q => q.tema))];
            setAvailableTopics(uniqueTopics.map(t => ({ id: t, label: t })));
        } else { 
            setAvailableTopics([]); 
        }
        if (!preselectedTopic) setTopicName('');
    }, [blockName, blocks, preselectedTopic]);

    const handleGenerate = useCallback(async () => {
        if (!blockName.trim() || !topicName.trim()) { 
            setError(t('generator_error_fields_missing')); 
            return; 
        }
        setIsLoading(true); 
        setError(null); 
        setGeneratedQuestions([]);
        
        try {
            const questions = await generateQuestionsWithAI(
                blockName, topicName, questionCount, optionCount, difficulty, 
                apiKey, t('generator_error_no_api_key'), syllabusContent, difficultyRange
            );
            setGeneratedQuestions(questions);
        } catch (err) { 
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally { 
            setIsLoading(false); 
        }
    }, [blockName, topicName, questionCount, optionCount, difficulty, apiKey, t, syllabusContent, difficultyRange]);
    
    const resetGenerator = useCallback(() => {
        setBlockName(preselectedBlock || ''); 
        setTopicName(preselectedTopic || ''); 
        setQuestionCount(5); 
        setDifficulty(3);
        setSyllabusContent(''); 
        setSyllabusFileName(''); 
        if (syllabusInputRef.current) syllabusInputRef.current.value = '';
        setDifficultyRange(new Set()); 
        setObservaciones('');
    }, [preselectedBlock, preselectedTopic]);

    const handleSave = useCallback(() => {
        try {
            const trimmedBlockName = blockName.trim();
            if (!trimmedBlockName) { 
                setSaveStatus('error'); 
                setSaveMessage('Block name cannot be empty.'); 
                setTimeout(() => setSaveStatus('idle'), 3000); 
                return; 
            }
            const existingBlock = blocks.find(b => b.nombreCorto?.toLowerCase() === trimmedBlockName.toLowerCase() && b.creatorId === currentUser?.id);
            if (existingBlock) {
                onSaveQuestions(existingBlock.id, generatedQuestions);
                setSaveStatus('success'); 
                setSaveMessage(t('generator_save_success_updated', {count: generatedQuestions.length, block: existingBlock.nombreCorto}));
            } else {
                onCreateBlock(trimmedBlockName, generatedQuestions, isPublic, observaciones);
                setSaveStatus('success'); 
                setSaveMessage(t('generator_save_success_created', {count: generatedQuestions.length, block: trimmedBlockName}));
            }
            setTimeout(() => { 
                setGeneratedQuestions([]); 
                resetGenerator(); 
                setSaveStatus('idle'); 
            }, 2500);
        } catch (err) { 
            setSaveStatus('error'); 
            setSaveMessage(t('generator_save_error')); 
            setTimeout(() => setSaveStatus('idle'), 3000); 
        }
    }, [blockName, generatedQuestions, blocks, onSaveQuestions, onCreateBlock, t, resetGenerator, isPublic, observaciones, currentUser?.id]);

    useEffect(() => { 
        setSaveStatus('idle'); 
        setSaveMessage(''); 
        setError(null); 
    }, [generatedQuestions]);
    
    const handleSyllabusFileChange = (event) => { 
        const file = event.target.files[0]; 
        if (!file) return; 
        const reader = new FileReader(); 
        reader.onload = (e) => { 
            setSyllabusContent(e.target.result); 
            setSyllabusFileName(file.name); 
        }; 
        reader.readAsText(file); 
    };
    
    const clearSyllabus = () => { 
        setSyllabusContent(''); 
        setSyllabusFileName(''); 
        if (syllabusInputRef.current) syllabusInputRef.current.value = ''; 
    };
    
    const handleDifficultyRangeChange = (value) => { 
        setDifficultyRange(prev => { 
            const newSet = new Set(prev); 
            if (newSet.has(value)) newSet.delete(value); 
            else newSet.add(value); 
            return newSet; 
        }); 
    };

    const blockOptions = blocks.map(b => ({ id: b.id, label: b.nombreCorto || b.name || '' }));
    const isUIBlocked = isLoading || generatedQuestions.length > 0;

    return React.createElement('div', {
        style: {
            background: '#1B263B',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
            border: '1px solid #415A77'
        }
    }, [
        React.createElement('div', {
            key: 'header',
            style: { display: 'flex', alignItems: 'center', marginBottom: '16px', gap: '16px' }
        }, [
            React.createElement('div', { 
                key: 'title-section',
                style: { display: 'flex', alignItems: 'center' } 
            }, [
                React.createElement(SparklesIcon, { 
                    key: 'icon',
                    style: { height: '24px', width: '24px', marginRight: '12px', color: '#778DA9' } 
                }),
                React.createElement('h3', { 
                    key: 'title',
                    style: { fontSize: '20px', fontWeight: 'bold', color: '#E0E1DD', margin: 0 } 
                }, t('generator_title'))
            ]),
            React.createElement('span', { 
                key: 'badge',
                style: { 
                    fontSize: '12px', fontWeight: '600', color: '#778DA9', 
                    background: '#0D1B2A', padding: '4px 8px', borderRadius: '6px' 
                } 
            }, t('generator_powered_by'))
        ]),
        
        React.createElement('div', {
            key: 'form',
            style: { display: 'flex', flexDirection: 'column', gap: '16px' }
        }, [
            // API Key field
            React.createElement('div', { key: 'api-key' }, [
                React.createElement('label', { 
                    key: 'label',
                    style: { display: 'block', fontSize: '14px', fontWeight: '500', color: '#778DA9', marginBottom: '4px' }
                }, t('generator_api_key')),
                React.createElement('input', {
                    key: 'input',
                    type: 'password',
                    value: apiKey,
                    onChange: (e) => setApiKey(e.target.value),
                    style: {
                        width: '100%',
                        background: '#0D1B2A',
                        border: '1px solid #415A77',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: '#E0E1DD',
                        outline: 'none'
                    },
                    placeholder: t('generator_api_key_placeholder'),
                    disabled: isUIBlocked
                })
            ]),
            
            // Syllabus upload
            React.createElement('div', { key: 'syllabus' }, [
                React.createElement('label', { 
                    key: 'label',
                    style: { display: 'block', fontSize: '14px', fontWeight: '500', color: '#778DA9', marginBottom: '4px' }
                }, t('generator_syllabus_upload')),
                React.createElement('div', {
                    key: 'upload-container',
                    style: { display: 'flex', alignItems: 'center', gap: '8px' }
                }, [
                    React.createElement('label', {
                        key: 'upload-label',
                        htmlFor: 'syllabus-upload',
                        style: {
                            flexGrow: 1,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            background: '#415A77',
                            color: 'white',
                            fontWeight: 'bold',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: isUIBlocked ? 'not-allowed' : 'pointer',
                            opacity: isUIBlocked ? 0.5 : 1,
                            transition: 'background-color 0.3s'
                        }
                    }, [
                        React.createElement(DocumentTextIcon, { 
                            key: 'icon',
                            style: { height: '20px', width: '20px' } 
                        }),
                        syllabusFileName || t('generator_syllabus_upload_button')
                    ]),
                    React.createElement('input', {
                        key: 'file-input',
                        ref: syllabusInputRef,
                        id: 'syllabus-upload',
                        type: 'file',
                        style: { position: 'absolute', left: '-9999px' },
                        accept: '.txt',
                        onChange: handleSyllabusFileChange,
                        disabled: isUIBlocked
                    }),
                    syllabusFileName && React.createElement('button', {
                        key: 'clear-button',
                        onClick: clearSyllabus,
                        style: {
                            fontSize: '14px',
                            fontWeight: '600',
                            background: '#EF4444',
                            color: 'white',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'background-color 0.3s'
                        },
                        disabled: isUIBlocked
                    }, t('generator_syllabus_clear'))
                ])
            ]),
            
            // Block and Topic fields
            React.createElement('div', {
                key: 'block-topic',
                style: { 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                    gap: '16px' 
                }
            }, [
                React.createElement('div', { key: 'block' }, [
                    React.createElement('label', { 
                        key: 'label',
                        style: { display: 'block', fontSize: '14px', fontWeight: '500', color: '#778DA9', marginBottom: '4px' }
                    }, t('generator_block')),
                    React.createElement(Combobox, {
                        key: 'combobox',
                        options: blockOptions,
                        value: blockName,
                        onChange: setBlockName,
                        placeholder: t('generator_block_placeholder'),
                        disabled: isUIBlocked
                    })
                ]),
                React.createElement('div', { key: 'topic' }, [
                    React.createElement('label', { 
                        key: 'label',
                        style: { display: 'block', fontSize: '14px', fontWeight: '500', color: '#778DA9', marginBottom: '4px' }
                    }, t('generator_topic')),
                    React.createElement(Combobox, {
                        key: 'combobox',
                        options: availableTopics,
                        value: topicName,
                        onChange: setTopicName,
                        placeholder: t('generator_topic_placeholder'),
                        disabled: !blockName.trim() || isUIBlocked
                    })
                ])
            ]),
            
            // Block visibility for new blocks
            isNewBlock && currentUser && React.createElement('div', {
                key: 'block-visibility',
                style: {
                    background: '#0D1B2A',
                    padding: '12px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }
            }, [
                React.createElement('label', {
                    key: 'label',
                    style: { fontSize: '14px', fontWeight: '500', color: '#778DA9' }
                }, t('block_type') + ':'),
                React.createElement('div', {
                    key: 'radio-group',
                    style: { display: 'flex', alignItems: 'center', gap: '16px', color: '#E0E1DD' }
                }, [
                    React.createElement('label', {
                        key: 'public',
                        style: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }
                    }, [
                        React.createElement('input', {
                            key: 'radio',
                            type: 'radio',
                            name: 'block-visibility-gen',
                            checked: isPublic,
                            onChange: () => setIsPublic(true),
                            style: { height: '16px', width: '16px' }
                        }),
                        t('block_public')
                    ]),
                    React.createElement('label', {
                        key: 'private',
                        style: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }
                    }, [
                        React.createElement('input', {
                            key: 'radio',
                            type: 'radio',
                            name: 'block-visibility-gen',
                            checked: !isPublic,
                            onChange: () => setIsPublic(false),
                            style: { height: '16px', width: '16px' }
                        }),
                        t('block_private')
                    ])
                ])
            ]),
            
            // Observations for new blocks
            isNewBlock && React.createElement('div', { key: 'observations' }, [
                React.createElement('label', { 
                    key: 'label',
                    style: { display: 'block', fontSize: '14px', fontWeight: '500', color: '#778DA9', marginBottom: '4px' }
                }, t('generator_observations')),
                React.createElement('textarea', {
                    key: 'textarea',
                    value: observaciones,
                    onChange: (e) => setObservaciones(e.target.value),
                    style: {
                        width: '100%',
                        background: '#0D1B2A',
                        border: '1px solid #415A77',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: '#E0E1DD',
                        outline: 'none',
                        resize: 'none'
                    },
                    placeholder: t('generator_observations_placeholder'),
                    rows: 3,
                    disabled: isUIBlocked
                })
            ]),
            
            // Question count and difficulty
            React.createElement('div', {
                key: 'count-difficulty',
                style: { 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '24px', 
                    alignItems: 'end' 
                }
            }, [
                React.createElement('div', { key: 'count' }, [
                    React.createElement('label', { 
                        key: 'label',
                        style: { display: 'block', fontSize: '14px', fontWeight: '500', color: '#778DA9', marginBottom: '4px' }
                    }, t('generator_questions')),
                    React.createElement('input', {
                        key: 'input',
                        type: 'number',
                        value: questionCount,
                        onChange: (e) => setQuestionCount(Math.max(1, parseInt(e.target.value, 10) || 1)),
                        style: {
                            width: '100%',
                            background: '#0D1B2A',
                            border: '1px solid #415A77',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            color: '#E0E1DD',
                            outline: 'none'
                        },
                        disabled: isUIBlocked
                    })
                ]),
                React.createElement('div', { key: 'difficulty' }, [
                    React.createElement('label', { 
                        key: 'label',
                        style: { display: 'block', fontSize: '14px', fontWeight: '500', color: '#778DA9', marginBottom: '4px' }
                    }, `${t('generator_difficulty')} (${difficulty}/5)`),
                    React.createElement('input', {
                        key: 'range',
                        type: 'range',
                        min: '1',
                        max: '5',
                        value: difficulty,
                        onChange: (e) => setDifficulty(parseInt(e.target.value, 10)),
                        style: { width: '100%' },
                        disabled: isUIBlocked || difficultyRange.size > 0
                    })
                ])
            ]),
            
            // Difficulty range
            React.createElement('div', { key: 'difficulty-range' }, [
                React.createElement('label', { 
                    key: 'label',
                    style: { display: 'block', fontSize: '14px', fontWeight: '500', color: '#778DA9', marginBottom: '8px' }
                }, t('generator_difficulty_range')),
                React.createElement('div', {
                    key: 'checkboxes',
                    style: {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-around',
                        background: '#0D1B2A',
                        padding: '8px',
                        borderRadius: '8px'
                    }
                }, [1, 2, 3, 4, 5].map(level => 
                    React.createElement('label', {
                        key: level,
                        style: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#E0E1DD' }
                    }, [
                        React.createElement('input', {
                            key: 'checkbox',
                            type: 'checkbox',
                            checked: difficultyRange.has(level),
                            onChange: () => handleDifficultyRangeChange(level),
                            disabled: isUIBlocked,
                            style: { height: '16px', width: '16px' }
                        }),
                        level.toString()
                    ])
                ))
            ]),
            
            // Generate button
            React.createElement('button', {
                key: 'generate-btn',
                onClick: handleGenerate,
                disabled: !blockName.trim() || !topicName.trim() || isUIBlocked,
                style: {
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: (!blockName.trim() || !topicName.trim() || isUIBlocked) ? '#415A77' : '#3B82F6',
                    color: 'white',
                    fontWeight: 'bold',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: (!blockName.trim() || !topicName.trim() || isUIBlocked) ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.3s'
                }
            }, isLoading ? [
                React.createElement('svg', {
                    key: 'spinner',
                    style: { animation: 'spin 1s linear infinite', marginLeft: '-4px', marginRight: '12px', height: '20px', width: '20px' },
                    xmlns: "http://www.w3.org/2000/svg",
                    fill: "none",
                    viewBox: "0 0 24 24"
                }, [
                    React.createElement('circle', {
                        key: 'circle1',
                        style: { opacity: 0.25 },
                        cx: "12",
                        cy: "12",
                        r: "10",
                        stroke: "currentColor",
                        strokeWidth: "4"
                    }),
                    React.createElement('path', {
                        key: 'path1',
                        style: { opacity: 0.75 },
                        fill: "currentColor",
                        d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    })
                ]),
                t('generator_button_generating')
            ] : t('generator_button_generate')),
            
            // Error message
            error && React.createElement('p', {
                key: 'error',
                style: { fontSize: '14px', color: '#EF4444', textAlign: 'center' }
            }, error)
        ]),
        
        // Generated questions display
        generatedQuestions.length > 0 && React.createElement('div', {
            key: 'results',
            style: { marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }
        }, [
            React.createElement('h4', {
                key: 'results-title',
                style: { fontSize: '18px', fontWeight: '600', color: '#E0E1DD' }
            }, t('generator_generated_questions')),
            
            ...generatedQuestions.map((q, qIndex) => 
                React.createElement('div', {
                    key: q.id || qIndex,
                    style: {
                        background: '#0D1B2A',
                        padding: '16px',
                        borderRadius: '8px'
                    }
                }, [
                    React.createElement('p', {
                        key: 'question',
                        style: { fontWeight: '600', marginBottom: '8px' }
                    }, `${qIndex + 1}. ${q.textoPregunta}`),
                    
                    React.createElement('div', {
                        key: 'answers',
                        style: { marginTop: '8px', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }
                    }, q.respuestas.map((r, rIndex) => 
                        React.createElement('div', {
                            key: rIndex,
                            style: { 
                                display: 'flex', 
                                alignItems: 'center', 
                                fontSize: '14px', 
                                color: r.esCorrecta ? '#10B981' : '#778DA9' 
                            }
                        }, [
                            r.esCorrecta 
                                ? React.createElement(CheckCircleIcon, { key: 'icon', style: { height: '16px', width: '16px', marginRight: '8px' } })
                                : React.createElement(XCircleIcon, { key: 'icon', style: { height: '16px', width: '16px', marginRight: '8px' } }),
                            React.createElement('span', { key: 'text' }, r.textoRespuesta)
                        ])
                    )),
                    
                    React.createElement('p', {
                        key: 'explanation',
                        style: { 
                            marginTop: '8px', 
                            fontSize: '12px', 
                            fontStyle: 'italic', 
                            color: '#778DA9', 
                            paddingLeft: '16px', 
                            borderLeft: '2px solid #415A77' 
                        }
                    }, [
                        React.createElement('strong', { key: 'label' }, t('generator_explanation') + ': '),
                        q.explicacionRespuesta
                    ])
                ])
            ),
            
            React.createElement('div', {
                key: 'save-section',
                style: { marginTop: '24px' }
            }, [
                React.createElement('button', {
                    key: 'save-btn',
                    onClick: handleSave,
                    disabled: saveStatus !== 'idle',
                    style: {
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: saveStatus !== 'idle' ? '#415A77' : '#10B981',
                        color: 'white',
                        fontWeight: 'bold',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: saveStatus !== 'idle' ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.3s'
                    }
                }, [
                    React.createElement(SaveIcon, { key: 'icon', style: { height: '20px', width: '20px', marginRight: '8px' } }),
                    React.createElement('span', { key: 'text' }, t('generator_button_save'))
                ]),
                
                saveStatus === 'success' && React.createElement('p', {
                    key: 'success-msg',
                    style: { fontSize: '14px', color: '#10B981', marginTop: '12px', textAlign: 'center', animation: 'pulse 2s infinite' }
                }, saveMessage),
                
                saveStatus === 'error' && React.createElement('p', {
                    key: 'error-msg',
                    style: { fontSize: '14px', color: '#EF4444', marginTop: '12px', textAlign: 'center' }
                }, saveMessage)
            ])
        ])
    ]);
};

// Get current user from session with authentication check
const getCurrentUser = () => {
    try {
        // Check for authentication token first
        const authToken = localStorage.getItem('playtest_auth_token') || localStorage.getItem('authToken');
        if (!authToken) {
            console.warn('🔐 No authentication token found. User may not be logged in.');
            return null; // Return null to indicate no authentication
        }

        const sessionString = localStorage.getItem('playtest_session');
        if (sessionString) {
            const session = JSON.parse(sessionString);
            return {
                id: session.userId,
                nickname: session.nickname || session.username || 'Usuario',
                isAuthenticated: true
            };
        }
    } catch (error) {
        console.error('Error getting current user:', error);
    }
    
    // Check if we at least have a token without session data
    const authToken = localStorage.getItem('playtest_auth_token') || localStorage.getItem('authToken');
    if (authToken) {
        return { id: 1, nickname: 'Usuario', isAuthenticated: true };
    }
    
    return null; // No authentication available
};

// Get blocks data using API service
const getBlocksData = async () => {
    try {
        if (typeof apiDataService !== 'undefined') {
            const blocks = await apiDataService.fetchAllBlocks();
            return blocks.map(block => ({
                ...block,
                nombreCorto: block.name || block.nombreCorto,
                totalPreguntas: block.questionCount || 0,
                questions: block.questions || []
            })).sort((a, b) => (a.nombreCorto || '').localeCompare(b.nombreCorto || ''));
        }
    } catch (error) {
        console.error('Error fetching blocks:', error);
    }
    // Fallback data
    return [
        { id: 1, nombreCorto: 'Matemáticas', creatorId: 1, questions: [{ tema: 'Álgebra' }, { tema: 'Geometría' }] },
        { id: 2, nombreCorto: 'Historia', creatorId: 1, questions: [{ tema: 'Medieval' }, { tema: 'Moderna' }] }
    ];
};

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

// Function to parse question format from file content
const parseQuestions = (content, bloque, tema) => {
    console.log('🔍 Parsing content for:', bloque, '→', tema);
    
    const lines = content.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
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
                    
                    if (!questionText || answerParts.length < 2) continue;
                    
                    const respuestas = answerParts.map(answerText => {
                        const trimmedText = answerText.trim();
                        return {
                            textoRespuesta: trimmedText.startsWith('@@') ? trimmedText.substring(2).trim() : trimmedText,
                            esCorrecta: trimmedText.startsWith('@@')
                        };
                    });
                    
                    if (respuestas.filter(r => r.esCorrecta).length !== 1) continue;
                    
                    let explicacionRespuesta = '';
                    if (i + 1 < lines.length) {
                        const nextLine = lines[i + 1].trim();
                        if (nextLine.length > 0 && !nextLine.includes('##')) {
                            explicacionRespuesta = nextLine;
                            i++; // Skip explanation line in next iteration
                        }
                    }
                    
                    questions.push({
                        bloque,
                        tema,
                        textoPregunta: questionText,
                        respuestas: respuestas,
                        explicacionRespuesta: explicacionRespuesta
                    });
                }
            }
        }
    } else {
        // FORMATO 2: Standard format with question patterns
        console.log('🎯 Detected standard format (question patterns)');
        
        let currentQuestion = '';
        let currentAnswers = [];
        let currentExplanation = '';
        
        const questionPatterns = [
            /^\d+[.)]\s*(.+)$/,
            /^Q\d*[.:]\s*(.+)$/i,
            /^Question\s*\d*[.:]\s*(.+)$/i,
            /^Pregunta\s*\d*[.:]\s*(.+)$/i
        ];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
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
                }
            }
            // Multi-line questions
            else if (currentQuestion && !currentAnswers.length && line.length > 0) {
                currentQuestion += ' ' + line;
            }
            // Possible explanation (after all answers)
            else if (currentAnswers.length > 0 && line.length > 0) {
                currentExplanation = line;
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

// Enhanced Question Uploader Component with Multiple File Support
const QuestionUploader = ({ currentUser, blocks, onSaveQuestions, onCreateBlock }) => {
    const { t } = useLanguage();
    const [blockName, setBlockName] = useState('');
    const [topicName, setTopicName] = useState('');
    const [files, setFiles] = useState([]);
    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');
    const [processedQuestions, setProcessedQuestions] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Batch upload states
    const [fileQueue, setFileQueue] = useState([]);
    const [isBatchModeActive, setIsBatchModeActive] = useState(false);
    const [selectedBatchFiles, setSelectedBatchFiles] = useState(new Set());
    const [batchIsPublic, setBatchIsPublic] = useState(true);
    const [reviewedQuestions, setReviewedQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const blockOptions = blocks.map(b => ({ id: b.id, label: b.nombreCorto || b.name || '' }));

    const resetFullState = useCallback(() => {
        setBlockName('');
        setTopicName('');
        setFiles([]);
        setReviewedQuestions([]);
        setStatus('idle');
        setMessage('');
        setIsLoading(false);
        setFileQueue([]);
        setIsBatchModeActive(false);
        setSelectedBatchFiles(new Set());
        setProcessedQuestions([]);
    }, []);

    const handleFileChange = (event) => {
        const selectedFiles = Array.from(event.target.files);
        setFiles(selectedFiles);
        
        // Auto-fill block and topic from first file if available
        if (selectedFiles.length > 0) {
            const firstFile = selectedFiles[0];
            const parsed = parseFilename(firstFile.name);
            
            if (parsed.bloque && parsed.tema) {
                setBlockName(parsed.bloque);
                setTopicName(parsed.tema);
            }
        }
    };

    const handleFolderSelect = (event) => {
        if (event.target.files) {
            resetFullState();
            const files = Array.from(event.target.files);
            const fileRegex = /^([^_]+)_([^_.]+)\.txt$/i;
            const newQueue = files.map(file => {
                const match = file.name.match(fileRegex);
                if (match) {
                    const blockName = match[1].replace(/-/g, ' ').trim();
                    const topicName = match[2].replace(/-/g, ' ').trim();
                    
                    if (!blockName || !topicName) {
                        console.error(`🚨 Invalid filename format for ${file.name}`);
                        return null;
                    }
                    
                    const fileInfo = { file, blockName, topicName };
                    console.log(`📂 ✅ VALIDATED file: ${file.name} -> Block: "${fileInfo.blockName}", Topic: "${fileInfo.topicName}"`);
                    return fileInfo;
                }
                return null;
            }).filter(Boolean);

            if (newQueue.length > 0) {
                setFileQueue(newQueue);
                setIsBatchModeActive(true);
            } else {
                setMessage(t('uploader_batch_status_no_files'));
                setStatus('error');
            }
        }
        event.target.value = '';
    };

    const handleBatchFileSelectionChange = (fileName) => {
        setSelectedBatchFiles(prev => {
            const newSet = new Set(prev);
            if (newSet.has(fileName)) newSet.delete(fileName);
            else newSet.add(fileName);
            return newSet;
        });
    };

    const handleLoadSelectedBatchFiles = useCallback(async () => {
        if (selectedBatchFiles.size === 0) return;
        setIsLoading(true);
        setStatus('idle');
        let allParsedQuestions = [];
        const filesToProcess = fileQueue.filter(f => selectedBatchFiles.has(f.file.name));

        try {
            for (const fileInfo of filesToProcess) {
                const text = await fileInfo.file.text();
                if (!text) continue;
                
                console.log(`📄 Processing file: ${fileInfo.file.name} with topic: "${fileInfo.topicName}"`);
                const questions = parseQuestions(text, fileInfo.blockName, fileInfo.topicName);
                allParsedQuestions.push(...questions);
            }
            
            setProcessedQuestions(allParsedQuestions);
            setMessage(`✅ Procesado completamente: ${allParsedQuestions.length} preguntas de ${filesToProcess.length} archivo(s)`);
            setStatus('success');
        } catch (error) {
            console.error('Error processing files:', error);
            setMessage('Error al procesar los archivos');
            setStatus('error');
        } finally {
            setIsLoading(false);
        }
    }, [selectedBatchFiles, fileQueue, t]);

    const handleLoadForReview = () => {
        if (!topicName.trim() || files.length === 0) {
            setMessage(t('uploader_status_generic_error'));
            setStatus('error');
            return;
        }
        
        setIsLoading(true);
        setStatus('idle');
        const file = files[0]; // Single file processing
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (!text) throw new Error("File is empty or could not be read.");
                const parsedQuestions = parseQuestions(text, blockName, topicName.trim());
                if (parsedQuestions.length === 0) throw new Error(t('uploader_status_no_questions'));
                setReviewedQuestions(parsedQuestions);
                setMessage(t('uploader_status_loaded', { count: parsedQuestions.length }));
                setStatus('success');
            } catch (err) {
                setMessage(err.message);
                setStatus('error');
                setReviewedQuestions([]);
            } finally {
                setIsLoading(false);
                setTimeout(() => {
                    setStatus('idle');
                    setMessage('');
                }, 3000);
            }
        };
        
        reader.onerror = () => {
            setMessage(t('uploader_status_read_error'));
            setStatus('error');
            setIsLoading(false);
        };
        
        reader.readAsText(file);
    };

    const handleSaveProcessedQuestions = async () => {
        try {
            if (processedQuestions.length === 0) return;

            const questionsByBlock = processedQuestions.reduce((acc, question) => {
                if (!acc[question.bloque]) {
                    acc[question.bloque] = [];
                }
                acc[question.bloque].push(question);
                return acc;
            }, {});

            for (const [blockName, blockQuestions] of Object.entries(questionsByBlock)) {
                const existingBlock = blocks.find(b => b.nombreCorto?.toLowerCase() === blockName.toLowerCase());
                if (existingBlock) {
                    await onSaveQuestions(existingBlock.id, blockQuestions);
                } else {
                    await onCreateBlock(blockName, blockQuestions, batchIsPublic, '');
                }
            }

            setMessage(`¡Guardado exitoso! ${processedQuestions.length} preguntas procesadas.`);
            setStatus('success');
            setTimeout(resetFullState, 2000);
        } catch (error) {
            console.error('Error saving questions:', error);
            setMessage('Error al guardar las preguntas');
            setStatus('error');
        }
    };

    return React.createElement('div', {
        style: {
            background: '#1B263B',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
            border: '1px solid #415A77'
        }
    }, [
        React.createElement('h3', {
            key: 'title',
            style: { fontSize: '20px', fontWeight: 'bold', color: '#E0E1DD', marginBottom: '16px' }
        }, t('uploader_title')),
        
        React.createElement('div', {
            key: 'content',
            style: { display: 'flex', flexDirection: 'column', gap: '16px' }
        }, [
            // Batch upload section
            React.createElement('div', { key: 'batch-upload' }, [
                React.createElement('label', {
                    key: 'folder-label',
                    htmlFor: 'folder-upload',
                    style: {
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '16px',
                        border: '2px dashed #415A77',
                        borderRadius: '8px',
                        cursor: (isBatchModeActive || isLoading) ? 'not-allowed' : 'pointer',
                        opacity: (isBatchModeActive || isLoading) ? 0.6 : 1,
                        transition: 'all 0.3s ease'
                    }
                }, [
                    React.createElement('svg', {
                        key: 'folder-icon',
                        xmlns: "http://www.w3.org/2000/svg",
                        style: { height: '40px', width: '40px', color: '#778DA9', flexShrink: 0 },
                        fill: "none",
                        viewBox: "0 0 24 24",
                        stroke: "currentColor",
                        strokeWidth: "1.5"
                    }, React.createElement('path', {
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        d: "M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
                    })),
                    React.createElement('div', {
                        key: 'folder-text',
                        style: { textAlign: 'left' }
                    }, [
                        React.createElement('span', {
                            key: 'title',
                            style: { fontWeight: 'bold', color: '#E0E1DD', display: 'block' }
                        }, t('uploader_batch_title')),
                        React.createElement('p', {
                            key: 'description',
                            style: { fontSize: '12px', color: '#778DA9', margin: 0 },
                            dangerouslySetInnerHTML: { __html: t('uploader_batch_explanation') }
                        })
                    ])
                ]),
                React.createElement('input', {
                    key: 'folder-input',
                    id: 'folder-upload',
                    type: 'file',
                    webkitdirectory: "",
                    directory: "",
                    style: { position: 'absolute', left: '-9999px' },
                    onChange: handleFolderSelect,
                    disabled: isBatchModeActive || isLoading
                })
            ]),
            
            // Batch file management
            isBatchModeActive && processedQuestions.length === 0 && React.createElement('div', {
                key: 'batch-management',
                style: {
                    margin: '16px 0',
                    padding: '16px',
                    background: '#0D1B2A',
                    borderRadius: '8px',
                    border: '1px solid #415A77'
                }
            }, [
                React.createElement('div', {
                    key: 'batch-header',
                    style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }
                }, [
                    React.createElement('h4', {
                        key: 'batch-title',
                        style: { fontSize: '18px', fontWeight: '600', color: '#E0E1DD' }
                    }, `${t('uploader_batch_detected_files')} (${fileQueue.length})`),
                    React.createElement('button', {
                        key: 'finish-btn',
                        onClick: resetFullState,
                        style: {
                            fontSize: '12px',
                            fontWeight: '600',
                            background: '#EF4444',
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer'
                        }
                    }, t('uploader_batch_finish'))
                ]),
                
                // Block visibility for batch
                currentUser && React.createElement('div', {
                    key: 'batch-visibility',
                    style: {
                        marginBottom: '16px',
                        background: '#1B263B',
                        padding: '12px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                    }
                }, [
                    React.createElement('label', {
                        key: 'visibility-label',
                        style: { fontSize: '14px', fontWeight: '500', color: '#778DA9' }
                    }, t('block_type') + ':'),
                    React.createElement('div', {
                        key: 'visibility-options',
                        style: { display: 'flex', alignItems: 'center', gap: '16px', color: '#E0E1DD' }
                    }, [
                        React.createElement('label', {
                            key: 'public-option',
                            style: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }
                        }, [
                            React.createElement('input', {
                                key: 'public-radio',
                                type: 'radio',
                                name: 'batch-block-visibility',
                                checked: batchIsPublic,
                                onChange: () => setBatchIsPublic(true),
                                style: { height: '16px', width: '16px' }
                            }),
                            t('block_public')
                        ]),
                        React.createElement('label', {
                            key: 'private-option',
                            style: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }
                        }, [
                            React.createElement('input', {
                                key: 'private-radio',
                                type: 'radio',
                                name: 'batch-block-visibility',
                                checked: !batchIsPublic,
                                onChange: () => setBatchIsPublic(false),
                                style: { height: '16px', width: '16px' }
                            }),
                            t('block_private')
                        ])
                    ])
                ]),
                
                // File list
                fileQueue.length > 0 ? [
                    React.createElement('div', {
                        key: 'file-list',
                        style: { maxHeight: '192px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '8px' }
                    }, fileQueue.map((fileInfo, index) => 
                        React.createElement('label', {
                            key: index,
                            style: {
                                display: 'flex',
                                alignItems: 'center',
                                width: '100%',
                                textAlign: 'left',
                                padding: '8px',
                                borderRadius: '6px',
                                transition: 'background-color 0.3s',
                                fontSize: '14px',
                                background: '#1B263B',
                                color: '#E0E1DD',
                                cursor: 'pointer'
                            }
                        }, [
                            React.createElement('input', {
                                key: 'checkbox',
                                type: 'checkbox',
                                checked: selectedBatchFiles.has(fileInfo.file.name),
                                onChange: () => handleBatchFileSelectionChange(fileInfo.file.name),
                                style: { height: '16px', width: '16px', marginRight: '12px' }
                            }),
                            React.createElement('span', { key: 'filename' }, fileInfo.file.name)
                        ])
                    )),
                    React.createElement('button', {
                        key: 'load-selected-btn',
                        onClick: handleLoadSelectedBatchFiles,
                        disabled: selectedBatchFiles.size === 0 || isLoading,
                        style: {
                            width: '100%',
                            marginTop: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: (selectedBatchFiles.size === 0 || isLoading) ? '#415A77' : '#3B82F6',
                            color: 'white',
                            fontWeight: 'bold',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: (selectedBatchFiles.size === 0 || isLoading) ? 'not-allowed' : 'pointer'
                        }
                    }, isLoading ? t('uploader_parsing') : t('uploader_button_load_selected', { count: selectedBatchFiles.size }))
                ] : React.createElement('div', {
                    key: 'batch-complete',
                    style: { textAlign: 'center', padding: '16px', color: '#778DA9' }
                }, t('uploader_batch_status_complete'))
            ]),
            
            // Single file upload (when not in batch mode)
            !isBatchModeActive && React.createElement('div', {
                key: 'single-upload',
                style: { display: 'flex', flexDirection: 'column', gap: '16px' }
            }, [
                React.createElement('div', {
                    key: 'separator',
                    style: { textAlign: 'center', color: '#778DA9', fontSize: '14px' }
                }, t('uploader_separator')),
                
                React.createElement('div', {
                    key: 'block-topic-fields',
                    style: {
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '16px'
                    }
                }, [
                    React.createElement('div', { key: 'block-field' }, [
                        React.createElement('label', {
                            key: 'block-label',
                            style: { display: 'block', fontSize: '14px', fontWeight: '500', color: '#778DA9', marginBottom: '4px' }
                        }, t('generator_block')),
                        React.createElement(Combobox, {
                            key: 'block-combobox',
                            options: blockOptions,
                            value: blockName,
                            onChange: setBlockName,
                            placeholder: t('generator_block_placeholder')
                        })
                    ]),
                    React.createElement('div', { key: 'topic-field' }, [
                        React.createElement('label', {
                            key: 'topic-label',
                            style: { display: 'block', fontSize: '14px', fontWeight: '500', color: '#778DA9', marginBottom: '4px' }
                        }, t('generator_topic')),
                        React.createElement('input', {
                            key: 'topic-input',
                            type: 'text',
                            value: topicName,
                            onChange: (e) => setTopicName(e.target.value),
                            style: {
                                width: '100%',
                                background: '#0D1B2A',
                                border: '1px solid #415A77',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                color: '#E0E1DD',
                                outline: 'none'
                            },
                            placeholder: t('generator_topic_placeholder')
                        })
                    ])
                ]),
                
                React.createElement('div', { key: 'file-field' }, [
                    React.createElement('label', {
                        key: 'file-label',
                        style: { display: 'block', fontSize: '14px', fontWeight: '500', color: '#778DA9', marginBottom: '4px' }
                    }, t('uploader_file_label')),
                    React.createElement('input', {
                        key: 'file-input',
                        type: 'file',
                        accept: '.txt',
                        multiple: true,
                        onChange: handleFileChange,
                        style: {
                            width: '100%',
                            background: '#0D1B2A',
                            border: '1px solid #415A77',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            color: '#E0E1DD'
                        }
                    })
                ]),
                
                React.createElement('button', {
                    key: 'load-btn',
                    onClick: handleLoadForReview,
                    disabled: files.length === 0 || !topicName.trim(),
                    style: {
                        width: '100%',
                        background: (files.length === 0 || !topicName.trim()) ? '#415A77' : '#3B82F6',
                        color: 'white',
                        fontWeight: 'bold',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: (files.length === 0 || !topicName.trim()) ? 'not-allowed' : 'pointer'
                    }
                }, t('uploader_button_load'))
            ]),
            
            // Display processed questions (batch mode)
            processedQuestions.length > 0 && React.createElement('div', {
                key: 'processed-questions',
                style: {
                    marginTop: '24px',
                    padding: '16px',
                    background: '#0D1B2A',
                    borderRadius: '8px',
                    border: '1px solid #415A77'
                }
            }, [
                React.createElement('h4', {
                    key: 'questions-title',
                    style: { fontSize: '18px', fontWeight: '600', color: '#E0E1DD', marginBottom: '16px' }
                }, `Preguntas procesadas: ${processedQuestions.length}`),
                
                React.createElement('div', {
                    key: 'questions-preview',
                    style: { maxHeight: '300px', overflowY: 'auto', marginBottom: '16px' }
                }, processedQuestions.slice(0, 5).map((question, index) =>
                    React.createElement('div', {
                        key: index,
                        style: {
                            padding: '12px',
                            marginBottom: '8px',
                            background: '#1B263B',
                            borderRadius: '6px',
                            fontSize: '14px'
                        }
                    }, [
                        React.createElement('p', {
                            key: 'question-text',
                            style: { fontWeight: '600', marginBottom: '8px', color: '#E0E1DD' }
                        }, `${index + 1}. ${question.textoPregunta}`),
                        React.createElement('p', {
                            key: 'block-topic',
                            style: { fontSize: '12px', color: '#778DA9' }
                        }, `Bloque: ${question.bloque} | Tema: ${question.tema}`)
                    ])
                )),
                
                processedQuestions.length > 5 && React.createElement('p', {
                    key: 'more-questions',
                    style: { fontSize: '12px', color: '#778DA9', textAlign: 'center', marginBottom: '16px' }
                }, `... y ${processedQuestions.length - 5} preguntas más`),
                
                React.createElement('button', {
                    key: 'save-all-btn',
                    onClick: handleSaveProcessedQuestions,
                    style: {
                        width: '100%',
                        background: '#10B981',
                        color: 'white',
                        fontWeight: 'bold',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer'
                    }
                }, 'Guardar Todas las Preguntas')
            ]),
            
            // Display reviewed questions (single file mode)
            reviewedQuestions.length > 0 && React.createElement('div', {
                key: 'reviewed-questions',
                style: {
                    marginTop: '24px',
                    padding: '16px',
                    background: '#0D1B2A',
                    borderRadius: '8px',
                    border: '1px solid #415A77'
                }
            }, [
                React.createElement('h4', {
                    key: 'reviewed-title',
                    style: { fontSize: '18px', fontWeight: '600', color: '#E0E1DD', marginBottom: '16px' }
                }, t('uploader_review_title', { count: reviewedQuestions.length })),
                
                React.createElement('div', {
                    key: 'reviewed-list',
                    style: { maxHeight: '400px', overflowY: 'auto' }
                }, reviewedQuestions.slice(0, 3).map((question, index) =>
                    React.createElement('div', {
                        key: index,
                        style: {
                            padding: '16px',
                            marginBottom: '12px',
                            background: '#1B263B',
                            borderRadius: '8px',
                            border: '1px solid #415A77'
                        }
                    }, [
                        React.createElement('p', {
                            key: 'question-text',
                            style: { fontWeight: '600', marginBottom: '12px', color: '#E0E1DD' }
                        }, `${index + 1}. ${question.textoPregunta}`),
                        
                        React.createElement('div', {
                            key: 'answers',
                            style: { marginBottom: '8px', paddingLeft: '16px' }
                        }, question.respuestas.map((answer, answerIndex) =>
                            React.createElement('div', {
                                key: answerIndex,
                                style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontSize: '14px',
                                    color: answer.esCorrecta ? '#10B981' : '#778DA9',
                                    marginBottom: '4px'
                                }
                            }, [
                                answer.esCorrecta
                                    ? React.createElement(CheckCircleIcon, { key: 'correct-icon', style: { height: '16px', width: '16px', marginRight: '8px' } })
                                    : React.createElement(XCircleIcon, { key: 'incorrect-icon', style: { height: '16px', width: '16px', marginRight: '8px' } }),
                                React.createElement('span', { key: 'answer-text' }, answer.textoRespuesta)
                            ])
                        )),
                        
                        question.explicacionRespuesta && React.createElement('p', {
                            key: 'explanation',
                            style: {
                                fontSize: '12px',
                                fontStyle: 'italic',
                                color: '#778DA9',
                                paddingLeft: '16px',
                                borderLeft: '2px solid #415A77',
                                marginTop: '8px'
                            }
                        }, `Explicación: ${question.explicacionRespuesta}`)
                    ])
                )),
                
                React.createElement('div', {
                    key: 'save-actions',
                    style: { marginTop: '16px', display: 'flex', gap: '12px' }
                }, [
                    React.createElement('button', {
                        key: 'clear-btn',
                        onClick: () => {
                            setReviewedQuestions([]);
                            setFiles([]);
                            setMessage('');
                            setStatus('idle');
                        },
                        style: {
                            flex: 1,
                            background: '#415A77',
                            color: 'white',
                            fontWeight: 'bold',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer'
                        }
                    }, t('uploader_button_clear')),
                    
                    React.createElement('button', {
                        key: 'save-reviewed-btn',
                        onClick: async () => {
                            try {
                                const existingBlock = blocks.find(b => b.nombreCorto?.toLowerCase() === blockName.toLowerCase());
                                if (existingBlock) {
                                    await onSaveQuestions(existingBlock.id, reviewedQuestions);
                                } else {
                                    await onCreateBlock(blockName.trim(), reviewedQuestions, true, '');
                                }
                                setMessage(`¡Guardado exitoso! ${reviewedQuestions.length} preguntas.`);
                                setStatus('success');
                                setTimeout(() => {
                                    setReviewedQuestions([]);
                                    setFiles([]);
                                    setMessage('');
                                    setStatus('idle');
                                }, 2000);
                            } catch (error) {
                                setMessage('Error al guardar las preguntas');
                                setStatus('error');
                            }
                        },
                        style: {
                            flex: 2,
                            background: '#10B981',
                            color: 'white',
                            fontWeight: 'bold',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer'
                        }
                    }, t('uploader_button_save_all'))
                ])
            ]),
            
            // Status message
            message && React.createElement('p', {
                key: 'status-message',
                style: {
                    fontSize: '14px',
                    color: status === 'error' ? '#EF4444' : '#10B981',
                    textAlign: 'center',
                    marginTop: '12px'
                }
            }, message),
            
            // File format information section
            React.createElement('div', {
                key: 'format-info',
                style: {
                    marginTop: '32px',
                    padding: '20px',
                    background: '#0D1B2A',
                    borderRadius: '10px',
                    border: '1px solid #415A77'
                }
            }, [
                React.createElement('h4', {
                    key: 'info-title',
                    style: { fontSize: '16px', fontWeight: '600', color: '#E0E1DD', marginBottom: '12px', textAlign: 'center' }
                }, t('uploader_format_info_title')),
                
                React.createElement('p', {
                    key: 'info-subtitle',
                    style: { fontSize: '14px', color: '#778DA9', marginBottom: '16px', textAlign: 'center' }
                }, t('uploader_format_info_subtitle')),
                
                React.createElement('div', {
                    key: 'formats-grid',
                    style: {
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '16px',
                        marginBottom: '20px'
                    }
                }, [
                    // Format 1
                    React.createElement('div', {
                        key: 'format-1',
                        style: {
                            background: '#1B263B',
                            padding: '16px',
                            borderRadius: '8px',
                            border: '1px solid #415A77'
                        }
                    }, [
                        React.createElement('h5', {
                            key: 'f1-title',
                            style: { fontSize: '14px', fontWeight: '600', color: '#F59E0B', marginBottom: '8px' }
                        }, t('uploader_format_1_title')),
                        React.createElement('p', {
                            key: 'f1-desc',
                            style: { fontSize: '12px', color: '#778DA9', marginBottom: '8px' }
                        }, t('uploader_format_1_desc')),
                        React.createElement('code', {
                            key: 'f1-example',
                            style: {
                                display: 'block',
                                background: '#415A77',
                                padding: '8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                color: '#E0E1DD',
                                wordBreak: 'break-word'
                            }
                        }, t('uploader_format_1_example'))
                    ]),
                    
                    // Format 2
                    React.createElement('div', {
                        key: 'format-2',
                        style: {
                            background: '#1B263B',
                            padding: '16px',
                            borderRadius: '8px',
                            border: '1px solid #415A77'
                        }
                    }, [
                        React.createElement('h5', {
                            key: 'f2-title',
                            style: { fontSize: '14px', fontWeight: '600', color: '#10B981', marginBottom: '8px' }
                        }, t('uploader_format_2_title')),
                        React.createElement('p', {
                            key: 'f2-desc',
                            style: { fontSize: '12px', color: '#778DA9', marginBottom: '8px' }
                        }, t('uploader_format_2_desc')),
                        React.createElement('pre', {
                            key: 'f2-example',
                            style: {
                                background: '#415A77',
                                padding: '8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                color: '#E0E1DD',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                margin: 0
                            }
                        }, t('uploader_format_2_example'))
                    ])
                ]),
                
                // Filename format
                React.createElement('div', {
                    key: 'filename-info',
                    style: {
                        background: '#1B263B',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid #415A77',
                        textAlign: 'center'
                    }
                }, [
                    React.createElement('h5', {
                        key: 'fn-title',
                        style: { fontSize: '14px', fontWeight: '600', color: '#3B82F6', marginBottom: '8px' }
                    }, t('uploader_filename_title')),
                    React.createElement('p', {
                        key: 'fn-desc',
                        style: { fontSize: '12px', color: '#778DA9', marginBottom: '8px' },
                        dangerouslySetInnerHTML: { __html: t('uploader_filename_desc') }
                    }),
                    React.createElement('code', {
                        key: 'fn-example',
                        style: {
                            display: 'inline-block',
                            background: '#415A77',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            color: '#E0E1DD'
                        }
                    }, t('uploader_filename_example'))
                ])
            ])
        ])
    ]);
};

// Enhanced Manual Question Form Component (simplified version for space)
const ManualQuestionForm = ({ currentUser, blocks, onSaveQuestions, onCreateBlock }) => {
    const { t } = useLanguage();
    const [blockName, setBlockName] = useState('');
    const [topicName, setTopicName] = useState('');
    const [questionText, setQuestionText] = useState('');
    const [answers, setAnswers] = useState([{ text: '', isCorrect: false }, { text: '', isCorrect: false }]);
    const [explanation, setExplanation] = useState('');
    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');

    const addAnswer = () => {
        setAnswers([...answers, { text: '', isCorrect: false }]);
    };

    const removeAnswer = (index) => {
        if (answers.length > 2) {
            setAnswers(answers.filter((_, i) => i !== index));
        }
    };

    const updateAnswer = (index, field, value) => {
        const newAnswers = [...answers];
        if (field === 'isCorrect' && value) {
            // Only one correct answer allowed
            newAnswers.forEach((answer, i) => {
                answer.isCorrect = i === index;
            });
        } else {
            newAnswers[index][field] = value;
        }
        setAnswers(newAnswers);
    };

    const handleSave = () => {
        if (!blockName.trim() || !topicName.trim() || !questionText.trim()) {
            setMessage(t('manual_form_fields_missing'));
            setStatus('error');
            return;
        }
        
        const validAnswers = answers.filter(a => a.text.trim());
        if (validAnswers.length < 2 || !validAnswers.some(a => a.isCorrect)) {
            setMessage(t('manual_form_fields_missing'));
            setStatus('error');
            return;
        }

        const question = {
            id: Date.now(),
            textoPregunta: questionText.trim(),
            respuestas: validAnswers.map(a => ({
                textoRespuesta: a.text.trim(),
                esCorrecta: a.isCorrect
            })),
            explicacionRespuesta: explanation.trim(),
            bloque: blockName.trim(),
            tema: topicName.trim(),
            dificultad: 1
        };

        try {
            const existingBlock = blocks.find(b => b.nombreCorto?.toLowerCase() === blockName.trim().toLowerCase());
            if (existingBlock) {
                onSaveQuestions(existingBlock.id, [question]);
            } else {
                onCreateBlock(blockName.trim(), [question], true, '');
            }
            
            setMessage(t('manual_form_save_success'));
            setStatus('success');
            
            // Reset form
            setTimeout(() => {
                setQuestionText('');
                setAnswers([{ text: '', isCorrect: false }, { text: '', isCorrect: false }]);
                setExplanation('');
                setStatus('idle');
                setMessage('');
            }, 2000);
        } catch (error) {
            setMessage(t('manual_form_error'));
            setStatus('error');
        }
    };

    const blockOptions = blocks.map(b => ({ id: b.id, label: b.nombreCorto || b.name || '' }));

    return React.createElement('div', {
        style: {
            background: '#1B263B',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
            border: '1px solid #415A77'
        }
    }, [
        React.createElement('h3', {
            key: 'title',
            style: { fontSize: '20px', fontWeight: 'bold', color: '#E0E1DD', marginBottom: '16px' }
        }, t('manual_form_title')),
        
        React.createElement('div', {
            key: 'form',
            style: { display: 'flex', flexDirection: 'column', gap: '16px' }
        }, [
            // Block and Topic fields
            React.createElement('div', {
                key: 'block-topic',
                style: { 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                    gap: '16px' 
                }
            }, [
                React.createElement('div', { key: 'block' }, [
                    React.createElement('label', { 
                        key: 'label',
                        style: { display: 'block', fontSize: '14px', fontWeight: '500', color: '#778DA9', marginBottom: '4px' }
                    }, t('generator_block')),
                    React.createElement(Combobox, {
                        key: 'combobox',
                        options: blockOptions,
                        value: blockName,
                        onChange: setBlockName,
                        placeholder: t('generator_block_placeholder')
                    })
                ]),
                React.createElement('div', { key: 'topic' }, [
                    React.createElement('label', { 
                        key: 'label',
                        style: { display: 'block', fontSize: '14px', fontWeight: '500', color: '#778DA9', marginBottom: '4px' }
                    }, t('generator_topic')),
                    React.createElement('input', {
                        key: 'input',
                        type: 'text',
                        value: topicName,
                        onChange: (e) => setTopicName(e.target.value),
                        style: {
                            width: '100%',
                            background: '#0D1B2A',
                            border: '1px solid #415A77',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            color: '#E0E1DD',
                            outline: 'none'
                        },
                        placeholder: t('generator_topic_placeholder')
                    })
                ])
            ]),
            
            // Question text
            React.createElement('div', { key: 'question' }, [
                React.createElement('label', { 
                    key: 'label',
                    style: { display: 'block', fontSize: '14px', fontWeight: '500', color: '#778DA9', marginBottom: '4px' }
                }, t('manual_form_question_text')),
                React.createElement('textarea', {
                    key: 'textarea',
                    value: questionText,
                    onChange: (e) => setQuestionText(e.target.value),
                    style: {
                        width: '100%',
                        background: '#0D1B2A',
                        border: '1px solid #415A77',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: '#E0E1DD',
                        outline: 'none',
                        resize: 'vertical'
                    },
                    rows: 3,
                    placeholder: 'Escribe tu pregunta aquí...'
                })
            ]),
            
            // Answers
            React.createElement('div', { key: 'answers' }, [
                React.createElement('label', { 
                    key: 'label',
                    style: { display: 'block', fontSize: '14px', fontWeight: '500', color: '#778DA9', marginBottom: '8px' }
                }, t('manual_form_answers')),
                React.createElement('div', {
                    key: 'answers-list',
                    style: { display: 'flex', flexDirection: 'column', gap: '8px' }
                }, answers.map((answer, index) => 
                    React.createElement('div', {
                        key: index,
                        style: { display: 'flex', alignItems: 'center', gap: '8px' }
                    }, [
                        React.createElement('input', {
                            key: 'radio',
                            type: 'radio',
                            name: 'correct-answer',
                            checked: answer.isCorrect,
                            onChange: (e) => updateAnswer(index, 'isCorrect', e.target.checked),
                            style: { flexShrink: 0 }
                        }),
                        React.createElement('input', {
                            key: 'text',
                            type: 'text',
                            value: answer.text,
                            onChange: (e) => updateAnswer(index, 'text', e.target.value),
                            style: {
                                flex: 1,
                                background: '#0D1B2A',
                                border: '1px solid #415A77',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                color: '#E0E1DD',
                                outline: 'none'
                            },
                            placeholder: `Respuesta ${index + 1}...`
                        }),
                        answers.length > 2 && React.createElement('button', {
                            key: 'remove',
                            onClick: () => removeAnswer(index),
                            style: {
                                background: '#EF4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                cursor: 'pointer'
                            }
                        }, React.createElement(TrashIcon, { style: { height: '16px', width: '16px' } }))
                    ])
                )),
                React.createElement('button', {
                    key: 'add-answer',
                    onClick: addAnswer,
                    style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: '#415A77',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        alignSelf: 'flex-start'
                    }
                }, [
                    React.createElement(PlusCircleIcon, { key: 'icon', style: { height: '16px', width: '16px' } }),
                    t('manual_form_add_answer')
                ])
            ]),
            
            // Explanation
            React.createElement('div', { key: 'explanation' }, [
                React.createElement('label', { 
                    key: 'label',
                    style: { display: 'block', fontSize: '14px', fontWeight: '500', color: '#778DA9', marginBottom: '4px' }
                }, t('manual_form_explanation')),
                React.createElement('textarea', {
                    key: 'textarea',
                    value: explanation,
                    onChange: (e) => setExplanation(e.target.value),
                    style: {
                        width: '100%',
                        background: '#0D1B2A',
                        border: '1px solid #415A77',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: '#E0E1DD',
                        outline: 'none',
                        resize: 'vertical'
                    },
                    rows: 2,
                    placeholder: 'Explicación opcional...'
                })
            ]),
            
            // Save button
            React.createElement('button', {
                key: 'save-btn',
                onClick: handleSave,
                disabled: status === 'saving',
                style: {
                    width: '100%',
                    background: status === 'saving' ? '#415A77' : '#10B981',
                    color: 'white',
                    fontWeight: 'bold',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: status === 'saving' ? 'not-allowed' : 'pointer'
                }
            }, t('manual_form_add_button')),
            
            message && React.createElement('p', {
                key: 'message',
                style: { 
                    fontSize: '14px', 
                    color: status === 'error' ? '#EF4444' : '#10B981',
                    textAlign: 'center' 
                }
            }, message)
        ])
    ]);
};

// Main Add Questions Application Component
const AddQuestionsApp = () => {
    const [activeTab, setActiveTab] = useState('uploader');
    const [currentUser, setCurrentUser] = useState(null);
    const [blocks, setBlocks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeApp = async () => {
            setCurrentUser(getCurrentUser());
            const blocksData = await getBlocksData();
            setBlocks(blocksData);
            setLoading(false);
        };
        
        initializeApp();
    }, []);

    const handleSaveQuestions = async (blockId, questions) => {
        try {
            if (typeof apiDataService !== 'undefined') {
                for (const question of questions) {
                    // Use Spanish field names like add-question.html (backend expects Spanish)
                    const backendQuestionData = {
                        blockId: blockId,
                        tema: question.tema,
                        textoPregunta: question.textoPregunta,
                        respuestas: question.respuestas,
                        difficulty: question.dificultad || 1,
                        explicacionRespuesta: question.explicacionRespuesta || ''
                    };
                    
                    console.log('🔍 Sending question data to backend:', JSON.stringify(backendQuestionData, null, 2));
                    
                    await apiDataService.createQuestion(backendQuestionData);
                }
            }
            
            // Refresh blocks data
            const updatedBlocks = await getBlocksData();
            setBlocks(updatedBlocks);
            
            console.log('Questions saved successfully');
        } catch (error) {
            console.error('Error saving questions:', error);
            throw error;
        }
    };

    const handleCreateBlock = async (blockName, questions, isPublic, observaciones) => {
        try {
            // Check authentication before attempting API calls
            const currentUser = getCurrentUser();
            if (!currentUser || !currentUser.isAuthenticated) {
                throw new Error('🔐 Debes estar autenticado para crear bloques. Por favor, inicia sesión.');
            }

            if (typeof apiDataService !== 'undefined') {
                const blockData = {
                    name: blockName,
                    description: `${blockName} - Custom block created with questions`,
                    observaciones: observaciones,
                    isPublic: isPublic
                };
                
                const block = await apiDataService.createBlock(blockData);
                
                // Add questions to the new block
                for (const question of questions) {
                    await apiDataService.createQuestion({
                        blockId: block.id,
                        tema: question.tema,
                        textoPregunta: question.textoPregunta,
                        respuestas: question.respuestas,
                        explicacionRespuesta: question.explicacionRespuesta,
                        dificultad: question.dificultad || 1
                    });
                }
            }
            
            // Refresh blocks data
            const updatedBlocks = await getBlocksData();
            setBlocks(updatedBlocks);
            
            console.log('Block created successfully');
        } catch (error) {
            console.error('Error creating block:', error);
            if (error.message.includes('Invalid or expired token') || error.message.includes('403')) {
                throw new Error('🔐 Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
            }
            throw error;
        }
    };

    if (loading) {
        return React.createElement('div', {
            style: {
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '40px',
                color: '#E0E1DD'
            }
        }, 'Cargando...');
    }

    return React.createElement('div', {
        style: {
            width: '100%'
        }
    }, [
        // Tab navigation
        React.createElement('div', {
            key: 'tabs',
            style: {
                display: 'flex',
                background: '#415A77',
                borderRadius: '0',
                overflow: 'hidden',
                marginBottom: '0'
            }
        }, [
            ['uploader', '📁 ' + useLanguage().t('add_question_tab_uploader')],
            ['manual', '✏️ ' + useLanguage().t('add_question_tab_manual')],
            ['generator', '🤖 ' + useLanguage().t('add_question_tab_generator')]
        ].map(([tabId, tabLabel]) =>
            React.createElement('button', {
                key: tabId,
                onClick: () => setActiveTab(tabId),
                style: {
                    flex: 1,
                    padding: '12px 16px',
                    border: 'none',
                    background: activeTab === tabId ? '#1B263B' : 'transparent',
                    color: activeTab === tabId ? '#E0E1DD' : '#778DA9',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                }
            }, tabLabel)
        )),
        
        // Tab content
        React.createElement('div', {
            key: 'content',
            style: {
                background: '#1B263B',
                borderRadius: '0',
                padding: '0'
            }
        }, [
            activeTab === 'uploader' && React.createElement(QuestionUploader, {
                key: 'uploader',
                currentUser: currentUser,
                blocks: blocks,
                onSaveQuestions: handleSaveQuestions,
                onCreateBlock: handleCreateBlock
            }),
            
            activeTab === 'manual' && React.createElement(ManualQuestionForm, {
                key: 'manual',
                currentUser: currentUser,
                blocks: blocks,
                onSaveQuestions: handleSaveQuestions,
                onCreateBlock: handleCreateBlock
            }),
            
            activeTab === 'generator' && React.createElement(QuestionGenerator, {
                key: 'generator',
                currentUser: currentUser,
                blocks: blocks,
                onSaveQuestions: handleSaveQuestions,
                onCreateBlock: handleCreateBlock
            })
        ])
    ]);
};

// Global function to mount the Add Questions application
window.mountAddQuestionsApp = function(containerId) {
    const container = document.getElementById(containerId);
    if (container && typeof ReactDOM !== 'undefined') {
        const root = ReactDOM.createRoot(container);
        root.render(React.createElement(AddQuestionsApp));
        console.log('🎯 Add Questions App mounted successfully in', containerId);
    } else {
        console.error('❌ Failed to mount Add Questions App - container or ReactDOM not found');
    }
};

// Auto-mount if container exists
document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('add-questions-content');
    if (container) {
        window.mountAddQuestionsApp('add-questions-content');
    }
});

console.log('✅ Enhanced Add Questions Module loaded successfully - v1.2.0');