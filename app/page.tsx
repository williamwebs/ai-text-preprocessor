"use client";

import WelcomeScreen from "@/components/WelcomeScreen";
import React, { useEffect, useState, useRef } from "react";
import { IoIosSend } from "react-icons/io";

interface DetectionCandidate {
  detectedLanguage: string;
  confidence: number;
}

interface AILanguageDetector {
  detect(text: string): Promise<DetectionCandidate[]>;
  destroy(): void;
  ready: Promise<void>;
}

interface Summarizer {
  summarize: (text: string) => Promise<string>;
  ready: Promise<void>;
}

interface Translator {
  translate: (text: string, targetLang: string) => Promise<string>;
  ready: Promise<void>;
}

interface Translation {
  lang: string;
  text: string;
}

interface Conversation {
  input: string;
  result: Array<{
    detectedLanguage?: string;
    summary?: string;
    translations?: Translation[];
  }>;
}

export default function Home() {
  const [languageDetector, setLanguageDetector] =
    useState<AILanguageDetector | null>(null);
  const [summarizer, setSummarizer] = useState<Summarizer | null>(null);
  const [translator, setTranslator] = useState<Translator | null>(null);
  const [conversation, setConversation] = useState<Conversation[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [detectedResult, setDetectedResult] = useState<string>("");

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [conversation]);

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
      console.log(summarizerCapabilities);
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

        console.log("Waiting for summarizer to be ready...");
        await summarizerInstance.ready;
        console.log("Summarizer is ready");

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
    initializeSummarizerApi();
    initializeTranslatorApi();
  }, []);

  // load conversation from localstorage
  useEffect(() => {
    const storedData = localStorage.getItem("conversation");

    if (storedData) {
      setConversation(JSON.parse(storedData));
    }
  }, []);

  // detect language fn
  const detectLanguageFunction = async (
    input: string
  ): Promise<DetectionCandidate[]> => {
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

        // saving the conversation
        const newConversation: Conversation = {
          input,
          result: [{ detectedLanguage: bestCandidate.detectedLanguage }],
        };

        const storedData = localStorage.getItem("conversation");
        const allConversation: Conversation[] = storedData
          ? JSON.parse(storedData)
          : [];

        allConversation.push(newConversation);
        setConversation(allConversation);
        setInputText("");
        localStorage.setItem("conversation", JSON.stringify(allConversation));
        // return detectionResult;

        console.log(detectedResult)
      } catch (error) {
        console.error("Detection failed:", error);
      }
    }
    return [];
  };

  // handle form submit
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await detectLanguageFunction(inputText);
  };

  // handle summaization
  const handleSummarize = async (index: number) => {
    const specificData = conversation[index];
    const longText = specificData.input;
    console.log(specificData);

    if (!summarizer) {
      console.error("Summarizer is not initialized.");
      return;
    }

    const matches = longText.match(/\b\w+\b/g);

    if (matches && matches.length < 150) {
      alert("Sentence is too short");
      return;
    }

    try {
      const summary = await summarizer.summarize(longText);
      console.log("Summary:", summary);

      const updatedConversation = [...conversation];

      updatedConversation[index] = {
        ...updatedConversation[index],
        result: [...updatedConversation[index].result, { summary }],
      };

      setConversation(updatedConversation);

      // save in ls
      localStorage.setItem("conversation", JSON.stringify(updatedConversation));
    } catch (error) {
      console.error("Error summarizing text", error);
    }
  };

  // handle language change
  const handleLanguageChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
    cIndex: number
  ) => {
    const targetLanguage = e.target.value;

    if (!translator) {
      console.error("Translator is not initialized.");
      return;
    }

    try {
      // translation data for the specific conversation
      const translation = await translator.translate(
        conversation[cIndex].input,
        targetLanguage
      );
      console.log("Translated text:", translation);

      // new translation data
      const newTranslation = { lang: targetLanguage, text: translation };

      const updatedConversation = conversation.map((item, index) => {
        if (index === cIndex) {
          const translationResult = item.result.find((r) => r.translations);

          if (translationResult) {
            return {
              ...item,
              result: item.result.map((r) =>
                r.translations
                  ? { ...r, translations: [...r.translations, newTranslation] }
                  : r
              ),
            };
          } else {
            return {
              ...item,
              result: [...item.result, { translations: [newTranslation] }],
            };
          }
        }
        return item;
      });

      setConversation(updatedConversation);
      localStorage.setItem("conversation", JSON.stringify(updatedConversation));
    } catch (error) {
      console.error("Error translating text:", error);
    }
  };

  return (
    <main className="w-full h-screen">
      <div className="container mx-auto px-2 h-full">
        {conversation.length > 0 ? (
          <div className="h-full max-w-3xl mx-auto relative">
            {/* absolute textarea and button */}
            <form
              onSubmit={handleSubmit}
              className="absolute z-10 bottom-0 mb-1 rounded w-full h-20 flex gap-2 shadow p-1.5 items-stretch bg-white/20 backdrop-blur"
            >
              <textarea
                onChange={(e) => setInputText(e.target.value)}
                value={inputText}
                placeholder="Enter your words here..."
                className="flex-1 h-full w-full p-1 text-gray-900 text-base placeholder:text-gray-500 placeholder:text-sm resize-none border rounded focus:outline-slate-200 focus:ring-teal-500 focus:ring"
              ></textarea>
              <button
                disabled={inputText === ""}
                type="submit"
                className="bg-black text-gray-100 px-5 rounded border border-transparent flex items-center gap-1 disabled:cursor-wait"
              >
                <span className="hidden sm:inline-block">send</span>{" "}
                <IoIosSend className="size-4" />
              </button>
            </form>

            <div
              className="w-full h-[90%] pb-20 chat-container"
              ref={chatContainerRef}
            >
              {conversation.map((message, index) => (
                <div key={index}>
                  {/* chat bubble */}
                  <div className="max-w-2xl ml-auto">
                    <div className="chat chat-end">
                      <div className="chat-bubble chat-bubble-secondary text-white text-base">
                        {message.input}
                      </div>
                    </div>
                    {/* error */}
                    <div className="max-w-xs sm:max-w-md ml-auto">
                      {/* <span className="text-xs text-red-600 text-right block">
                      Lorem ipsum dolor sit amet consectetur.
                    </span> */}
                      <div
                        className={`grid ${
                          message.result[0].detectedLanguage === "en"
                            ? "grid-cols-1 sm:grid-cols-2"
                            : "grid-cols-1"
                        } gap-2 my-2`}
                      >
                        {message.result[0].detectedLanguage === "en" && (
                          <button
                            // disabled={!summarizer}
                            onClick={() => handleSummarize(index)}
                            className="border py-1 rounded text-sm bg-gray-800 text-gray-100 border-transparent disabled:cursor-wait"
                          >
                            Summarize
                          </button>
                        )}

                        <select
                          onChange={(e) => handleLanguageChange(e, index)}
                          name="language"
                          className={`select select-bordered w-full py-1 focus:outline-none focus:ring-0 rounded`}
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

                  {message.result[0].detectedLanguage !== "" && (
                    <div className="chat chat-start max-w-2xl">
                      <div className="chat-bubble chat-bubble-primary text-white text-base">
                        Detected language:{" "}
                        {message.result[0].detectedLanguage === "en"
                          ? "English"
                          : message.result[0].detectedLanguage === "pt"
                          ? "Portuguese"
                          : message.result[0].detectedLanguage === "es"
                          ? "Spanish"
                          : message.result[0].detectedLanguage === "ru"
                          ? "Russian"
                          : message.result[0].detectedLanguage === "tr"
                          ? "Turkish"
                          : message.result[0].detectedLanguage === "fr"
                          ? "French"
                          : ""}
                      </div>
                    </div>
                  )}

                  {/* summarized text */}
                  {message.result[1]?.summary && (
                    <div className="chat chat-start max-w-2xl">
                      <div className="chat-bubble chat-bubble-primary text-white text-base">
                        {message.result[1].summary}
                      </div>
                    </div>
                  )}

                  {/* translation */}
                  {message.result[1]?.translations &&
                    message.result[1]?.translations.length > 0 && (
                      <div>
                        {message.result[1]?.translations.map((trans, index) => (
                          <div
                            className="chat chat-start max-w-2xl"
                            key={index}
                          >
                            <div className="chat-bubble chat-bubble-primary text-white text-base">
                              {trans.text}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              ))}
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
