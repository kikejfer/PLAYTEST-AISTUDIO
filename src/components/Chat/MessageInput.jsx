import React, { useState, useRef, useEffect } from 'react';

/**
 * Componente de input para enviar mensajes
 */
const MessageInput = ({
    conversationId,
    onSend,
    onTypingStart,
    onTypingStop,
    placeholder = 'Escribe un mensaje...',
    maxLength = 5000
}) => {
    const [messageText, setMessageText] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [error, setError] = useState(null);

    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
        }
    }, [messageText]);

    // Limpiar typing indicator al desmontar
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            if (isTyping && onTypingStop) {
                onTypingStop();
            }
        };
    }, [isTyping, onTypingStop]);

    // Manejar cambio de texto
    const handleTextChange = (e) => {
        const newText = e.target.value;
        setMessageText(newText);

        // Indicador de escritura
        if (newText.trim() && !isTyping) {
            setIsTyping(true);
            if (onTypingStart) onTypingStart();
        }

        // Reset typing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            if (onTypingStop) onTypingStop();
        }, 2000);
    };

    // Manejar selección de archivos
    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        const maxSize = 10 * 1024 * 1024; // 10MB
        const maxFiles = 5;

        // Validar número de archivos
        if (attachments.length + files.length > maxFiles) {
            setError(`Máximo ${maxFiles} archivos permitidos`);
            return;
        }

        // Validar tamaño de archivos
        const oversizedFiles = files.filter(file => file.size > maxSize);
        if (oversizedFiles.length > 0) {
            setError('Algunos archivos exceden el tamaño máximo de 10MB');
            return;
        }

        setAttachments(prev => [...prev, ...files]);
        setError(null);

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Remover adjunto
    const handleRemoveAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    // Enviar mensaje
    const handleSend = async (e) => {
        e?.preventDefault();

        const text = messageText.trim();

        if (!text && attachments.length === 0) {
            return;
        }

        if (text.length > maxLength) {
            setError(`El mensaje no puede exceder ${maxLength} caracteres`);
            return;
        }

        setIsSending(true);
        setError(null);

        try {
            await onSend(text, attachments);

            // Limpiar
            setMessageText('');
            setAttachments([]);

            // Stop typing indicator
            if (isTyping) {
                setIsTyping(false);
                if (onTypingStop) onTypingStop();
            }

            // Focus back to textarea
            textareaRef.current?.focus();

        } catch (error) {
            console.error('Error enviando mensaje:', error);
            setError(error.message || 'Error al enviar el mensaje');
        } finally {
            setIsSending(false);
        }
    };

    // Manejar tecla Enter
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Formatear tamaño de archivo
    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="message-input-container">
            {/* Error message */}
            {error && (
                <div className="message-input-error">
                    <span>{error}</span>
                    <button onClick={() => setError(null)}>✕</button>
                </div>
            )}

            {/* Adjuntos seleccionados */}
            {attachments.length > 0 && (
                <div className="message-attachments-preview">
                    {attachments.map((file, index) => (
                        <div key={index} className="attachment-preview">
                            <div className="attachment-info">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                    <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
                                </svg>
                                <span className="attachment-name">{file.name}</span>
                                <span className="attachment-size">{formatFileSize(file.size)}</span>
                            </div>
                            <button
                                type="button"
                                className="remove-attachment-btn"
                                onClick={() => handleRemoveAttachment(index)}
                                aria-label="Eliminar archivo"
                            >
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Input area */}
            <form className="message-input-form" onSubmit={handleSend}>
                <div className="message-input-wrapper">
                    {/* Botón adjuntar */}
                    <button
                        type="button"
                        className="message-input-btn attach-btn"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSending}
                        aria-label="Adjuntar archivo"
                        title="Adjuntar archivo"
                    >
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                            <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
                        </svg>
                    </button>

                    {/* Textarea */}
                    <textarea
                        ref={textareaRef}
                        className="message-input-textarea"
                        placeholder={placeholder}
                        value={messageText}
                        onChange={handleTextChange}
                        onKeyDown={handleKeyDown}
                        disabled={isSending}
                        rows={1}
                        maxLength={maxLength}
                    />

                    {/* Botón enviar */}
                    <button
                        type="submit"
                        className="message-input-btn send-btn"
                        disabled={isSending || (!messageText.trim() && attachments.length === 0)}
                        aria-label="Enviar mensaje"
                        title="Enviar mensaje"
                    >
                        {isSending ? (
                            <div className="spinner-small"></div>
                        ) : (
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                            </svg>
                        )}
                    </button>
                </div>

                {/* Contador de caracteres */}
                {messageText.length > maxLength * 0.9 && (
                    <div className="message-input-counter">
                        {messageText.length} / {maxLength}
                    </div>
                )}

                {/* Input de archivos oculto */}
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />
            </form>

            {/* Ayuda */}
            <div className="message-input-hint">
                <span>Presiona Enter para enviar, Shift+Enter para nueva línea</span>
            </div>
        </div>
    );
};

export default MessageInput;
