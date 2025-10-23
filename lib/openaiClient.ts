import { createReadStream } from 'fs';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function uploadFileToOpenAI(filePath: string) {
    const fileStream = createReadStream(filePath);
    const uploadedFile = await openai.files.create({
        file: fileStream,
        purpose: 'user_data',
    });
    return uploadedFile;
}

interface ParsedData {
    full_name?: string;
    email?: string;
    birthdate?: string;
    gender?: string;
    experience?: string | number;
    skills?: string[];
    address?: string;
    position?: string;
}

interface ScoreData {
    fit_score?: number;
    strengths?: string[];
    weaknesses?: string[];
}

export async function parseCVFromOpenAI(fileId: string): Promise<ParsedData> {
    const parseResponse = await openai.responses.create({
        model: 'gpt-4o-mini',
        input: [
        {
            role: 'user',
            content: [
            {
                type: 'input_text',
                text: `Extract the following information from this CV:\n
    - full_name\n- birthdate (YYYY-MM-DD)\n- gender\n- email\n- experience (years)\n- address\n- skills (as array)\n- position (current or desired job position)\n\nReturn JSON only.`,
            },
            {
                type: 'input_file',
                file_id: fileId,
            },
            ],
        },
        ],
    });

    let parsedData: ParsedData = {};
    try {
        const cleanedParseText = parseResponse.output_text?.trim().replace(/```json|```/g, '') || '{}';
        parsedData = JSON.parse(cleanedParseText);
    } catch (e) {
        console.error('Failed to parse parsedData JSON:', e);
        parsedData = {};
    }

    return parsedData;
}

export async function scoreCVFromOpenAI(fileId: string, jobRequirements: string): Promise<ScoreData> {
    const scoreResponse = await openai.responses.create({
        model: 'gpt-4o-mini',
        input: [
        {
            role: 'user',
            content: [
            {
                type: 'input_text',
                text: `Given the job requirements:\n${jobRequirements}\n\nEvaluate the fit of this CV.\nReturn JSON in format:\n{
    "fit_score": number (0-100),
    "strengths": [string],
    "weaknesses": [string]
    }`,
            },
            {
                type: 'input_file',
                file_id: fileId,
            },
            ],
        },
        ],
    });

    let scoreData: ScoreData = {};
    try {
        const cleanedScoreText = scoreResponse.output_text?.trim().replace(/```json|```/g, '') || '{}';
        scoreData = JSON.parse(cleanedScoreText);
        //console.log("scoreData", scoreData);    
    } catch (e) {
        console.error('Failed to parse scoreData JSON:', e);
        scoreData = {};
    }

    return scoreData;
}

export async function deleteOpenAIFile(fileId: string) {
    await openai.files.delete(fileId);
}

// Batch processing functions
export async function uploadMultipleFilesToOpenAI(filePaths: string[]) {
    const uploadPromises = filePaths.map(filePath => uploadFileToOpenAI(filePath));
    return await Promise.all(uploadPromises);
}

// Helper function to extract JSON from OpenAI response
function extractJsonFromResponse(text: string): string {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || 
                     text.match(/\[\s*\{[\s\S]*\}\s*\]/);
    
    if (jsonMatch) {
        return jsonMatch[1] || jsonMatch[0];
    }
    
    // Fallback: find array boundaries
    const arrayStart = text.indexOf('[');
    const arrayEnd = text.lastIndexOf(']');
    if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
        return text.substring(arrayStart, arrayEnd + 1);
    }
    
    return text;
}

// Helper function to build prompt text
function buildPromptText(jobRequirements?: string): string {
    const baseFields = [
        'full_name', 'birthdate (YYYY-MM-DD)', 'gender', 'email', 
        'experience (years)', 'address', 'skills (as array)', 
        'position (current or desired job position)'
    ];
    
    let prompt = `Extract the following information from each CV file:\n${baseFields.map(field => `- ${field}`).join('\n')}`;
    
    if (jobRequirements) {
        prompt += `\n\nAdditionally, evaluate the fit of each CV against these job requirements:\n${jobRequirements}\n\nFor each CV, provide a fit score (0-100), strengths, and weaknesses.`;
    }
    
    const format = jobRequirements 
        ? '[{"parsed": {...}, "score": {"fit_score": number, "strengths": [string], "weaknesses": [string]}}]'
        : '[{"parsed": {...}}]';
    
    return `${prompt}\n\nReturn ONLY a valid JSON array with one object per CV file, in the same order as provided.\nNo explanatory text, markdown, or code blocks.\nFormat: ${format}`;
}

