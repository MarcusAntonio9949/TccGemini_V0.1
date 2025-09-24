import PromptSuggestionButton from "./PromptSuggestionButton";



const PromptSuggestionsRow = ({ onPromptCLick }) => {
    const prompts = [
        "No ideia 1",
        "No idea 2",
        "No idea 3",
        "No idea 4",
        "No idea 5",
    ]
    return (
        <div className="prompt-sug">
            {prompts.map((prompt, index) => <PromptSuggestionButton
                key={`suggestion-${index}`}
                text={prompt}
                onClick={() => onPromptCLick} />)}

        </div>
    )
}

export default PromptSuggestionsRow