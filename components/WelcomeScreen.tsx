interface Props {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  detectLanguageFunction: (text: string) => Promise<any>;
}

const WelcomeScreen = ({ input, setInput, detectLanguageFunction }: Props) => {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    const detectedLanguage = await detectLanguageFunction(input);
  };

  return (
    <div className="h-full flex items-center justify-center max-w-3xl w-full mx-auto">
      <div className="text-center">
        <h1 className="text-5xl text-black font-bold mb-2">
          AI-Text Preprocessor
        </h1>
        <p className="text-base text-gray-700 font-normal max-w-lg mx-auto">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Tenetur
          beatae dicta autem natus quam esse.
        </p>

        <div className="mt-10 w-full shadow rounded p-1">
          <form className="flex items-stretch gap-1" onSubmit={handleSubmit}>
            <textarea
              placeholder="Enter your words here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 h-full w-full p-1 text-gray-900 text-base placeholder:text-gray-500 placeholder:text-sm resize-none border rounded focus:outline-slate-200 focus:ring-teal-500 focus:ring"
            ></textarea>
            <button className="bg-black text-gray-100 px-4 rounded border border-transparent">
              send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
