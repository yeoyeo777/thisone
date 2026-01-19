
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

// Fix: Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeTokenSecurity = async (tokenData: any): Promise<AnalysisResult> => {
  const prompt = `Perform a comprehensive DeFi security audit for the following token launch configuration:
  ${JSON.stringify(tokenData, null, 2)}
  
  Evaluate the configuration for malicious patterns such as:
  1. Mint authority risks (is it being used for potential inflation/dumping?)
  2. Freeze authority (could it be used to block sells?)
  3. Wallet bundling (are many initial holders linked to the creator?)
  4. Liquidity lock status.
  
  Provide a detailed safety report and risk score.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          tokenMetadata: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              symbol: { type: Type.STRING },
              supply: { type: Type.NUMBER },
              decimals: { type: Type.NUMBER },
              creatorAddress: { type: Type.STRING }
            },
            required: ["name", "symbol", "supply", "decimals", "creatorAddress"]
          },
          riskScore: { type: Type.NUMBER, description: "Risk score from 0 to 100" },
          checks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                status: { type: Type.STRING, enum: ["passed", "failed", "warning"] },
                description: { type: Type.STRING },
                remediation: { type: Type.STRING }
              }
            }
          },
          bundleAnalysis: {
            type: Type.OBJECT,
            properties: {
              clustersDetected: { type: Type.NUMBER },
              percentageOfSupply: { type: Type.NUMBER },
              isSuspect: { type: Type.BOOLEAN }
            }
          },
          summary: { type: Type.STRING }
        },
        required: ["tokenMetadata", "riskScore", "checks", "bundleAnalysis", "summary"]
      }
    }
  });

  try {
    // Fix: Access the .text property directly (not as a method) as per SDK guidelines
    const text = response.text;
    return JSON.parse(text || '{}');
  } catch (e) {
    throw new Error("Failed to parse security analysis response");
  }
};
