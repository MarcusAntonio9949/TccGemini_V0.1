const PromptSuggestionButton = ({ text, onClick }) => {
    return (
        <button className="prompt-but" onClick={onClick}>
            {text}
        </button>
    )
}

export default PromptSuggestionButton;