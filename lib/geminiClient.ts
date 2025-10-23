import { GoogleGenerativeAI } from '@google/generative-ai';
import { createReadStream, readFileSync } from 'fs';
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

interface ParsedData {
    full_name?: string;
    email?: string;
    birthdate?: string;
    gender?: string;
    experience?: string | number;
    skills?: string[];
    address?: string;
    position?: string;
    cv_summary?: string;  // Added for CV summary
}

interface ScoreData {
    fit_score?: number;
    strengths?: string[];
    weaknesses?: string[];
    evaluation?: string;  // Detailed evaluation explaining the score
}

// Helper function to convert file to Gemini format
async function fileToGenerativePart(filePath: string) {
    const fileBuffer = readFileSync(filePath);
    const mimeType = getMimeType(filePath);
    
    return {
        inlineData: {
            data: fileBuffer.toString('base64'),
            mimeType: mimeType,
        },
    };
}

function getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case '.pdf':
            return 'application/pdf';
        case '.doc':
            return 'application/msword';
        case '.docx':
            return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        case '.txt':
            return 'text/plain';
        default:
            return 'application/pdf'; // Default to PDF
    }
}

// COMMENTED OUT - Not used anywhere in codebase
/*
export async function parseCVFromGemini(filePath: string): Promise<ParsedData> {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
        
        const filePart = await fileToGenerativePart(filePath);
        
        const prompt = `Analyze this CV and extract the following information:
1. Personal Information:
   - full_name
   - birthdate (YYYY-MM-DD)
   - gender
   - email
   - address

2. Professional Information:
   - experience (years, convert to number if possible)
   - skills (as array, include proficiency levels if mentioned)
   - position (current or desired job position)
   - education (highest degree and institution)
   - certifications (if any)

3. Summary:
   - Generate a concise professional summary (2-3 sentences) highlighting key qualifications and experience

Return ONLY valid JSON in this exact format:
{
    "full_name": "string",
    "email": "string",
    "birthdate": "YYYY-MM-DD",
    "gender": "string",
    "experience": "string or number",
    "skills": ["skill1 (proficiency)", "skill2 (proficiency)"],
    "address": "string",
    "position": "string",
    "cv_summary": "string"
}`;

        const result = await model.generateContent([prompt, filePart]);
        const response = await result.response;
        const text = response.text();
        
        let parsedData: ParsedData = {};
        try {
            const cleanedText = text.trim().replace(/```json|```/g, '');
            parsedData = JSON.parse(cleanedText);
        } catch (e) {
            console.error('Failed to parse CV data JSON:', e);
            console.error('Raw response:', text);
            parsedData = {};
        }
        
        return parsedData;
    } catch (error) {
        console.error('Error parsing CV with Gemini:', error);
        return {};
    }
}
*/

// COMMENTED OUT - Not used anywhere in codebase
/*
export async function scoreCVFromGemini(filePath: string, jobRequirements: string): Promise<ScoreData> {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
        
        const filePart = await fileToGenerativePart(filePath);
        
        const prompt = `You are an expert recruiter evaluating a candidate's CV against the following job requirements:
${jobRequirements}

Please provide a detailed evaluation including:
1. A fit score from 0-100 based on how well the candidate matches the requirements
2. 3-5 key strengths that make them a good fit
3. 3-5 areas of concern or missing qualifications
4. A detailed evaluation explaining your reasoning for the score

Return ONLY valid JSON in this exact format:
{
    "fit_score": number (0-100),
    "strengths": ["strength1", "strength2", "strength3"],
    "weaknesses": ["weakness1", "weakness2", "weakness3"],
    "evaluation": "Detailed evaluation explaining the score and overall fit. This should be 2-3 paragraphs analyzing the candidate's qualifications, experience, and skills in relation to the job requirements. Highlight specific matches and gaps, and provide context for the score."
}

Scoring Guidelines:
- 90-100: Exceptional match, exceeds all requirements
- 80-89: Strong match, meets all key requirements and some preferred
- 70-79: Good match, meets most key requirements
- 60-69: Partial match, some key requirements met
- Below 60: Poor match, major requirements missing`;

        const result = await model.generateContent([prompt, filePart]);
        const response = await result.response;
        const text = response.text();
        
        let scoreData: ScoreData = {};
        try {
            const cleanedText = text.trim().replace(/```json|```/g, '');
            scoreData = JSON.parse(cleanedText);
        } catch (e) {
            console.error('Failed to parse score data JSON:', e);
            console.error('Raw response:', text);
            scoreData = {};
        }
        
        return scoreData;
    } catch (error) {
        console.error('Error scoring CV with Gemini:', error);
        return {};
    }
}
*/