// Combined function to parse and score CVs in a single API call
export async function parseAndScoreMultipleCVsFromOpenAI(
    fileIds: string[], 
    jobRequirements?: string
): Promise<{ parsedData: ParsedData[]; scoreData: ScoreData[] }> {
    const fileInputs = fileIds.map(fileId => ({
        type: 'input_file' as const,
        file_id: fileId,
    }));

    const promptText = buildPromptText(jobRequirements);

    const response = await openai.responses.create({
        model: 'gpt-4o-mini',
        input: [{
            role: 'user',
            content: [
                { type: 'input_text', text: promptText },
                ...fileInputs,
            ],
        }],
    });

    const parsedDataArray: ParsedData[] = [];
    const scoreDataArray: ScoreData[] = [];

    try {
        const rawText = response.output_text?.trim() || '[]';
        console.log('Raw combined response:', rawText);
        
        const cleanedText = extractJsonFromResponse(rawText);
        console.log('Cleaned JSON text:', cleanedText);
        
        const responseArray = JSON.parse(cleanedText);
        console.log('Parsed combined response:', responseArray);
        
        const dataArray = Array.isArray(responseArray) ? responseArray : [responseArray];
        
        // Process each item in the response
        dataArray.forEach((item, index) => {
            const hasScore = jobRequirements && item.parsed && item.score;
            const hasDirectParsed = !jobRequirements && item.parsed;
            
            if (hasScore) {
                parsedDataArray[index] = item.parsed;
                scoreDataArray[index] = item.score;
            } else if (hasDirectParsed) {
                parsedDataArray[index] = item.parsed;
                scoreDataArray[index] = {};
            } else {
                // Fallback for direct format
                parsedDataArray[index] = item;
                scoreDataArray[index] = {};
            }
        });
        
        // Ensure arrays match fileIds length
        const targetLength = fileIds.length;
        while (parsedDataArray.length < targetLength) {
            parsedDataArray.push({});
            scoreDataArray.push({});
        }
    } catch (error) {
        console.error('Failed to parse combined response JSON:', error);
        console.error('Raw response:', response.output_text);
        
        // Return empty arrays matching file count
        return {
            parsedData: fileIds.map(() => ({})),
            scoreData: fileIds.map(() => ({}))
        };
    }

    return { parsedData: parsedDataArray, scoreData: scoreDataArray };
}

// Keep individual functions for backward compatibility
export async function parseMultipleCVsFromOpenAI(fileIds: string[]): Promise<ParsedData[]> {
    const result = await parseAndScoreMultipleCVsFromOpenAI(fileIds);
    return result.parsedData;
}

export async function scoreMultipleCVsFromOpenAI(fileIds: string[], jobRequirements: string): Promise<ScoreData[]> {
    const result = await parseAndScoreMultipleCVsFromOpenAI(fileIds, jobRequirements);
    return result.scoreData;
}

export async function deleteMultipleOpenAIFiles(fileIds: string[]) {
    const deletePromises = fileIds.map(fileId => deleteOpenAIFile(fileId));
    await Promise.all(deletePromises);
}

// Convenience function to process multiple CVs end-to-end
export async function processMultipleCVs(filePaths: string[], jobRequirements?: string) {
    try {
        // Upload all files
        const uploadedFiles = await uploadMultipleFilesToOpenAI(filePaths);
        const fileIds = uploadedFiles.map(file => file.id);
        
        // Parse and score all CVs in a single request
        console.log('Starting combined parse and score with job requirements:', jobRequirements);
        const { parsedData: parsedDataArray, scoreData: scoreDataArray } = 
            await parseAndScoreMultipleCVsFromOpenAI(fileIds, jobRequirements);
        console.log('Combined processing completed, parsed:', parsedDataArray, 'scores:', scoreDataArray);
        
        // Clean up uploaded files
        await deleteMultipleOpenAIFiles(fileIds);
        
        // Combine results
        const results = parsedDataArray.map((parsedData, index) => ({
            filePath: filePaths[index],
            parsedData,
            scoreData: scoreDataArray[index] || {},
        }));
        
        return results;
    } catch (error) {
        console.error('Error processing multiple CVs:', error);
        throw error;
    }
}