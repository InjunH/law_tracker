
import { GoogleGenAI } from "@google/genai";
import { Movement } from "../types";

// Always use a named parameter for apiKey and obtain it exclusively from process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getMarketInsights = async (movements: Movement[]): Promise<string> => {
  const recentMovements = movements.slice(0, 15);
  const dataSummary = recentMovements.map(m => 
    `${m.lawyerName}: ${m.fromFirm || '신규'} -> ${m.toFirm || '퇴사'} (${m.position}, ${m.expertise.join(', ')})`
  ).join('\n');

  try {
    // Using ai.models.generateContent with appropriate model and prompt per task type.
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `당신은 법률 시장 전문 애널리스트입니다. 다음은 최근 대형 로펌 변호사 이직 데이터입니다:\n\n${dataSummary}\n\n이 데이터를 바탕으로 현재 대한민국 법률 시장의 인력 이동 트렌드를 3-4문장으로 요약하고, 주목할 만한 점을 한 가지 짚어주세요. 한국어로 답변하세요.`,
      config: {
        temperature: 0.7,
        topP: 0.95,
      }
    });
    // Extracting text from response.text property directly (not as a method).
    return response.text || "분석 결과를 가져올 수 없습니다.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI 분석 중 오류가 발생했습니다.";
  }
};