// COMMENTED OUT - Not used anywhere in codebase
/*
// Batch processing functions
export async function parseMultipleCVsFromGemini(filePaths: string[]): Promise<ParsedData[]> {
    const parsePromises = filePaths.map(filePath => parseCVFromGemini(filePath));
    return await Promise.all(parsePromises);
}

export async function scoreMultipleCVsFromGemini(filePaths: string[], jobRequirements: string): Promise<ScoreData[]> {
    const scorePromises = filePaths.map(filePath => scoreCVFromGemini(filePath, jobRequirements));
    return await Promise.all(scorePromises);
}
*/

// COMMENTED OUT - Not used anywhere in codebase
/*
export async function parseAndScoreMultipleCVsFromGemini(
    filePaths: string[], 
    jobRequirements?: string
): Promise<{ parsedData: ParsedData[]; scoreData: ScoreData[] }> {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
        
        // Convert all files to Gemini format
        const fileParts = await Promise.all(filePaths.map(filePath => fileToGenerativePart(filePath)));
        
        const baseFields = [
            'full_name', 'birthdate (YYYY-MM-DD)', 'gender', 'email', 
            'experience (years)', 'address', 'skills (as array)', 
            'position (current or desired job position)'
        ];
        
        let prompt = `Hãy trích xuất thông tin từ CV bằng tiếng Việt. Đảm bảo tất cả các phản hồi đều bằng tiếng Việt.

Yêu cầu trích xuất thông tin sau từ CV:
${baseFields.map(field => `- ${field}`).join('\n')}
- cv_summary: Tóm tắt ngắn gọn 2-3 câu về trình độ chuyên môn và kinh nghiệm của ứng viên`;
        
        if (jobRequirements) {
            prompt += `\n\nĐánh giá mức độ phù hợp của ứng viên dựa trên yêu cầu công việc sau:\n${jobRequirements}\n\nVới mỗi CV, hãy cung cấp:\n1. fit_score (0-100) dựa trên mức độ phù hợp với yêu cầu công việc\n2. strengths: 3-5 điểm mạnh chính khiến ứng viên phù hợp\n3. weaknesses: 3-5 điểm yếu hoặc thiếu sót so với yêu cầu\n4. evaluation: Đánh giá chi tiết (2-3 đoạn) giải thích lý do cho điểm số`;
        }
        
        const format = jobRequirements 
            ? '[{"parsed": {...}, "score": {"fit_score": number, "strengths": [string], "weaknesses": [string], "evaluation": string}}]'
            : '[{"parsed": {...}}]';
        
        prompt += `\n\nCHỈ trả về một mảng JSON hợp lệ với mỗi đối tượng tương ứng với một file CV, theo đúng thứ tự.\nKhông thêm bất kỳ văn bản giải thích, markdown hay khối code nào khác.\nĐịnh dạng: ${format}\n\nLưu ý: Tất cả các trường văn bản phải được viết bằng tiếng Việt.`;

        const result = await model.generateContent([prompt, ...fileParts]);
        const response = await result.response;
        const text = response.text();
        
        // Log raw response for debugging
        console.log('Raw Gemini response:', text);
        
        const parsedDataArray: ParsedData[] = [];
        const scoreDataArray: ScoreData[] = [];

        try {
            const cleanedText = text.trim().replace(/```json|```/g, '');
            console.log('Cleaned response text:', cleanedText);
            
            const responseArray = JSON.parse(cleanedText);
            console.log('Parsed response array:', JSON.stringify(responseArray, null, 2));
            
            const dataArray = Array.isArray(responseArray) ? responseArray : [responseArray];
            
            // Process each item in the response
            dataArray.forEach((item, index) => {
                console.log(`Processing item ${index}:`, JSON.stringify(item, null, 2));
                
                const hasScore = jobRequirements && item.parsed && item.score;
                const hasDirectParsed = !jobRequirements && item.parsed;
                
                if (hasScore) {
                    console.log('Item has score data');
                    parsedDataArray[index] = {
                        ...item.parsed,
                        cv_summary: item.parsed.cv_summary || item.parsed.summary || null
                    };
                    scoreDataArray[index] = {
                        ...item.score,
                        evaluation: item.score.evaluation || null
                    };
                } else if (hasDirectParsed) {
                    console.log('Item has direct parsed data');
                    parsedDataArray[index] = {
                        ...item.parsed,
                        cv_summary: item.parsed.cv_summary || item.parsed.summary || null
                    };
                    scoreDataArray[index] = {};
                } else {
                    console.log('Item has direct format');
                    parsedDataArray[index] = {
                        ...item,
                        cv_summary: item.cv_summary || item.summary || null
                    };
                    scoreDataArray[index] = {};
                }
            });
            
            // Ensure arrays match filePaths length
            const targetLength = filePaths.length;
            while (parsedDataArray.length < targetLength) {
                parsedDataArray.push({});
                scoreDataArray.push({});
            }
        } catch (error) {
            console.error('Failed to parse combined response JSON:', error);
            console.error('Raw response:', text);
            
            // Return empty arrays matching file count
            return {
                parsedData: filePaths.map(() => ({})),
                scoreData: filePaths.map(() => ({}))
            };
        }

        return { parsedData: parsedDataArray, scoreData: scoreDataArray };
    } catch (error) {
        console.error('Error processing multiple CVs with Gemini:', error);
        return {
            parsedData: filePaths.map(() => ({})),
            scoreData: filePaths.map(() => ({}))
        };
    }
}
*/

