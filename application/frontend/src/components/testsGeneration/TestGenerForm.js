import react, {useContext, useState} from "react";
import { getAuthenticatedRequest } from "../../utils/authService";

const ChatAI = () => {

    
    const [search, setSearch] = useState("");
    const [result, setResult] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        setSearch(event.target.value);
    };



    const handleClick = async () => {

        try {
            const testsData = await getAuthenticatedRequest(`/generate_tests/?q=${search}`, "GET");
            setResult(testsData.generated_text); // assuming testsData is the result you want to show
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
          }

        //send request to backend

    };

    return (
        <div>

            <h2>AI Question Generator</h2>
            {loading && <p>Loading...</p>}

            {!result && !loading && (
                <>
                    <textarea value={search}
                        onChange={handleChange}
                        placeholder="Paste your text here..."
                        rows={6}
                        style={{ width: "100%", marginBottom: "10px" }}
                    />
                    <button
                        onClick={handleClick}
                        style={{
                        padding: "10px 20px",
                        backgroundColor: "#007bff",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "16px",
                        }}
                    > Generate Questions </button>
                </>
            )}

            {result && (
                <div style={{ marginTop: "20px" }}>
                    <h3>Generated Questions</h3>
                    <p>{result}</p>
                </div>
            )}

        </div>
    )
}


export default ChatAI;
