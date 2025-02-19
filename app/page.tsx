"use client";

import WelcomeScreen from "@/components/WelcomeScreen";
import { log } from "node:console";
import React, { useEffect, useState } from "react";

interface AILanguageDetector {
  detect(text: string): Promise<any>;
  destroy(): void;
  ready: Promise<void>;
}

interface Summarizer {
  summarize: (text: string) => Promise<any>;
  ready: Promise<void>;
}

interface Translator {
  translate: (text: string, targetLang: string) => Promise<any>;
  ready: Promise<void>;
}

interface Message {
  role: "user" | "ai";
  text: string;
}

interface LanguageDetectorCapabilities {
  available: "readily" | "after-download" | "no";
  languageAvailable?: (lang: string) => string;
}

export default function Home() {
  const [languageDetector, setLanguageDetector] =
    useState<AILanguageDetector | null>(null);
  const [summarizer, setSummarizer] = useState<Summarizer | null>(null);
  const [translator, setTranslator] = useState<Translator | null>(null);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [detectedResult, setDetectedResult] = useState<string>("");
  const [targetLanguage, setTargetLanguage] = useState<string>("");

  // initialize language detection api when component is mounted
  const initializeLanguageDetectionApi = async () => {
    try {
      const languageCapabilities =
        await window.ai.languageDetector.capabilities();
      if (languageCapabilities.available === "readily") {
        const detector = await window.ai.languageDetector.create();
        setLanguageDetector(detector);
      } else if (languageCapabilities.availble === "after-download") {
        const detector = await window.ai.languageDetector.create({
          monitor(m: any) {
            m.addEventListener("downloadprogress", (e: any) => {
              console.log(
                `Language Detector downloaded ${e.loaded} of ${e.total} bytes.`
              );
            });
          },
        });
        await detector.ready;
        setLanguageDetector(detector);
      } else {
        console.error("Language Detector API is not available.");
      }
    } catch (error) {
      console.error("Error initializing Language Detector API:", error);
    }
  };

  // initialize summarizer api when component is mounted
  const initializeSummarizerApi = async () => {
    try {
      const summarizerCapabilities = await window.ai.summarizer.capabilities();
      if (summarizerCapabilities.available === "readily") {
        const summarizerInstance = await window.ai.summarizer.create();
        setSummarizer(summarizerInstance);
      } else if (summarizerCapabilities.available === "after-download") {
        const summarizerInstance = await window.ai.summarizer.create({
          monitor(m: any) {
            m.addEventListener("downloadprogress", (e: any) => {
              console.log(
                `Summarizer downloaded ${e.loaded} of ${e.total} bytes.`
              );
            });
          },
        });
        await summarizerInstance.ready;
        setSummarizer(summarizerInstance);
      } else {
        console.error("Summarizer API is not available.");
      }
    } catch (error) {
      console.error("Error initializing Summarizer API:", error);
    }
  };

  // initialize translator api when component is mounted
  const initializeTranslatorApi = async () => {
    try {
      const translatorCapability = await window.ai.translator.capabilities();
      if (translatorCapability.available === "readily") {
        const translatorInstance = await window.ai.translator.create();
        setTranslator(translatorInstance);
      } else {
        console.error("Translator API is not available.");
      }
    } catch (error) {
      console.error("Error initializing Summarizer API:", error);
    }
  };

  useEffect(() => {
    if (!window.ai) {
      console.log("Chrome AI APIs are not available on this browser.");
      return;
    }

    initializeLanguageDetectionApi();
    // initializeSummarizerApi();
    // initializeTranslatorApi();
  }, []);

  // load conversation from localstorage
  useEffect(() => {
    const stored = localStorage.getItem("conversation");

    if (stored) {
      setConversation(JSON.parse(stored));
    }
  }, []);

  // save conversation to local storage
  const updateConversation = (newMessge: Message[]) => {
    setConversation(newMessge);
  };

  // detect language fn
  const detectLanguageFunction = async (input: string) => {
    if (languageDetector) {
      const text = input;

      try {
        const detectionResult = await languageDetector.detect(text);
        const bestCandidate = detectionResult.reduce(
          (best: any, candidate: any) =>
            candidate.confidence > best.confidence ? candidate : best,
          detectionResult[0]
        );

        console.log("Best detected language:", bestCandidate.detectedLanguage);
        console.log(bestCandidate.detectedLanguage);
        setDetectedResult(bestCandidate.detectedLanguage);
      } catch (error) {
        console.error("Detection failed:", error);
      }
    }
  };

  return (
    <main className="w-full h-screen">
      <div className="container mx-auto px-2 h-full">
        {detectedResult && inputText ? (
          <div className="h-full max-w-3xl mx-auto relative">
            {/* absolute textarea and button */}
            <div className="absolute z-10 bottom-0 mb-1 rounded w-full h-20 flex gap-2 shadow p-1.5 items-stretch bg-white/20 backdrop-blur">
              <textarea
                placeholder="Enter your words here..."
                className="flex-1 h-full w-full p-1 text-gray-900 text-base placeholder:text-gray-500 placeholder:text-sm resize-none border rounded focus:outline-slate-200 focus:ring-teal-500 focus:ring"
              ></textarea>
              <button className="bg-black text-gray-100 px-5 rounded border border-transparent">
                send
              </button>
            </div>

            {/* content / conversation starts here */}
            <div className="w-full h-[90%] pb-20 chat-container">
              {/* chat bubble */}
              <div className="max-w-2xl ml-auto">
                <div className="chat chat-end">
                  <div className="chat-bubble chat-bubble-secondary text-white text-base">
                    {inputText}
                  </div>
                </div>
                {/* error */}
                <div className="max-w-xs sm:max-w-md ml-auto">
                  <span className="text-xs text-red-600 text-right block">
                    Lorem ipsum dolor sit amet consectetur.
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2">
                    {/* only show if the output text is in english language */}
                    <button className="border py-1 rounded text-sm bg-gray-800 text-gray-100 border-transparent">
                      Summarize
                    </button>

                    <select
                      name="language"
                      className="select select-bordered w-full py-1 focus:outline-none focus:ring-0"
                    >
                      <option disabled selected>
                        Translate to:
                      </option>
                      <option value="en">English</option>
                      <option value="pt">Portuguese</option>
                      <option value="es">Spanish</option>
                      <option value="ru">Russian</option>
                      <option value="tr">Turkish</option>
                      <option value="fr">French</option>
                    </select>
                  </div>
                </div>
              </div>

              {detectedResult !== "" && (
                <div className="chat chat-start max-w-2xl">
                  <div className="chat-bubble chat-bubble-primary text-white text-base">
                    Detected language: {detectedResult}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <WelcomeScreen
            input={inputText}
            setInput={setInputText}
            detectLanguageFunction={detectLanguageFunction}
          />
        )}
      </div>
    </main>
  );
}