// Convenience function to process multiple CVs end-to-end
export async function processMultipleCVs(filePaths: string[], jobRequirements?: string) {
    try {
        console.log('Starting combined parse and score with Gemini, job requirements:', jobRequirements);
        
        // Process CVs with Gemini directly (without calling parseAndScoreMultipleCVsFromGemini)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite',generationConfig: { temperature: 0, topP: 1 } });
        
        // Convert all files to Gemini format
        const fileParts = await Promise.all(filePaths.map(filePath => fileToGenerativePart(filePath)));
        
        const baseFields = [
            'full_name', 'birthdate (YYYY-MM-DD)', 'gender (Nam/Nữ/Khác)', 'email', 
            'experience (years)', 'address', 'skills (as array)', 
            'position (current or desired job position)'
        ];
        
        let prompt = `Hãy trích xuất thông tin từ CV bằng tiếng Việt. Đảm bảo tất cả các phản hồi đều bằng tiếng Việt.

Yêu cầu trích xuất thông tin sau từ CV:
${baseFields.map(field => `- ${field}`).join('\n')}
- cv_summary: Tóm tắt ngắn gọn 2-3 câu về trình độ chuyên môn và kinh nghiệm của ứng viên`;
        
        if (jobRequirements) {
            prompt += `\n\nĐánh giá mức độ phù hợp (fit_score) của từng ứng viên so với yêu cầu công việc sau:
${jobRequirements}

Khi đánh giá, hãy xem xét và cho điểm dựa trên **5 nhóm tiêu chí** sau (mỗi nhóm tối đa 20 điểm, tổng tối đa 100 điểm):

1. **Kỹ năng chuyên môn (Skills):**
   - 0–20 điểm: mức độ phù hợp giữa kỹ năng của ứng viên và yêu cầu kỹ năng trong công việc.
   - Nếu kỹ năng gần tương đồng ≥ 80% → 18–20 điểm
   - Nếu kỹ năng tương đồng 50–79% → 12–17 điểm
   - Nếu kỹ năng tương đồng 20–49% → 6–11 điểm
   - Nếu kỹ năng tương đồng < 20% → 0–5 điểm

2. **Kinh nghiệm làm việc (Experience):**
   - So sánh số năm kinh nghiệm và lĩnh vực đã làm việc của ứng viên với mô tả công việc.
   - Cho điểm 0–20 theo cùng quy tắc trên.

3. **Vị trí/Chức danh (Position Match):**
   - So sánh vị trí hiện tại hoặc mong muốn của ứng viên với vị trí tuyển dụng.
   - Nếu hoàn toàn trùng khớp hoặc tương đương → 18–20 điểm
   - Nếu tương đối phù hợp → 10–17 điểm
   - Nếu không liên quan → 0–9 điểm

4. **Trình độ học vấn (Education / Certifications):**
   - Cho điểm dựa trên mức độ đáp ứng yêu cầu học vấn hoặc chứng chỉ chuyên môn (nếu có).
   - Thang điểm 0–20 tương tự.

5. **Phù hợp tổng thể (Overall Fit):**
   - Xem xét thái độ, khả năng thích ứng, kỹ năng mềm thể hiện qua CV.
   - Cho điểm 0–20 tùy theo mức độ phù hợp với văn hóa và yêu cầu công việc.

Sau đó, **tính tổng điểm fit_score = tổng 5 nhóm tiêu chí (0–100)**.

---

**Kèm theo mỗi CV, hãy cung cấp thêm:**
1. \`fit_score\`: số nguyên tổng kết (0–100)  
2. \`strengths\`: 3–5 điểm mạnh khiến ứng viên phù hợp với công việc  
3. \`weaknesses\`: 3–5 điểm yếu hoặc thiếu sót  
4. \`evaluation\`: 2–3 đoạn phân tích chi tiết lý do cho điểm fit_score, đề cập cụ thể đến kỹ năng, kinh nghiệm và điểm nổi bật hoặc thiếu sót của ứng viên.

---

**Yêu cầu quan trọng:**
- Chỉ trả về dữ liệu JSON hợp lệ (không có markdown hoặc văn bản ngoài).  
- Mọi văn bản đều bằng tiếng Việt, rõ ràng, chuyên nghiệp và khách quan.`;
        }
        
        const format = jobRequirements 
            ? '[{"parsed": {...}, "score": {"fit_score": number, "strengths": [string], "weaknesses": [string], "evaluation": string}}]'
            : '[{"parsed": {...}}]';
        
        prompt += `\n\nCHỈ trả về một mảng JSON hợp lệ với mỗi đối tượng tương ứng với một file CV, theo đúng thứ tự.\nKhông thêm bất kỳ văn bản giải thích, markdown hay khối code nào khác.\nĐịnh dạng: ${format}\n\nLưu ý: Tất cả các trường văn bản phải được viết bằng tiếng Việt.`;

        const result = await model.generateContent([prompt, ...fileParts]);
        const response = await result.response;
        const text = response.text();
        
        // Log raw response for debugging
        console.log('Raw Gemini response:', text);
        
        const parsedDataArray: ParsedData[] = [];
        const scoreDataArray: ScoreData[] = [];

        try {
            const cleanedText = text.trim().replace(/```json|```/g, '');
            console.log('Cleaned response text:', cleanedText);
            
            const responseArray = JSON.parse(cleanedText);
            console.log('Parsed response array:', JSON.stringify(responseArray, null, 2));
            
            const dataArray = Array.isArray(responseArray) ? responseArray : [responseArray];
            
            // Process each item in the response
            dataArray.forEach((item, index) => {
                console.log(`Processing item ${index}:`, JSON.stringify(item, null, 2));
                
                const hasScore = jobRequirements && item.parsed && item.score;
                const hasDirectParsed = !jobRequirements && item.parsed;
                
                if (hasScore) {
                    console.log('Item has score data');
                    parsedDataArray[index] = {
                        ...item.parsed,
                        cv_summary: item.parsed.cv_summary || item.parsed.summary || null
                    };
                    scoreDataArray[index] = {
                        ...item.score,
                        evaluation: item.score.evaluation || null
                    };
                } else if (hasDirectParsed) {
                    console.log('Item has direct parsed data');
                    parsedDataArray[index] = {
                        ...item.parsed,
                        cv_summary: item.parsed.cv_summary || item.parsed.summary || null
                    };
                    scoreDataArray[index] = {};
                } else {
                    console.log('Item has direct format');
                    parsedDataArray[index] = {
                        ...item,
                        cv_summary: item.cv_summary || item.summary || null
                    };
                    scoreDataArray[index] = {};
                }
            });
            
            // Ensure arrays match filePaths length
            const targetLength = filePaths.length;
            while (parsedDataArray.length < targetLength) {
                parsedDataArray.push({});
                scoreDataArray.push({});
            }
        } catch (error) {
            console.error('Failed to parse combined response JSON:', error);
            console.error('Raw response:', text);
            
            // Return empty arrays matching file count
            return filePaths.map(() => ({
                filePath: '',
                parsedData: {},
                scoreData: {}
            }));
        }
        
        // Log detailed results for debugging
        console.log('=== PARSED DATA ===');
        parsedDataArray.forEach((data, i) => {
            console.log(`CV ${i + 1} (${filePaths[i]})`);
            console.log('Full name:', data.full_name || 'Not provided');
            console.log('Email:', data.email || 'Not provided');
            console.log('Position:', data.position || 'Not provided');
            console.log('Experience:', data.experience || 'Not provided');
            console.log('Skills:', data.skills?.join(', ') || 'Not provided');
            console.log('CV Summary:', data.cv_summary || 'No summary available');
            console.log('---');
        });
        
        console.log('=== SCORE DATA ===');
        scoreDataArray.forEach((score, i) => {
            console.log(`Score for CV ${i + 1} (${filePaths[i]})`);
            console.log('Fit score:', score.fit_score || 'Not scored');
            console.log('Strengths:', score.strengths?.join('\n  - ') || 'None');
            console.log('Weaknesses:', score.weaknesses?.join('\n  - ') || 'None');
            console.log('Evaluation:', score.evaluation || 'No evaluation available');
            console.log('---');
        });
        
        // Combine results with better error handling
        const results = parsedDataArray.map((parsedData, index) => {
            const scoreData = scoreDataArray[index] || {};
            
            // Process skills to ensure it's an array
            const skills = (() => {
                if (Array.isArray(parsedData.skills)) {
                    return parsedData.skills;
                } else if (typeof parsedData.skills === 'string') {
                    return (parsedData.skills as string).split(',').map((s: string) => s.trim());
                }
                return [];
            })();
            
            // Process experience to ensure it's a number
            let experience = 0;
            if (typeof parsedData.experience === 'number') {
                experience = parsedData.experience;
            } else if (typeof parsedData.experience === 'string') {
                experience = parseFloat(parsedData.experience) || 0;
            }

            // Map gender to Vietnamese if it's in English
            let gender = parsedData.gender;
            if (typeof gender === 'string') {
                gender = gender.toLowerCase();
                if (gender === 'male' || gender === 'nam') {
                    gender = 'Nam';
                } else if (gender === 'female' || gender === 'nữ') {
                    gender = 'Nữ';
                } else if (gender === 'other' || gender === 'khác') {
                    gender = 'Khác';
                }
            }
            
            // Ensure all required fields are present
            const processedData = {
                filePath: filePaths[index],
                parsedData: {
                    ...parsedData,
                    full_name: parsedData.full_name || 'Unknown',
                    email: parsedData.email || '',
                    position: parsedData.position || '',
                    experience,
                    skills,
                    cv_summary: parsedData.cv_summary || 'No summary available',
                    gender: gender || null,
                    birthdate: parsedData.birthdate || null,
                    address: parsedData.address || null
                },
                scoreData: {
                    fit_score: typeof scoreData.fit_score === 'number' ? scoreData.fit_score : 0,
                    strengths: Array.isArray(scoreData.strengths) ? scoreData.strengths : [],
                    weaknesses: Array.isArray(scoreData.weaknesses) ? scoreData.weaknesses : [],
                    evaluation: scoreData.evaluation || 'No evaluation available'
                }
            };
            
            return processedData;
        });
        
        return results;
    } catch (error) {
        console.error('Error processing multiple CVs with Gemini:', error);
        throw error;
    }
}

// COMMENTED OUT - Not used anywhere in codebase
/*
// Legacy compatibility functions (no file upload/delete needed for Gemini)
export async function uploadFileToGemini(filePath: string) {
    // Gemini doesn't require separate file upload, return file path
    return { id: filePath, path: filePath };
}

export async function deleteGeminiFile(fileId: string) {
    // No cleanup needed for Gemini
    return Promise.resolve();
}

export async function uploadMultipleFilesToGemini(filePaths: string[]) {
    return filePaths.map(path => ({ id: path, path }));
}

export async function deleteMultipleGeminiFiles(fileIds: string[]) {
    // No cleanup needed for Gemini
    return Promise.resolve();
}
*/
