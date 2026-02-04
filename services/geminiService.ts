
import { GoogleGenAI, Type } from "@google/genai";
import { ExamReference, ExamRecord, ImagingExam } from "../types";

export const fetchSigtapReference = async (query: string): Promise<ExamReference[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Liste exames laboratoriais brasileiros relacionados a "${query}" baseados na tabela SIGTAP. Retorne apenas um JSON válido no formato de array de objetos com as propriedades: code, name, referenceValue, unit.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              code: { type: Type.STRING },
              name: { type: Type.STRING },
              referenceValue: { type: Type.STRING },
              unit: { type: Type.STRING },
            },
            required: ["code", "name", "referenceValue", "unit"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error fetching SIGTAP data:", error);
    return [];
  }
};

export const getExamInformation = async (examName: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Forneça uma explicação curta e informativa sobre o exame de sangue/laboratorial chamado "${examName}". Explique para que serve e sua importância no monitoramento da saúde no Brasil. Responda em português.`,
    });
    return response.text || "Informação não disponível no momento.";
  } catch (error) {
    return "Erro ao carregar informações.";
  }
};

export const generateExamSymbol = async (examName: string): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `A clean, professional, minimalist medical icon representing the medical exam or procedure "${examName}". Flat design, 2D vector style, medical blue and white color palette, isolated on a white background, high quality, 512x512.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating exam symbol image:", error);
    return null;
  }
};

export const extractExamDataFromFile = async (base64Data: string, mimeType: string): Promise<Partial<ExamRecord>[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: `Analise este documento de exame laboratorial e extraia TODOS os exames/testes individuais listados. 
            Para cada teste encontrado, extraia:
            - examName: Nome do teste (ex: Glicose, Creatinina, TSH).
            - value: O resultado numérico ou qualitativo.
            - unit: Unidade de medida (ex: mg/dL).
            - referenceRange: O intervalo de referência completo indicado.
            - laboratory: Nome do laboratório (comum a todos os testes).
            - doctorName: Nome do médico (comum a todos os testes).
            - date: Data de realização (formato YYYY-MM-DD).
            
            Retorne um ARRAY de objetos JSON. Se um laudo tiver 10 testes, retorne 10 objetos.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              examName: { type: Type.STRING },
              value: { type: Type.STRING },
              unit: { type: Type.STRING },
              referenceRange: { type: Type.STRING },
              laboratory: { type: Type.STRING },
              doctorName: { type: Type.STRING },
              date: { type: Type.STRING }
            }
          }
        }
      }
    });

    const results = JSON.parse(response.text || "[]");
    return Array.isArray(results) ? results : [results];
  } catch (error) {
    console.error("Error analyzing exam file:", error);
    return [];
  }
};

export const extractImagingDataFromFile = async (base64Data: string, mimeType: string): Promise<Partial<ImagingExam> | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: `Siga estas instruções rigorosamente para extrair dados deste laudo de imagem (Radiologia):
            1. patientName: O NOME COMPLETO do paciente que consta no laudo.
            2. examType: Identifique a MODALIDADE PRINCIPAL (Ex: RESSONÂNCIA MAGNÉTICA, TOMOGRAFIA COMPUTADORIZADA, ULTRASSONOGRAFIA, RAIO-X). Não use nomes de órgãos ou achados aqui.
            3. region: A região do corpo examinada (Ex: CRÂNIO, ABDOMEN TOTAL, JOELHO ESQUERDO).
            4. laboratory: Nome do laboratório, hospital ou clínica que emitiu o laudo.
            5. doctorName: Nome do médico que solicitou ou o radiologista que assinou.
            6. date: Data do exame (YYYY-MM-DD).
            7. reportSummary: O texto descritivo dos achados radiológicos.
            8. conclusion: A IMPRESSÃO DIAGNÓSTICA ou CONCLUSÃO final do laudo. Este campo é OBRIGATÓRIO e deve conter o resumo clínico do resultado.
            
            Retorne apenas um objeto JSON.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            patientName: { type: Type.STRING },
            examType: { type: Type.STRING },
            region: { type: Type.STRING },
            laboratory: { type: Type.STRING },
            doctorName: { type: Type.STRING },
            date: { type: Type.STRING },
            reportSummary: { type: Type.STRING },
            conclusion: { type: Type.STRING }
          },
          required: ["examType", "laboratory", "conclusion"]
        }
      }
    });

    return JSON.parse(response.text || "null");
  } catch (error) {
    console.error("Error analyzing imaging file:", error);
    return null;
  }
};
