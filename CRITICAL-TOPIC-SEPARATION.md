# 🚨 CRITICAL: Topic Separation Functionality Protection

## NEVER MODIFY WITHOUT EXPLICIT DISCUSSION

This functionality has been problematic in the past and MUST be preserved at all costs.

## How Topic Separation Works

1. **Filename Format**: `BlockName_TopicName.txt`
2. **Parsing**: Regex extracts block and topic from filename
3. **Question Assignment**: Each question gets the topic from the filename
4. **Validation**: Multiple layers prevent topic loss

## Protected Code Sections

### 1. Frontend: `add-question.html` Lines 262-310
```javascript
const saveQuestionsToBlock = async (blockId, questions) => {
    // CRITICAL validation and tema preservation
    tema: question.tema.trim(), // NEVER change this line
}
```

### 2. Frontend: Filename Parsing Lines 572-591
```javascript
const fileRegex = /^([^_]+)_([^_\.]+)\.txt$/i;
// CRITICAL: Topic extraction from filename
```

### 3. Backend: `routes/questions.js` Lines 21-28
```javascript
// CRITICAL: Validate that tema is preserved
if (!tema || tema.trim() === '' || tema === 'General') {
    // NEVER allow empty or 'General' topics
}
```

## Validation Layers

1. **Filename validation**: Ensures proper format
2. **Topic extraction validation**: Validates extracted topic
3. **Parsing validation**: Ensures questions get correct topics
4. **Pre-save validation**: Final check before database
5. **Backend validation**: Server-side protection

## Warning Signs of Breakage

- Console errors with "🚨 CRITICAL"
- All questions showing same topic
- Questions with topic "General"
- Missing topics in database

## If You Must Modify

1. **DISCUSS FIRST** - Never change without explicit approval
2. **Test thoroughly** with multiple file uploads
3. **Verify topics are preserved** in console and database
4. **Run all validation checks**

## Recovery Steps if Broken

1. Check console for "🚨 CRITICAL" errors
2. Verify `question.tema` is not being overwritten
3. Ensure no fallback to 'General' topic
4. Check filename parsing regex
5. Restore from working commit

---
**REMEMBER: This functionality breaking wastes significant development time. Protect it at all costs.**